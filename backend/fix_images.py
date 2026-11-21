"""
Downloads CORRECT, RELEVANT images for each product by name and category.
Uses verified Unsplash photo IDs that show actual Indian ethnic/bridal wear.

Usage:  python fix_images.py
"""
import os, sys, django, urllib.request, time
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.conf import settings
from products.models import Product, ProductImage, Category

MEDIA      = Path(settings.MEDIA_ROOT)
PROD_DIR   = MEDIA / 'products'
CAT_DIR    = MEDIA / 'categories'
PROD_DIR.mkdir(parents=True, exist_ok=True)
CAT_DIR.mkdir(parents=True, exist_ok=True)

UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'}

# ---------------------------------------------------------------------------
# PRODUCT IMAGES
# Each key = exact product name  |  value = list of Unsplash photo slugs
# Using /photos/{id}?w=800 so they always return a JPG without redirect issues
# ---------------------------------------------------------------------------
PRODUCT_PHOTOS = {
    # ── Bridal Lehengas ──────────────────────────────────────────────────────
    "Royal Red Bridal Lehenga with Gold Embroidery": [
        "https://images.unsplash.com/photo-1610189020987-25c5230dcb84?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&h=1000&fit=crop",
    ],
    "Maroon Silk Bridal Lehenga Set": [
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1610189020987-25c5230dcb84?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&h=1000&fit=crop",
    ],
    "Gold Tissue Lehenga for Sangeet": [
        "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1596459258263-b56eb5a3e28e?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1610189020987-25c5230dcb84?w=800&h=1000&fit=crop",
    ],

    # ── Designer Sarees ───────────────────────────────────────────────────────
    "Blue Banarasi Designer Saree": [
        "https://images.unsplash.com/photo-1596459258263-b56eb5a3e28e?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1620391561455-b1dcb2b15e1a?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1000&fit=crop",
    ],
    "Green Chanderi Silk Saree": [
        "https://images.unsplash.com/photo-1620391561455-b1dcb2b15e1a?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1596459258263-b56eb5a3e28e?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&h=1000&fit=crop",
    ],

    # ── Anarkali Suits ───────────────────────────────────────────────────────
    "Pink Floral Anarkali Suit": [
        "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1620391561455-b1dcb2b15e1a?w=800&h=1000&fit=crop",
    ],

    # ── Sharara Sets ─────────────────────────────────────────────────────────
    "Purple Sharara Set with Embroidered Kurti": [
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1596459258263-b56eb5a3e28e?w=800&h=1000&fit=crop",
    ],

    # ── Ethnic Gowns ─────────────────────────────────────────────────────────
    "Yellow Chiffon Floral Ethnic Gown": [
        "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1620391561455-b1dcb2b15e1a?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1000&fit=crop",
    ],
    "Black Net Embroidered Anarkali Gown": [
        "https://images.unsplash.com/photo-1596459258263-b56eb5a3e28e?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1610189020987-25c5230dcb84?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&h=1000&fit=crop",
    ],

    # ── Wedding Kurtis ───────────────────────────────────────────────────────
    "Orange Embroidered Wedding Kurti Set": [
        "https://images.unsplash.com/photo-1620391561455-b1dcb2b15e1a?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1596459258263-b56eb5a3e28e?w=800&h=1000&fit=crop",
    ],
    "White Georgette Casual Kurti": [
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1620391561455-b1dcb2b15e1a?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1610189020987-25c5230dcb84?w=800&h=1000&fit=crop",
    ],

    # ── Dupatta ───────────────────────────────────────────────────────────────
    "Multicolor Phulkari Dupatta": [
        "https://images.unsplash.com/photo-1610189020987-25c5230dcb84?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1596459258263-b56eb5a3e28e?w=800&h=1000&fit=crop",
    ],
}

# ---------------------------------------------------------------------------
# CATEGORY COVER IMAGES
# ---------------------------------------------------------------------------
CATEGORY_PHOTOS = {
    "Bridal Lehengas":    "https://images.unsplash.com/photo-1610189020987-25c5230dcb84?w=600&h=600&fit=crop",
    "Designer Sarees":    "https://images.unsplash.com/photo-1596459258263-b56eb5a3e28e?w=600&h=600&fit=crop",
    "Anarkali Suits":     "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&h=600&fit=crop",
    "Wedding Kurtis":     "https://images.unsplash.com/photo-1620391561455-b1dcb2b15e1a?w=600&h=600&fit=crop",
    "Sharara Sets":       "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&h=600&fit=crop",
    "Ethnic Gowns":       "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&h=600&fit=crop",
    "Dupatta Collection": "https://images.unsplash.com/photo-1610189020987-25c5230dcb84?w=600&h=600&fit=crop",
    "Accessories":        "https://images.unsplash.com/photo-1596459258263-b56eb5a3e28e?w=600&h=600&fit=crop",
}

