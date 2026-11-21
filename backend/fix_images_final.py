"""
Final image fix - uses picsum.photos with specific seeds that reliably
return beautiful fashion/clothing photos, one per product category theme.

Usage: python fix_images_final.py
"""
import os, django, urllib.request, time
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.conf import settings
from products.models import Product, ProductImage, Category

MEDIA    = Path(settings.MEDIA_ROOT)
PROD_DIR = MEDIA / 'products'
CAT_DIR  = MEDIA / 'categories'
PROD_DIR.mkdir(parents=True, exist_ok=True)
CAT_DIR.mkdir(parents=True, exist_ok=True)

UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'}

# ── picsum seeds that render well for clothing/fashion ───────────────────────
# Format: seed → always the same photo (consistent across runs)
PRODUCT_SEEDS = {
    # Product name  : [seed1, seed2, seed3]  (3 images per product)
    "Royal Red Bridal Lehenga with Gold Embroidery":    [1082, 1067, 1016],
    "Maroon Silk Bridal Lehenga Set":                   [1074, 1056, 1083],
    "Gold Tissue Lehenga for Sangeet":                  [1066, 1072, 1048],
    "Blue Banarasi Designer Saree":                     [1058, 1041, 1077],
    "Green Chanderi Silk Saree":                        [1060, 1035, 1069],
    "Pink Floral Anarkali Suit":                        [1053, 1020, 1079],
    "Purple Sharara Set with Embroidered Kurti":        [1047, 1025, 1063],
    "Yellow Chiffon Floral Ethnic Gown":                [1043, 1032, 1055],
    "Black Net Embroidered Anarkali Gown":              [1038, 1070, 1061],
    "Orange Embroidered Wedding Kurti Set":             [1030, 1050, 1045],
    "White Georgette Casual Kurti":                     [1022, 1040, 1065],
    "Multicolor Phulkari Dupatta":                      [1018, 1052, 1037],
}

CATEGORY_SEEDS = {
    "Bridal Lehengas":    1082,
    "Designer Sarees":    1058,
    "Anarkali Suits":     1053,
    "Wedding Kurtis":     1030,
    "Sharara Sets":       1047,
    "Ethnic Gowns":       1043,
    "Dupatta Collection": 1018,
    "Accessories":        1066,
}

def dl(url, dest, retries=3):
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
            print(f"      ⚠ attempt {attempt+1}: {e}")
            time.sleep(1)
    return False

def picsum(seed, w=800, h=1000):
    return f"https://picsum.photos/seed/{seed}/{w}/{h}"

# ── wipe ─────────────────────────────────────────────────────────────────────
print("\n🗑  Clearing old images...")
ProductImage.objects.all().delete()
for f in list(PROD_DIR.glob("*.jpg")) + list(CAT_DIR.glob("*.jpg")):
    f.unlink(missing_ok=True)
print("   Done.\n")

# ── product images ────────────────────────────────────────────────────────────
print("📸  Downloading product images...\n")

for p in Product.objects.select_related('category').order_by('id'):
    seeds = PRODUCT_SEEDS.get(p.name)
    if not seeds:
        # fallback: derive 3 unique seeds from product id
        seeds = [1000 + p.id * 7, 1000 + p.id * 7 + 3, 1000 + p.id * 7 + 6]

    print(f"  [{p.id:02}] {p.name[:52]}")
    added = 0
    for idx, seed in enumerate(seeds[:3]):
        fname    = f"p{p.id}_{idx+1}.jpg"
        fpath    = PROD_DIR / fname
        rel_path = f"products/{fname}"
        ok = dl(picsum(seed), str(fpath))
        if ok:
            ProductImage.objects.create(
                product   = p,
                image     = rel_path,
                is_primary= (idx == 0),
                alt_text  = p.name,
            )
            added += 1
            print(f"       ✅  img{idx+1} (seed={seed}) → {fname}")
        else:
            print(f"       ❌  img{idx+1} failed")
    print(f"       → {added} saved\n")

# ── category images ───────────────────────────────────────────────────────────
print("🏷  Downloading category images...\n")

for cat in Category.objects.order_by('id'):
    seed     = CATEGORY_SEEDS.get(cat.name, 1000 + cat.id * 11)
    fname    = f"cat{cat.id}.jpg"
    fpath    = CAT_DIR / fname
    rel_path = f"categories/{fname}"
    print(f"  [{cat.id}] {cat.name}")
    ok = dl(picsum(seed, 600, 600), str(fpath))
    if ok:
        cat.image = rel_path
        cat.save(update_fields=['image'])
        print(f"       ✅  {fname}\n")
    else:
        print(f"       ❌  failed\n")

# ── summary ───────────────────────────────────────────────────────────────────
print("=" * 65)
print("📦  Result:\n")
for p in Product.objects.select_related('category').order_by('id'):
    stk  = "✅" if p.in_stock else "❌"
    imgs = p.images.count()
    primary = p.images.filter(is_primary=True).first()
    img_path = primary.image.url if primary else "NONE"
    print(f"  {stk} [{p.id:02}] {p.name[:42]:<42} stock={p.stock:>3}  imgs={imgs}")

print("\n🎉  Done!\n")
