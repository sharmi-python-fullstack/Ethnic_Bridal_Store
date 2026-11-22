"""
Seed superuser, categories, products, images, and coupons cleanly and idempotently.
Uses update_or_create so it NEVER fails on duplicate slugs or existing records.
"""
import os
import sys
import json
import django

# Ensure current directory is on path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from products.models import Category, Product, ProductImage
from coupons.models import Coupon
from django.utils import timezone

User = get_user_model()

def run():
    # 1. Superuser
    if not User.objects.filter(email='admin@shaaz.com').exists():
        User.objects.create_superuser('admin@shaaz.com', 'Admin@123', first_name='Shaaz', last_name='Admin')
        print("[seed_store] Superuser created: admin@shaaz.com / Admin@123")
    else:
        print("[seed_store] Superuser admin@shaaz.com already exists.")

    # 2. Read seed_data.json
    seed_file = os.path.join(BASE_DIR, 'seed_data.json')
    if not os.path.exists(seed_file):
        print("[seed_store] seed_data.json not found, skipping.")
        return

    with open(seed_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    categories = [d for d in data if d['model'] == 'products.category']
    products = [d for d in data if d['model'] == 'products.product']
    images = [d for d in data if d['model'] == 'products.productimage']
    coupons = [d for d in data if d['model'] == 'coupons.coupon']

    # 3. Categories
    cat_map = {}
    for item in categories:
        fields = item['fields']
        cat, _ = Category.objects.update_or_create(
            slug=fields['slug'],
            defaults={
                'name': fields['name'],
                'description': fields.get('description', ''),
                'image': fields.get('image', ''),
                'is_active': fields.get('is_active', True),
            }
        )
        cat_map[item['pk']] = cat

    # 4. Products
    prod_pk_to_obj = {}
    for item in products:
        fields = item['fields']
        cat = cat_map.get(fields.get('category'))
        prod, _ = Product.objects.update_or_create(
            slug=fields['slug'],
            defaults={
                'name': fields['name'],
                'description': fields.get('description', ''),
                'price': fields['price'],
                'discount_price': fields.get('discount_price'),
                'stock': fields.get('stock', 20),
                'fabric': fields.get('fabric', ''),
                'occasion': fields.get('occasion', 'bridal'),
                'color': fields.get('color', 'red'),
                'care_instructions': fields.get('care_instructions', ''),
                'is_featured': fields.get('is_featured', False),
                'is_active': fields.get('is_active', True),
                'category': cat,
            }
        )
        prod_pk_to_obj[item['pk']] = prod

    # 5. Product Images
    img_count = 0
    for item in images:
        fields = item['fields']
        prod = prod_pk_to_obj.get(fields.get('product'))
        if not prod:
            prod = Product.objects.filter(id=fields.get('product')).first()
        if prod:
            img_path = fields['image']
            ProductImage.objects.update_or_create(
                product=prod,
                image=img_path,
                defaults={
                    'is_primary': fields.get('is_primary', False),
                    'alt_text': fields.get('alt_text', prod.name),
                }
            )
            img_count += 1

    # 6. Coupons
    for item in coupons:
        fields = item['fields']
        Coupon.objects.update_or_create(
            code=fields['code'],
            defaults={
                'description': fields.get('description', ''),
                'discount_type': fields['discount_type'],
                'discount_value': fields['discount_value'],
                'min_order_amount': fields.get('min_order_amount', 0),
                'max_discount_amount': fields.get('max_discount_amount'),
                'max_uses': fields.get('max_uses', 100),
                'is_active': fields.get('is_active', True),
                'valid_from': timezone.now(),
            }
        )

    print(f"🎉 Store seeded: {len(products)} products, {img_count} images, and {len(coupons)} coupons active!")

if __name__ == '__main__':
    run()
