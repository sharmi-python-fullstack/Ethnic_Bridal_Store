# 🌸 Shaaz Ethnicwear — The Complete Bridal Store

A full-stack, production-grade e-commerce application for premier bridal and ethnic wear, inspired by Manyavar and Mohey. Built with a decoupled **Django REST Framework** backend, a modern **React 18 + Vite + Tailwind CSS** frontend, and **Razorpay Payment Gateway (Test Mode)**.

---

## 🎨 Aesthetic Theme & Brand Palette

Shaaz Ethnicwear features an ethnic bridal color scheme:
- **Deep Red / Royal Maroon** (`#9B1313`) — Primary regal bridal identity
- **Sandal & Antique Gold** (`#D4AF37`) — Luxury bridal borders, badges, buttons, and accents
- **Royal Purple** (`#6B21A8`) — Velvet sherwanis & festive sharara sets
- **Emerald & Olive Green** (`#16A34A`) — Kanjivaram sarees & mehendi wear
- **Festive Yellow** (`#EAB308`) — Haldi celebration outfits & Lucknowi kurtis
- **Tangerine Orange** (`#EA580C`) — Chanderi silk sarees & festive kurtas
- **Rose Pink** (`#DB2777`) — Sangeet lehengas & anarkali suits
- **Sapphire Blue** (`#1D4ED8`) — Banarasi silk sarees & royal blue kurtas
- **Ivory / Sandal Cream** (`#FFF8F0`) — Background & soft cards

---

## 👥 Collections Included (Men & Women)

### 👰 Women's Bridal Wear
1. **Bridal Lehengas** — Raw silk, heavy zari embroidery, velvet & sangeet lehengas
2. **Designer Sarees** — Banarasi silk, Kanjivaram, Paithani, and Chanderi sarees
3. **Anarkali Suits** — Floor-length embroidered velvet and georgette suits
4. **Wedding Kurtis** — Chikankari, palazzo sets, and mirror-work kurtis
5. **Sharara Sets** — Trendy party wear and nikah gharara sets
6. **Ethnic Gowns** — Net embroidered gowns and Indo-Western trail reception gowns
7. **Dupatta Collection** — Authentic Phulkari, Banarasi gold zari dupattas

### 🤵 Men's Groom & Festive Wear
8. **Sherwanis** — Royal ivory gold groom sherwanis, maroon velvet sherwanis, and black designer sherwanis
9. **Kurta Pajama Sets** — Classic Lucknowi chikan, royal blue silk sets, Pathani suits, and Nehru jacket combos
10. **Indo-Western Menswear** — Jodhpuri bandhgala suits, asymmetric jackets, and fusion sherwanis

### 💍 Bridal Accessories
11. **Bridal Accessories** — Kundan jewellery sets (7 pcs), embroidered mojaris (juttis), groom's pagdi/safa, and red bridal kalire sets

---

## ⚡ Quick Run Commands (Local Development)

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm 9+

---

### Step 1: Run the Django Backend

```powershell
# Open terminal in project root
cd "C:\Users\hr111\OneDrive\Desktop\AI Python Full Stack Projects\final project- bridal ecommerce website\backend"

# 1. Install dependencies
pip install -r requirements.txt

# 2. Apply database migrations
python manage.py migrate

# 3. Seed admin user, categories, products, and coupons
python create_admin.py

# 4. Verify and map product images
python manage.py seed_images

# 5. Start the backend development server
python manage.py runserver 8000
```
Backend API will be active at: **`http://localhost:8000`**

---

### Step 2: Run the React Frontend

```powershell
# Open a second terminal
cd "C:\Users\hr111\OneDrive\Desktop\AI Python Full Stack Projects\final project- bridal ecommerce website\frontend"

# 1. Install dependencies
npm install

# 2. Start the Vite development server
npm run dev
```
Frontend Web App will be active at: **`http://localhost:5173`**

---

## 🔑 Default Login Credentials

| Role | Email | Password | Access Area |
| :--- | :--- | :--- | :--- |
| **Store Administrator** | `admin@shaaz.com` | `Admin@123` | Full Storefront + Admin Dashboard |
| **New Customers** | Register any new account on `/register` | (your password) | Customer Storefront, Cart, Orders |

**Admin Dashboard URL:** `http://localhost:5173/admin-dashboard`

---

## 🎟️ Active Discount Coupons (Test in Cart / Checkout)

| Coupon Code | Discount Type | Discount Value | Rules |
| :--- | :--- | :--- | :--- |
| **`BRIDAL10`** | Percentage | **10% OFF** | Min. order ₹1,000 (Max ₹5,000 discount) |
| **`FLAT500`** | Flat Amount | **₹500 OFF** | Min. order ₹3,000 |
| **`WEDDING20`** | Percentage | **20% OFF** | Min. order ₹5,000 (Max ₹10,000 discount) |

