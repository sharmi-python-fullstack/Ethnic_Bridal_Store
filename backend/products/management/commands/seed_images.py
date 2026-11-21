"""
Seed product images for Shaaz Ethnicwear.

Downloads REAL bridal/ethnic wear images from Unsplash and assigns them to
products based on their category.

Usage:
    python manage.py seed_images
    python manage.py seed_images --images-per-product 3
"""
import urllib.request
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from products.models import Product, ProductImage, Category


# ─── Category → Real bridal-wear Unsplash image URLs ───────────────────────────
# These are actual Indian bridal/ethnic wear photos from Unsplash (free license)
CATEGORY_IMAGES = {
    'Bridal Lehengas': [
        'https://images.unsplash.com/photo-1610189020987-25c5230dcb84?w=600&q=80',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80',
        'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&q=80',
        'https://images.unsplash.com/photo-1594818379496-da1e345b0ded?w=600&q=80',
    ],
    'Designer Sarees': [
        'https://images.unsplash.com/photo-1596459258263-b56eb5a3e28e?w=600&q=80',
        'https://images.unsplash.com/photo-1620391561455-b1dcb2b15e1a?w=600&q=80',
        'https://images.unsplash.com/photo-1610189020987-25c5230dcb84?w=600&q=80',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80',
    ],
    'Anarkali Suits': [
        'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&q=80',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80',
        'https://images.unsplash.com/photo-1596459258263-b56eb5a3e28e?w=600&q=80',
        'https://images.unsplash.com/photo-1594818379496-da1e345b0ded?w=600&q=80',
    ],
    'Wedding Kurtis': [
        'https://images.unsplash.com/photo-1620391561455-b1dcb2b15e1a?w=600&q=80',
        'https://images.unsplash.com/photo-1610189020987-25c5230dcb84?w=600&q=80',
        'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&q=80',
        'https://images.unsplash.com/photo-1594818379496-da1e345b0ded?w=600&q=80',
    ],
    'Sharara Sets': [
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80',
        'https://images.unsplash.com/photo-1596459258263-b56eb5a3e28e?w=600&q=80',
        'https://images.unsplash.com/photo-1620391561455-b1dcb2b15e1a?w=600&q=80',
        'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&q=80',
    ],
    'Ethnic Gowns': [
        'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&q=80',
        'https://images.unsplash.com/photo-1610189020987-25c5230dcb84?w=600&q=80',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80',
        'https://images.unsplash.com/photo-1594818379496-da1e345b0ded?w=600&q=80',
    ],
    'Dupatta Collection': [
        'https://images.unsplash.com/photo-1596459258263-b56eb5a3e28e?w=600&q=80',
        'https://images.unsplash.com/photo-1620391561455-b1dcb2b15e1a?w=600&q=80',
        'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&q=80',
    ],
    # Men's categories
    'Sherwanis': [
        'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600&q=80',
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
    ],
    'Kurta Pajama Sets': [
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80',
        'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
    ],
    'Indo-Western Menswear': [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
        'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600&q=80',
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80',
    ],
    'Bridal Accessories': [
        'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80',
        'https://images.unsplash.com/photo-1515562141589-67f0d569b6e3?w=600&q=80',
        'https://images.unsplash.com/photo-1596459258263-b56eb5a3e28e?w=600&q=80',
    ],
}

DEFAULT_URLS = [
    'https://images.unsplash.com/photo-1610189020987-25c5230dcb84?w=600&q=80',
    'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&q=80',
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80',
]


def download_image(url, filepath, timeout=25):
    """Download ``url`` to ``filepath``. Returns True on success."""
    try:
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': (
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36'
                )
            },
        )
        with urllib.request.urlopen(req, timeout=timeout) as response:
            data = response.read()
        if len(data) < 5000:
            return False
        with open(filepath, 'wb') as fh:
            fh.write(data)
        return True
    except Exception as exc:
        print(f'      ⚠ download failed: {exc}')
        if Path(filepath).exists():
            try:
                Path(filepath).unlink()
            except OSError:
                pass
        return False


class Command(BaseCommand):
    help = 'Ensure every product has category-appropriate images.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--images-per-product', type=int, default=3,
            help='Number of images each product should have (default: 3).',
        )

    def handle(self, *args, **options):
        count = max(1, options['images_per_product'])
        products_dir = Path(settings.MEDIA_ROOT) / 'products'
        products_dir.mkdir(parents=True, exist_ok=True)
        categories_dir = Path(settings.MEDIA_ROOT) / 'categories'
        categories_dir.mkdir(parents=True, exist_ok=True)

        products = list(Product.objects.select_related('category').order_by('id'))
        self.stdout.write(f'\n📸 Ensuring {count} images for {len(products)} products...\n')

        for product in products:
            category = product.category.name if product.category else None
            urls = CATEGORY_IMAGES.get(category) or DEFAULT_URLS
            added = 0

            for index in range(count):
                filename = f'product_{product.id}_img{index + 1}.jpg'
                rel_path = f'products/{filename}'
                filepath = products_dir / filename

                # Reuse existing file when present
                have_file = filepath.exists() and filepath.stat().st_size > 5000
                if not have_file:
                    have_file = download_image(urls[index % len(urls)], str(filepath))
                if not have_file:
                    # Fallback to Picsum
                    seed = product.id * 10 + index
                    have_file = download_image(
                        f'https://picsum.photos/seed/{seed}/600/800', str(filepath)
                    )
                if not have_file:
                    self.stdout.write(f'   ✗ {rel_path} could not be fetched')
                    continue

                _, created = ProductImage.objects.get_or_create(
                    product=product,
                    image=rel_path,
                    defaults={'alt_text': f'{product.name} - Image {index + 1}'},
                )
                if created:
                    added += 1

            # Guarantee exactly one primary image per product
            images = list(ProductImage.objects.filter(product=product))
            if images and not any(img.is_primary for img in images):
                first = images[0]
                first.is_primary = True
                first.save(update_fields=['is_primary'])

            total = ProductImage.objects.filter(product=product).count()
            marker = '✅' if total >= count else '⚠️'
            self.stdout.write(
                f'   {marker} {product.name[:50]:<50} → {total} image(s)'
                + (f' (+{added} new)' if added else '')
            )

        # Also seed category images
        self.stdout.write('\n📂 Seeding category images...\n')
        for cat in Category.objects.all():
            urls = CATEGORY_IMAGES.get(cat.name)
            if not urls or cat.image:
                continue
            filename = f'cat_{cat.id}.jpg'
            filepath = categories_dir / filename
            if not filepath.exists() or filepath.stat().st_size < 5000:
                if not download_image(urls[0], str(filepath)):
                    continue
            cat.image = f'categories/{filename}'
            cat.save(update_fields=['image'])
            self.stdout.write(f'   ✅ {cat.name} → category image set')

        self.stdout.write('\n✅ Image seeding complete!\n')