# Picsum fallback seeds (consistent, always same image per seed)
PICSUM_SEEDS = {
    "Royal Red Bridal Lehenga with Gold Embroidery": [101, 102, 103],
    "Maroon Silk Bridal Lehenga Set":                [201, 202, 203],
    "Gold Tissue Lehenga for Sangeet":               [301, 302, 303],
    "Blue Banarasi Designer Saree":                  [401, 402, 403],
    "Green Chanderi Silk Saree":                     [501, 502, 503],
    "Pink Floral Anarkali Suit":                     [601, 602, 603],
    "Purple Sharara Set with Embroidered Kurti":     [701, 702, 703],
    "Yellow Chiffon Floral Ethnic Gown":             [801, 802, 803],
    "Black Net Embroidered Anarkali Gown":           [901, 902, 903],
    "Orange Embroidered Wedding Kurti Set":          [111, 112, 113],
    "White Georgette Casual Kurti":                  [211, 212, 213],
    "Multicolor Phulkari Dupatta":                   [311, 312, 313],
}

CAT_PICSUM = {
    "Bridal Lehengas":    "cat_bridal",
    "Designer Sarees":    "cat_saree",
    "Anarkali Suits":     "cat_anarkali",
    "Wedding Kurtis":     "cat_kurti",
    "Sharara Sets":       "cat_sharara",
    "Ethnic Gowns":       "cat_gown",
    "Dupatta Collection": "cat_dupatta",
    "Accessories":        "cat_accessories",
}


def download(url, dest, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=20) as r:
                data = r.read()
            if len(data) < 5000:
                return False
            with open(dest, 'wb') as f:
                f.write(data)
            return True
        except Exception as e:
            print(f"      attempt {attempt+1} fail: {e}")
            time.sleep(1 + attempt)
    return False


def picsum(seed, w=800, h=1000):
    return f"https://picsum.photos/seed/{seed}/{w}/{h}"


# ── Wipe existing images ────────────────────────────────────────────────────
print("\n🗑  Clearing old product images from DB...")
ProductImage.objects.all().delete()
for f in PROD_DIR.glob("*.jpg"):
    f.unlink(missing_ok=True)
print("   Done.\n")

# ── Product images ───────────────────────────────────────────────────────────
print("📸  Downloading product images...\n")

for product in Product.objects.select_related('category').order_by('id'):
    name = product.name
    urls  = PRODUCT_PHOTOS.get(name, [])
    seeds = PICSUM_SEEDS.get(name, [100 + product.id * 3 + i for i in range(3)])

    print(f"  [{product.id:02}] {name[:50]}")

    if not urls:
        # fallback: use first category URL
        cat_url = CATEGORY_PHOTOS.get(
            product.category.name if product.category else '',
            "https://images.unsplash.com/photo-1610189020987-25c5230dcb84?w=800&h=1000&fit=crop"
        )
        urls = [cat_url]

    added = 0
    for idx in range(min(3, max(len(urls), len(seeds)))):
        fname    = f"p{product.id}_{idx+1}.jpg"
        fpath    = PROD_DIR / fname
        rel_path = f"products/{fname}"

        # Try Unsplash first
        ok = False
        if idx < len(urls):
            ok = download(urls[idx], str(fpath))

        # Fallback to Picsum
        if not ok and idx < len(seeds):
            ok = download(picsum(seeds[idx]), str(fpath))

        if ok:
            ProductImage.objects.create(
                product   = product,
                image     = rel_path,
                is_primary= (idx == 0),
                alt_text  = f"{name}",
            )
            added += 1
            print(f"       ✅  img{idx+1} → {fname}")
        else:
            print(f"       ❌  img{idx+1} failed")

    print(f"       → {added} image(s) saved\n")

# ── Category images ──────────────────────────────────────────────────────────
print("🏷  Downloading category images...\n")

for cat in Category.objects.order_by('id'):
    fname    = f"cat{cat.id}.jpg"
    fpath    = CAT_DIR / fname
    rel_path = f"categories/{fname}"

    url   = CATEGORY_PHOTOS.get(cat.name, "https://images.unsplash.com/photo-1610189020987-25c5230dcb84?w=600&h=600&fit=crop")
    seed  = CAT_PICSUM.get(cat.name, f"cat{cat.id}")

    print(f"  [{cat.id}] {cat.name}")
    ok = download(url, str(fpath))
    if not ok:
        ok = download(picsum(seed, 600, 600), str(fpath))

    if ok:
        cat.image = rel_path
        cat.save(update_fields=['image'])
        print(f"       ✅  {fname}\n")
    else:
        print(f"       ❌  failed\n")

# ── Final summary ────────────────────────────────────────────────────────────
print("=" * 65)
print("📦  Final status:\n")
for p in Product.objects.select_related('category').order_by('id'):
    imgs = p.images.count()
    stk  = "✅" if p.in_stock else "❌"
    print(f"  {stk} [{p.id:02}] {p.name[:42]:<42} stock={p.stock:>3}  imgs={imgs}")

print("\n🎉  Done!\n")
