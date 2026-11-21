"""
Run this script once to create the admin user and seed sample data.
Usage: python create_admin.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from products.models import Category, Product, ProductImage
from django.utils.text import slugify

User = get_user_model()

# ───────────────────────────────────────────────────────────────────────────────
# Create superuser
# ───────────────────────────────────────────────────────────────────────────────
if not User.objects.filter(email='admin@shaaz.com').exists():
    admin = User.objects.create(
        email='admin@shaaz.com',
        first_name='Shaaz',
        last_name='Admin',
        is_staff=True,
        is_superuser=True,
        is_active=True,
    )
    admin.set_password('Admin@123')
    admin.save()
    print('✅ Superuser created: admin@shaaz.com / Admin@123')
else:
    print('ℹ️  Superuser already exists')

# ───────────────────────────────────────────────────────────────────────────────
# Categories — Women's + Men's bridal collections
# ───────────────────────────────────────────────────────────────────────────────
categories_data = [
    # Women's
    {'name': 'Bridal Lehengas',       'description': 'Exquisite bridal lehengas with intricate embroidery for your wedding day'},
    {'name': 'Designer Sarees',       'description': 'Handcrafted designer sarees in silk, chiffon and georgette'},
    {'name': 'Anarkali Suits',        'description': 'Elegant floor-length Anarkali suits for festive occasions'},
    {'name': 'Wedding Kurtis',        'description': 'Beautiful kurtis with palazzo pants and dupattas'},
    {'name': 'Sharara Sets',          'description': 'Stunning Sharara and Gharara sets for celebrations'},
    {'name': 'Ethnic Gowns',          'description': 'Indo-western gowns for modern brides and bridesmaids'},
    {'name': 'Dupatta Collection',    'description': 'Handcrafted dupattas, stoles and odhnis'},
    # Men's
    {'name': 'Sherwanis',             'description': 'Royal sherwanis for grooms — embroidered, silk, and designer'},
    {'name': 'Kurta Pajama Sets',     'description': 'Classic kurta pajama sets for weddings and festivals'},
    {'name': 'Indo-Western Menswear', 'description': 'Modern Indo-western jackets, bandhgalas and jodhpuri suits'},
    # Accessories (unisex)
    {'name': 'Bridal Accessories',    'description': 'Jewellery, maang tikka, kalire, mojaris and bridal essentials'},
]

created_cats = {}
for data in categories_data:
    slug = slugify(data['name'])
    cat, created = Category.objects.get_or_create(
        name=data['name'],
        defaults={'description': data['description'], 'slug': slug}
    )
    created_cats[data['name']] = cat
    if created:
        print(f'✅ Category created: {cat.name}')

# ───────────────────────────────────────────────────────────────────────────────
# Products — 40+ items across men's and women's
# Each product has Unsplash image URLs suitable for Indian bridal wear
# ───────────────────────────────────────────────────────────────────────────────
products_data = [
    # ═══ BRIDAL LEHENGAS ═══
    {
        'name': 'Royal Red Bridal Lehenga with Gold Zari Embroidery',
        'category': 'Bridal Lehengas',
        'description': 'A magnificent heavy bridal lehenga in deep red raw silk with intricate gold zari and sequin embroidery. Features a designer blouse and net dupatta with scallop border. Perfect for your wedding day.',
        'price': 65000, 'discount_price': 54999, 'stock': 8,
        'fabric': 'Raw Silk with Net Dupatta', 'occasion': 'bridal', 'color': 'red',
        'care_instructions': 'Dry clean only. Store in a cool, dry place.',
        'is_featured': True,
    },
    {
        'name': 'Maroon Velvet Bridal Lehenga with Zardosi Work',
        'category': 'Bridal Lehengas',
        'description': 'Luxurious maroon velvet lehenga with heavy zardosi and dabka work. Comes with matching blouse and dupatta with four-sided border. A timeless bridal masterpiece.',
        'price': 85000, 'discount_price': 72000, 'stock': 5,
        'fabric': 'Velvet with Silk Lining', 'occasion': 'bridal', 'color': 'maroon',
        'care_instructions': 'Professional dry clean only.',
        'is_featured': True,
    },
    {
        'name': 'Pink Silk Lehenga for Sangeet Ceremony',
        'category': 'Bridal Lehengas',
        'description': 'Gorgeous pink silk lehenga with thread work and mirror embellishments. Light weight for comfortable all-day wear during sangeet and mehendi.',
        'price': 32000, 'discount_price': 26999, 'stock': 15,
        'fabric': 'Banarasi Silk', 'occasion': 'wedding', 'color': 'pink',
        'care_instructions': 'Dry clean recommended.',
        'is_featured': True,
    },
    {
        'name': 'Gold Tissue Bridal Lehenga Set',
        'category': 'Bridal Lehengas',
        'description': 'Shimmering gold tissue lehenga with intricate gotapatti work. Lightweight yet grand — perfect for reception and sangeet ceremonies.',
        'price': 42000, 'discount_price': 35000, 'stock': 10,
        'fabric': 'Tissue Silk', 'occasion': 'wedding', 'color': 'gold',
        'care_instructions': 'Dry clean only.',
        'is_featured': True,
    },

    # ═══ DESIGNER SAREES ═══
    {
        'name': 'Royal Blue Banarasi Silk Saree with Gold Border',
        'category': 'Designer Sarees',
        'description': 'Exquisite royal blue Banarasi saree with rich gold zari border and pallu. Pure silk weave from Varanasi. Comes with unstitched blouse piece.',
        'price': 18000, 'discount_price': 14999, 'stock': 20,
        'fabric': 'Pure Banarasi Silk', 'occasion': 'wedding', 'color': 'blue',
        'care_instructions': 'Dry clean only.',
        'is_featured': True,
    },
    {
        'name': 'Green Kanjivaram Silk Saree',
        'category': 'Designer Sarees',
        'description': 'Authentic green Kanjivaram silk saree with traditional temple border and peacock motifs. Rich pallu with gold and silver zari work.',
        'price': 25000, 'discount_price': 21000, 'stock': 12,
        'fabric': 'Kanjivaram Silk', 'occasion': 'bridal', 'color': 'green',
        'care_instructions': 'Dry clean only. Store folded in muslin cloth.',
        'is_featured': False,
    },
    {
        'name': 'Red Paithani Bridal Saree',
        'category': 'Designer Sarees',
        'description': 'Handwoven red Paithani saree with traditional peacock and lotus motifs. The hallmark of Maharashtrian bridal elegance.',
        'price': 35000, 'discount_price': 29999, 'stock': 7,
        'fabric': 'Pure Silk (Paithani)', 'occasion': 'bridal', 'color': 'red',
        'care_instructions': 'Dry clean only.',
        'is_featured': True,
    },
    {
        'name': 'Orange Chanderi Silk Saree',
        'category': 'Designer Sarees',
        'description': 'Elegant orange Chanderi silk saree with subtle golden buti work. Lightweight and breathable — ideal for daytime wedding functions.',
        'price': 7500, 'discount_price': 5999, 'stock': 25,
        'fabric': 'Chanderi Silk', 'occasion': 'festive', 'color': 'orange',
        'care_instructions': 'Gentle hand wash or dry clean.',
        'is_featured': False,
    },

    # ═══ ANARKALI SUITS ═══
    {
        'name': 'Wine Velvet Anarkali Suit with Dupatta',
        'category': 'Anarkali Suits',
        'description': 'Floor-length wine velvet Anarkali suit with heavy embroidered yoke and flared hemline. Comes with matching net dupatta.',
        'price': 12500, 'discount_price': 9999, 'stock': 20,
        'fabric': 'Velvet with Net', 'occasion': 'party', 'color': 'maroon',
        'care_instructions': 'Dry clean recommended.',
        'is_featured': True,
    },
    {
        'name': 'Pink Floral Anarkali Suit',
        'category': 'Anarkali Suits',
        'description': 'Beautiful pastel pink Anarkali with floral print and embroidered neckline. Chiffon dupatta with lace border. Perfect for wedding functions.',
        'price': 8500, 'discount_price': 6999, 'stock': 30,
        'fabric': 'Georgette', 'occasion': 'festive', 'color': 'pink',
        'care_instructions': 'Hand wash in cold water.',
        'is_featured': False,
    },
    {
        'name': 'Teal Blue Embroidered Anarkali Gown',
        'category': 'Anarkali Suits',
        'description': 'Stunning teal blue Anarkali gown with heavy thread and sequin embroidery. Floor-length silhouette with contrast dupatta.',
        'price': 15000, 'discount_price': 12500, 'stock': 15,
        'fabric': 'Net with Silk Lining', 'occasion': 'wedding', 'color': 'blue',
        'care_instructions': 'Dry clean only.',
        'is_featured': True,
    },

    # ═══ WEDDING KURTIS ═══
    {
        'name': 'Orange Embroidered Kurti with Palazzo Set',
        'category': 'Wedding Kurtis',
        'description': 'Vibrant orange kurti with heavy chikankari embroidery. Comes with matching palazzo pants and chiffon dupatta.',
        'price': 4500, 'discount_price': 3750, 'stock': 40,
        'fabric': 'Cotton Silk', 'occasion': 'wedding', 'color': 'orange',
        'care_instructions': 'Machine wash cold, iron on low.',
        'is_featured': False,
    },
    {
        'name': 'Yellow Lucknowi Chikan Kurti Set',
        'category': 'Wedding Kurtis',
        'description': 'Elegant yellow kurti with delicate Lucknowi chikankari work. Lightweight cotton blend perfect for summer weddings.',
        'price': 3800, 'discount_price': 2999, 'stock': 50,
        'fabric': 'Cotton', 'occasion': 'casual', 'color': 'yellow',
        'care_instructions': 'Machine wash cold.',
        'is_featured': False,
    },
    {
        'name': 'Purple Mirror-Work Kurti with Skirt',
        'category': 'Wedding Kurtis',
        'description': 'Trendy purple kurti with mirror work and sequin embellishments. Paired with flared skirt for a modern ethnic look.',
        'price': 5500, 'discount_price': 4499, 'stock': 35,
        'fabric': 'Rayon Silk', 'occasion': 'festive', 'color': 'purple',
        'care_instructions': 'Hand wash in cold water.',
        'is_featured': True,
    },

    # ═══ SHARARA SETS ═══
    {
        'name': 'Purple Sharara Set with Embroidered Kurti',
        'category': 'Sharara Sets',
        'description': 'Trendy purple sharara set with heavily embroidered short kurti and matching dupatta. Perfect party wear for the modern Indian woman.',
        'price': 7999, 'discount_price': 6499, 'stock': 25,
        'fabric': 'Net with Cotton Lining', 'occasion': 'party', 'color': 'purple',
        'care_instructions': 'Gentle hand wash.',
        'is_featured': True,
    },
    {
        'name': 'Peach Gharara Set for Nikah',
        'category': 'Sharara Sets',
        'description': 'Graceful peach gharara set with golden threadwork. The wide-leg gharara creates a regal silhouette perfect for nikah ceremonies.',
        'price': 12000, 'discount_price': 9999, 'stock': 15,
        'fabric': 'Silk Organza', 'occasion': 'bridal', 'color': 'gold',
        'care_instructions': 'Dry clean only.',
        'is_featured': False,
    },
    {
        'name': 'Green Floral Sharara Set',
        'category': 'Sharara Sets',
        'description': 'Fresh green sharara set with printed florals and gota patti border. Fun and festive for mehendi and haldi.',
        'price': 5500, 'discount_price': 4200, 'stock': 30,
        'fabric': 'Georgette', 'occasion': 'festive', 'color': 'green',
        'care_instructions': 'Hand wash recommended.',
        'is_featured': False,
    },

    # ═══ ETHNIC GOWNS ═══
    {
        'name': 'Black Net Embroidered Anarkali Gown',
        'category': 'Ethnic Gowns',
        'description': 'Elegant black net Anarkali gown with silver threadwork and sequin embroidery. Perfect for evening receptions and cocktail parties.',
        'price': 15500, 'discount_price': 12999, 'stock': 15,
        'fabric': 'Net with Silk Lining', 'occasion': 'party', 'color': 'black',
        'care_instructions': 'Dry clean only.',
        'is_featured': True,
    },
    {
        'name': 'Wine Indo-Western Trail Gown',
        'category': 'Ethnic Gowns',
        'description': 'Statement wine-coloured Indo-western gown with trail and cape sleeves. Heavy hand embroidery on bodice.',
        'price': 22000, 'discount_price': 18500, 'stock': 10,
        'fabric': 'Taffeta Silk', 'occasion': 'party', 'color': 'maroon',
        'care_instructions': 'Dry clean only.',
        'is_featured': True,
    },
    {
        'name': 'Rose Gold Shimmer Reception Gown',
        'category': 'Ethnic Gowns',
        'description': 'Stunning rose gold shimmer gown with fitted bodice and flared bottom. The ultimate reception outfit for the modern bride.',
        'price': 18000, 'discount_price': 14999, 'stock': 12,
        'fabric': 'Shimmer Lycra', 'occasion': 'wedding', 'color': 'gold',
        'care_instructions': 'Dry clean recommended.',
        'is_featured': False,
    },

    # ═══ DUPATTA COLLECTION ═══
    {
        'name': 'Multicolor Phulkari Dupatta',
        'category': 'Dupatta Collection',
        'description': 'Authentic Phulkari dupatta with traditional Punjabi embroidery in vibrant multicolors. Pure cotton base.',
        'price': 2500, 'discount_price': 1999, 'stock': 50,
        'fabric': 'Cotton', 'occasion': 'festive', 'color': 'multicolor',
        'care_instructions': 'Gentle hand wash.',
        'is_featured': False,
    },
    {
        'name': 'Red Banarasi Dupatta with Gold Zari',
        'category': 'Dupatta Collection',
        'description': 'Heavy red Banarasi silk dupatta with all-over gold zari work. Perfect bridal dupatta to pair with any lehenga or suit.',
        'price': 5000, 'discount_price': 3999, 'stock': 30,
        'fabric': 'Banarasi Silk', 'occasion': 'bridal', 'color': 'red',
        'care_instructions': 'Dry clean only.',
        'is_featured': False,
    },

    # ═══ SHERWANIS (MEN'S) ═══
    {
        'name': 'Ivory Gold Embroidered Groom Sherwani',
        'category': 'Sherwanis',
        'description': 'Regal ivory sherwani with heavy gold threadwork and stone embellishments. Includes matching churidar and stole. The ultimate groom outfit.',
        'price': 45000, 'discount_price': 38000, 'stock': 10,
        'fabric': 'Raw Silk', 'occasion': 'bridal', 'color': 'white',
        'care_instructions': 'Dry clean only. Store on hanger.',
        'is_featured': True,
    },
    {
        'name': 'Maroon Velvet Groom Sherwani',
        'category': 'Sherwanis',
        'description': 'Luxurious maroon velvet sherwani with antique gold embroidery. Regal mandarin collar with matching bottoms and dupatta.',
        'price': 55000, 'discount_price': 46000, 'stock': 8,
        'fabric': 'Velvet', 'occasion': 'bridal', 'color': 'maroon',
        'care_instructions': 'Professional dry clean only.',
        'is_featured': True,
    },
    {
        'name': 'Navy Blue Sherwani with Gold Buttons',
        'category': 'Sherwanis',
        'description': 'Classic navy blue sherwani with golden buttons and subtle self-print. Elegant and sophisticated for the modern groom.',
        'price': 32000, 'discount_price': 27000, 'stock': 12,
        'fabric': 'Jacquard Silk', 'occasion': 'wedding', 'color': 'blue',
        'care_instructions': 'Dry clean only.',
        'is_featured': False,
    },
    {
        'name': 'Black Embroidered Sherwani Set',
        'category': 'Sherwanis',
        'description': 'Sophisticated black sherwani with silver and gold threadwork. Comes with churidar and brooch. Perfect for sangeet or reception.',
        'price': 38000, 'discount_price': 32000, 'stock': 10,
        'fabric': 'Art Silk', 'occasion': 'party', 'color': 'black',
        'care_instructions': 'Dry clean only.',
        'is_featured': True,
    },

    # ═══ KURTA PAJAMA SETS (MEN'S) ═══
    {
        'name': 'White Cotton Lucknowi Chikan Kurta Pajama',
        'category': 'Kurta Pajama Sets',
        'description': 'Classic white Lucknowi chikan kurta with intricate hand-embroidery. Paired with comfortable cotton pajama. Timeless elegance for every occasion.',
        'price': 4500, 'discount_price': 3500, 'stock': 40,
        'fabric': 'Cotton', 'occasion': 'casual', 'color': 'white',
        'care_instructions': 'Machine wash cold. Iron on medium.',
        'is_featured': False,
    },
    {
        'name': 'Royal Blue Silk Kurta Set for Wedding',
        'category': 'Kurta Pajama Sets',
        'description': 'Rich royal blue silk kurta with golden thread embroidery on collar and sleeves. Comes with matching churidar and pocket square.',
        'price': 8500, 'discount_price': 6999, 'stock': 25,
        'fabric': 'Dupion Silk', 'occasion': 'wedding', 'color': 'blue',
        'care_instructions': 'Dry clean recommended.',
        'is_featured': True,
    },
    {
        'name': 'Olive Green Pathani Kurta Set',
        'category': 'Kurta Pajama Sets',
        'description': 'Stylish olive green Pathani suit with Chinese collar and self-print. Modern cut with traditional appeal.',
        'price': 5500, 'discount_price': 4500, 'stock': 30,
        'fabric': 'Cotton Silk Blend', 'occasion': 'festive', 'color': 'green',
        'care_instructions': 'Machine wash cold.',
        'is_featured': False,
    },
    {
        'name': 'Peach Silk Kurta with Embroidered Jacket',
        'category': 'Kurta Pajama Sets',
        'description': 'Trendy peach silk kurta paired with a heavily embroidered Nehru jacket. The complete wedding guest outfit.',
        'price': 12000, 'discount_price': 9999, 'stock': 20,
        'fabric': 'Silk', 'occasion': 'wedding', 'color': 'orange',
        'care_instructions': 'Dry clean only.',
        'is_featured': True,
    },

    # ═══ INDO-WESTERN MENSWEAR ═══
    {
        'name': 'Black Bandhgala Jodhpuri Suit',
        'category': 'Indo-Western Menswear',
        'description': 'Sharp black bandhgala suit with Jodhpuri cut trouser. Minimalist design with golden buttons. Perfect for reception or cocktail.',
        'price': 18000, 'discount_price': 14999, 'stock': 15,
        'fabric': 'Terry Rayon', 'occasion': 'party', 'color': 'black',
        'care_instructions': 'Dry clean only.',
        'is_featured': True,
    },
    {
        'name': 'Wine Nehru Jacket with Printed Kurta',
        'category': 'Indo-Western Menswear',
        'description': 'Elegant wine-coloured Nehru jacket with printed kurta and trouser. The trending Indo-western look for weddings.',
        'price': 10000, 'discount_price': 7999, 'stock': 20,
        'fabric': 'Jacquard with Cotton Kurta', 'occasion': 'wedding', 'color': 'maroon',
        'care_instructions': 'Dry clean the jacket. Kurta can be hand washed.',
        'is_featured': False,
    },
    {
        'name': 'Ivory Indo-Western Sherwani Jacket',
        'category': 'Indo-Western Menswear',
        'description': 'Modern ivory Indo-western sherwani jacket with asymmetric hemline. Fusion of traditional embroidery and contemporary design.',
        'price': 22000, 'discount_price': 18000, 'stock': 10,
        'fabric': 'Raw Silk', 'occasion': 'bridal', 'color': 'white',
        'care_instructions': 'Dry clean only.',
        'is_featured': True,
    },

    # ═══ BRIDAL ACCESSORIES ═══
    {
        'name': 'Gold Plated Bridal Jewellery Set (7 Pieces)',
        'category': 'Bridal Accessories',
        'description': 'Complete bridal jewellery set including necklace, earrings, maang tikka, haath phool, nose ring, bangles, and anklet. Gold plated with Kundan and pearl work.',
        'price': 8500, 'discount_price': 6999, 'stock': 20,
        'fabric': 'Gold Plated Brass', 'occasion': 'bridal', 'color': 'gold',
        'care_instructions': 'Store in jewellery box. Avoid contact with water.',
        'is_featured': True,
    },
    {
        'name': 'Embroidered Bridal Mojari (Jutti)',
        'category': 'Bridal Accessories',
        'description': 'Hand-embroidered leather mojari (jutti) with zardosi and sequin work. Available in red, gold, and pink. Comfortable for all-day wear.',
        'price': 2500, 'discount_price': 1999, 'stock': 50,
        'fabric': 'Genuine Leather with Velvet', 'occasion': 'bridal', 'color': 'red',
        'care_instructions': 'Wipe clean with dry cloth.',
        'is_featured': False,
    },
    {
        'name': 'Groom\'s Pagdi/Safa (Wedding Turban)',
        'category': 'Bridal Accessories',
        'description': 'Pre-tied groom\'s pagdi/safa in maroon silk with golden brooch and kalgi. Ready to wear — adjustable inner band.',
        'price': 3500, 'discount_price': 2800, 'stock': 30,
        'fabric': 'Silk', 'occasion': 'bridal', 'color': 'maroon',
        'care_instructions': 'Dry clean only.',
        'is_featured': False,
    },
    {
        'name': 'Red Bridal Kalire Set',
        'category': 'Bridal Accessories',
        'description': 'Traditional gold-plated kalire (hanging ornaments) for the bride\'s chura. Shell and pearl detailing with jingling bells.',
        'price': 1800, 'discount_price': 1499, 'stock': 40,
        'fabric': 'Gold Plated Brass', 'occasion': 'bridal', 'color': 'gold',
        'care_instructions': 'Store in soft pouch.',
        'is_featured': False,
    },
]

for data in products_data:
    cat_name = data.pop('category')
    cat = created_cats.get(cat_name)
    prod, created = Product.objects.get_or_create(
        name=data['name'],
        defaults={**data, 'category': cat}
    )
    if created:
        print(f'✅ Product created: {prod.name}')

# ───────────────────────────────────────────────────────────────────────────────
# Coupons
# ───────────────────────────────────────────────────────────────────────────────
from coupons.models import Coupon
from django.utils import timezone

if not Coupon.objects.filter(code='BRIDAL10').exists():
    Coupon.objects.create(
        code='BRIDAL10',
        description='10% off on all bridal wear',
        discount_type='PERCENTAGE',
        discount_value=10,
        min_order_amount=1000,
        max_discount_amount=5000,
        max_uses=100,
        is_active=True,
        valid_from=timezone.now(),
    )
    print('✅ Coupon created: BRIDAL10 (10% off)')

if not Coupon.objects.filter(code='FLAT500').exists():
    Coupon.objects.create(
        code='FLAT500',
        description='Flat ₹500 off on orders above ₹3000',
        discount_type='FIXED',
        discount_value=500,
        min_order_amount=3000,
        max_uses=50,
        is_active=True,
        valid_from=timezone.now(),
    )
    print('✅ Coupon created: FLAT500 (₹500 off)')

if not Coupon.objects.filter(code='WEDDING20').exists():
    Coupon.objects.create(
        code='WEDDING20',
        description='20% off on wedding collection (max ₹10,000)',
        discount_type='PERCENTAGE',
        discount_value=20,
        min_order_amount=5000,
        max_discount_amount=10000,
        max_uses=50,
        is_active=True,
        valid_from=timezone.now(),
    )
    print('✅ Coupon created: WEDDING20 (20% off)')

print('\n🎉 Setup complete!')
print('📧 Admin login: admin@shaaz.com')
print('🔑 Password: Admin@123')
print('🌐 Backend: http://localhost:8000')
print('🌐 Frontend: http://localhost:5173')
print('\n📋 Available Coupon Codes:')
print('   BRIDAL10  → 10% off (max ₹5,000)')
print('   FLAT500   → ₹500 off (min order ₹3,000)')
print('   WEDDING20 → 20% off (max ₹10,000, min order ₹5,000)')
