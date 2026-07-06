import os
import re
import time
import json
import logging
import random
from collections import defaultdict
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor
from typing import List, Tuple, Optional
from urllib.parse import unquote

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers, generics
from rest_framework.permissions import IsAuthenticated
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.edge.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.edge.service import Service as EdgeService
from transformers import T5ForConditionalGeneration, AutoTokenizer
import torch

from .models import Product, ProductReview, SearchHistory
from .serializers import (
    ProductSerializer,
    ProductSearchInputSerializer,
    SearchHistorySerializer,
)
from drf_spectacular.utils import extend_schema
from dotenv import load_dotenv

load_dotenv()

# ─── LOGGER ───────────────────────────────────────────────────────────────────
logger = logging.getLogger(__name__)


# ─── HELPER ───────────────────────────────────────────────────────────────────
def format_response(data):
    if not isinstance(data, list):
        return [data]
    return data


# ─── MODEL LOADING (once at startup) ──────────────────────────────────────────
MODEL_PATH = os.getenv(
    "MODEL_PATH",
    os.path.join(os.path.dirname(__file__), "t5base")
)
model = T5ForConditionalGeneration.from_pretrained(MODEL_PATH, local_files_only=True)
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, local_files_only=True)
model.eval()

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)


# ─── DEDUPLICATION ────────────────────────────────────────────────────────────
SENTIMENT_VOCAB = r'(?:extremely\s+positive|extremely\s+negative|positive|negative|neutral|conflict)'
PAIR_RE = re.compile(rf'([^:,;]+):\s*({SENTIMENT_VOCAB})', re.IGNORECASE)
CONNECTOR_PREFIX_RE = re.compile(r'^\s*(?:and|und|de|,|;)\s+', re.IGNORECASE)
BRACKET_RE = re.compile(r'[()\[\]{}]')

# Common synonyms/plurals the model uses for the same underlying aspect
ASPECT_ALIASES = {
    "colour": "color", "colours": "color", "colors": "color",
    "fabrics": "fabric", "material": "fabric", "materials": "fabric",
    "sizing": "size", "sizes": "size",
    "designs": "design",
    "zippers": "zipper",
    "qualities": "quality",
    "prices": "price", "pricing": "price",
    "fits": "fit", "fitting": "fit",
    "comforts": "comfort", "comfortable": "comfort",
}


def _normalize_aspect(raw_aspect: str) -> str:
    aspect = CONNECTOR_PREFIX_RE.sub('', raw_aspect)
    aspect = re.sub(r'\s+', ' ', aspect).strip(' .,:;')
    aspect = aspect.lower()
    return ASPECT_ALIASES.get(aspect, aspect)


def deduplicate_prediction(prediction: str) -> str:
    """
    The T5 model doesn't always separate multiple aspect/sentiment pairs with a
    clean comma - it sometimes uses 'and', 'de', 'und' as connectors, or wraps
    a secondary aspect in parentheses like "fabric: positive (color: positive)".
    We strip stray bracket characters (keeping their content, since it's often
    a real extra aspect) and then extract every (aspect, sentiment) pair with a
    regex anchored on the fixed sentiment vocabulary - instead of relying on
    comma-splitting, which used to produce garbled combined aspect names.
    """
    # Drop bracket characters but keep what's inside them
    prediction = BRACKET_RE.sub(' ', prediction)

    seen = set()
    unique_parts = []
    for raw_aspect, raw_sentiment in PAIR_RE.findall(prediction):
        aspect = _normalize_aspect(raw_aspect)
        sentiment = raw_sentiment.strip().lower()
        if not aspect:
            continue
        key = f"{aspect}: {sentiment}"
        if key not in seen:
            seen.add(key)
            unique_parts.append(key)

    return ", ".join(unique_parts)


