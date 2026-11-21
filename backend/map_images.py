"""
Image Mapping Script for Shaaz Ethnicwear
Maps user-uploaded images to their correct products by visual content.
"""
import os
import sys
import shutil
import django

os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from products.models import Product, ProductImage, Category
from django.core.files import File

# Source directory with uploaded images
UPLOAD_DIR = r"C:\Users\hr111\.gemini\antigravity\brain\9f01a648-36ef-470e-b0d2-9db73aeddfe8\.user_uploaded"
MEDIA_PRODUCTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'media', 'products')
MEDIA_CATEGORIES = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'media', 'categories')

os.makedirs(MEDIA_PRODUCTS, exist_ok=True)
os.makedirs(MEDIA_CATEGORIES, exist_ok=True)

# ═══════════════════════════════════════════════════════════════════════════════
# MASTER IMAGE → PRODUCT MAPPING
# Based on visual inspection of each uploaded image
# ═══════════════════════════════════════════════════════════════════════════════

IMAGE_MAP = {
    # ─── BATCH 1: Women's Collection (15 images) ─────────────────────────────
    # Bridal Lehengas
    "media_1795283373056_182723c2.webp": {
        "product_id": 23,  # Royal Red Bridal Lehenga with Gold Zari Embroidery
        "rename": "royal-red-bridal-lehenga-gold-zari.webp",
        "cat_img": "bridal-lehengas.webp",  # Use as category image too
    },
    "media_1795283363856_d51bb10a.jpg": {
        "product_id": 24,  # Maroon Velvet Bridal Lehenga with Zardosi Work
        "rename": "maroon-velvet-bridal-lehenga-zardosi.jpg",
    },
    "media_1795283334435_7cf498f8.jpg": {
        "product_id": 25,  # Pink Silk Lehenga for Sangeet Ceremony
        "rename": "pink-silk-sangeet-lehenga.jpg",
    },
    "media_1795283322257_acf01920.jpg": {
        "product_id": 26,  # Gold Tissue Bridal Lehenga Set
        "rename": "gold-tissue-bridal-lehenga-set.jpg",
    },
    # Also assign some to original products 1,2,13,14 that need real images
    # Product 1 = Royal Red Bridal Lehenga with Gold Embroidery (similar to 23)
    # Product 2 = Maroon Silk Bridal Lehenga Set (similar to 24)
    # Product 7 = Gold Tissue Lehenga for Sangeet
    # Product 13 = Crimson Velvet Bridal Lehenga
    # Product 14 = Rose Pink Bridal Lehenga with Mirror Work

    # Designer Sarees
    "media_1795283393812_d9776685.png": {
        "product_id": 27,  # Royal Blue Banarasi Silk Saree with Gold Border
        "rename": "royal-blue-banarasi-silk-saree.png",
        "cat_img": "designer-sarees.png",
    },
    "media_1795283418620_cd2df060.png": {
        "product_id": 28,  # Green Kanjivaram Silk Saree
        "rename": "green-kanjivaram-silk-saree.png",
    },
    "media_1795283447901_09d6cbdc.png": {
        "product_id": 29,  # Red Paithani Bridal Saree
        "rename": "red-paithani-bridal-saree.png",
    },
    "media_1795283488691_de9c31de.png": {
        "product_id": 12,  # White Georgette Casual Kurti (white/cream georgette)
        "rename": "white-georgette-casual-kurti.png",
    },

    # Anarkali Suits
    "media_1795283536503_c79f5374.png": {
        "product_id": 31,  # Wine Velvet Anarkali Suit with Dupatta
        "rename": "wine-velvet-anarkali-suit.png",
        "cat_img": "anarkali-suits.png",
    },
    "media_1795283569678_b9233237.png": {
        "product_id": 3,   # Pink Floral Anarkali Suit
        "rename": "pink-floral-anarkali-suit.png",
    },
    "media_1795283620936_61c50f39.png": {
        "product_id": 32,  # Teal Blue Embroidered Anarkali Gown
        "rename": "teal-blue-embroidered-anarkali.png",
    },

    # Wedding Kurtis
    "media_1795283658890_26079a05.png": {
        "product_id": 33,  # Orange Embroidered Kurti with Palazzo Set
        "rename": "orange-embroidered-kurti-palazzo.png",
        "cat_img": "wedding-kurtis.png",
    },
    "media_1795283354360_3ae18037.jpg": {
        "product_id": 34,  # Yellow Lucknowi Chikan Kurti Set (gold/beige anarkali)
        "rename": "yellow-lucknowi-chikan-kurti.jpg",
    },

    # Sharara Sets
    "media_1795283684905_98439916.png": {
        "product_id": 36,  # Peach Gharara Set for Nikah (orange/rust sharara)
        "rename": "peach-gharara-set-nikah.png",
        "cat_img": "sharara-sets.png",
    },
    "media_1795283710176_7bbdf2d1.png": {
        "product_id": 6,   # Purple Sharara Set with Embroidered Kurti
        "rename": "purple-sharara-set-embroidered.png",
    },

    # ─── BATCH 2: Women's Gowns + Men's Collection (15 images) ───────────────
    # Sharara Sets (continued)
    "media_1795283824923_2cc911d3.jpg": {
        "product_id": 19,  # Gold Embroidered Sharara Set (pink+purple sharara)
        "rename": "gold-embroidered-sharara-set.jpg",
    },
    # Sharara / Green Floral
    "media_1795283899504_00de8a6a.png": {
        "product_id": 37,  # Green Floral Sharara Set
        "rename": "green-floral-sharara-set.png",
    },

    # Ethnic Gowns
    "media_1795283979579_f911ee5c.png": {
        "product_id": 11,  # Black Net Embroidered Anarkali Gown (black floral gown)
        "rename": "black-net-embroidered-gown.png",
        "cat_img": "ethnic-gowns.png",
    },
    "media_1795284002808_6b3b27ef.jpg": {
        "product_id": 38,  # Wine Indo-Western Trail Gown (deep purple draped gown)
        "rename": "wine-indo-western-trail-gown.jpg",
    },
    "media_1795284033941_88c6c3e9.png": {
        "product_id": 39,  # Rose Gold Shimmer Reception Gown (peach/rose gold gown)
        "rename": "rose-gold-shimmer-reception-gown.png",
    },

    # Menswear - Sherwanis
    "media_1795284070210_7a68b6de.png": {
        "product_id": 45,  # White Cotton Lucknowi Chikan Kurta (white kurta + printed jacket)
        "rename": "white-lucknowi-chikan-kurta-nehru-jacket.png",
    },
    "media_1795284084532_f50f8848.png": {
        "product_id": 42,  # Maroon Velvet Groom Sherwani
        "rename": "maroon-velvet-groom-sherwani.png",
        "cat_img": "sherwanis.png",
    },
    "media_1795284112874_782b7b8f.png": {
        "product_id": 46,  # Royal Blue Silk Kurta Set for Wedding (navy blue kurta + red stole)
        "rename": "royal-blue-silk-kurta-set.png",
    },
    "media_1795284158601_95ef5c23.png": {
        "product_id": 44,  # Black Embroidered Sherwani Set (black bandhgala)
        "rename": "black-embroidered-sherwani-set.png",
    },
    "media_1795284197558_6fd976fc.png": {
        "product_id": 48,  # Peach Silk Kurta with Embroidered Jacket (white kurta + light printed jacket)
        "rename": "peach-silk-kurta-embroidered-jacket.png",
        "cat_img": "kurta-pajama-sets.png",
    },

    # Menswear - Kurta Pajama / Indo-Western
    "media_1795284244970_f5eff2e1.jpg": {
        "product_id": 50,  # Wine Nehru Jacket with Printed Kurta (teal+navy nehru jackets)
        "rename": "wine-nehru-jacket-printed-kurta.jpg",
        "cat_img": "indo-western-menswear.jpg",
    },
    "media_1795284285039_d13d9dad.png": {
        "product_id": 47,  # Olive Green Pathani Kurta Set
        "rename": "olive-green-pathani-kurta-set.png",
    },
    "media_1795284308006_e1673e17.png": {
        "product_id": 51,  # Ivory Indo-Western Sherwani Jacket (peach kurta + printed jacket)
        "rename": "ivory-indo-western-sherwani-jacket.png",
    },
    "media_1795284338502_73c441ef.png": {
        "product_id": 49,  # Black Bandhgala Jodhpuri Suit (black embroidered jodhpuri)
        "rename": "black-bandhgala-jodhpuri-suit.png",
    },
    "media_1795284363690_bb02347d.png": {
        "product_id": 43,  # Navy Blue Sherwani with Gold Buttons (maroon kurta + jacket)
        "rename": "navy-blue-sherwani-gold-buttons.png",
    },

    # ─── BATCH 3: Sherwanis + Accessories (14 images) ─────────────────────────
    # Ivory Gold Sherwani
    "media_1795284412539_ba057189.png": {
        "product_id": 41,  # Ivory Gold Embroidered Groom Sherwani
        "rename": "ivory-gold-embroidered-groom-sherwani.png",
    },
    # Phulkari Dupatta / Women with colorful dupatta
    "media_1795284446385_f330f785.png": {
        "product_id": 10,  # Multicolor Phulkari Dupatta (maroon suit + phulkari dupatta)
        "rename": "multicolor-phulkari-dupatta.png",
        "cat_img": "dupatta-collection.png",
    },
    # Red Banarasi Dupatta
    "media_1795284587270_b18b326c.png": {
        "product_id": 40,  # Red Banarasi Dupatta with Gold Zari
        "rename": "red-banarasi-dupatta-gold-zari.png",
    },

    # Bridal Accessories - Jewellery
    "media_1795284608011_5eaa9780.png": {
        "product_id": 52,  # Gold Plated Bridal Jewellery Set (7 Pieces) - black/gold kundan set
        "rename": "gold-plated-bridal-jewellery-set-7pc.png",
        "cat_img": "bridal-accessories.png",
    },
    "media_1795284616060_81c65779.png": {
        "product_id": 55,  # Red Bridal Kalire Set - red/green kundan necklace set
        "rename": "red-bridal-kalire-set.png",
    },
    "media_1795284627883_3cfa4630.png": {
        "product_id": 22,  # Bridal Chooda Set – 21 Bangles (purple/gold kundan necklace set)
        "rename": "bridal-chooda-set-bangles.png",
        "also_product": 8,  # Also use for Accessories category product
        "cat_img": "accessories.png",
    },
    # Bangles
    "media_1795284640149_ff917808.png": {
        "product_id": 22,  # Bridal Chooda Set – 21 Bangles (pink+purple bangles)
        "rename": "bridal-bangles-pink-purple.png",
        "is_secondary": True,  # Additional image for same product
    },
    # Kundan Jewellery set (purple/gold elaborate)
    "media_1795284647838_f3d179fa.png": {
        "product_id": 52,  # Gold Plated Bridal Jewellery Set - additional angle
        "rename": "gold-plated-bridal-jewellery-set-alt.png",
        "is_secondary": True,
    },
    # Kundan jhumka earrings
    "media_1795284659058_9729371a.png": {
        "product_id": 52,  # Gold Plated Bridal Jewellery Set - earrings detail
        "rename": "gold-plated-bridal-jewellery-earrings.png",
        "is_secondary": True,
    },
    # Bride wearing full jewellery set
    "media_1795284865919_235d7e55.png": {
        "product_id": 52,  # Gold Plated Bridal Jewellery Set - on model
        "rename": "gold-plated-bridal-jewellery-on-model.png",
        "is_secondary": True,
    },

    # Mojari/Jutti (Women's)
    "media_1795284901013_705cd53c.png": {
        "product_id": 53,  # Embroidered Bridal Mojari (Jutti) - red with gold embroidery
        "rename": "embroidered-bridal-mojari-red.png",
    },
    # Mojari/Jutti (Men's / colorful)
    "media_1795284912693_c99cb515.png": {
        "product_id": 53,  # Embroidered Bridal Mojari (Jutti) - colorful
        "rename": "embroidered-bridal-mojari-colorful.png",
        "is_secondary": True,
    },

    # Groom Pagdi/Safa (white)
    "media_1795284940284_ba25c19e.png": {
        "product_id": 54,  # Groom's Pagdi/Safa (Wedding Turban) - white with emerald
        "rename": "groom-pagdi-safa-white-emerald.png",
    },
    # Groom Pagdi/Safa (red velvet)
    "media_1795284953099_dfc971cc.png": {
        "product_id": 54,  # Groom's Pagdi/Safa (Wedding Turban) - red velvet
        "rename": "groom-pagdi-safa-red-velvet.png",
        "is_secondary": True,
    },
}

