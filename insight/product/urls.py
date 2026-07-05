from django.urls import path
from .views import (
    ProductSearchOrScrapeView,
    AspectSentimentAnalysisView,
    ProductDetailView,
    UserHistoryView,
    ClearUserHistoryView,
    DeleteHistoryItemView,
)

urlpatterns = [
    path('', ProductSearchOrScrapeView.as_view(), name='product-search-or-scrape'),
    path('test/', AspectSentimentAnalysisView.as_view(), name='test-sentiment-analysis'),
    path('history/', UserHistoryView.as_view(), name='user-history'),
    path('history/clear/', ClearUserHistoryView.as_view(), name='clear-user-history'),
    path('history/<int:history_id>/', DeleteHistoryItemView.as_view(), name='delete-history-item'),
    path('<int:product_id>/', ProductDetailView.as_view(), name='product-detail'),
]