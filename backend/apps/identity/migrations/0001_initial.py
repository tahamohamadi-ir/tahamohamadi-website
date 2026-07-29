import django.db.models.deletion
import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [("media", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="SiteProfile",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.CharField(blank=True, default="", max_length=255)),
                ("updated_by", models.CharField(blank=True, default="", max_length=255)),
                ("version", models.IntegerField(default=1)),
                ("locale_updated_at", models.JSONField(blank=True, default=dict, help_text='Per-locale last-edit timestamps. Example: {"fa": "2024-01-01T12:00:00Z", "en": "2024-01-02T14:30:00Z"}')),
                ("name_fa", models.CharField(max_length=255)),
                ("name_en", models.CharField(max_length=255)),
                ("headline_fa", models.CharField(blank=True, default="", max_length=500)),
                ("headline_en", models.CharField(blank=True, default="", max_length=500)),
                ("bio_fa", models.TextField(blank=True, default="")),
                ("bio_en", models.TextField(blank=True, default="")),
                ("public_email", models.EmailField(blank=True, default="", max_length=254)),
                ("status", models.CharField(default="draft", max_length=20)),
                ("portrait", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="identity_portraits", to="media.mediaasset")),
            ],
            options={"ordering": ["-updated_at"]},
        ),
        migrations.CreateModel(
            name="SocialLink",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.CharField(blank=True, default="", max_length=255)),
                ("updated_by", models.CharField(blank=True, default="", max_length=255)),
                ("version", models.IntegerField(default=1)),
                ("locale_updated_at", models.JSONField(blank=True, default=dict, help_text='Per-locale last-edit timestamps. Example: {"fa": "2024-01-01T12:00:00Z", "en": "2024-01-02T14:30:00Z"}')),
                ("label_fa", models.CharField(max_length=100)),
                ("label_en", models.CharField(max_length=100)),
                ("url", models.URLField()),
                ("ordering", models.PositiveIntegerField(default=0)),
                ("status", models.CharField(default="draft", max_length=20)),
            ],
            options={"ordering": ["ordering", "id"]},
        ),
        migrations.CreateModel(
            name="Skill",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.CharField(blank=True, default="", max_length=255)),
                ("updated_by", models.CharField(blank=True, default="", max_length=255)),
                ("version", models.IntegerField(default=1)),
                ("locale_updated_at", models.JSONField(blank=True, default=dict, help_text='Per-locale last-edit timestamps. Example: {"fa": "2024-01-01T12:00:00Z", "en": "2024-01-02T14:30:00Z"}')),
                ("name_fa", models.CharField(max_length=100)),
                ("name_en", models.CharField(max_length=100)),
                ("category_fa", models.CharField(blank=True, default="", max_length=100)),
                ("category_en", models.CharField(blank=True, default="", max_length=100)),
                ("ordering", models.PositiveIntegerField(default=0)),
                ("status", models.CharField(default="draft", max_length=20)),
            ],
            options={"ordering": ["ordering", "id"]},
        ),
    ]
