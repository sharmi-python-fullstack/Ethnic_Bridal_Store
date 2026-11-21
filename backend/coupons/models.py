from django.db import models
from django.utils import timezone


class Coupon(models.Model):
    DISCOUNT_TYPE_CHOICES = [
        ('PERCENTAGE', 'Percentage'),
        ('FIXED', 'Fixed Amount'),
    ]

    code = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.CharField(max_length=200, blank=True)
    discount_type = models.CharField(
        max_length=20, choices=DISCOUNT_TYPE_CHOICES, default='PERCENTAGE'
    )
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )
    max_discount_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text='Maximum discount cap (for percentage coupons)'
    )
    max_uses = models.PositiveIntegerField(
        default=0, help_text='0 = unlimited'
    )
    times_used = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Coupon'
        verbose_name_plural = 'Coupons'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.code} ({self.discount_type}: {self.discount_value})'

    def is_valid(self):
        now = timezone.now()
        if not self.is_active:
            return False
        if now < self.valid_from:
            return False
        if self.valid_until and now > self.valid_until:
            return False
        if self.max_uses > 0 and self.times_used >= self.max_uses:
            return False
        return True

    def get_discount(self, order_amount):
        """Return the discount amount for a given order total."""
        if order_amount < float(self.min_order_amount):
            return 0
        if self.discount_type == 'PERCENTAGE':
            discount = (float(self.discount_value) / 100) * order_amount
            if self.max_discount_amount:
                discount = min(discount, float(self.max_discount_amount))
            return round(discount, 2)
        else:  # FIXED
            return min(float(self.discount_value), order_amount)
