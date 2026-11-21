import django, os
os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings'
django.setup()

from products.models import Product, ProductImage, Category

print("=== PRODUCTS + IMAGES + STOCK ===")
for p in Product.objects.select_related('category').order_by('id'):
    imgs = p.images.count()
    primary = p.images.filter(is_primary=True).first()
    img_path = primary.image.name if primary else "NONE"
    stock_ok = "IN STOCK" if p.in_stock else "OUT OF STOCK"
    print(f"  [{p.id:02}] {p.name[:42]:<42} | {stock_ok} ({p.stock}) | imgs={imgs} | {img_path}")

print()
print("=== CATEGORIES + IMAGES ===")
for c in Category.objects.all().order_by('id'):
    img = c.image.name if c.image else "NONE"
    print(f"  [{c.id}] {c.name:<25} | img={img}")
