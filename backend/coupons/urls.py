from django.urls import path
from .views import (
    ApplyCouponView,
    ActiveCouponListView,
    AdminCouponListCreateView,
    AdminCouponDetailView,
)

urlpatterns = [
    path('apply/', ApplyCouponView.as_view(), name='apply-coupon'),
    path('active/', ActiveCouponListView.as_view(), name='active-coupons'),
    # Admin
    path('admin/', AdminCouponListCreateView.as_view(), name='admin-coupon-list'),
    path('admin/<int:pk>/', AdminCouponDetailView.as_view(), name='admin-coupon-detail'),
]
