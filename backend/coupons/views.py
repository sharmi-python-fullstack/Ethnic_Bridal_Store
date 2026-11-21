from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from .models import Coupon
from .serializers import CouponSerializer, ApplyCouponSerializer


class ApplyCouponView(APIView):
    """Validate a coupon code and return discount details."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ApplyCouponSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        code = serializer.validated_data['code'].strip().upper()
        order_amount = float(serializer.validated_data['order_amount'])

        try:
            coupon = Coupon.objects.get(code__iexact=code)
        except Coupon.DoesNotExist:
            return Response(
                {'error': 'Invalid coupon code.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not coupon.is_valid():
            return Response(
                {'error': 'This coupon is expired or no longer valid.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order_amount < float(coupon.min_order_amount):
            return Response(
                {'error': f'Minimum order amount of ₹{coupon.min_order_amount} required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        discount = coupon.get_discount(order_amount)
        return Response({
            'code': coupon.code,
            'discount_type': coupon.discount_type,
            'discount_value': str(coupon.discount_value),
            'discount_amount': discount,
            'description': coupon.description,
            'message': f'Coupon applied! You save ₹{discount:.0f}.',
        })


class ActiveCouponListView(APIView):
    """Public: list all active coupons for customers to pick at checkout."""
    permission_classes = []

    def get(self, request):
        active_coupons = Coupon.objects.filter(is_active=True)
        valid_coupons = [c for c in active_coupons if c.is_valid()]
        serializer = CouponSerializer(valid_coupons, many=True)
        return Response(serializer.data)


# ─── Admin Coupon Views ───────────────────────────────────────────────────────

class AdminCouponListCreateView(generics.ListCreateAPIView):
    """Admin: list all coupons or create a new one."""
    permission_classes = [IsAdminUser]
    serializer_class = CouponSerializer
    queryset = Coupon.objects.all()


class AdminCouponDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin: get, update, or delete a coupon."""
    permission_classes = [IsAdminUser]
    serializer_class = CouponSerializer
    queryset = Coupon.objects.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        code = instance.code
        self.perform_destroy(instance)
        return Response({'message': f'Coupon "{code}" deleted.'}, status=status.HTTP_200_OK)
