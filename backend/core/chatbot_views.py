"""A deliberately scoped support assistant for Shaaz Ethnicwear.

This is a rules-and-catalogue assistant, not a general-purpose AI endpoint.
It only answers questions about the store, its products, account flows and a
signed-in customer's own orders.
"""
import re

from django.db.models import Q
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order
from products.models import Product
from products.serializers import ProductListSerializer


STORE_TERMS = {
    'shaaz', 'ethnicwear', 'store', 'website', 'product', 'products',
    'lehenga', 'lehengas', 'saree', 'sarees', 'kurti', 'kurtis', 'sherwani',
    'sherwanis', 'gown', 'gowns', 'dupatta', 'dupattas', 'outfit', 'outfits',
    'dress', 'dresses', 'bridal', 'wedding', 'collection', 'collections',
    'category', 'categories', 'size', 'sizes', 'fit', 'fabric', 'colour',
    'color', 'stock', 'available', 'availability', 'price', 'prices', 'cost',
    'cart', 'wishlist', 'checkout', 'shipping', 'delivery', 'order', 'orders',
    'track', 'tracking', 'return', 'returns', 'refund', 'refunds', 'exchange',
    'payment', 'payments', 'cod', 'razorpay', 'coupon', 'coupons', 'discount',
    'login', 'password', 'account', 'profile', 'address', 'addresses',
    'contact', 'policy', 'policies', 'red', 'pink', 'blue', 'green', 'yellow',
    'orange', 'purple', 'maroon', 'gold', 'silver', 'white', 'black',
}