# ─── WEBDRIVER MANAGER ────────────────────────────────────────────────────────
class WebDriverManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(WebDriverManager, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not hasattr(self, '_initialized'):
            self.edge_options = self._configure_edge_options()
            self._initialized = True

    @staticmethod
    def _configure_edge_options():
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--ignore-certificate-errors")
        options.add_argument("--disable-extensions")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)
        options.add_argument(
            "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36 Edg/148.0.3967.96"
        )
        return options

    def get_driver(self):
        DRIVER_PATH = os.getenv(
            "EDGE_DRIVER_PATH",
            r"C:\WebDrivers\msedgedriver.exe"
        )
        if not os.path.exists(DRIVER_PATH):
            raise RuntimeError(
                f"Edge WebDriver not found at {DRIVER_PATH}. "
                f"Download version 148.0.3967.96 from: "
                f"https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/"
            )
        service = EdgeService(DRIVER_PATH)
        return webdriver.Edge(service=service, options=self.edge_options)


driver_manager = WebDriverManager()


# ─── SENTIMENT ANALYSIS ───────────────────────────────────────────────────────
@lru_cache(maxsize=100)
def extract_aspect_sentiment_cached(review: str) -> str:
    input_text = f"aspect-sentiment analysis: {review}"
    input_encoding = tokenizer(
        input_text,
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=256
    ).to(device)

    with torch.no_grad():
        output_ids = model.generate(
            input_ids=input_encoding["input_ids"],
            attention_mask=input_encoding["attention_mask"],
            max_new_tokens=64,
            num_beams=4,
            do_sample=False,
            early_stopping=True,
            no_repeat_ngram_size=3,
            repetition_penalty=2.5,
        )

    prediction = tokenizer.decode(output_ids[0], skip_special_tokens=True)
    return deduplicate_prediction(prediction)


def extract_aspect_sentiment(reviews: List[str]) -> List[str]:
    with ThreadPoolExecutor(max_workers=4) as executor:
        predictions = list(executor.map(extract_aspect_sentiment_cached, reviews))
    return predictions


# ─── WEB SCRAPING ─────────────────────────────────────────────────────────────
def extract_product_image(driver) -> Optional[str]:
    """
    Amazon's main product image is usually lazy-loaded, so the real high-res
    URL often lives in an attribute (data-old-hires / data-a-dynamic-image)
    rather than plain src. Try several strategies, best quality first.
    """
    image_selectors = [
        "#landingImage",
        "#imgTagWrapperId img",
        "#main-image-container img",
        "img[data-a-dynamic-image]",
    ]

    for selector in image_selectors:
        try:
            img = driver.find_element(By.CSS_SELECTOR, selector)
        except NoSuchElementException:
            continue

        hires = img.get_attribute("data-old-hires")
        if hires:
            return hires

        dynamic = img.get_attribute("data-a-dynamic-image")
        if dynamic:
            try:
                urls = list(json.loads(dynamic).keys())
                if urls:
                    return urls[0]
            except Exception:
                pass

        src = img.get_attribute("src")
        if src and src.startswith("http"):
            return src

    return None


def extract_product_price(driver) -> Optional[str]:
    price_selectors = [
        '.a-price .a-offscreen',
        '#corePrice_feature_div .a-price .a-offscreen',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '#price_inside_buybox',
        '.a-price-whole',
    ]
    for selector in price_selectors:
        try:
            el = driver.find_element(By.CSS_SELECTOR, selector)
            text = (el.get_attribute('innerText') or el.text or '').strip()
            if text:
                return text
        except NoSuchElementException:
            continue
        except Exception:
            continue
    return None


def extract_product_sizes(driver) -> List[str]:
    """
    Amazon renders size options either as a <select> dropdown or as a row of
    clickable swatch buttons, depending on the category/template - so we try
    both patterns. Best-effort: returns an empty list if neither is found,
    which is common on non-apparel or single-size listings.
    """
    sizes = []
    seen = set()

    try:
        options = driver.find_elements(
            By.CSS_SELECTOR,
            '#native_dropdown_selected_size_name option, '
            'select[name="dropdown_selected_size_name"] option'
        )
        for opt in options:
            text = opt.text.strip()
            if text and text.lower() not in ('select', 'select size', '') and text not in seen:
                seen.add(text)
                sizes.append(text)
    except Exception:
        pass

    if not sizes:
        try:
            buttons = driver.find_elements(
                By.CSS_SELECTOR,
                '#variation_size_name li .a-button-text, '
                '#variation_size_name .swatch-title-text-display, '
                '#inline-twister-expanded-dimension-text-size_name'
            )
            for b in buttons:
                text = b.text.strip()
                if text and text not in seen:
                    seen.add(text)
                    sizes.append(text)
        except Exception:
            pass

    return sizes[:15]


