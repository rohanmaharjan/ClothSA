from rest_framework import serializers
from .models import Product, ProductReview, SearchHistory


class ProductReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductReview
        fields = ['id', 'review_text']


class ProductSerializer(serializers.ModelSerializer):
    reviews = ProductReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'reviews']


class ProductSearchInputSerializer(serializers.Serializer):
    input = serializers.CharField(help_text="Enter a product name or URL")


class SearchHistorySerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source="product.id", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = SearchHistory
        fields = ['id', 'query_input', 'product_id', 'product_name', 'created_at']