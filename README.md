# 🌸 Shaaz Ethnicwear — The Complete Bridal Store

A full-stack e-commerce website for bridal ethnic wear, built with **Django REST Framework** (backend) and **React + Vite + Tailwind CSS** (frontend).

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm 9+

---

## 🔧 Backend Setup (Django)

```bash
cd backend

# 1. Install Python dependencies
pip install -r requirements.txt --trusted-host pypi.org --trusted-host files.pythonhosted.org

# 2. Create .env file (already provided in backend/.env)
# Edit backend/.env with your settings if needed

# 3. Run database migrations
python manage.py makemigrations accounts products orders coupons
python manage.py migrate

# 4. Seed data (creates admin + sample products + coupons)
python create_admin.py

# 5. (Optional) Download product images
python manage.py seed_images

# 6. Start the server
python manage.py runserver 8000
```

Backend runs at: **http://localhost:8000**

---

## 🎨 Frontend Setup (React + Vite)

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🔑 Admin Credentials

| Role  | Email               | Password   |
|-------|---------------------|------------|
| Admin | admin@shaaz.com     | Admin@123  |

**Admin Dashboard**: http://localhost:5173/admin-dashboard

---

## 🛍️ Coupon Codes (for testing)

| Code      | Discount                      |
|-----------|-------------------------------|
| BRIDAL10  | 10% off (max ₹5000)           |
| FLAT500   | Flat ₹500 off (min ₹3000)    |

---

## 📋 Features Implemented

### Customer Features
- ✅ User Registration, Login, Logout
- ✅ Forgot Password (OTP via email)
- ✅ Product Listing with Search, Filter & Sort
- ✅ Product Detail with Images, Reviews & Rating
- ✅ Add to Cart, Update Quantity, Remove Items
- ✅ Add to Wishlist & Remove
- ✅ Coupon Code Discount
- ✅ Checkout with Shipping Address
- ✅ Cash on Delivery (COD)
- ✅ Razorpay Payment Gateway (Test Mode)
- ✅ Order History & Order Details
- ✅ Order Tracking with Timeline
- ✅ Order Cancellation
- ✅ User Profile Management
- ✅ Address Management (Add / Edit / Delete / Set Default)
- ✅ Product Ratings & Reviews

### Admin Features (Dashboard at /admin-dashboard)
- ✅ Dashboard with Revenue, Orders, Products & User Stats
- ✅ Product Management (Add / Edit / Delete)
- ✅ Category Management
- ✅ Inventory Management (stock tracking)
- ✅ Order Management with Status Updates
- ✅ User Management (Activate / Deactivate / Toggle Admin)
- ✅ Coupon Code Management (Create / Edit / Delete)
- ✅ Order Tracking History

### Technical
- ✅ JWT Authentication (access + refresh tokens)
- ✅ Auto token refresh on 401
- ✅ CORS configured
- ✅ Image upload & serving via Django media
- ✅ Automatic stock deduction on order placement
- ✅ Stock restoration on order cancellation
- ✅ Form validation (frontend + backend)
- ✅ Protected Routes (authenticated + admin-only)
- ✅ Redux state management
- ✅ Responsive mobile-first design

---

## 🎨 Color Palette

The website uses a rich bridal color palette:
- **Deep Red** `#9B1313` — Primary brand color
- **Crimson** `#DC143C` — Accents & buttons
- **Gold** `#D4AF37` — Premium highlights
- **Purple** `#6B21A8` — Secondary accent
- **Pink** `#DB2777` — Festive elements
- **Cream** `#FFF8F0` — Background

---

## 📁 Project Structure

```
├── backend/                    # Django REST Framework
│   ├── accounts/               # User auth, profile, addresses
│   ├── products/               # Categories, products, reviews, wishlist
│   ├── orders/                 # Cart, orders, order tracking
│   ├── coupons/                # Coupon codes & discounts
│   ├── payments/               # Razorpay integration
│   ├── core/                   # Django settings, URLs
│   ├── media/                  # Uploaded images
│   └── create_admin.py         # Setup script
│
└── frontend/                   # React + Vite + Tailwind CSS
    └── src/
        ├── pages/              # All page components
        │   ├── Home.jsx
        │   ├── ProductList.jsx
        │   ├── ProductDetail.jsx
        │   ├── Cart.jsx
        │   ├── Checkout.jsx
        │   ├── OrderHistory.jsx
        │   ├── OrderDetail.jsx
        │   ├── Profile.jsx
        │   ├── Wishlist.jsx
        │   ├── AddressManager.jsx
        │   ├── Login.jsx / Register.jsx
        │   ├── ForgotPassword.jsx / ResetPassword.jsx
        │   └── admin/          # Admin pages
        ├── components/
        │   ├── layout/         # Navbar, Footer, Layout
        │   ├── common/         # ProductCard, ProtectedRoute
        │   └── admin/          # AdminLayout
        ├── store/              # Redux slices
        ├── api/                # Axios API calls
        ├── hooks/              # Custom hooks
        └── utils/              # Helpers
```

