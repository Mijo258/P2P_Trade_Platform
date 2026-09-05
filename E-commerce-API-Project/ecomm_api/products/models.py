from django.db import models
from django.conf import settings # To link to the User model

class UserProfile(models.Model):
    # This creates a one-to-one link. One user has one profile.
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    display_name = models.CharField(max_length=100, help_text="Public name to be shown (Seller/Buyer Name)")
    contact_info = models.CharField(max_length=255, help_text="Public contact method (e.g., a social media handle, a different email, etc.)")

    def __str__(self):
        return f"Profile of {self.user.username}"

class Category(models.Model):
    """A model for product categories."""
    name = models.CharField(max_length=100, unique=True, help_text="Name of the category")
    description = models.TextField(blank=True, help_text="Optional description of the category")

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class PurchaseRequest(models.Model):
    """model for purchase requests"""
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="purchase_requests")
    product_name = models.CharField(max_length=255, help_text="Name of the product to purchase")
    description = models.TextField(help_text="Description of the product to purchase")
    target_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Target price for the product")
    created_at = models.DateTimeField(auto_now_add=True, help_text="Date the purchase request was created")
    def __str__(self):
        return f"'{self.product_name}' requested by {self.buyer.username}"
    
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
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('pending', 'Pending Trade'),
        ('sold', 'Sold')
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available', help_text="Current status of the product")

    def __str__(self):
        return self.name