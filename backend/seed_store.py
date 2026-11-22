import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vegfruit_store.settings')
django.setup()

from django.contrib.auth import get_user_model
from products.models import Category, Product, ProductImage
from coupons.models import Coupon

print("🌱 Starting idempotent seed...")

# ── Superuser ──────────────────────────────────────────────────────────────
User = get_user_model()
if not User.objects.filter(email='admin@shaaz.com').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@shaaz.com',
        password='Admin@123'
    )
    print("✅ Superuser created")
else:
    print("ℹ️  Superuser already exists")

# ── Coupons ────────────────────────────────────────────────────────────────
coupons = [
    {'code': 'BRIDAL10',  'discount': 10,  'active': True},
    {'code': 'FLAT500',   'discount': 500, 'active': True},
    {'code': 'WEDDING20', 'discount': 20,  'active': True},
]
for c in coupons:
    obj, created = Coupon.objects.update_or_create(
        code=c['code'],
        defaults={'discount': c['discount'], 'active': c['active']}
    )
    if created:
        print(f"✅ Coupon created: {c['code']}")
    else:
        print(f"ℹ️  Coupon already exists: {c['code']}")

# ── Products (idempotent via update_or_create on slug) ──────────────────────
from django.core.management import call_command
import json

fixture_path = os.path.join(os.path.dirname(__file__), 'seed_data.json')
if os.path.exists(fixture_path):
    with open(fixture_path, 'r') as f:
        data = json.load(f)

    for entry in data:
        if entry['model'] == 'products.product':
            fields = entry['fields']
            slug = fields.get('slug')
            if slug:
                # Get category object
                cat_id = fields.get('category')
                try:
                    cat = Category.objects.get(pk=cat_id)
                except Category.DoesNotExist:
                    continue

                Product.objects.update_or_create(
                    slug=slug,
                    defaults={
                        'name': fields.get('name', ''),
                        'description': fields.get('description', ''),
                        'price': fields.get('price', 0),
                        'stock': fields.get('stock', 0),
                        'category': cat,
                        'image': fields.get('image', ''),
                        'is_available': fields.get('is_available', True),
                    }
                )
        elif entry['model'] == 'products.category':
            fields = entry['fields']
            Category.objects.update_or_create(
                pk=entry['pk'],
                defaults={
                    'name': fields.get('name', ''),
                    'slug': fields.get('slug', ''),
                }
            )

    print("✅ Products and categories seeded (idempotent)")
else:
    print("⚠️  seed_data.json not found, skipping product seed")

print("🎉 Seed complete!")
