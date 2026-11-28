from rest_framework import status, generics, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Avg, Count, Q
from rest_framework import serializers

from .models import Category, Product, ProductImage, ProductReview, Wishlist
from .serializers import (
    CategorySerializer, ProductListSerializer, ProductDetailSerializer,
    ProductReviewSerializer, CreateReviewSerializer, WishlistSerializer,
    AdminProductSerializer, AdminCategorySerializer,
)
from .filters import ProductFilter


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class CategoryListView(APIView):
    """List all active root categories with product counts."""
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Category.objects.filter(
            is_active=True, parent__isnull=True
        ).prefetch_related('children', 'products')
        serializer = CategorySerializer(
            categories, many=True, context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProductListView(generics.ListAPIView):
    """
    List products with filtering, searching, and ordering.
    GET /api/products/?category=bridal-lehengas&min_price=1000&max_price=50000
         &color=red&occasion=bridal&in_stock=true&search=silk&ordering=-price
    """
    permission_classes = [AllowAny]
    serializer_class = ProductListSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'fabric', 'color']
    ordering_fields = ['price', 'created_at', 'name', 'stock']
    ordering = ['-created_at']

    def get_queryset(self):
        return Product.objects.filter(
            is_active=True
        ).select_related('category').prefetch_related('images', 'reviews')


