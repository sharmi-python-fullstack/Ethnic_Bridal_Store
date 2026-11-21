from django.urls import path
from .views import (
    CartView, CartItemAddView, CartItemUpdateView,
    OrderListView, OrderCreateView, OrderDetailView, OrderCancelView,
    AdminOrderListView, AdminOrderDetailView,
)

urlpatterns = [
    # Cart
    path('cart/', CartView.as_view(), name='cart'),
    path('cart/add/', CartItemAddView.as_view(), name='cart-add'),
    path('cart/items/<int:item_id>/', CartItemUpdateView.as_view(), name='cart-item'),
    # Orders
    path('', OrderListView.as_view(), name='order-list'),
    path('create/', OrderCreateView.as_view(), name='order-create'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('<int:pk>/cancel/', OrderCancelView.as_view(), name='order-cancel'),
    # Admin orders
    path('admin/orders/', AdminOrderListView.as_view(), name='admin-order-list'),
    path('admin/orders/<int:pk>/', AdminOrderDetailView.as_view(), name='admin-order-detail'),
]
