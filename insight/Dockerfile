# ── Dockerfile for the InsightFullens Django backend ──────────────────────────
# Built for Render (Docker web service, free tier). Model inference is called
# over the network via Hugging Face's Inference API, so torch/transformers
# are NOT installed here -- keeps the image light enough for 512MB RAM.
# Put this file in insight/ (same folder as manage.py).

FROM python:3.11-slim

# System deps: Chromium + matching driver (replaces Edge, which isn't available
# on Linux servers) and build tools some ML packages need at install time.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium chromium-driver \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

ENV CHROME_BIN=/usr/bin/chromium \
    CHROMEDRIVER_PATH=/usr/bin/chromedriver \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Collect static files for the Django admin / drf-spectacular docs UI
RUN python manage.py collectstatic --noinput || true

# Render sets $PORT itself at runtime; this default just covers local testing.
ENV PORT=10000
EXPOSE 10000

CMD gunicorn insightfullens.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 180
