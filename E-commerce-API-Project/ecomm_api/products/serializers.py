from rest_framework import serializers
from .models import Category, Product, PurchaseRequest, UserProfile
from django.contrib.auth.models import User

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['display_name', 'contact_info']

class UserInfoSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'profile', 'email']

class PurchaseRequestSerializer(serializers.ModelSerializer):

    #buyer = serializers.PrimaryKeyRelatedField(read_only=True)
    buyer = UserInfoSerializer(read_only=True)
    class Meta:
        model = PurchaseRequest
        fields = ['id', 'buyer', 'product_name', 'description', 'target_price', 'created_at']
        read_only_fields = ['buyer', 'created_at']

class ProductSerializer(serializers.ModelSerializer):
    # To show the category name instead of just its ID, we can do this:
    category_name = serializers.CharField(source='category.name', read_only=True)
    created_by = UserInfoSerializer(read_only=True)
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'stock_quantity', 
                  'image_url', 'category', 'category_name', 'created_at', 'created_by',  'status', 'created_by']
        # 'category' is the ID (for writing), 'category_name' is for reading.
        read_only_fields = ['category', 'status', 'created_by']
        def create(self, validated_data):
             category_name = validated_data.pop('category_name', None)
             category = None
             if category_name:
            # This logic finds an existing category or creates a new one.
                category, created = Category.objects.get_or_create(name=category_name)
        
        # The logged-in user is added from the view's perform_create method
             product = Product.objects.create(category=category, **validated_data)
             return product

