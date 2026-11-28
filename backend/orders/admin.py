from django.contrib import admin
from django.db import transaction
from core.emailing import send_order_update_email
from .models import Cart, CartItem, Order, OrderItem, OrderTracking


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ['unit_price', 'total_price']


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_items', 'subtotal', 'created_at']
    inlines = [CartItemInline]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['line_total']

    @admin.display(description='Total price')
    def line_total(self, obj):
        # Django renders an unsaved empty form even when extra=0.
        if obj is None or obj.price is None or obj.quantity is None:
            return '—'
        return obj.total_price


class OrderTrackingInline(admin.TabularInline):
    model = OrderTracking
    extra = 0
    readonly_fields = ['timestamp']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'user', 'status', 'payment_method',
                    'payment_status', 'total', 'created_at']
    list_filter = ['status', 'payment_method', 'payment_status']
    search_fields = ['order_number', 'user__email']
    readonly_fields = ['order_number', 'created_at', 'updated_at']
    inlines = [OrderItemInline, OrderTrackingInline]
    ordering = ['-created_at']

    def save_model(self, request, obj, form, change):
        status_changed = change and 'status' in form.changed_data
        super().save_model(request, obj, form, change)
        if status_changed:
            description = {
                'PENDING': 'Your order is pending.',
                'CONFIRMED': 'Order confirmed. We are preparing your items.',
                'PROCESSING': 'Your order is being processed and packed.',
                'SHIPPED': 'Your order has been shipped and is on its way!',
                'DELIVERED': 'Order delivered successfully. Enjoy your purchase!',
                'CANCELLED': 'Order cancelled by admin.',
                'REFUNDED': 'Refund initiated for this order.',
            }[obj.status]
            OrderTracking.objects.create(order=obj, status=obj.status, description=description, updated_by=request.user)
            transaction.on_commit(lambda: send_order_update_email(obj, description, subject_prefix='Order status updated'))
