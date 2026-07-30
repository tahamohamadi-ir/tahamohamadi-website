# Generated manually for the persistent media usage index.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("media", "0001_initial"),
        ("cms", "0002_add_locale_updated_at"),
        ("blog", "0002_add_locale_updated_at"),
        ("portfolio", "0002_add_locale_updated_at"),
    ]

    operations = [
        migrations.CreateModel(
            name="MediaUsageReference",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("source_type", models.CharField(choices=[("cms_block", "CMS block"), ("article", "Article featured image"), ("article_block", "Article block"), ("case_study", "Case study gallery"), ("case_study_block", "Case study block")], max_length=32)),
                ("source_id", models.UUIDField()),
                ("owner_type", models.CharField(choices=[("page", "Page"), ("article", "Article"), ("case_study", "Case study")], max_length=32)),
                ("owner_id", models.UUIDField()),
                ("reference_field", models.CharField(max_length=64)),
                ("article", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="media_usage_references", to="blog.article")),
                ("article_block", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="media_usage_references", to="blog.articleblock")),
                ("case_study", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="media_usage_references", to="portfolio.casestudy")),
                ("case_study_block", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="media_usage_references", to="portfolio.casestudyblock")),
                ("cms_block", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="media_usage_references", to="cms.block")),
                ("media", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="usage_references", to="media.mediaasset")),
            ],
            options={
                "indexes": [
                    models.Index(fields=["media", "owner_type", "owner_id"], name="media_media_media_i_5f8956_idx"),
                    models.Index(fields=["source_type", "source_id"], name="media_media_source__be1ba4_idx"),
                ],
                "constraints": [
                    models.UniqueConstraint(fields=("media", "source_type", "source_id", "reference_field"), name="media_usage_reference_unique_source_field"),
                ],
            },
        ),
    ]
