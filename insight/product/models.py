from django.db import models
from django.contrib.auth.models import User


class Product(models.Model):
    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class ProductReview(models.Model):
    product = models.ForeignKey(Product, related_name="reviews", on_delete=models.CASCADE)
    review_text = models.TextField()

    def __str__(self):
        return f"Review for {self.product.name}"


class SearchHistory(models.Model):
    """
    Tracks every search/scrape a user performs so each account can see
    its own history, independent of the browser/device used.
    """
    user = models.ForeignKey(
        User, related_name="search_history", on_delete=models.CASCADE
    )
    product = models.ForeignKey(
        Product, related_name="search_history", on_delete=models.CASCADE
    )
    query_input = models.CharField(
        max_length=1000,
        help_text="Exactly what the user typed or pasted (URL or product name).",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Search History"
        verbose_name_plural = "Search Histories"

    def __str__(self):
        return f"{self.user.username} searched '{self.query_input}' -> {self.product.name}"