# ─── SECONDARY MAPPINGS ──────────────────────────────────────────────────────
# Map same batch-1 images as secondary/reused images for similar original products
REUSE_MAP = {
    # Original product 1 reuses same red lehenga as product 23
    1: "media_1795283373056_182723c2.webp",
    # Original product 2 reuses same maroon lehenga as product 24
    2: "media_1795283363856_d51bb10a.jpg",
    # Product 7 (Gold Tissue Lehenga for Sangeet) reuses product 26 image
    7: "media_1795283322257_acf01920.jpg",
    # Product 13 (Crimson Velvet Bridal Lehenga) reuses maroon velvet
    13: "media_1795283363856_d51bb10a.jpg",
    # Product 14 (Rose Pink Bridal Lehenga) reuses pink silk
    14: "media_1795283334435_7cf498f8.jpg",
    # Product 4 (Blue Banarasi Designer Saree) reuses blue banarasi
    4: "media_1795283393812_d9776685.png",
    # Product 5 (Green Chanderi Silk Saree) reuses green kanjivaram
    5: "media_1795283418620_cd2df060.png",
    # Product 15 (Royal Purple Kanjivaram Saree) reuses green/purple kanjivaram
    15: "media_1795283418620_cd2df060.png",
    # Product 16 (Coral Georgette Designer Saree) reuses red paithani
    16: "media_1795283447901_09d6cbdc.png",
    # Product 30 (Orange Chanderi Silk Saree) reuses red paithani
    30: "media_1795283447901_09d6cbdc.png",
    # Product 17 (Deep Red Embroidered Anarkali Gown) reuses wine anarkali
    17: "media_1795283536503_c79f5374.png",
    # Product 18 (Blue Thread Work Anarkali Suit) reuses teal blue anarkali
    18: "media_1795283620936_61c50f39.png",
    # Product 8 (Orange Embroidered Wedding Kurti Set) reuses orange kurti
    8: "media_1795283658890_26079a05.png",
    # Product 20 (Printed Silk Festive Kurti with Palazzo)
    20: "media_1795283354360_3ae18037.jpg",
    # Product 35 (Purple Mirror-Work Kurti with Skirt)
    35: "media_1795283710176_7bbdf2d1.png",
    # Product 9 (Yellow Chiffon Floral Ethnic Gown) reuses rose gold gown
    9: "media_1795284033941_88c6c3e9.png",
    # Product 21 (Maroon Embroidered Indo-Western Gown) reuses wine trail gown
    21: "media_1795284002808_6b3b27ef.jpg",
}


