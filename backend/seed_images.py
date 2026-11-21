"""
Convenience wrapper so the app can be seeded with a single command:

    python seed_images.py

It ensures every product has category-appropriate images and then prints a
stock-availability summary. The real logic lives in the reusable management
command ``products/management/commands/seed_images.py``.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.core.management import call_command  # noqa: E402
from products.models import Product  # noqa: E402


def main():
    call_command('seed_images')

    print('📦 Stock Availability Check:')
    print('-' * 60)
    for product in Product.objects.select_related('category').order_by('category__name', 'name'):
        status = '✅ In Stock' if product.in_stock else '❌ Out of Stock'
        print(f'  {status} | {product.name[:40]:<40} | Stock: {product.stock}')
    print('\n🎉 Images and stock status verified.')


if __name__ == '__main__':
    main()
