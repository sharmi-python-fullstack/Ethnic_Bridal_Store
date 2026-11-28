from rest_framework import status, generics, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.shortcuts import get_object_or_404
from django.db import transaction

from products.models import Product
from .models import Cart, CartItem, Order, OrderItem, OrderTracking
from .serializers import (
    CartSerializer, CartItemSerializer, AddToCartSerializer,
    UpdateCartItemSerializer, OrderSerializer, OrderDetailSerializer,
    CreateOrderSerializer, OrderTrackingWriteSerializer,
)
from core.emailing import send_order_update_email


# ─── Cart Views ──────────────────────────────────────────────────────────────

class CartView(APIView):
    """Get or clear the authenticated user's cart."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)

    def delete(self, request):
        try:
            cart = Cart.objects.get(user=request.user)
            cart.items.all().delete()
        except Cart.DoesNotExist:
            pass
        return Response({'message': 'Cart cleared.'}, status=status.HTTP_200_OK)


class CartItemAddView(APIView):
    """Add an item to the cart or update quantity if it already exists."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        product = serializer.product
        cart, _ = Cart.objects.get_or_create(user=request.user)

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            size=data.get('size', ''),
            color=data.get('color', ''),
            defaults={'quantity': data['quantity']},
        )
        if not created:
            new_qty = item.quantity + data['quantity']
            if product.stock < new_qty:
                return Response(
                    {'error': f'Only {product.stock} units available.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            item.quantity = new_qty
            item.save()

        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response({
            'message': f'"{product.name}" added to cart.',
            'cart': cart_serializer.data,
        }, status=status.HTTP_200_OK)


class CartItemUpdateView(APIView):
    """Update a specific cart item's quantity."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, item_id):
        cart = get_object_or_404(Cart, user=request.user)
        item = get_object_or_404(CartItem, id=item_id, cart=cart)

        serializer = UpdateCartItemSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_qty = serializer.validated_data['quantity']
        if item.product.stock < new_qty:
            return Response(
                {'error': f'Only {item.product.stock} units available.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        item.quantity = new_qty
        item.save()

        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response({'message': 'Cart updated.', 'cart': cart_serializer.data})

    def delete(self, request, item_id):
        cart = get_object_or_404(Cart, user=request.user)
        item = get_object_or_404(CartItem, id=item_id, cart=cart)
        item.delete()

        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response({'message': 'Item removed.', 'cart': cart_serializer.data})


# ─── Order Views ─────────────────────────────────────────────────────────────

class OrderListView(APIView):
    """List the authenticated user's orders."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user).prefetch_related('items')
        serializer = OrderSerializer(orders, many=True, context={'request': request})
        return Response({'count': len(serializer.data), 'results': serializer.data})


class OrderCreateView(APIView):
    """Place a new order from the current cart."""
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        cart = data['cart']
        is_online_payment = data['payment_method'] == 'RAZORPAY'

        # Reuse an outstanding secure-payment order instead of creating a
        # duplicate order and reserving the same cart stock a second time.
        if is_online_payment:
            pending_order = Order.objects.filter(
                user=request.user, payment_method='RAZORPAY',
                payment_status='PENDING', status='PENDING',
            ).order_by('-created_at').first()
            if pending_order:
                return Response({
                    'message': 'A pending Razorpay payment was found.',
                    'order': OrderDetailSerializer(pending_order, context={'request': request}).data,
                }, status=status.HTTP_200_OK)

        # Apply coupon if provided
        coupon_code = data.get('coupon_code', '').strip()
        discount = 0
        if coupon_code:
            from coupons.models import Coupon
            try:
                coupon = Coupon.objects.get(
                    code__iexact=coupon_code, is_active=True
                )
                if coupon.is_valid():
                    discount = coupon.get_discount(float(cart.subtotal))
                    coupon.times_used += 1
                    coupon.save()
            except Exception:
                pass

        subtotal = float(cart.subtotal)
        shipping_charge = 0 if subtotal >= 999 else 99
        total = subtotal + shipping_charge - discount

        # Online orders remain pending until Razorpay returns a verified payment
        # signature. COD orders can be confirmed immediately.
        order = Order.objects.create(
            user=request.user,
            shipping_address=data['shipping_address'],
            payment_method=data['payment_method'],
            status='PENDING' if is_online_payment else 'CONFIRMED',
            coupon_code=coupon_code,
            subtotal=subtotal,
            shipping_charge=shipping_charge,
            discount=discount,
            total=total,
            notes=data.get('notes', ''),
        )

        # Snapshot cart items into order items
        for item in cart.items.select_related('product__category').prefetch_related('product__images'):
            primary_image = item.product.images.filter(is_primary=True).first()
            if not primary_image:
                primary_image = item.product.images.first()
            image_url = ''
            if primary_image:
                image_url = request.build_absolute_uri(primary_image.image.url)

            OrderItem.objects.create(
                order=order,
                product=item.product,
                product_name=item.product.name,
                product_image=image_url,
                price=item.unit_price,
                quantity=item.quantity,
                size=item.size,
                color=item.color,
            )
            # Deduct stock
            item.product.stock = max(0, item.product.stock - item.quantity)
            item.product.save(update_fields=['stock'])

        # Keep the cart until an online payment is verified, so an interrupted
        # Razorpay checkout can be retried. COD has no second confirmation step.
        if not is_online_payment:
            cart.items.all().delete()

        payment_desc = 'via Cash on Delivery' if data['payment_method'] == 'COD' else 'awaiting Razorpay payment'
        OrderTracking.objects.create(
            order=order,
            status=order.status,
            description=(
                f'Order #{order.order_number} confirmed {payment_desc}! Preparing your bridal attire for dispatch.'
                if not is_online_payment
                else f'Order #{order.order_number} was created and is awaiting secure Razorpay payment confirmation.'
            ),
            updated_by=None,
        )
        transaction.on_commit(
            lambda: send_order_update_email(
                order,
                'Your order has been placed successfully. We will keep you updated as it moves through our bridal studio.',
                subject_prefix='Order confirmed',
            )
        )

        return Response({
            'message': 'Order placed successfully!',
            'order': OrderDetailSerializer(order, context={'request': request}).data,
        }, status=status.HTTP_201_CREATED)


class OrderDetailView(APIView):
    """Get order details for the authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        order = get_object_or_404(
            Order.objects.prefetch_related('items', 'tracking_history'),
            pk=pk, user=request.user,
        )
        serializer = OrderDetailSerializer(order, context={'request': request})
        return Response(serializer.data)


class OrderCancelView(APIView):
    """Cancel an order if it is still cancellable."""
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk, user=request.user)
        if not order.can_cancel():
            return Response(
                {'error': 'This order cannot be cancelled at this stage.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Restore stock
        for item in order.items.select_related('product'):
            if item.product:
                item.product.stock += item.quantity
                item.product.save(update_fields=['stock'])

        order.status = 'CANCELLED'
        order.save(update_fields=['status'])

        OrderTracking.objects.create(
            order=order,
            status='CANCELLED',
            description='Order cancelled by customer.',
            updated_by=request.user,
        )
        transaction.on_commit(
            lambda: send_order_update_email(
                order,
                'Your order has been cancelled. If payment was completed, our team will contact you about the refund process.',
                subject_prefix='Order cancelled',
            )
        )
        return Response({'message': 'Order cancelled successfully.'})


# ─── Admin Order Views ────────────────────────────────────────────────────────

class AdminOrderListView(generics.ListAPIView):
    """Admin: List all orders with optional filtering."""
    permission_classes = [IsAdminUser]
    serializer_class = OrderSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['order_number', 'user__email']
    ordering_fields = ['created_at', 'total', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Order.objects.select_related('user').prefetch_related('items')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class AdminOrderDetailView(APIView):
    """Admin: Get order detail and update order status."""
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        order = get_object_or_404(
            Order.objects.prefetch_related('items', 'tracking_history__updated_by'),
            pk=pk,
        )
        serializer = OrderDetailSerializer(order, context={'request': request})
        return Response(serializer.data)

    @transaction.atomic
    def patch(self, request, pk):
        order = get_object_or_404(Order, pk=pk)
        new_status = request.data.get('status')
        payment_status = request.data.get('payment_status')

        status_description = None
        if new_status and new_status in dict(Order.STATUS_CHOICES) and new_status != order.status:
            old_status = order.status
            order.status = new_status
            order.save(update_fields=['status'])

            status_descriptions = {
                'CONFIRMED': 'Order confirmed. We are preparing your items.',
                'PROCESSING': 'Your order is being processed and packed.',
                'SHIPPED': 'Your order has been shipped and is on its way!',
                'DELIVERED': 'Order delivered successfully. Enjoy your purchase!',
                'CANCELLED': 'Order cancelled by admin.',
                'REFUNDED': 'Refund initiated for this order.',
            }
            status_description = status_descriptions.get(new_status, f'Status updated to {new_status}.')
            OrderTracking.objects.create(
                order=order,
                status=new_status,
                description=status_description,
                updated_by=request.user,
            )

        if payment_status and payment_status in dict(Order.PAYMENT_STATUS_CHOICES):
            order.payment_status = payment_status
            order.save(update_fields=['payment_status'])

        if status_description and old_status != new_status:
            transaction.on_commit(
                lambda: send_order_update_email(
                    order,
                    status_description,
                    subject_prefix='Order status updated',
                )
            )

        return Response({
            'message': 'Order updated.',
            'order': OrderDetailSerializer(order, context={'request': request}).data,
        })


class AdminOrderTrackingListCreateView(APIView):
    """Staff can add a customer-visible tracking event to an order."""
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk)
        serializer = OrderTrackingWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tracking = OrderTracking.objects.create(
            order=order,
            status=serializer.validated_data['status'],
            description=serializer.validated_data['description'],
            updated_by=request.user,
        )

        if serializer.validated_data['sync_order_status'] and order.status != tracking.status:
            order.status = tracking.status
            order.save(update_fields=['status'])
            transaction.on_commit(
                lambda: send_order_update_email(
                    order,
                    tracking.description,
                    subject_prefix='Order tracking update',
                )
            )

        return Response({
            'message': 'Tracking update added.',
            'tracking': OrderDetailSerializer(order, context={'request': request}).data['tracking_history'][0],
            'order': OrderDetailSerializer(order, context={'request': request}).data,
        }, status=status.HTTP_201_CREATED)


class AdminOrderTrackingDetailView(APIView):
    """Staff can correct or remove a previously entered tracking event."""
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def patch(self, request, pk, tracking_id):
        order = get_object_or_404(Order.objects.select_for_update(), pk=pk)
        tracking = get_object_or_404(OrderTracking, id=tracking_id, order=order)
        serializer = OrderTrackingWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        changed_fields = []
        status_provided = 'status' in serializer.validated_data
        for field in ('status', 'description'):
            if field in serializer.validated_data:
                setattr(tracking, field, serializer.validated_data[field])
                changed_fields.append(field)
        if changed_fields:
            tracking.updated_by = request.user
            changed_fields.append('updated_by')
            tracking.save(update_fields=changed_fields)

        latest = order.tracking_history.order_by('-timestamp', '-pk').first()
        if status_provided and latest and latest.pk == tracking.pk and order.status != tracking.status:
            order.status = tracking.status
            order.save(update_fields=['status', 'updated_at'])
            transaction.on_commit(lambda: send_order_update_email(order, tracking.description, subject_prefix='Order tracking update'))

        return Response({'message': 'Tracking update saved.', 'order': OrderDetailSerializer(order, context={'request': request}).data})

    def delete(self, request, pk, tracking_id):
        tracking = get_object_or_404(OrderTracking, id=tracking_id, order_id=pk)
        tracking.delete()
        return Response({'message': 'Tracking update deleted.'}, status=status.HTTP_200_OK)
