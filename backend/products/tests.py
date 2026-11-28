from io import BytesIO

from PIL import Image
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase

from .models import Category, Product, ProductImage, StoredMedia


def sample_image(name='photo.png', color='green'):
    data = BytesIO()
    Image.new('RGB', (3, 3), color).save(data, format='PNG')
    return SimpleUploadedFile(name, data.getvalue(), content_type='image/png')


class PersistentProductImagesTests(APITestCase):
    def setUp(self):
        self.admin = get_user_model()(email='image-admin@example.com', is_staff=True)
        self.admin.set_password('StrongPassword@123')
        self.admin.save()
        self.client.force_authenticate(self.admin)

    def test_admin_uploads_are_stored_and_served_from_database(self):
        response = self.client.post('/api/admin/products/', {
            'name': 'Green Silk Saree', 'description': 'Green silk',
            'price': '1000.00', 'stock': 2, 'is_active': 'true',
            'image_0': sample_image(), 'image_1': sample_image('second.png', 'red'),
        }, format='multipart')
        self.assertEqual(response.status_code, 201, response.data)
        product = Product.objects.get(name='Green Silk Saree')
        self.assertEqual(product.images.count(), 2)
        primary = product.images.get(is_primary=True)
        self.assertTrue(primary.image.name.startswith('db_uploads/'))
        self.assertTrue(StoredMedia.objects.filter(name=primary.image.name).exists())

        self.client.force_authenticate(user=None)
        product_data = self.client.get(f'/api/products/{product.slug}/').data
        image_url = product_data['images'][0]['image_url']
        image_response = self.client.get(image_url)
        self.assertEqual(image_response.status_code, 200)
        self.assertEqual(image_response['Content-Type'], 'image/png')
        self.assertTrue(image_response.content.startswith(b'\x89PNG'))

    def test_new_admin_image_becomes_primary_on_edit(self):
        product = Product.objects.create(name='Garland', description='Flowers', price=100, stock=1)
        old = ProductImage.objects.create(product=product, image=sample_image('old.png'), is_primary=True)
        response = self.client.patch(f'/api/admin/products/{product.id}/', {
            'image_0': sample_image('new.png'),
        }, format='multipart')
        self.assertEqual(response.status_code, 200, response.data)
        old.refresh_from_db()
        self.assertFalse(old.is_primary)
        self.assertIn('new.png', product.images.get(is_primary=True).image.name)

    def test_category_upload_is_database_backed(self):
        response = self.client.post('/api/admin/categories/', {
            'name': 'Sarees', 'slug': 'test-sarees', 'image': sample_image(),
        }, format='multipart')
        self.assertEqual(response.status_code, 201, response.data)
        category = Category.objects.get(slug='test-sarees')
        self.assertTrue(StoredMedia.objects.filter(name=category.image.name).exists())
        self.assertEqual(self.client.get(category.image.url).status_code, 200)
