from django.db import models
from django.conf import settings # To link to the User model

class Category(models.Model):
    """A model for product categories."""
    name = models.CharField(max_length=100, unique=True, help_text="Name of the category")
    description = models.TextField(blank=True, help_text="Optional description of the category")

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class Product(models.Model):
    """A model for products in the e-commerce store."""
    name = models.CharField(max_length=255, help_text="Name of the product")
    description = models.TextField(help_text="Detailed description of the product")
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Price of the product")
    stock_quantity = models.PositiveIntegerField(default=0, help_text="How many items are in stock")
    image_url = models.URLField(max_length=2048, blank=True, null=True, help_text="URL for the product image")
    category = models.ForeignKey(Category, related_name='products', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, help_text="Date the product was added")
    # You could use the default Django user model here, or your own custom user model
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="products")

    def __str__(self):
        return self.name