def copy_image(src_filename, dest_filename, dest_dir=MEDIA_PRODUCTS):
    """Copy an image from uploads to media directory."""
    src = os.path.join(UPLOAD_DIR, src_filename)
    dst = os.path.join(dest_dir, dest_filename)
    if os.path.exists(src):
        shutil.copy2(src, dst)
        return True
    else:
        print(f"  WARNING: Source not found: {src_filename}")
        return False


def main():
    print("=" * 70)
    print("SHAAZ ETHNICWEAR — Image Mapping Script")
    print("=" * 70)

    # Step 1: Delete ALL existing ProductImage records to start fresh
    old_count = ProductImage.objects.count()
    ProductImage.objects.all().delete()
    print(f"\n✓ Cleared {old_count} old placeholder images")

    mapped = 0
    failed = 0

    # Step 2: Process primary image mappings
    print("\n── Primary Image Mapping ──")
    for src_file, info in IMAGE_MAP.items():
        pid = info["product_id"]
        dest = info["rename"]
        is_secondary = info.get("is_secondary", False)

        try:
            product = Product.objects.get(id=pid)
        except Product.DoesNotExist:
            print(f"  ✗ Product ID {pid} not found, skipping {src_file}")
            failed += 1
            continue

        if copy_image(src_file, dest):
            # Check if this product already has a primary image
            has_primary = ProductImage.objects.filter(product=product, is_primary=True).exists()

            ProductImage.objects.create(
                product=product,
                image=f"products/{dest}",
                alt_text=product.name,
                is_primary=not is_secondary and not has_primary,
            )
            mapped += 1
            status = "secondary" if (is_secondary or has_primary) else "PRIMARY"
            print(f"  ✓ [{status}] {src_file} → #{pid} {product.name}")

            # Copy as category image if specified
            if "cat_img" in info:
                cat_dest = info["cat_img"]
                copy_image(src_file, cat_dest, MEDIA_CATEGORIES)
                # Update category image field
                cat = product.category
                cat.image = f"categories/{cat_dest}"
                cat.save(update_fields=["image"])
                print(f"    ↳ Category image: {cat.name} → {cat_dest}")
        else:
            failed += 1

    # Step 3: Process reuse mappings (for products that share similar images)
    print("\n── Reuse Image Mapping ──")
    for pid, src_file in REUSE_MAP.items():
        # Skip if this product already got a primary image in Step 2
        if ProductImage.objects.filter(product_id=pid, is_primary=True).exists():
            continue

        info = IMAGE_MAP.get(src_file, {})
        dest = info.get("rename", src_file)

        try:
            product = Product.objects.get(id=pid)
        except Product.DoesNotExist:
            print(f"  ✗ Product ID {pid} not found")
            failed += 1
            continue

        # The image should already be copied from Step 2
        dest_path = os.path.join(MEDIA_PRODUCTS, dest)
        if os.path.exists(dest_path):
            ProductImage.objects.create(
                product=product,
                image=f"products/{dest}",
                alt_text=product.name,
                is_primary=True,
            )
            mapped += 1
            print(f"  ✓ [REUSED] #{pid} {product.name} ← {dest}")
        else:
            # Try copying from source
            if copy_image(src_file, f"reuse_{pid}_{dest}"):
                ProductImage.objects.create(
                    product=product,
                    image=f"products/reuse_{pid}_{dest}",
                    alt_text=product.name,
                    is_primary=True,
                )
                mapped += 1
                print(f"  ✓ [COPIED] #{pid} {product.name}")
            else:
                failed += 1
                print(f"  ✗ Could not map #{pid} {product.name}")

    # Step 4: Use earlier uploaded images for remaining unmapped products
    EARLIER_UPLOADS = {
        "media_1795256399790_74627e15.jpg": {
            "product_id": 9,  # Yellow Chiffon Floral Ethnic Gown
            "rename": "yellow-chiffon-ethnic-gown.jpg",
        },
        "media_1795256399791_818f0e08.jpg": {
            "product_id": 21,  # Maroon Embroidered Indo-Western Gown
            "rename": "maroon-indo-western-gown.jpg",
        },
    }

    print("\n── Earlier Upload Mapping ──")
    for src_file, info in EARLIER_UPLOADS.items():
        pid = info["product_id"]
        if ProductImage.objects.filter(product_id=pid, is_primary=True).exists():
            continue
        dest = info["rename"]
        try:
            product = Product.objects.get(id=pid)
        except Product.DoesNotExist:
            continue
        if copy_image(src_file, dest):
            ProductImage.objects.create(
                product=product,
                image=f"products/{dest}",
                alt_text=product.name,
                is_primary=True,
            )
            mapped += 1
            print(f"  ✓ [EARLIER] #{pid} {product.name}")

    # Step 5: Summary
    total_products = Product.objects.count()
    products_with_images = ProductImage.objects.values('product').distinct().count()
    total_images = ProductImage.objects.count()

    print("\n" + "=" * 70)
    print(f"SUMMARY:")
    print(f"  Images mapped:            {mapped}")
    print(f"  Failed:                   {failed}")
    print(f"  Total ProductImage rows:  {total_images}")
    print(f"  Products with images:     {products_with_images}/{total_products}")
    print("=" * 70)

    # List products that still have no image
    products_without = Product.objects.exclude(
        id__in=ProductImage.objects.values_list('product_id', flat=True)
    )
    if products_without.exists():
        print("\n⚠ Products without images:")
        for p in products_without:
            print(f"  - #{p.id} {p.name} [{p.category.name}]")


if __name__ == '__main__':
    main()
