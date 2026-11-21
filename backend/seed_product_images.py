"""
Downloads and assigns proper ethnic/bridal wear images to each product.
Uses Unsplash Source API (free, no key) with specific photo IDs
that show actual bridal/ethnic wear clothing.

Usage: python seed_product_images.py
"""
import os, sys, django, urllib.request, shutil, time
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.conf import settings
from products.models import Product, ProductImage, Category

MEDIA = Path(settings.MEDIA_ROOT)
PROD_DIR  = MEDIA / 'products'
CAT_DIR   = MEDIA / 'categories'
PROD_DIR.mkdir(parents=True, exist_ok=True)
CAT_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/120.0.0.0 Safari/537.36'
    )
}

# ── Carefully chosen Unsplash photo IDs for Indian ethnic / bridal wear ──────
# Each entry:  photo_id used in https://images.unsplash.com/photo-{id}?w=800&q=85
PRODUCT_IMAGES = {
    # Bridal Lehengas
    'Royal Red Bridal Lehenga with Gold Embroidery': [
        'photo-1610189020987-25c5230dcb84',   # red bridal lehenga
        'photo-1583391733956-3750e0ff4e8b',   # bridal jewellery/lehenga
    ],
    'Maroon Silk Bridal Lehenga Set': [
        'photo-1583391733956-3750e0ff4e8b',
        'photo-1610189020987-25c5230dcb84',
    ],
    'Gold Tissue Lehenga for Sangeet': [
        'photo-1617627143750-d86bc21e42bb',   # golden ethnic outfit
        'photo-1596459258263-b56eb5a3e28e',
    ],
    # Designer Sarees
    'Blue Banarasi Designer Saree': [
        'photo-1596459258263-b56eb5a3e28e',   # saree model
        'photo-1620391561455-b1dcb2b15e1a',
    ],
    'Green Chanderi Silk Saree': [
        'photo-1620391561455-b1dcb2b15e1a',
        'photo-1596459258263-b56eb5a3e28e',
    ],
    # Anarkali Suits
    'Pink Floral Anarkali Suit': [
        'photo-1617627143750-d86bc21e42bb',
        'photo-1583391733956-3750e0ff4e8b',
    ],
    # Sharara
    'Purple Sharara Set with Embroidered Kurti': [
        'photo-1583391733956-3750e0ff4e8b',
        'photo-1617627143750-d86bc21e42bb',
    ],
    # Ethnic Gowns
    'Yellow Chiffon Floral Ethnic Gown': [
        'photo-1617627143750-d86bc21e42bb',
        'photo-1620391561455-b1dcb2b15e1a',
    ],
    'Black Net Embroidered Anarkali Gown': [
        'photo-1596459258263-b56eb5a3e28e',
        'photo-1583391733956-3750e0ff4e8b',
    ],
    # Kurtis
    'Orange Embroidered Wedding Kurti Set': [
        'photo-1620391561455-b1dcb2b15e1a',
        'photo-1610189020987-25c5230dcb84',
    ],
    'White Georgette Casual Kurti': [
        'photo-1617627143750-d86bc21e42bb',
        'photo-1596459258263-b56eb5a3e28e',
    ],
    # Dupatta
    'Multicolor Phulkari Dupatta': [
        'photo-1583391733956-3750e0ff4e8b',
        'photo-1610189020987-25c5230dcb84',
    ],
}

# Category cover images (uses Unsplash photo IDs)
CATEGORY_IMAGES = {
    'Bridal Lehengas':    'photo-1610189020987-25c5230dcb84',
    'Designer Sarees':    'photo-1596459258263-b56eb5a3e28e',
    'Anarkali Suits':     'photo-1617627143750-d86bc21e42bb',
    'Wedding Kurtis':     'photo-1620391561455-b1dcb2b15e1a',
    'Sharara Sets':       'photo-1583391733956-3750e0ff4e8b',
    'Ethnic Gowns':       'photo-1617627143750-d86bc21e42bb',
    'Dupatta Collection': 'photo-1596459258263-b56eb5a3e28e',
    'Accessories':        'photo-1610189020987-25c5230dcb84',
}

def dl(url, path, retries=3):
    """Download URL → path. Returns True on success."""
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=20) as r:
                data = r.read()
            if len(data) < 5000:
                return False
            with open(path, 'wb') as f:
                f.write(data)
            return True
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1)
    return False

def unsplash_url(photo_id, w=800, h=1000):
    return f"https://images.unsplash.com/{photo_id}?w={w}&h={h}&fit=crop&q=85"

def picsum_url(seed, w=800, h=1000):
    """Fallback: Picsum with a fixed seed (always same image)."""
    return f"https://picsum.photos/seed/{seed}/{w}/{h}"

# ── Seed product images ───────────────────────────────────────────────────────
print("\n📸  Seeding PRODUCT images...\n")

# Wipe existing product images to start fresh
ProductImage.objects.all().delete()
# Remove old files
for f in PROD_DIR.glob("product_*.jpg"):
    f.unlink(missing_ok=True)

for product in Product.objects.select_related('category').order_by('id'):
    name = product.name
    ids  = PRODUCT_IMAGES.get(name, [])

    # Fallback: use first entry for the category
    if not ids:
        cat = product.category.name if product.category else ''
        cid = CATEGORY_IMAGES.get(cat, 'photo-1610189020987-25c5230dcb84')
        ids = [cid]

    print(f"  [{product.id}] {name[:48]}")
    added = 0
    for idx, photo_id in enumerate(ids[:3]):
        fname    = f"product_{product.id}_{idx+1}.jpg"
        fpath    = PROD_DIR / fname
        rel_path = f"products/{fname}"

        ok = dl(unsplash_url(photo_id), str(fpath))
        if not ok:
            # fallback picsum
            ok = dl(picsum_url(f"{product.id * 7 + idx}", 800, 1000), str(fpath))

        if ok:
            ProductImage.objects.create(
                product=product,
                image=rel_path,
                is_primary=(idx == 0),
                alt_text=f"{name} – image {idx+1}",
            )
            added += 1
            print(f"      ✅ img{idx+1} saved → {fname}")
        else:
            print(f"      ❌ img{idx+1} failed")

    if added == 0:
        print(f"      ⚠  No images saved for this product")

# ── Seed CATEGORY images ──────────────────────────────────────────────────────
print("\n🏷   Seeding CATEGORY images...\n")

for cat in Category.objects.all():
    photo_id = CATEGORY_IMAGES.get(cat.name, 'photo-1610189020987-25c5230dcb84')
    fname    = f"cat_{cat.id}.jpg"
    fpath    = CAT_DIR / fname
    rel_path = f"categories/{fname}"

    print(f"  [{cat.id}] {cat.name}")
    ok = dl(unsplash_url(photo_id, 600, 600), str(fpath))
    if not ok:
        ok = dl(picsum_url(f"cat{cat.id}", 600, 600), str(fpath))

    if ok:
        cat.image = rel_path
        cat.save(update_fields=['image'])
        print(f"      ✅ saved → {fname}")
    else:
        print(f"      ❌ failed")

# ── Stock summary ─────────────────────────────────────────────────────────────
print("\n📦  Stock Availability:\n")
for p in Product.objects.select_related('category').order_by('category__name', 'name'):
    icon = "✅" if p.in_stock else "❌"
    imgs = p.images.count()
    print(f"  {icon} {p.name[:42]:<42} stock={p.stock:>3}  images={imgs}")

print("\n🎉  Done!\n")
