from django.urls import path
from .views import (
    CategoryListView,
    ProductListView,
    ProductDetailView,
    FeaturedProductsView,
    ProductReviewListCreateView,
    ProductRecommendationsView,
    WishlistView,
    WishlistAddRemoveView,
    AdminProductListView,
    AdminProductDetailView,
    AdminCategoryListView,
    AdminCategoryDetailView,
)

urlpatterns = [
    # Public product routes
    path('', ProductListView.as_view(), name='product-list'),
    path('featured/', FeaturedProductsView.as_view(), name='featured-products'),
    path('<slug:slug>/', ProductDetailView.as_view(), name='product-detail'),
    path('<slug:slug>/recommendations/', ProductRecommendationsView.as_view(), name='product-recommendations'),
    path('<slug:slug>/reviews/', ProductReviewListCreateView.as_view(), name='product-reviews'),
    # Categories
    path('categories/all/', CategoryListView.as_view(), name='category-list'),
    # Wishlist (authenticated)
    path('wishlist/', WishlistView.as_view(), name='wishlist'),
    path('wishlist/<int:product_id>/toggle/', WishlistAddRemoveView.as_view(), name='wishlist-toggle'),
    # Admin routes
    path('admin/products/', AdminProductListView.as_view(), name='admin-product-list'),
    path('admin/products/<int:pk>/', AdminProductDetailView.as_view(), name='admin-product-detail'),
    path('admin/categories/', AdminCategoryListView.as_view(), name='admin-category-list'),
    path('admin/categories/<int:pk>/', AdminCategoryDetailView.as_view(), name='admin-category-detail'),
]