class ProductDetailView(APIView):
    """Get complete product details by slug."""
    permission_classes = [AllowAny]

    def get(self, request, slug):
        product = get_object_or_404(
            Product.objects.select_related('category').prefetch_related(
                'images', 'reviews__user'
            ),
            slug=slug, is_active=True
        )
        serializer = ProductDetailSerializer(product, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class FeaturedProductsView(generics.ListAPIView):
    """Get featured products for homepage."""
    permission_classes = [AllowAny]
    serializer_class = ProductListSerializer

    def get_queryset(self):
        return Product.objects.filter(
            is_active=True, is_featured=True
        ).select_related('category').prefetch_related('images', 'reviews')[:12]


class ProductReviewListCreateView(APIView):
    """List product reviews or create a new review (auth required)."""
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, slug):
        product = get_object_or_404(Product, slug=slug, is_active=True)
        reviews = ProductReview.objects.filter(
            product=product, is_verified=True
        ).select_related('user')
        serializer = ProductReviewSerializer(
            reviews, many=True, context={'request': request}
        )
        # Aggregate stats
        stats = reviews.aggregate(
            avg_rating=Avg('rating'),
            total=Count('id')
        )
        return Response({
            'results': serializer.data,
            'average_rating': round(stats['avg_rating'] or 0, 1),
            'total_reviews': stats['total'],
        }, status=status.HTTP_200_OK)

    def post(self, request, slug):
        product = get_object_or_404(Product, slug=slug, is_active=True)
        # Check if user already reviewed this product
        existing = ProductReview.objects.filter(
            product=product, user=request.user
        ).first()
        if existing:
            # Update existing review
            serializer = CreateReviewSerializer(existing, data=request.data)
        else:
            serializer = CreateReviewSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(product=product, user=request.user)
            return Response({
                'message': 'Review submitted successfully.',
                'review': ProductReviewSerializer(
                    serializer.instance, context={'request': request}
                ).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductRecommendationsView(APIView):
    """
    Frequently Bought Together & Recommended Items for bridal attire:
    Matches main attire (Lehenga/Sherwani) with complementary bridal accessories
    (Jewellery, Mojaris, Turbans/Safas, Dupattas).
    """
    permission_classes = [AllowAny]

    def get(self, request, slug):
        product = get_object_or_404(
            Product.objects.select_related('category'), slug=slug, is_active=True
        )
        cat_slug = product.category.slug

        is_menswear = cat_slug in ['sherwanis', 'kurta-pajama-sets', 'indo-western-menswear']
        if is_menswear:
            complementary = ['bridal-accessories', 'dupatta-collection', 'accessories']
        elif cat_slug in ['bridal-accessories', 'accessories', 'dupatta-collection']:
            complementary = ['bridal-lehengas', 'designer-sarees', 'sherwanis']
        else:
            complementary = ['bridal-accessories', 'accessories', 'dupatta-collection']

        bought_together = Product.objects.filter(
            category__slug__in=complementary,
            is_active=True,
            stock__gt=0
        ).exclude(id=product.id).order_by('?')[:3]

        similar = Product.objects.filter(
            category=product.category,
            is_active=True
        ).exclude(id=product.id).order_by('?')[:4]

        return Response({
            'bought_together': ProductListSerializer(
                bought_together, many=True, context={'request': request}
            ).data,
            'similar_products': ProductListSerializer(
                similar, many=True, context={'request': request}
            ).data,
        })


class WishlistView(APIView):
    """Get the authenticated user's wishlist."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wishlist_items = Wishlist.objects.filter(
            user=request.user
        ).select_related('product__category').prefetch_related('product__images')
        serializer = WishlistSerializer(
            wishlist_items, many=True, context={'request': request}
        )
        return Response({
            'count': wishlist_items.count(),
            'results': serializer.data,
        }, status=status.HTTP_200_OK)


class WishlistAddRemoveView(APIView):
    """Toggle product in wishlist (add if not present, remove if present)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, product_id):
        product = get_object_or_404(Product, id=product_id, is_active=True)
        wishlist_item, created = Wishlist.objects.get_or_create(
            user=request.user, product=product
        )
        if not created:
            wishlist_item.delete()
            return Response({
                'message': f'"{product.name}" removed from wishlist.',
                'in_wishlist': False,
            }, status=status.HTTP_200_OK)
        return Response({
            'message': f'"{product.name}" added to wishlist.',
            'in_wishlist': True,
        }, status=status.HTTP_201_CREATED)


# ─── Admin Views ─────────────────────────────────────────────────────────────

class AdminProductListView(generics.ListCreateAPIView):
    """Admin: List all products (including inactive) or create new."""
    permission_classes = [IsAdminUser]
    serializer_class = AdminProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'stock', 'created_at', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        return Product.objects.all().select_related('category').prefetch_related('images')

    @transaction.atomic
    def perform_create(self, serializer):
        files = validated_product_images(self.request)
        product = serializer.save()
        save_product_images(product, files)


class AdminProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin: Retrieve, update or delete a product."""
    permission_classes = [IsAdminUser]
    serializer_class = AdminProductSerializer
    queryset = Product.objects.all()

    @transaction.atomic
    def perform_update(self, serializer):
        files = validated_product_images(self.request)
        product = serializer.save()
        save_product_images(product, files)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        name = instance.name
        self.perform_destroy(instance)
        return Response(
            {'message': f'Product "{name}" deleted successfully.'},
            status=status.HTTP_200_OK
        )


def validated_product_images(request):
    """Accept the numbered image files submitted by the custom admin forms."""
    files = []
    image_field = serializers.ImageField()
    for index in range(6):
        uploaded = request.FILES.get(f'image_{index}')
        if uploaded:
            files.append(image_field.run_validation(uploaded))
    return files


def save_product_images(product, files):
    # The first newly uploaded photo becomes the storefront's primary image.
    for index, uploaded in enumerate(files):
        ProductImage.objects.create(
            product=product, image=uploaded, is_primary=(index == 0),
            alt_text=product.name,
        )


class AdminCategoryListView(generics.ListCreateAPIView):
    """Admin: List all categories or create new."""
    permission_classes = [IsAdminUser]
    serializer_class = AdminCategorySerializer
    queryset = Category.objects.all()
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


class AdminCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin: Retrieve, update or delete a category."""
    permission_classes = [IsAdminUser]
    serializer_class = AdminCategorySerializer
    queryset = Category.objects.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        name = instance.name
        self.perform_destroy(instance)
        return Response(
            {'message': f'Category "{name}" deleted successfully.'},
            status=status.HTTP_200_OK
        )
