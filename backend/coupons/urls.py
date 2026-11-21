from django.urls import path
from .views import ApplyCouponView, AdminCouponListCreateView, AdminCouponDetailView

urlpatterns = [
    path('apply/', ApplyCouponView.as_view(), name='apply-coupon'),
    # Admin
    path('admin/', AdminCouponListCreateView.as_view(), name='admin-coupon-list'),
    path('admin/<int:pk>/', AdminCouponDetailView.as_view(), name='admin-coupon-detail'),
]
