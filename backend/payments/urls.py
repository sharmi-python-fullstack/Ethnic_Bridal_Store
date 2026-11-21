from django.urls import path
from .views import CreateRazorpayOrderView, VerifyPaymentView

urlpatterns = [
    path('create-order/', CreateRazorpayOrderView.as_view(), name='razorpay-create-order'),
    path('verify/', VerifyPaymentView.as_view(), name='razorpay-verify'),
]