---

## 💳 Payment Gateway (Razorpay & COD)

1. **Cash on Delivery (COD)**:
   - Available on checkout with 1 click. Stock is immediately deducted and order status set to `PENDING`.

2. **Razorpay Online Payment (Test Mode)**:
   - Configured with test support.
   - To use live Razorpay test keys: add your `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend/.env`.
   - In offline or placeholder mode: the application automatically displays the interactive **Razorpay Test Mode Modal**, allowing one-click payment approval and automatic verification.
   - Successful payment automatically updates the order status to `CONFIRMED` and `payment_status` to `PAID`.

---

## 🌐 Full List of Application URLs

### Customer Storefront
- **Home / Landing Page**: `http://localhost:5173/`
- **Product Catalog (Search, Filter, Sort)**: `http://localhost:5173/products`
- **Bridal Lehengas**: `http://localhost:5173/category/bridal-lehengas`
- **Sherwanis (Men's)**: `http://localhost:5173/category/sherwanis`
- **Designer Sarees**: `http://localhost:5173/category/designer-sarees`
- **Product Details Page**: `http://localhost:5173/products/<slug>`
- **Shopping Cart**: `http://localhost:5173/cart`
- **Checkout & Payment**: `http://localhost:5173/checkout`
- **Wishlist**: `http://localhost:5173/wishlist`
- **Order History**: `http://localhost:5173/orders`
- **Order Tracking & Details**: `http://localhost:5173/orders/<id>`
- **User Profile**: `http://localhost:5173/profile`
- **Saved Addresses**: `http://localhost:5173/addresses`
- **Login**: `http://localhost:5173/login`
- **Register**: `http://localhost:5173/register`
- **Forgot Password (OTP)**: `http://localhost:5173/forgot-password`

### Admin Management Back-Office
- **Admin Dashboard**: `http://localhost:5173/admin-dashboard`
- **Product Management (CRUD + Stock)**: `http://localhost:5173/admin-dashboard/products`
- **Add New Product**: `http://localhost:5173/admin-dashboard/products/add`
- **Category Management**: `http://localhost:5173/admin-dashboard/categories`
- **Order Management & Status Tracking**: `http://localhost:5173/admin-dashboard/orders`
- **User Management**: `http://localhost:5173/admin-dashboard/users`
- **Coupon Code Management**: `http://localhost:5173/admin-dashboard/coupons`
- **Django Native Admin**: `http://localhost:8000/admin/`

---

## 🚀 How to Deploy on Render (Step-by-Step)

The project includes a production-ready `render.yaml` Blueprint and `build.sh` script.

### 1. Push to GitHub
```powershell
cd "C:\Users\hr111\OneDrive\Desktop\AI Python Full Stack Projects\final project- bridal ecommerce website"

# Connect to your GitHub repository
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git branch -M main
git push -u origin main
```

### 2. Deploy on Render
1. Log in to [dashboard.render.com](https://dashboard.render.com/).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically detect `render.yaml` and configure:
   - **`shaaz-db`**: Managed PostgreSQL database
   - **`shaaz-ethnicwear-backend`**: Django Python Web Service
   - **`shaaz-ethnicwear`**: React Vite Static Site
5. Click **Apply**.
6. The backend build script (`build.sh`) will run migrations, seed data, and link all product images automatically.
7. Your live website URL will be: `https://shaaz-ethnicwear.onrender.com`

---

## 📦 Features Checklist & Architecture

- [x] **Responsive UI**: Aesthetic bridal palette with animations, mobile hamburger navigation, announcement bar, and hero sliders.
- [x] **Full Authentication**: JWT (SimpleJWT) with access/refresh rotation, OTP password recovery, and role-based route guards (`ProtectedRoute`, `AdminRoute`).
- [x] **Catalog Browsing**: Full-text search, multi-faceted filtering (category, color, occasion, price range, in-stock), and sorting.
- [x] **Stock Management**: Atomic stock reduction upon order placement, out-of-stock badge, and stock restoration on cancellation.
- [x] **Cart & Wishlist**: Real-time quantity updates, cart totals calculation, item removal, and synchronized wishlist state.
- [x] **Checkout & Addresses**: Multiple saved addresses support, new address entry with inline validation.
- [x] **Payment Integration**: Cash on Delivery and Razorpay (live test mode with HMAC signature validation and simulated fallback).
- [x] **Order Tracking**: Visual status timeline (`PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED`).
- [x] **Customer Reviews**: Star ratings, title, comment, and verified customer review breakdown.
- [x] **Complete Admin Dashboard**: Revenue, total orders, low-stock warnings, user role updates, product CRUD, and coupon management.
