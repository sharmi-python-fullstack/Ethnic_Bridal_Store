from django.db import models
from django.utils.text import slugify
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator, URLValidator
import uuid


class NewsletterSubscriber(models.Model):
    email = models.EmailField(unique=True)
    is_confirmed = models.BooleanField(default=False)
    confirmation_token = models.UUIDField(default=uuid.uuid4, unique=True, null=True, blank=True)
    unsubscribe_token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.email


class NewsletterIssue(models.Model):
    subject = models.CharField(max_length=200)
    body = models.TextField(help_text='Plain-text newsletter content.')
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    is_sending = models.BooleanField(default=False)

    def __str__(self):
        return self.subject


class NewsletterDelivery(models.Model):
    issue = models.ForeignKey(NewsletterIssue, on_delete=models.CASCADE, related_name='deliveries')
    subscriber = models.ForeignKey(NewsletterSubscriber, on_delete=models.CASCADE, related_name='deliveries')
    status = models.CharField(max_length=12, choices=[('pending', 'Pending'), ('sending', 'Sending'), ('sent', 'Sent'), ('failed', 'Failed'), ('skipped', 'Skipped')], default='pending')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['issue', 'subscriber'], name='unique_newsletter_delivery')]


class StoredMedia(models.Model):
    """Uploaded image bytes persisted in the configured Django database."""
    name = models.CharField(max_length=500, unique=True)
    content = models.BinaryField()
    created_at = models.DateTimeField(auto_now_add=True)


class SocialMediaLink(models.Model):
    """Store-owned profile links displayed in the storefront footer."""
    PLATFORM_CHOICES = [
        ('facebook', 'Facebook'), ('instagram', 'Instagram'),
        ('x', 'X'), ('youtube', 'YouTube'),
    ]
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, unique=True)
    url = models.URLField(max_length=500, validators=[URLValidator(schemes=['https'])], help_text='Full HTTPS link to the store profile.')
    is_active = models.BooleanField(default=True, help_text='Only active links appear in the footer.')
    display_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'platform']
        verbose_name = 'Social media link'
        verbose_name_plural = 'Social media links'

    def __str__(self):
        return self.get_platform_display()


class Category(models.Model):
    """Product category with optional parent (subcategory support)."""
    name = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(unique=True, max_length=200)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    parent = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='children'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        if self.parent:
            return f'{self.parent.name} → {self.name}'
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Product(models.Model):
    """Main product model for Shaaz Ethnicwear."""
    OCCASION_CHOICES = [
        ('bridal', 'Bridal'),
        ('wedding', 'Wedding'),
        ('festive', 'Festive'),
        ('party', 'Party Wear'),
        ('casual', 'Casual'),
        ('office', 'Office Wear'),
    ]
    COLOR_CHOICES = [
        ('red', 'Red'),
        ('pink', 'Pink'),
        ('blue', 'Blue'),
        ('green', 'Green'),
        ('yellow', 'Yellow'),
        ('orange', 'Orange'),
        ('purple', 'Purple'),
        ('maroon', 'Maroon'),
        ('gold', 'Gold'),
        ('silver', 'Silver'),
        ('white', 'White'),
        ('black', 'Black'),
        ('multicolor', 'Multi-Color'),
    ]

    name = models.CharField(max_length=300, db_index=True)
    slug = models.SlugField(unique=True, max_length=300)
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True,
        related_name='products'
    )
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    discount_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0)]
    )
    stock = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Ethnic wear specific fields
    fabric = models.CharField(max_length=200, blank=True)
    care_instructions = models.TextField(blank=True)
    occasion = models.CharField(
        max_length=50, choices=OCCASION_CHOICES, blank=True
    )
    color = models.CharField(
        max_length=50, choices=COLOR_CHOICES, blank=True
    )
    size_chart = models.ImageField(
        upload_to='size_charts/', blank=True, null=True
    )

    class Meta:
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def effective_price(self):
        """Return discounted price if available, else regular price."""
        return self.discount_price if self.discount_price else self.price

    @property
    def discount_percentage(self):
        """Calculate discount percentage."""
        if self.discount_price and self.price > 0:
            return round(((self.price - self.discount_price) / self.price) * 100)
        return 0

    @property
    def in_stock(self):
        return self.stock > 0

    @property
    def average_rating(self):
        reviews = self.reviews.filter(is_verified=True)
        if reviews.exists():
            return round(reviews.aggregate(
                models.Avg('rating')
            )['rating__avg'], 1)
        return 0.0

    @property
    def review_count(self):
        return self.reviews.filter(is_verified=True).count()


class ProductImage(models.Model):
    """Multiple images for a product."""
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='images'
    )
    image = models.ImageField(upload_to='products/')
    is_primary = models.BooleanField(default=False)
    alt_text = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Product Image'
        verbose_name_plural = 'Product Images'
        ordering = ['-is_primary', 'created_at']

    def __str__(self):
        return f'{self.product.name} - {"Primary" if self.is_primary else "Image"}'

    def save(self, *args, **kwargs):
        if self.is_primary:
            ProductImage.objects.filter(
                product=self.product, is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)


class ProductReview(models.Model):
    """Customer reviews for products."""
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='reviews'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='reviews'
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    title = models.CharField(max_length=200)
    comment = models.TextField()
    is_verified = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Product Review'
        verbose_name_plural = 'Product Reviews'
        ordering = ['-created_at']
        unique_together = ['product', 'user']

    def __str__(self):
        return f'{self.user.email} - {self.product.name} ({self.rating}★)'


class Wishlist(models.Model):
    """Products saved to user's wishlist."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='wishlist_items'
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='wishlisted_by'
    )
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Wishlist Item'
        verbose_name_plural = 'Wishlist Items'
        unique_together = ['user', 'product']
        ordering = ['-added_at']

    def __str__(self):
        return f'{self.user.email} → {self.product.name}'
