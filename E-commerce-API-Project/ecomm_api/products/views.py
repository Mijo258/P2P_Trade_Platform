from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django.shortcuts import render
from django.shortcuts import render
from rest_framework import viewsets, status
from django_filters import rest_framework as filters
from .models import Category, Product, PurchaseRequest
from .serializers import CategorySerializer, ProductSerializer, PurchaseRequestSerializer
from rest_framework.decorators import action
from rest_framework.response import Response


class ProductFilter(filters.FilterSet):
    # Allow filtering by price range 
    min_price = filters.NumberFilter(field_name="price", lookup_expr='gte') # gte = greater than or equal to
    max_price = filters.NumberFilter(field_name="price", lookup_expr='lte') # lte = less than or equal to
    # Allow searching by name 
    name = filters.CharFilter(field_name="name", lookup_expr='icontains')

    class Meta:
        model = Product
        # Define exact match filters here
        fields = ['category', 'name', 'min_price', 'max_price']

class CategoryViewSet(viewsets.ModelViewSet): 
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class ProductViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for viewing and editing products.
    """
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    authentication_classes = [JWTAuthentication] # Explicitly use only JWT for this view
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_class = ProductFilter
    search_fields = ['name', 'category__name']

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def initiate_trade(self, request, pk=None):
        """
        Marks a product's status as 'pending' to initiate a trade.
        """
        product = self.get_object()
        if product.status != 'available':
            return Response({'status': 'Product is not available for trade'}, status=status.HTTP_400_BAD_REQUEST)
        product.status = 'pending'
        product.save()
        return Response({'status': f'Trade initiated for {product.name}'}, status=status.HTTP_200_OK)

    def perform_create(self, serializer):
        """
        Overrides the default create behavior to automatically assign
        the logged-in user to the 'created_by' field.
        """
        # self.request.user gives us the user who made the request
        # We pass this user to the serializer's save method
        serializer.save(created_by=self.request.user)
def product_list_page(request):
    """
    A view that fetches all products and renders them
    in an HTML template.
    """
    # 1. Get the data from the database
    all_products = Product.objects.all().order_by('name')

    # 2. Define the context dictionary to pass to the template
    context = {
        'products': all_products
    }

    # 3. Render the request, template, and context
    return render(request, 'products/product_list.html', context)

class PurchaseRequestViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for viewing and creating purchase requests.
    """
    queryset = PurchaseRequest.objects.all().order_by('-created_at')
    serializer_class = PurchaseRequestSerializer
    # Anyone can view requests, but only logged-in users can create them.
    permission_classes = [IsAuthenticatedOrReadOnly] 

    def perform_create(self, serializer):
        """
        Overrides the default create behavior to automatically assign
        the logged-in user as the 'buyer'.
        """
        # self.request.user is automatically populated by DRF with the
        # authenticated user from the JWT token.
        serializer.save(buyer=self.request.user)