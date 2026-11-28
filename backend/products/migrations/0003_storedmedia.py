from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('products', '0002_socialmedialink')]

    operations = [
        migrations.CreateModel(
            name='StoredMedia',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=500, unique=True)),
                ('content', models.BinaryField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