---

## 🌐 API Endpoints

### Auth (`/api/auth/`)
- `POST register/` — Create account
- `POST login/` — Get JWT tokens
- `POST logout/` — Blacklist refresh token
- `GET/PATCH profile/` — User profile
- `POST change-password/`
- `POST forgot-password/` — Send OTP
- `POST reset-password/` — Reset with OTP
- `GET/POST addresses/` — Manage addresses

### Products (`/api/products/`)
- `GET /` — List with filters
- `GET categories/all/` — All categories
- `GET featured/` — Featured products
- `GET <slug>/` — Product detail
- `GET/POST <slug>/reviews/` — Reviews
- `GET wishlist/` — User's wishlist
- `POST wishlist/<id>/toggle/` — Toggle wishlist

### Orders (`/api/orders/`)
- `GET/DELETE cart/` — View/clear cart
- `POST cart/add/` — Add to cart
- `PATCH/DELETE cart/items/<id>/` — Update/remove item
- `GET /` — Order list
- `POST create/` — Place order
- `GET <id>/` — Order detail
- `POST <id>/cancel/` — Cancel order

### Coupons (`/api/coupons/`)
- `POST apply/` — Validate & apply coupon

### Payments (`/api/payments/`)
- `POST create-order/` — Create Razorpay order
- `POST verify/` — Verify payment signature

### Admin (`/api/admin/`)
- `GET dashboard/` — Stats
- Full CRUD for products, categories, orders, users, coupons

---

## 📸 Adding Product Images

Upload product images through:
1. **Django Admin**: http://localhost:8000/admin → Products → Select a product → Add images in the inline section
2. **Admin Dashboard**: http://localhost:5173/admin-dashboard/products/add → Upload images directly

Images stored in `backend/media/products/` and served at `http://localhost:8000/media/products/`.

---

## 💳 Razorpay Test Mode

To use the Razorpay payment gateway:
1. Create a free account at https://dashboard.razorpay.com/
2. Go to Settings → API Keys → Generate Test Key
3. Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend/.env`
4. Use test card: `4111 1111 1111 1111`, any future expiry, any CVV

---

## ☁️ Deploy to Render (PostgreSQL)

The repo ships a `render.yaml` Blueprint that provisions everything:

| Resource | Purpose |
|----------|---------|
| `shaaz-db` (PostgreSQL) | Persists products, images & stock across deploys |
| `shaaz-backend` (Web Service) | Django REST API + admin (runs migrations & seeds data on every build) |
| `shaaz-frontend` (Static Site) | React app, pointed at the backend automatically |

### Steps
1. Push this project to a GitHub/GitLab repository.
2. In Render: **New → Blueprint** → select the repo → **Apply**.
3. Wait for the first build. `backend/build.sh` automatically installs dependencies,
   runs `collectstatic` + `migrate`, then runs `create_admin.py` (admin user,
   categories, 12 products, coupons) and `seed_images` (assigns the bundled
   category images to the database).
4. Verify the API: `https://<shaaz-backend-url>/api/products/` returns the seeded products.
5. Admin panel: `https://<shaaz-backend-url>/admin/` — login `admin@shaaz.com` / `Admin@123`.

Because the data is (re)seeded during every build, the database is always reflected on Render.

> **Images**: product images live in `backend/media/` and are served by Django, so they
> appear on Render with no external storage.
> **API URL**: `render.yaml` sets the frontend `VITE_API_URL` from the backend host
> automatically — no manual edit required.

---

## 📝 Notes

- **Email**: Uses Django console backend in DEBUG mode — OTPs print to the terminal.
- **Images**: Products without uploaded images show a branded placeholder.
- **Stock**: Automatically deducted on order placement, restored on cancellation.
