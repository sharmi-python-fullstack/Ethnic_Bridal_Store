from rest_framework import serializers
from .models import Category, Product, ProductImage, ProductReview, Wishlist


class CategorySerializer(serializers.ModelSerializer):
    """Category serializer with nested children."""
    children = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'image', 'image_url',
            'parent', 'children', 'product_count', 'is_active',
        ]

    def get_children(self, obj):
        children = obj.children.filter(is_active=True)
        return CategorySerializer(children, many=True, context=self.context).data

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for product images."""
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'image_url', 'is_primary', 'alt_text']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ProductListSerializer(serializers.ModelSerializer):
    """Compact serializer for product listings."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    primary_image = serializers.SerializerMethodField()
    effective_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    discount_percentage = serializers.IntegerField(read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category_name', 'category_slug',
            'price', 'discount_price', 'effective_price', 'discount_percentage',
            'primary_image', 'is_featured', 'in_stock', 'stock',
            'average_rating', 'review_count', 'occasion', 'color', 'fabric',
            'created_at',
        ]

    def get_primary_image(self, obj):
        image = obj.images.filter(is_primary=True).first()
        if not image:
            image = obj.images.first()
        if image:
            return ProductImageSerializer(image, context=self.context).data
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full product detail serializer with all related data."""
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    effective_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    discount_percentage = serializers.IntegerField(read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    in_wishlist = serializers.SerializerMethodField()
    size_chart_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'description',
            'price', 'discount_price', 'effective_price', 'discount_percentage',
            'stock', 'in_stock', 'is_featured', 'is_active',
            'images', 'fabric', 'care_instructions', 'occasion', 'color',
            'size_chart', 'size_chart_url', 'average_rating', 'review_count',
            'in_wishlist', 'created_at', 'updated_at',
        ]

    def get_in_wishlist(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Wishlist.objects.filter(user=request.user, product=obj).exists()
        return False

    def get_size_chart_url(self, obj):
        if obj.size_chart:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.size_chart.url)
            return obj.size_chart.url
        return None


class ProductReviewSerializer(serializers.ModelSerializer):
    """Serializer for displaying product reviews."""
    user_name = serializers.SerializerMethodField()
    user_avatar = serializers.SerializerMethodField()

    class Meta:
        model = ProductReview
        fields = [
            'id', 'user_name', 'user_avatar', 'rating', 'title',
            'comment', 'is_verified', 'created_at',
        ]

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email.split('@')[0]

    def get_user_avatar(self, obj):
        if obj.user.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.profile_image.url)
            return obj.user.profile_image.url
        return None


class CreateReviewSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating product reviews."""
    class Meta:
        model = ProductReview
        fields = ['rating', 'title', 'comment']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value

    def validate_comment(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError('Review comment must be at least 10 characters.')
        return value


class WishlistSerializer(serializers.ModelSerializer):
    """Serializer for wishlist items."""
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = Wishlist
        fields = ['id', 'product', 'added_at']


class AdminProductSerializer(serializers.ModelSerializer):
    """Full product serializer for admin CRUD."""
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = '__all__'
        extra_kwargs = {'slug': {'required': False, 'allow_blank': True}}


class AdminCategorySerializer(serializers.ModelSerializer):
    """Full category serializer for admin CRUD."""
    class Meta:
        model = Category
        fields = '__all__'

    def validate_slug(self, value):
        from django.utils.text import slugify
        return slugify(value) if value else value
