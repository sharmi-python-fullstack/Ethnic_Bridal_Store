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
    verbose_name_plural = 'Order tracking history (changing the latest status updates the order)'


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

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        # The explicit order-status field takes precedence if changed in the
        # same save. Editing an older history item must not roll an order back.
        if 'status' in form.changed_data:
            return

        changed_ids = set()
        for formset in formsets:
            if formset.model is OrderTracking:
                changed_ids.update(obj.pk for obj in formset.new_objects)
                changed_ids.update(obj.pk for obj, fields in formset.changed_objects if 'status' in fields)
        if not changed_ids:
            return

        order = form.instance
        latest = order.tracking_history.order_by('-timestamp', '-pk').first()
        if latest and latest.pk in changed_ids and latest.status != order.status:
            order.status = latest.status
            order.save(update_fields=['status', 'updated_at'])
            transaction.on_commit(lambda: send_order_update_email(order, latest.description, subject_prefix='Order tracking update'))
