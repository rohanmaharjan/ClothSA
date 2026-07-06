from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('product', '0003_product_image_url'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='price',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='product',
            name='sizes',
            field=models.JSONField(blank=True, default=list, null=True),
        ),
    ]