def scrape_product_reviews(product_link: str) -> Tuple[Optional[dict], List[str]]:
    """
    Returns (product_info, reviews).
    product_info is a dict: {"name", "image_url", "price", "sizes"} or None on failure.
    On failure, reviews[0] contains the error message.
    """
    driver = None
    try:
        driver = driver_manager.get_driver()
        driver.get(product_link)
        time.sleep(random.uniform(3, 5))

        page_title = driver.title.lower()
        print(f"Page title: {driver.title}")

        blocked_keywords = ["robot", "captcha", "sorry", "verify", "unusual traffic", "api gateway"]
        if any(k in page_title for k in blocked_keywords):
            print("BLOCKED BY AMAZON")
            return None, ["Amazon blocked the request"]

        title_selectors = ["#productTitle", "span#productTitle", "h1#title span", "h1"]
        product_name = None
        for selector in title_selectors:
            try:
                element = WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                )
                text = element.text.strip()
                if text:
                    product_name = text
                    print(f"Found product name: {product_name[:60]}")
                    break
            except TimeoutException:
                continue

        if not product_name:
            return None, ["Could not locate the product title"]

        image_url = extract_product_image(driver)
        price = extract_product_price(driver)
        sizes = extract_product_sizes(driver)
        print(f"Found image URL: {image_url}, price: {price}, sizes: {sizes}")

        print("Scrolling to load inline reviews on product page...")
        for scroll_pct in [0.3, 0.5, 0.7, 0.9, 1.0]:
            driver.execute_script(
                f"window.scrollTo(0, document.body.scrollHeight * {scroll_pct});"
            )
            time.sleep(1)

        try:
            reviews_section = driver.find_element(
                By.CSS_SELECTOR,
                '#reviews-medley-cmps-expand-head, '
                '#reviewsMedley, '
                '#customerReviews, '
                '[data-hook="reviews-medley-cmps-expand-head"]'
            )
            driver.execute_script("arguments[0].scrollIntoView();", reviews_section)
            time.sleep(1)
            print("Found reviews section on product page")
        except Exception:
            print("No reviews section anchor found, continuing with page scrape")

        review_selectors = [
            'span[data-hook="reviewText"]',
            'div[data-hook="reviewTextContainer"]',
            'div[data-hook="reviewRichContentContainer"]',
            'div[data-hook="review"]',
            'div[data-hook="review-collapsed"]',
            'span[data-hook="review-body"]',
            'div[data-hook="review-body"]',
            '[data-hook="review-star-rating"] ~ div span',
            '.review-text-content span',
            '.review-text span',
            '.reviewText span',
            'span.cr-original-review-content',
            '.a-expander-content p',
            '#cm_cr-review_list .review',
            '.customer-reviews-content',
        ]

        review_elements = []
        for selector in review_selectors:
            try:
                found = WebDriverWait(driver, 5).until(
                    EC.presence_of_all_elements_located((By.CSS_SELECTOR, selector))
                )
                if found:
                    print(f"Found {len(found)} elements with: {selector}")
                    review_elements = found
                    break
            except TimeoutException:
                continue

        if not review_elements:
            print("Trying full page text extraction...")
            all_spans = driver.find_elements(By.TAG_NAME, 'span')
            all_paras = driver.find_elements(By.TAG_NAME, 'p')

            candidates = all_spans + all_paras
            review_elements = [
                el for el in candidates
                if el.text and 20 < len(el.text.strip()) < 1000
            ]
            print(f"Full page extraction found {len(review_elements)} candidates")

        skip_keywords = [
            'sign in to see', 'write a review', 'filter by',
            'sort by', 'report abuse', 'see more reviews',
            'top reviews from', 'sponsored', 'back to top',
            'add to cart', 'add to wish', 'secure transaction',
            'ships from', 'sold by', 'return policy',
            'free delivery', 'javascript required',
        ]

        reviews = []
        seen = set()
        for el in review_elements:
            text = " ".join(el.text.split())
            if (text
                    and len(text) > 20
                    and text not in seen
                    and not any(kw in text.lower() for kw in skip_keywords)):
                seen.add(text)
                reviews.append(text)

        print(f"Total clean reviews: {len(reviews)}")

        product_info = {
            "name": product_name,
            "image_url": image_url,
            "price": price,
            "sizes": sizes,
        }

        if not reviews:
            return product_info, []

        return product_info, reviews

    except TimeoutException as e:
        return None, [f"Timeout: {str(e)}"]
    except Exception as e:
        print(f"Scraping error: {str(e)}")
        return None, [f"Scraping error: {str(e)}"]
    finally:
        if driver:
            driver.quit()


