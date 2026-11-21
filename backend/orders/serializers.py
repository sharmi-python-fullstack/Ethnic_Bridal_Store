from rest_framework import serializers
from django.conf import settings

from products.models import Product
from products.serializers import ProductListSerializer
from .models import Cart, CartItem, Order, OrderItem, OrderTracking


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for cart items with product details."""
    product = ProductListSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True),
        source='product', write_only=True
    )
    unit_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_id', 'quantity', 'size', 'color',
            'unit_price', 'total_price', 'added_at',
        ]
        read_only_fields = ['id', 'added_at']


class CartSerializer(serializers.ModelSerializer):
    """Full cart serializer with all items and totals."""
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    subtotal = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_items', 'subtotal', 'total_price', 'updated_at']


class AddToCartSerializer(serializers.Serializer):
    """Serializer for adding a product to cart."""
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)
    size = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    color = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')

    def validate_product_id(self, value):
        try:
            product = Product.objects.get(id=value, is_active=True)
        except Product.DoesNotExist:
            raise serializers.ValidationError('Product not found or unavailable.')
        self.product = product
        return value

    def validate(self, attrs):
        product = self.product
        if product.stock < attrs['quantity']:
            raise serializers.ValidationError({
                'quantity': f'Only {product.stock} items available in stock.'
            })
        return attrs


class UpdateCartItemSerializer(serializers.Serializer):
    """Serializer for updating cart item quantity."""
    quantity = serializers.IntegerField(min_value=1)

    def validate_quantity(self, value):
        return value


class ShippingAddressSerializer(serializers.Serializer):
    """Serializer for shipping address within an order."""
    name = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=15)
    address_line1 = serializers.CharField(max_length=255)
    address_line2 = serializers.CharField(max_length=255, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    pincode = serializers.CharField(max_length=10)
    country = serializers.CharField(max_length=100, default='India')

    def validate_pincode(self, value):
        if not value.isdigit() or len(value) != 6:
            raise serializers.ValidationError('Enter a valid 6-digit PIN code.')
        return value


class OrderTrackingSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = OrderTracking
        fields = ['id', 'status', 'description', 'timestamp', 'updated_by_name']

    def get_updated_by_name(self, obj):
        if obj.updated_by:
            return obj.updated_by.get_full_name() or obj.updated_by.email
        return 'System'


class OrderItemSerializer(serializers.ModelSerializer):
    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_name', 'product_image',
            'price', 'quantity', 'size', 'color', 'total_price',
        ]


class OrderSerializer(serializers.ModelSerializer):
    """Compact order serializer for list views."""
    total_items = serializers.IntegerField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(
        source='get_payment_method_display', read_only=True
    )
    payment_status_display = serializers.CharField(
        source='get_payment_status_display', read_only=True
    )

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'status_display',
            'payment_method', 'payment_method_display',
            'payment_status', 'payment_status_display',
            'subtotal', 'shipping_charge', 'discount', 'total',
            'total_items', 'created_at',
        ]


class OrderDetailSerializer(serializers.ModelSerializer):
    """Full order detail serializer with items and tracking."""
    items = OrderItemSerializer(many=True, read_only=True)
    tracking_history = OrderTrackingSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(
        source='get_payment_method_display', read_only=True
    )
    payment_status_display = serializers.CharField(
        source='get_payment_status_display', read_only=True
    )
    can_cancel = serializers.BooleanField(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'status_display',
            'shipping_address', 'payment_method', 'payment_method_display',
            'payment_status', 'payment_status_display',
            'razorpay_order_id', 'razorpay_payment_id',
            'coupon_code', 'subtotal', 'shipping_charge', 'discount', 'total',
            'notes', 'can_cancel', 'items', 'tracking_history',
            'created_at', 'updated_at',
        ]


class CreateOrderSerializer(serializers.Serializer):
    """Serializer for creating a new order from cart."""
    shipping_address = ShippingAddressSerializer()
    payment_method = serializers.ChoiceField(
        choices=Order.PAYMENT_METHOD_CHOICES, default='COD'
    )
    coupon_code = serializers.CharField(
        max_length=50, required=False, allow_blank=True
    )
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        request = self.context['request']
        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            raise serializers.ValidationError('Your cart is empty.')
        if not cart.items.exists():
            raise serializers.ValidationError('Your cart is empty.')
        # Check stock for all items
        for item in cart.items.all():
            if item.product.stock < item.quantity:
                raise serializers.ValidationError(
                    f'Only {item.product.stock} units of "{item.product.name}" available.'
                )
        attrs['cart'] = cart
        return attrs
