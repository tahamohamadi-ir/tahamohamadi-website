# Generated manually to introduce the first concrete core model.

import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="ContactMessage",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.CharField(blank=True, default="", max_length=255)),
                ("updated_by", models.CharField(blank=True, default="", max_length=255)),
                ("name", models.CharField(max_length=100)),
                ("email", models.EmailField(max_length=254)),
                ("subject", models.CharField(max_length=200)),
                ("message", models.TextField(max_length=5000)),
                (
                    "status",
                    models.CharField(
                        choices=[("new", "New"), ("read", "Read"), ("archived", "Archived")],
                        default="new",
                        max_length=12,
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddIndex(
            model_name="contactmessage",
            index=models.Index(fields=["status", "-created_at"], name="core_contac_status_a0adbc_idx"),
        ),
        migrations.AddIndex(
            model_name="contactmessage",
            index=models.Index(fields=["email"], name="core_contac_email_cfac76_idx"),
        ),
    ]