# ─── SUMMARY GENERATOR ────────────────────────────────────────────────────────
def generate_summary(extracted_aspects: List[str]) -> str:
    total_reviews = len(extracted_aspects)
    aspect_sentiment_count = defaultdict(lambda: defaultdict(int))

    for aspect_string in extracted_aspects:
        for part in aspect_string.split(", "):
            if ":" in part:
                try:
                    aspect, sentiment = part.rsplit(": ", 1)
                    aspect = aspect.strip().upper()
                    aspect_sentiment_count[aspect][normalize_sentiment(sentiment)] += 1
                except Exception:
                    continue

    if not aspect_sentiment_count:
        return "No clear sentiment patterns were found in the available reviews."

    # Net score per aspect (extreme sentiment weighted a bit heavier)
    aspect_scores = {}
    aspect_mention_totals = {}
    for aspect, sentiments in aspect_sentiment_count.items():
        pos = sentiments.get("positive", 0) + sentiments.get("extremely positive", 0) * 1.5
        neg = sentiments.get("negative", 0) + sentiments.get("extremely negative", 0) * 1.5
        aspect_scores[aspect] = pos - neg
        aspect_mention_totals[aspect] = sum(sentiments.values())

    # Overall sentiment across every aspect mention (drives the opening verdict)
    total_pos = sum(s.get("positive", 0) + s.get("extremely positive", 0) for s in aspect_sentiment_count.values())
    total_neg = sum(s.get("negative", 0) + s.get("extremely negative", 0) for s in aspect_sentiment_count.values())
    total_neutral = sum(s.get("neutral", 0) + s.get("conflict", 0) for s in aspect_sentiment_count.values())
    total_mentions = total_pos + total_neg + total_neutral or 1

    pos_pct = round((total_pos / total_mentions) * 100)
    neg_pct = round((total_neg / total_mentions) * 100)

    if pos_pct >= 75:
        verdict = "overwhelmingly positive"
    elif pos_pct >= 60:
        verdict = "positive"
    elif neg_pct >= 60:
        verdict = "largely negative"
    elif neg_pct >= 40:
        verdict = "mixed, leaning negative"
    elif pos_pct - neg_pct >= 10:
        verdict = "generally favorable, though mixed"
    else:
        verdict = "mixed"

    review_word = "review" if total_reviews == 1 else "reviews"
    opening = (
        f"Based on {total_reviews} {review_word}, overall customer sentiment is {verdict} "
        f"({pos_pct}% positive mentions vs {neg_pct}% negative)."
    )

    # Rank aspects by net score to find what's genuinely praised vs criticized
    ranked = sorted(aspect_scores.items(), key=lambda x: x[1], reverse=True)
    praised = [a for a, score in ranked if score > 0][:2]
    criticized = [a for a, score in sorted(aspect_scores.items(), key=lambda x: x[1]) if score < 0][:2]
    mixed = [
        a for a, score in aspect_scores.items()
        if abs(score) <= 1 and aspect_mention_totals[a] >= 3
        and a not in praised and a not in criticized
    ][:2]

    sentences = [opening]

    if praised:
        sentences.append(f"Customers particularly liked the {', '.join(praised).lower()}.")
    if criticized:
        sentences.append(f"The main points of criticism were the {', '.join(criticized).lower()}.")
    if mixed:
        sentences.append(f"Opinions were split on the {', '.join(mixed).lower()}.")
    if not praised and not criticized:
        sentences.append("No single aspect stood out strongly in either direction.")

    return " ".join(sentences)


