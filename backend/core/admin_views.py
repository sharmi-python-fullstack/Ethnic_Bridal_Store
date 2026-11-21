"""
Unified admin dashboard endpoints.
All routes are protected by IsAdminUser.
"""
from django.db.models import Sum, Count, Avg
from django.contrib.auth import get_user_model
from rest_framework import status, generics, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from django.shortcuts import get_object_or_404

from products.models import Product, Category
from products.serializers import AdminProductSerializer, AdminCategorySerializer
from orders.models import Order
from orders.serializers import OrderSerializer, OrderDetailSerializer, OrderTracking
from accounts.serializers import UserSerializer

User = get_user_model()


class AdminDashboardView(APIView):
    """Overview statistics for the admin dashboard."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        from orders.models import Order, OrderItem
        from products.models import Product, Category
        from coupons.models import Coupon

        total_orders = Order.objects.count()
        total_revenue = Order.objects.filter(
            payment_status='PAID'
        ).aggregate(rev=Sum('total'))['rev'] or 0

        total_products = Product.objects.filter(is_active=True).count()
        total_users = User.objects.filter(is_active=True).count()
        low_stock = Product.objects.filter(is_active=True, stock__lte=5).count()
        active_coupons = Coupon.objects.filter(is_active=True).count()

        # Recent orders
        recent_orders = Order.objects.select_related('user').order_by('-created_at')[:5]
        recent_serialized = OrderSerializer(recent_orders, many=True, context={'request': request}).data

        # Orders by status
        status_counts = dict(
            Order.objects.values_list('status').annotate(count=Count('id'))
        )

        # Monthly revenue (last 6 months)
        from django.utils import timezone
        from datetime import timedelta
        from django.db.models.functions import TruncMonth

        six_months_ago = timezone.now() - timedelta(days=180)
        monthly = (
            Order.objects
            .filter(created_at__gte=six_months_ago, payment_status='PAID')
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(revenue=Sum('total'), orders=Count('id'))
            .order_by('month')
            .values('month', 'revenue', 'orders')
        )

        monthly_data = [
            {
                'month': item['month'].strftime('%Y-%m') if item['month'] else '',
                'revenue': float(item['revenue'] or 0),
                'orders': item['orders'],
            }
            for item in monthly
        ]

        return Response({
            'total_orders': total_orders,
            'total_revenue': float(total_revenue),
            'total_products': total_products,
            'total_users': total_users,
            'low_stock_products': low_stock,
            'active_coupons': active_coupons,
            'recent_orders': recent_serialized,
            'orders_by_status': status_counts,
            'monthly_revenue': monthly_data,
        })


class AdminUserListView(generics.ListAPIView):
    """Admin: list all users."""
    permission_classes = [IsAdminUser]
    serializer_class = UserSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    ordering_fields = ['date_joined', 'email']
    ordering = ['-date_joined']

    def get_queryset(self):
        return User.objects.all()


class AdminUserDetailView(APIView):
    """Admin: get or update a user (activate/deactivate, toggle staff)."""
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = UserSerializer(user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        # Only allow toggling is_active and is_staff
        if 'is_active' in request.data:
            user.is_active = bool(request.data['is_active'])
        if 'is_staff' in request.data:
            user.is_staff = bool(request.data['is_staff'])
        user.save()
        serializer = UserSerializer(user, context={'request': request})
        return Response({
            'message': 'User updated.',
            'user': serializer.data,
        })
