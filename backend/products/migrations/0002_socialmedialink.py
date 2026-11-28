from django.core.validators import URLValidator
from django.db import migrations, models


def seed_existing_footer_links(apps, schema_editor):
    SocialMediaLink = apps.get_model('products', 'SocialMediaLink')
    for position, (platform, url) in enumerate([
        ('facebook', 'https://www.facebook.com/'),
        ('instagram', 'https://www.instagram.com/'),
        ('x', 'https://x.com/'),
        ('youtube', 'https://www.youtube.com/'),
    ]):
        SocialMediaLink.objects.using(schema_editor.connection.alias).get_or_create(
            platform=platform, defaults={'url': url, 'display_order': position},
        )


class Migration(migrations.Migration):
    dependencies = [('products', '0001_initial')]

    operations = [
        migrations.CreateModel(
            name='SocialMediaLink',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('platform', models.CharField(choices=[('facebook', 'Facebook'), ('instagram', 'Instagram'), ('x', 'X'), ('youtube', 'YouTube')], max_length=20, unique=True)),
                ('url', models.URLField(help_text='Full HTTPS link to the store profile.', max_length=500, validators=[URLValidator(schemes=['https'])])),
                ('is_active', models.BooleanField(default=True, help_text='Only active links appear in the footer.')),
                ('display_order', models.PositiveSmallIntegerField(default=0)),
            ],
            options={'verbose_name': 'Social media link', 'verbose_name_plural': 'Social media links', 'ordering': ['display_order', 'platform']},
        ),
        migrations.RunPython(seed_existing_footer_links, migrations.RunPython.noop),
    ]