# ─── NORMALIZE SENTIMENT (shared helper) ──────────────────────────────────────
def normalize_sentiment(sentiment: str) -> str:
    sentiment = sentiment.strip().lower()
    if "extremely positive" in sentiment:
        return "extremely positive"
    elif "extremely negative" in sentiment:
        return "extremely negative"
    elif "positive" in sentiment:
        return "positive"
    elif "negative" in sentiment:
        return "negative"
    elif "conflict" in sentiment:
        return "conflict"
    return "neutral"


def _build_aspect_sentiment_counts(extracted_aspects: List[str]) -> dict:
    aspect_sentiment_counts = defaultdict(lambda: defaultdict(int))
    for aspect_string in extracted_aspects:
        for part in aspect_string.split(", "):
            if ":" in part:
                try:
                    aspect, sentiment = part.rsplit(": ", 1)
                    aspect = aspect.strip().title()
                    aspect_sentiment_counts[aspect][normalize_sentiment(sentiment)] += 1
                except Exception:
                    continue
    return {aspect: dict(sentiments) for aspect, sentiments in aspect_sentiment_counts.items()}


def _record_search_history(user, product: Product, query_input: str) -> None:
    """Best-effort logging of a user's search; never breaks the main request."""
    try:
        SearchHistory.objects.create(user=user, product=product, query_input=query_input)
    except Exception as e:
        logger.error(f"Failed to record search history: {str(e)}")