class StoreChatView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        message = str(request.data.get('message', '')).strip()
        if not message:
            return Response({'error': 'Please type a store-related question.'}, status=400)
        if len(message) > 300:
            return Response({'error': 'Please keep your question under 300 characters.'}, status=400)

        text = message.lower()
        words = set(re.findall(r"[a-z0-9']+", text))
        if not self._is_store_question(text, words):
            return Response({
                'reply': (
                    'I can help only with Shaaz Ethnicwear—our bridal collections, '
                    'products, orders, delivery, returns, payments, and accounts. '
                    'Please ask a store-related question.'
                ),
                'suggestions': ['Show bridal lehengas', 'How do I track my order?', 'What is the return policy?'],
                'in_scope': False,
            })

        payload = self._answer(request, text, words)
        payload['in_scope'] = True
        return Response(payload)

    @staticmethod
    def _is_store_question(text, words):
        greetings = {'hi', 'hello', 'hey', 'thanks', 'thank', 'help'}
        return bool(words & STORE_TERMS) or words.issubset(greetings)

    def _answer(self, request, text, words):
        if words.issubset({'hi', 'hello', 'hey', 'help', 'thanks', 'thank', 'you'}):
            return {
                'reply': 'Welcome to Shaaz Ethnicwear. I can help you explore products, check store policies, or find your own order updates.',
                'suggestions': ['Show bridal lehengas', 'How does delivery work?', 'Track my order'],
            }

        if words & {'track', 'tracking'} or ('my' in words and ('order' in words or 'orders' in words)):
            return self._order_answer(request)

        if words & {'shipping', 'delivery'}:
            return {
                'reply': 'Shaaz Ethnicwear offers free shipping on orders above ₹999. Orders below that amount have the delivery charge shown at checkout. Once dispatched, each status update appears in My Orders.',
                'suggestions': ['Track my order', 'Show bridal lehengas', 'Return policy'],
            }

        if words & {'return', 'returns', 'refund', 'refunds', 'exchange'}:
            return {
                'reply': 'For a damaged or incorrect item, email info@shaazethnicwear.com with your order number, photos, and a brief description. Our team will confirm eligibility and the next steps.',
                'suggestions': ['Open return policy', 'Track my order', 'Contact the store'],
                'links': [{'label': 'Read return policy', 'to': '/legal/returns'}],
            }

        if words & {'payment', 'payments', 'cod', 'razorpay'}:
            return {
                'reply': 'You can choose Cash on Delivery where available or pay securely with Razorpay at checkout. Online orders are confirmed after Razorpay verifies the payment.',
                'suggestions': ['How does delivery work?', 'Track my order', 'Browse products'],
            }

        if words & {'coupon', 'coupons', 'discount'}:
            return {
                'reply': 'Enter a valid coupon code in your cart or at checkout. The store will show the discount and any minimum-order requirement before you place the order.',
                'suggestions': ['Browse sale items', 'How does delivery work?', 'Browse products'],
                'links': [{'label': 'See sale items', 'to': '/products?has_discount=true'}],
            }

        if words & {'password', 'login', 'account', 'profile', 'address', 'addresses'}:
            return {
                'reply': 'Use Forgot Password on the login page to receive a 6-digit OTP at your registered email address. After signing in, you can manage your profile and saved delivery addresses from My Profile.',
                'suggestions': ['Reset my password', 'Manage addresses', 'Track my order'],
                'links': [{'label': 'Forgot password', 'to': '/forgot-password'}],
            }

        products = self._find_products(request, text, words)
        if products:
            return {
                'reply': 'Here are matching items currently available at Shaaz Ethnicwear. Open any item for photos, sizes, fabric and availability.',
                'products': products,
                'suggestions': ['Show more products', 'How does delivery work?', 'What is the return policy?'],
            }

        return {
            'reply': 'I can help with Shaaz products, sizing, availability, orders, delivery, returns, payments, and account support. Try asking about a collection or a store policy.',
            'suggestions': ['Browse products', 'Show bridal lehengas', 'How do I track my order?'],
            'links': [{'label': 'Browse all products', 'to': '/products'}, {'label': 'View FAQs', 'to': '/faq'}],
        }

    @staticmethod
    def _find_products(request, text, words):
        product_terms = words & {
            'lehenga', 'lehengas', 'saree', 'sarees', 'kurti', 'kurtis',
            'sherwani', 'sherwanis', 'gown', 'gowns', 'dupatta', 'dupattas',
            'bridal', 'wedding', 'red', 'pink', 'blue', 'green', 'yellow',
            'orange', 'purple', 'maroon', 'gold', 'silver', 'white', 'black',
            'outfit', 'outfits', 'product', 'products', 'collection', 'collections',
        }
        if not product_terms:
            return []

        query = Q()
        for term in product_terms:
            singular = term[:-1] if term.endswith('s') else term
            query |= Q(name__icontains=singular)
            query |= Q(description__icontains=singular)
            query |= Q(category__name__icontains=singular)
            query |= Q(color__iexact=singular)
            query |= Q(occasion__iexact=singular)

        products = Product.objects.filter(is_active=True).filter(query).select_related('category').prefetch_related('images')[:4]
        return ProductListSerializer(products, many=True, context={'request': request}).data

    @staticmethod
    def _order_answer(request):
        if not request.user.is_authenticated:
            return {
                'reply': 'Please sign in first so I can show only your order updates. Your order information is kept private.',
                'suggestions': ['Log in', 'How does delivery work?', 'Browse products'],
                'links': [{'label': 'Log in', 'to': '/login'}],
            }

        orders = Order.objects.filter(user=request.user).order_by('-created_at')[:3]
        if not orders:
            return {
                'reply': 'I could not find an order for this account yet. Once you place an order, its tracking timeline will appear in My Orders.',
                'suggestions': ['Browse products', 'How does delivery work?', 'Contact the store'],
                'links': [{'label': 'Browse products', 'to': '/products'}],
            }

        return {
            'reply': 'Here are your latest Shaaz Ethnicwear orders. Open one to see its complete tracking history.',
            'orders': [
                {
                    'id': order.id,
                    'order_number': order.order_number,
                    'status': order.get_status_display(),
                    'to': f'/orders/{order.id}',
                }
                for order in orders
            ],
            'suggestions': ['How does delivery work?', 'Return policy', 'Browse products'],
        }
