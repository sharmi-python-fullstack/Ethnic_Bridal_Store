from django.urls import path
from .views import CreateRazorpayOrderView, VerifyPaymentView
from .diagnostics import RazorpayStatusView

urlpatterns = [
    path('status/', RazorpayStatusView.as_view(), name='razorpay-status'),
    path('create-order/', CreateRazorpayOrderView.as_view(), name='razorpay-create-order'),
    path('verify/', VerifyPaymentView.as_view(), name='razorpay-verify'),
]
