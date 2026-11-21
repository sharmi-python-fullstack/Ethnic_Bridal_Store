from django.contrib import admin
from django.utils.html import format_html

from .models import Category, Product, ProductImage, ProductReview, Wishlist


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
