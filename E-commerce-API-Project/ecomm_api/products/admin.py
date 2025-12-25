# In products/admin.py
from django.contrib import admin
from .models import Category, Product

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin): 
    """
    Admin configuration for the Category model.
    """
    list_display = ('name',)
    search_fields = ('name',) 

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin): 
    """
    Admin configuration for the Product model.
    """
    list_display = ('name', 'category', 'price', 'stock_quantity')
    list_filter = ('category',)
    search_fields = ('name', 'description')


