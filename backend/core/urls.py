"""
URL configuration for Shaaz Ethnicwear backend.
"""
from django.contrib import admin
from django.conf import settings
from django.http import JsonResponse
from django.urls import path
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.views.static import serve

from .admin_views import AdminDashboardView, AdminUserListView, AdminUserDetailView
from .chatbot_views import StoreChatView
from .social_views import SocialMediaLinksView
from .media_views import database_media
from orders.views import (
    AdminOrderListView, AdminOrderDetailView,
    AdminOrderTrackingListCreateView, AdminOrderTrackingDetailView,
)
from products.views import (
    AdminProductListView, AdminProductDetailView,
    AdminCategoryListView, AdminCategoryDetailView,
)
from coupons.views import AdminCouponListCreateView, AdminCouponDetailView
def payment_config_check(request):
    return JsonResponse({
        "razorpay_key_id_configured": bool(
            getattr(settings, "RAZORPAY_KEY_ID", "")
        ),
        "razorpay_secret_configured": bool(
            getattr(settings, "RAZORPAY_KEY_SECRET", "")
        ),
        "test_mode": bool(getattr(settings, "RAZORPAY_TEST_MODE", False)),
    })



def health_check(request):
    """Lightweight response for Render health checks and service monitoring."""
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('', health_check, name='health-check'),
    path('admin/', admin.site.urls),
     # Razorpay configuration diagnostic
    path(
        'api/payment-config-check/',
        payment_config_check,
        name='payment-config-check'
    ),

    # Auth & user management
    path('api/auth/', include('accounts.urls')),

    # Products, categories, wishlist, reviews
    path('api/products/', include('products.urls')),

    # Store-only support assistant
    path('api/chat/', StoreChatView.as_view(), name='store-chat'),
    path('api/social-links/', SocialMediaLinksView.as_view(), name='social-links'),
    path('api/media/<path:name>', database_media, name='database-media'),

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
    path('api/admin/orders/<int:pk>/tracking/', AdminOrderTrackingListCreateView.as_view(), name='admin-order-tracking'),
    path('api/admin/orders/<int:pk>/tracking/<int:tracking_id>/', AdminOrderTrackingDetailView.as_view(), name='admin-order-tracking-detail'),

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
