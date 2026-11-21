"""
URL configuration for Shaaz Ethnicwear backend.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve

from .admin_views import AdminDashboardView, AdminUserListView, AdminUserDetailView
from orders.views import AdminOrderListView, AdminOrderDetailView
from products.views import (
    AdminProductListView, AdminProductDetailView,
    AdminCategoryListView, AdminCategoryDetailView,
)
from coupons.views import AdminCouponListCreateView, AdminCouponDetailView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth & user management
    path('api/auth/', include('accounts.urls')),

    # Products, categories, wishlist, reviews
    path('api/products/', include('products.urls')),

    # Cart & orders
    path('api/orders/', include('orders.urls')),

    # Coupons
    path('api/coupons/', include('coupons.urls')),

    # Payments (Razorpay)
    path('api/payments/', include('payments.urls')),

    # Admin endpoints - dashboard & users
    path('api/admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('api/admin/users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('api/admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),

    # Admin orders
    path('api/admin/orders/', AdminOrderListView.as_view(), name='admin-orders'),
    path('api/admin/orders/<int:pk>/', AdminOrderDetailView.as_view(), name='admin-order'),

    # Admin products & categories
    path('api/admin/products/', AdminProductListView.as_view(), name='admin-product-list'),
    path('api/admin/products/<int:pk>/', AdminProductDetailView.as_view(), name='admin-product-detail'),
    path('api/admin/categories/', AdminCategoryListView.as_view(), name='admin-category-list'),
    path('api/admin/categories/<int:pk>/', AdminCategoryDetailView.as_view(), name='admin-category-detail'),

    # Admin coupons
    path('api/admin/coupons/', AdminCouponListCreateView.as_view(), name='admin-coupon-list'),
    path('api/admin/coupons/<int:pk>/', AdminCouponDetailView.as_view(), name='admin-coupon-detail'),
]

# Serve uploaded media (product/category images) in every environment.
# The images are bundled in the repository, so they exist on Render too.
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Customize admin site
admin.site.site_header = 'Shaaz Ethnicwear Admin'
admin.site.site_title = 'Shaaz Ethnicwear'
admin.site.index_title = 'Welcome to Shaaz Ethnicwear Admin Panel'