# ─── VIEWS ────────────────────────────────────────────────────────────────────
class ProductSearchOrScrapeView(APIView):
    """
    Scrapes/looks up a product and returns its overview (name, image, price,
    sizes, raw reviews) WITHOUT running sentiment analysis - that's deferred
    until the user explicitly hits GET /product/<id>/ (ProductDetailView),
    which is where the T5 model actually runs.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=ProductSearchInputSerializer,
        responses={200: ProductSerializer},
    )
    def post(self, request):
        user_input = request.data.get("input", "").strip()

        if not user_input:
            return Response(
                {"error": "Input is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user_input.startswith(("http://", "https://")):
            user_input = unquote(user_input)
            return self._handle_url_query(request, user_input)

        return self._handle_search_query(request, user_input)

    # ------------------------------------------------------------------
    def _handle_url_query(self, request, url: str) -> Response:
        try:
            product_info, scraped_reviews = scrape_product_reviews(url)

            if product_info is None:
                return Response(
                    {"error": scraped_reviews[0] if scraped_reviews else "Failed to scrape product details"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            product, _ = Product.objects.get_or_create(name=product_info["name"])

            # Keep image/price/sizes fresh on every scrape (price especially can change)
            product.image_url = product_info["image_url"] or product.image_url
            product.price = product_info["price"] or product.price
            product.sizes = product_info["sizes"] or product.sizes
            product.save(update_fields=["image_url", "price", "sizes"])

            IGNORED_REVIEW_TEXTS = {
                "no customer reviews found on page",
                "amazon blocked the request",
                "could not locate the product title",
            }

            existing_reviews = set(
                ProductReview.objects.filter(product=product)
                .values_list("review_text", flat=True)
            )

            new_reviews = [
                ProductReview(product=product, review_text=r)
                for r in scraped_reviews
                if r not in existing_reviews
                and r.strip().lower() not in IGNORED_REVIEW_TEXTS
            ]

            if new_reviews:
                ProductReview.objects.bulk_create(new_reviews)

            all_reviews = list(
                ProductReview.objects.filter(product=product)
                .values_list("review_text", flat=True)
            )

            _record_search_history(request.user, product, url)

            # No sentiment analysis here - the overview page shows this instantly,
            # then the user explicitly triggers analysis via GET /product/<id>/
            return Response({
                "products": format_response([{
                    "id": product.id,
                    "name": product.name,
                    "image_url": product.image_url,
                    "price": product.price,
                    "sizes": product.sizes,
                    "reviews": all_reviews,
                }])
            }, status=status.HTTP_200_OK)

        except RuntimeError as e:
            return Response(
                {"error": f"Web scraping unavailable: {str(e)}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to process URL: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # ------------------------------------------------------------------
    def _handle_search_query(self, request, query: str) -> Response:
        try:
            products = Product.objects.filter(name__icontains=query)

            if not products.exists():
                return Response(
                    {"message": "No matching products found."},
                    status=status.HTTP_404_NOT_FOUND
                )

            product_data = []

            for product in products:
                reviews = list(
                    ProductReview.objects.filter(product=product)
                    .values_list("review_text", flat=True)
                )

                product_info = ProductSerializer(product).data
                product_info["reviews"] = reviews
                product_data.append(product_info)

                _record_search_history(request.user, product, query)

            return Response({"products": product_data}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Search failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ─── TEST ENDPOINT ────────────────────────────────────────────────────────────
class ReviewInputSerializer(serializers.Serializer):
    reviews = serializers.ListField(
        child=serializers.CharField(),
        help_text="A list of review texts to analyze."
    )


class AspectSentimentOutputSerializer(serializers.Serializer):
    predictions = serializers.ListField(
        child=serializers.CharField(),
        help_text="A list of aspect-sentiment predictions."
    )


class AspectSentimentAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=ReviewInputSerializer,
        responses={200: AspectSentimentOutputSerializer},
    )
    def post(self, request, *args, **kwargs):
        serializer = ReviewInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reviews = serializer.validated_data["reviews"]
        predictions = extract_aspect_sentiment(reviews)
        return Response({"predictions": predictions}, status=status.HTTP_200_OK)


# ─── PRODUCT DETAIL (this is where sentiment analysis actually runs) ─────────
class ProductDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Unexpected error fetching product: {str(e)}")
            return Response(
                {"error": "An unexpected error occurred while retrieving the product."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            reviews = list(
                ProductReview.objects.filter(product=product)
                .values_list("review_text", flat=True)
            )
        except Exception as e:
            logger.error(f"Error fetching reviews: {str(e)}")
            return Response(
                {"error": "An error occurred while fetching product reviews."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        extracted_aspects = []
        serializable_counts = {}
        summary_text = "No reviews available for sentiment analysis."

        if reviews:
            try:
                extracted_aspects = extract_aspect_sentiment(reviews)
                serializable_counts = _build_aspect_sentiment_counts(extracted_aspects)
                summary_text = generate_summary(extracted_aspects)
            except Exception as e:
                logger.error(f"Error extracting aspect sentiments: {str(e)}")
                return Response(
                    {"error": "An error occurred while extracting aspect sentiments."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        product_info = ProductSerializer(product).data
        product_info.update({
            "reviews": reviews,
            "extracted_aspects": extracted_aspects,
            "aspect_sentiment_counts": serializable_counts,
            "summary_text": summary_text,
        })

        return Response(product_info, status=status.HTTP_200_OK)


# ─── USER SEARCH HISTORY ──────────────────────────────────────────────────────
class UserHistoryView(generics.ListAPIView):
    """
    Returns the search history belonging ONLY to the currently authenticated
    user - each account sees just its own list.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = SearchHistorySerializer

    def get_queryset(self):
        return (
            SearchHistory.objects
            .filter(user=self.request.user)
            .select_related("product")
        )


class ClearUserHistoryView(APIView):
    """Deletes all search history entries for the logged-in user."""
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        SearchHistory.objects.filter(user=request.user).delete()
        return Response({"message": "History cleared."}, status=status.HTTP_200_OK)


class DeleteHistoryItemView(APIView):
    """Deletes one specific search-history entry, owned by the logged-in user."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, history_id):
        try:
            entry = SearchHistory.objects.get(id=history_id, user=request.user)
        except SearchHistory.DoesNotExist:
            return Response(
                {"error": "History entry not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        entry.delete()
        return Response({"message": "History entry deleted."}, status=status.HTTP_200_OK)