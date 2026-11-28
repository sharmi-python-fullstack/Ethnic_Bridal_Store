from django.contrib import admin
from django.contrib import messages
from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.shortcuts import get_object_or_404, redirect
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils import timezone
from django.utils.html import format_html

from core.emailing import send_store_email
from .models import Category, Product, ProductImage, ProductReview, Wishlist, SocialMediaLink, NewsletterSubscriber, NewsletterIssue, NewsletterDelivery


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ['email', 'is_confirmed', 'created_at', 'confirmed_at']
    list_filter = ['is_confirmed']
    search_fields = ['email']
    fields = ['email', 'is_confirmed', 'created_at', 'confirmed_at']
    readonly_fields = fields

    def has_add_permission(self, request):
        return False  # Subscribers must opt in using their own email confirmation.


@admin.register(NewsletterIssue)
class NewsletterIssueAdmin(admin.ModelAdmin):
    list_display = ['subject', 'created_at', 'started_at']
    readonly_fields = ['created_at', 'started_at', 'send_link']
    fields = ['subject', 'body', 'created_at', 'started_at', 'send_link']

    def get_readonly_fields(self, request, obj=None):
        fields = list(super().get_readonly_fields(request, obj))
        if obj and obj.started_at:
            fields.extend(['subject', 'body'])
        return fields

    @admin.display(description='Send newsletter')
    def send_link(self, obj):
        if not obj or not obj.pk:
            return 'Save the draft first.'
        return format_html('<a href="{}">Review and send a batch</a>', reverse('admin:newsletter-send', args=[obj.pk]))

    def get_urls(self):
        return [path('<int:issue_id>/send/', self.admin_site.admin_view(self.send_batch), name='newsletter-send')] + super().get_urls()

    def send_batch(self, request, issue_id):
        issue = get_object_or_404(NewsletterIssue, pk=issue_id)
        if not self.has_change_permission(request, issue):
            raise PermissionDenied
        if request.method == 'POST':
            with transaction.atomic():
                issue = NewsletterIssue.objects.select_for_update().get(pk=issue_id)
                if issue.is_sending:
                    self.message_user(request, 'A batch is already in progress. Do not send another.', messages.ERROR)
                    return redirect('admin:newsletter-send', issue_id=issue_id)
                if not issue.started_at:
                    subscribers = NewsletterSubscriber.objects.filter(is_confirmed=True)
                    NewsletterDelivery.objects.bulk_create(
                        [NewsletterDelivery(issue=issue, subscriber=s) for s in subscribers],
                        ignore_conflicts=True,
                    )
                    issue.started_at = timezone.now()
                issue.is_sending = True
                issue.save(update_fields=['started_at', 'is_sending'])

            sent_count = failed_count = 0
            try:
                for delivery in issue.deliveries.filter(status='pending').select_related('subscriber').order_by('id')[:25]:
                    subscriber = NewsletterSubscriber.objects.get(pk=delivery.subscriber_id)
                    if not subscriber.is_confirmed:
                        delivery.status = 'skipped'
                        delivery.save(update_fields=['status', 'updated_at'])
                        continue
                    delivery.status = 'sending'
                    delivery.save(update_fields=['status', 'updated_at'])
                    unsubscribe_url = request.build_absolute_uri(reverse('newsletter-unsubscribe', args=[subscriber.unsubscribe_token]))
                    sent = send_store_email(
                        issue.subject, subscriber.email,
                        f'{issue.body}\n\n---\nYou received this email because you subscribed to Shaaz Ethnicwear.\nUnsubscribe: {unsubscribe_url}',
                    )
                    delivery.status = 'sent' if sent else 'failed'
                    delivery.save(update_fields=['status', 'updated_at'])
                    sent_count += int(sent)
                    failed_count += int(not sent)
            finally:
                NewsletterIssue.objects.filter(pk=issue_id).update(is_sending=False)
            self.message_user(request, f'Batch finished: {sent_count} accepted by email provider, {failed_count} failed. Check remaining deliveries below.', messages.WARNING if failed_count else messages.SUCCESS)
            return redirect('admin:newsletter-send', issue_id=issue_id)

        counts = {status: issue.deliveries.filter(status=status).count() for status in ['pending', 'sending', 'sent', 'failed', 'skipped']}
        context = {
            **self.admin_site.each_context(request), 'title': 'Review newsletter batch',
            'issue': issue, 'counts': counts,
            'subscriber_count': NewsletterSubscriber.objects.filter(is_confirmed=True).count(),
            'opts': self.model._meta,
        }
        return TemplateResponse(request, 'admin/newsletter_send.html', context)


@admin.register(SocialMediaLink)
class SocialMediaLinkAdmin(admin.ModelAdmin):
    list_display = ['platform', 'url', 'is_active', 'display_order']
    list_editable = ['is_active', 'display_order']
    ordering = ['display_order', 'platform']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'parent', 'is_active', 'product_count', 'created_at']
    list_filter = ['is_active', 'parent']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['is_active']

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = 'Products'


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ['image', 'is_primary', 'alt_text', 'thumbnail']
    readonly_fields = ['thumbnail']

    def thumbnail(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="80" height="80" style="object-fit:cover;" />',
                obj.image.url
            )
        return 'No Image'
    thumbnail.short_description = 'Preview'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'category', 'price', 'discount_price', 'stock',
        'is_featured', 'is_active', 'color', 'occasion', 'created_at'
    ]
    list_filter = ['is_active', 'is_featured', 'category', 'occasion', 'color']
    search_fields = ['name', 'description', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['price', 'discount_price', 'stock', 'is_featured', 'is_active']
    inlines = [ProductImageInline]
    readonly_fields = ['created_at', 'updated_at', 'effective_price', 'discount_percentage']
    raw_id_fields = ['category']

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'category', 'description')
        }),
        ('Pricing & Stock', {
            'fields': ('price', 'discount_price', 'effective_price', 'discount_percentage', 'stock')
        }),
        ('Attributes', {
            'fields': ('fabric', 'care_instructions', 'occasion', 'color', 'size_chart')
        }),
        ('Status', {
            'fields': ('is_featured', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('category')


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'is_primary', 'alt_text', 'thumbnail']
    list_filter = ['is_primary']
    search_fields = ['product__name', 'alt_text']
    raw_id_fields = ['product']

    def thumbnail(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="60" height="60" style="object-fit:cover;" />',
                obj.image.url
            )
        return 'No Image'
    thumbnail.short_description = 'Preview'


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'title', 'is_verified', 'created_at']
    list_filter = ['rating', 'is_verified', 'created_at']
    search_fields = ['product__name', 'user__email', 'title', 'comment']
    list_editable = ['is_verified']
    raw_id_fields = ['product', 'user']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ['user', 'product', 'added_at']
    search_fields = ['user__email', 'product__name']
    raw_id_fields = ['user', 'product']
    readonly_fields = ['added_at']
