import os
import sys
import json
import django

# Add backend directory to Python path so Django can find settings
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vegfruit_store.settings')
django.setup()

from django.contrib.auth import get_user_model
from products.models import Category, Product
from coupons.models import Coupon

print("🌱 Starting idempotent seed...")

# ── Superuser ────────────────────────────────────────────────────────────────
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

# ── Coupons ──────────────────────────────────────────────────────────────────
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
    print(f"{'✅ Created' if created else 'ℹ️  Exists'}: Coupon {c['code']}")

# ── Products & Categories (from seed_data.json via update_or_create) ─────────
fixture_path = os.path.join(BASE_DIR, 'seed_data.json')
if os.path.exists(fixture_path):
    with open(fixture_path, 'r') as f:
        data = json.load(f)

    # First pass: categories
    for entry in data:
        if entry['model'] == 'products.category':
            fields = entry['fields']
            Category.objects.update_or_create(
                pk=entry['pk'],
                defaults={
                    'name': fields.get('name', ''),
                    'slug': fields.get('slug', ''),
                }
            )

    # Second pass: products
    for entry in data:
        if entry['model'] == 'products.product':
            fields = entry['fields']
            slug = fields.get('slug')
            if not slug:
                continue
            try:
                cat = Category.objects.get(pk=fields.get('category'))
            except Category.DoesNotExist:
                continue
            Product.objects.update_or_create(
                slug=slug,
                defaults={
                    'name':         fields.get('name', ''),
                    'description':  fields.get('description', ''),
                    'price':        fields.get('price', 0),
                    'stock':        fields.get('stock', 0),
                    'category':     cat,
                    'image':        fields.get('image', ''),
                    'is_available': fields.get('is_available', True),
                }
            )

    print("✅ Products and categories seeded (idempotent)")
else:
    print("⚠️  seed_data.json not found, skipping products")

print("🎉 Seed complete!")
