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
| **Demo Customer** | `customer@shaaz.com` | `Customer@123` initially | Storefront, cart, orders, and real-email OTP reset once SMTP is configured |
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
   - Available on checkout with 1 click. The order is immediately confirmed for fulfilment.

2. **Razorpay Online Payment (Test Mode)**:
   - Add your own Razorpay test or live `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `backend/.env` (use Render environment variables when deployed).
   - The official Razorpay Checkout opens for cards, UPI, netbanking and wallets; card and bank credentials never reach this application.
   - An online order stays pending until Razorpay's signed payment callback is verified. A successful verification marks it `CONFIRMED` and `PAID`.

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
- **FAQs**: `http://localhost:5173/faq`

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

### Enable real OTP and order emails

The password-reset page sends a six-digit OTP only after a real email provider is configured; it never displays a production OTP in the browser.

Render's free web service blocks SMTP ports. To send from a free service, use the Brevo HTTPS API:

1. Create a Brevo account, set up and verify a sender, and obtain an API key. Your Brevo account may need transactional email enabled before sending.
2. In the Render backend service's **Environment** page, set `EMAIL_PROVIDER=brevo`, `EMAIL_DELIVERY_ENABLED=True`, `BREVO_API_KEY` to your Brevo API key, `DEFAULT_FROM_EMAIL` to your verified sender (for example, `Shaaz Ethnicwear <sender@example.com>`), and `PASSWORD_RESET_TEST_MODE=False`.
3. Save and deploy the backend. `/api/auth/email-status/` reports whether settings are present; it does not prove the provider accepted or delivered mail. Request a password reset for a registered email address to test actual delivery and inspect Brevo's email logs if needed.
4. Store the API key only in Render's environment settings or your ignored local `.env`, never in Git. Brevo may replace free-mail sender addresses to improve deliverability; a verified custom domain is recommended for a live store.

For local SMTP or a paid Render web service where SMTP ports are open:

1. Copy `backend/.env.example` to `backend/.env` for local use, then replace the sample sender values. Keep `backend/.env` private—it is ignored by Git.
2. For a Gmail sender, turn on 2-Step Verification and create a dedicated App Password. Use that 16-character App Password for `EMAIL_HOST_PASSWORD`, not the normal Gmail password.
3. Confirm these values: `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`, `EMAIL_DELIVERY_ENABLED=True`, `EMAIL_HOST=smtp.gmail.com`, `EMAIL_PORT=587`, `EMAIL_USE_TLS=True`, your sender address in `EMAIL_HOST_USER`, and the same address in `DEFAULT_FROM_EMAIL`.
4. On Render, open the **shaaz-ethnicwear-backend** service → **Environment** and securely add `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, and `DEFAULT_FROM_EMAIL`. Keep `PASSWORD_RESET_TEST_MODE=False` and `EMAIL_DELIVERY_ENABLED=True`.
5. Redeploy the backend. Visit `/api/auth/email-status/` to confirm `smtp_ready: true`, then request a reset using a registered email address and check its inbox/spam folder.

The application also sends non-blocking welcome, order-confirmation, payment-confirmation, cancellation, and admin status-update emails when SMTP is ready.

### Persistent product and category images

New images uploaded through Django admin or the store's admin dashboard are stored in the configured database, so they survive Render service restarts and deploys. Existing images bundled in `backend/media/` continue to work. The first new image added on the product create/edit page becomes the primary image. Uploaded images consume database storage, so monitor the database plan's capacity and backups.

Apply migrations locally with `python manage.py migrate`. The Render build script runs migrations on deploy. After the new version is live, re-upload any missing old images: image files previously lost from Render's temporary filesystem cannot be recovered from database paths alone. Check that the backend has its persistent `DATABASE_URL` configured; a local SQLite file on Render's temporary filesystem is not durable.

### Newsletter

The footer sends a confirmation email to each subscriber. Recipients must open the link and press the confirmation button before being included in newsletters. Opening a confirmation or unsubscribe link alone does not change the subscription; each page asks for confirmation. Subscribers can unsubscribe using the link included in every newsletter.

In Django admin, view confirmed subscribers under **Products → Newsletter subscribers**. Create a plain-text draft under **Products → Newsletter issues**, save it, then select **Review and send a batch**. The first confirmed send snapshots the subscriber list and locks the issue's subject and body. Each explicit confirmation sends at most 25 emails; return to the review page to see pending, accepted, failed, skipped, or uncertain deliveries and send another batch if necessary. Accepted means the email provider accepted the request, not that the message reached the inbox. Failed or uncertain deliveries are not retried automatically to avoid duplicate emails. Check Brevo's current plan limits and delivery logs before sending. No campaign is sent automatically on deployment or subscription.

---

## 📦 Features Checklist & Architecture

- [x] **Responsive UI**: Aesthetic bridal palette, animated S-and-crown brand mark, slow announcement carousel, mobile navigation, and hero sliders.
- [x] **Store-only Support Assistant & FAQs**: A scoped chatbot answers only Shaaz Ethnicwear product, policy, account, and signed-in customer-order questions, with a dedicated FAQ page.
- [x] **Full Authentication**: JWT (SimpleJWT) with access/refresh rotation, real-email OTP password recovery, and role-based route guards (`ProtectedRoute`, `AdminRoute`).
- [x] **Catalog Browsing**: Full-text search, multi-faceted filtering (category, color, occasion, price range, in-stock), and sorting.
- [x] **Stock Management**: Atomic stock reduction upon order placement, out-of-stock badge, and stock restoration on cancellation.
- [x] **Cart & Wishlist**: Real-time quantity updates, cart totals calculation, item removal, and synchronized wishlist state.
- [x] **Checkout & Addresses**: Multiple saved addresses support, new address entry with inline validation.
- [x] **Payment Integration**: Cash on Delivery and Razorpay Checkout with server-side HMAC signature verification.
- [x] **Order Tracking**: Visual status timeline plus admin controls to add, edit, delete, and optionally sync customer-visible tracking updates with the current order status.
- [x] **Customer Reviews**: Star ratings, title, comment, and verified customer review breakdown.
- [x] **Complete Admin Dashboard**: Revenue, total orders, low-stock warnings, user role updates, product CRUD, and coupon management.
