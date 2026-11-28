import uuid

from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_http_methods
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from core.emailing import send_store_email
from products.models import NewsletterSubscriber


class NewsletterThrottle(AnonRateThrottle):
    rate = '5/min'


class NewsletterSubscribeView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [NewsletterThrottle]

    def post(self, request):
        field = serializers.EmailField(max_length=254)
        try:
            email = field.run_validation(request.data.get('email')).strip().lower()
        except serializers.ValidationError:
            return Response({'error': 'Please enter a valid email address.'}, status=400)
        subscriber, _ = NewsletterSubscriber.objects.get_or_create(email=email)
        if not subscriber.is_confirmed:
            if not subscriber.confirmation_token:
                subscriber.confirmation_token = uuid.uuid4()
                subscriber.save(update_fields=['confirmation_token'])
            url = request.build_absolute_uri(reverse('newsletter-confirm', args=[subscriber.confirmation_token]))
            sent = send_store_email(
                'Confirm your Shaaz Ethnicwear newsletter subscription', email,
                f'Hello,\n\nPlease confirm that you want to receive Shaaz Ethnicwear news and offers:\n\n{url}\n\nIf you did not request this, you can ignore this email.\n\nTeam Shaaz Ethnicwear',
            )
            if not sent:
                return Response({'error': 'Unable to send the confirmation email. Please try again later.'}, status=503)
        return Response({'message': 'Please check your email for a confirmation link. If already subscribed, no action is needed.'})


@never_cache
@require_http_methods(['GET', 'POST'])
def newsletter_confirmation(request, token):
    subscriber = get_object_or_404(NewsletterSubscriber, confirmation_token=token, is_confirmed=False)
    completed = request.method == 'POST'
    if completed:
        subscriber.is_confirmed = True
        subscriber.confirmed_at = timezone.now()
        subscriber.confirmation_token = None
        subscriber.save(update_fields=['is_confirmed', 'confirmed_at', 'confirmation_token'])
    return render(request, 'newsletter/action.html', {
        'title': 'Confirm your subscription', 'button': 'Confirm subscription',
        'description': 'Confirm that you would like to receive Shaaz Ethnicwear news and offers.',
        'completed': completed, 'success': 'Your newsletter subscription is confirmed.',
    })


@never_cache
@require_http_methods(['GET', 'POST'])
def newsletter_unsubscribe(request, token):
    subscriber = get_object_or_404(NewsletterSubscriber, unsubscribe_token=token, is_confirmed=True)
    completed = request.method == 'POST'
    if completed:
        subscriber.is_confirmed = False
        subscriber.confirmed_at = None
        subscriber.confirmation_token = uuid.uuid4()
        subscriber.unsubscribe_token = uuid.uuid4()
        subscriber.save(update_fields=['is_confirmed', 'confirmed_at', 'confirmation_token', 'unsubscribe_token'])
    return render(request, 'newsletter/action.html', {
        'title': 'Unsubscribe', 'button': 'Unsubscribe',
        'description': 'Confirm that you no longer wish to receive Shaaz Ethnicwear news and offers.',
        'completed': completed, 'success': 'You have been unsubscribed from the newsletter.',
    })
