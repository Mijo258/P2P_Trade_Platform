from rest_framework import serializers
from .models import Category, Product

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

class ProductSerializer(serializers.ModelSerializer):
    # To show the category name instead of just its ID, we can do this:
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'stock_quantity', 
                  'image_url', 'category', 'category_name', 'created_at']
        # 'category' is the ID (for writing), 'category_name' is for reading.