#!/usr/bin/env python
"""Import data from the old Spring Boot + Vue/Quasar site's PostgreSQL database.

This script connects to the legacy PostgreSQL database (old Java Spring Boot
backend) and migrates content into the new Django models.

Usage:
    # Set environment variables for the legacy DB connection:
    export LEGACY_DB_HOST=localhost
    export LEGACY_DB_PORT=5432
    export LEGACY_DB_NAME=tahamohamadi_legacy
    export LEGACY_DB_USER=postgres
    export LEGACY_DB_PASSWORD=password

    # Run from the backend directory with Django settings loaded:
    cd backend
    python ../scripts/import_legacy_data.py

    # Or via Django's shell:
    python manage.py shell < ../scripts/import_legacy_data.py

Requirements:
    pip install psycopg2-binary

Notes:
    - This script assumes the legacy schema uses typical Spring Boot/JPA conventions
    - Adjust table and column names below to match your actual legacy schema
    - The script is idempotent: re-running skips already-imported records (matched by slug)
    - Media files must be copied separately (this only creates DB records)
"""

import os
import sys
from datetime import datetime
from pathlib import Path

# Add the backend directory to path so Django models can be imported
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

# Configure Django settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

import django  # noqa: E402

django.setup()

import psycopg2  # noqa: E402
from django.utils import timezone  # noqa: E402

from apps.blog.models import Article, ArticleBlock, Topic  # noqa: E402
from apps.cms.models import Block, Page, Section  # noqa: E402
from apps.media.models import MediaAsset  # noqa: E402
from apps.portfolio.models import CaseStudy, CaseStudyBlock  # noqa: E402


# ---------------------------------------------------------------------------
# Configuration — adjust these to match your legacy database schema
# ---------------------------------------------------------------------------

LEGACY_DB_CONFIG = {
    "host": os.environ.get("LEGACY_DB_HOST", "localhost"),
    "port": int(os.environ.get("LEGACY_DB_PORT", "5432")),
    "dbname": os.environ.get("LEGACY_DB_NAME", "tahamohamadi_legacy"),
    "user": os.environ.get("LEGACY_DB_USER", "postgres"),
    "password": os.environ.get("LEGACY_DB_PASSWORD", "password"),
}

# Legacy table/column mappings — update these to match your actual schema
LEGACY_TABLES = {
    "articles": "articles",  # or "blog_posts", "posts", etc.
    "pages": "pages",
    "media": "media_files",  # or "attachments", "uploads", etc.
    "portfolio": "portfolio_items",  # or "projects", "case_studies", etc.
    "topics": "categories",  # or "tags", "topics", etc.
}


def get_legacy_connection():
    """Connect to the legacy PostgreSQL database."""
    try:
        conn = psycopg2.connect(**LEGACY_DB_CONFIG)
        print(f"Connected to legacy DB: {LEGACY_DB_CONFIG['dbname']}@{LEGACY_DB_CONFIG['host']}")
        return conn
    except psycopg2.Error as e:
        print(f"ERROR: Cannot connect to legacy database: {e}")
        print("Make sure LEGACY_DB_* environment variables are set correctly.")
        sys.exit(1)


def import_media(cursor):
    """Import media assets from legacy database.

    Adjust the SQL query to match your legacy schema. Common Spring Boot
    media table columns might be:
    - id, file_name, file_path, content_type, file_size, created_at
    """
    print("\n--- Importing Media Assets ---")
    try:
        cursor.execute(f"""
            SELECT
                id,
                file_name,
                file_path,
                content_type,
                file_size,
                width,
                height,
                alt_text,
                created_at
            FROM {LEGACY_TABLES['media']}
            ORDER BY created_at
        """)
    except psycopg2.Error as e:
        print(f"  Skipping media import (table may not exist): {e}")
        cursor.connection.rollback()
        return {}

    media_map = {}  # legacy_id -> new MediaAsset
    rows = cursor.fetchall()
    imported = 0

    for row in rows:
        legacy_id, file_name, file_path, content_type, file_size, width, height, alt_text, created_at = row

        # Check if already imported (by original filename + checksum placeholder)
        existing = MediaAsset.objects.filter(original_filename=file_name).first()
        if existing:
            media_map[legacy_id] = existing
            continue

        asset = MediaAsset.objects.create(
            file=file_path or f"media/legacy/{file_name}",
            original_filename=file_name or "unknown",
            mime_type=content_type or "application/octet-stream",
            file_size=file_size or 0,
            width=width,
            height=height,
            checksum=f"legacy_{legacy_id}",
            alt_text_fa=alt_text or "",
            alt_text_en=alt_text or "",
        )
        media_map[legacy_id] = asset
        imported += 1

    print(f"  Imported {imported} media assets ({len(rows)} total in legacy)")
    return media_map


def import_topics(cursor):
    """Import blog topics/categories from legacy database."""
    print("\n--- Importing Topics ---")
    try:
        cursor.execute(f"""
            SELECT id, slug, name_fa, name_en
            FROM {LEGACY_TABLES['topics']}
            ORDER BY slug
        """)
    except psycopg2.Error as e:
        print(f"  Skipping topics import (table may not exist): {e}")
        cursor.connection.rollback()
        return {}

    topic_map = {}  # legacy_id -> new Topic
    rows = cursor.fetchall()
    imported = 0

    for row in rows:
        legacy_id, slug, name_fa, name_en = row

        topic, created = Topic.objects.get_or_create(
            slug=slug,
            defaults={"name_fa": name_fa or slug, "name_en": name_en or slug},
        )
        topic_map[legacy_id] = topic
        if created:
            imported += 1

    print(f"  Imported {imported} topics ({len(rows)} total in legacy)")
    return topic_map


def import_articles(cursor, topic_map, media_map):
    """Import blog articles from legacy database.

    Adjust columns to match your Spring Boot entity. Common patterns:
    - JPA entities often have snake_case columns: slug_fa, slug_en, title_fa, title_en
    - Or camelCase mapped to snake: slugFa -> slug_fa
    - Content might be stored as HTML, Markdown, or JSON blocks
    """
    print("\n--- Importing Articles ---")
    try:
        cursor.execute(f"""
            SELECT
                id,
                slug_fa,
                slug_en,
                title_fa,
                title_en,
                excerpt_fa,
                excerpt_en,
                content_fa,
                content_en,
                status,
                featured_image_id,
                published_at,
                created_at
            FROM {LEGACY_TABLES['articles']}
            ORDER BY created_at
        """)
    except psycopg2.Error as e:
        print(f"  Skipping articles import (table may not exist): {e}")
        cursor.connection.rollback()
        return

    rows = cursor.fetchall()
    imported = 0

    for row in rows:
        (
            legacy_id,
            slug_fa,
            slug_en,
            title_fa,
            title_en,
            excerpt_fa,
            excerpt_en,
            content_fa,
            content_en,
            status,
            featured_image_id,
            published_at,
            created_at,
        ) = row

        # Skip if already imported
        if Article.objects.filter(slug_en=slug_en).exists():
            continue

        # Map status
        new_status = _map_status(status)

        # Map featured image
        featured_image = media_map.get(featured_image_id)

        article = Article.objects.create(
            slug_fa=slug_fa or slug_en,
            slug_en=slug_en,
            title_fa=title_fa or title_en,
            title_en=title_en,
            excerpt_fa=excerpt_fa or "",
            excerpt_en=excerpt_en or "",
            featured_image=featured_image,
            status=new_status,
            published_at=published_at,
            reading_time_fa=_estimate_reading_time(content_fa, "fa"),
            reading_time_en=_estimate_reading_time(content_en, "en"),
            created_by="legacy_import",
            updated_by="legacy_import",
        )

        # Convert content to blocks
        if content_fa:
            _create_article_blocks(article, "fa", content_fa)
        if content_en:
            _create_article_blocks(article, "en", content_en)

        # Import topic associations
        _import_article_topics(cursor, legacy_id, article, topic_map)

        imported += 1

    print(f"  Imported {imported} articles ({len(rows)} total in legacy)")


def import_pages(cursor):
    """Import CMS pages from legacy database."""
    print("\n--- Importing Pages ---")
    try:
        cursor.execute(f"""
            SELECT
                id,
                slug_fa,
                slug_en,
                title_fa,
                title_en,
                page_type,
                content_fa,
                content_en,
                status,
                published_at,
                created_at
            FROM {LEGACY_TABLES['pages']}
            ORDER BY created_at
        """)
    except psycopg2.Error as e:
        print(f"  Skipping pages import (table may not exist): {e}")
        cursor.connection.rollback()
        return

    rows = cursor.fetchall()
    imported = 0

    for row in rows:
        (
            legacy_id,
            slug_fa,
            slug_en,
            title_fa,
            title_en,
            page_type,
            content_fa,
            content_en,
            status,
            published_at,
            created_at,
        ) = row

        if Page.objects.filter(slug_en=slug_en).exists():
            continue

        new_status = _map_status(status)

        page = Page.objects.create(
            slug_fa=slug_fa or slug_en,
            slug_en=slug_en,
            title_fa=title_fa or title_en,
            title_en=title_en,
            page_type=page_type or "custom",
            status=new_status,
            published_at=published_at,
            created_by="legacy_import",
            updated_by="legacy_import",
        )

        # Create a default section with text block for migrated content
        section = Section.objects.create(page=page, ordering=0, layout="default")

        if content_fa or content_en:
            Block.objects.create(
                section=section,
                block_type="text",
                ordering=0,
                settings={
                    "body_fa": content_fa or "",
                    "body_en": content_en or "",
                },
            )

        imported += 1

    print(f"  Imported {imported} pages ({len(rows)} total in legacy)")


def import_portfolio(cursor, media_map):
    """Import portfolio/case studies from legacy database."""
    print("\n--- Importing Portfolio ---")
    try:
        cursor.execute(f"""
            SELECT
                id,
                slug_fa,
                slug_en,
                title_fa,
                title_en,
                role_fa,
                role_en,
                client_fa,
                client_en,
                date_start,
                date_end,
                technologies,
                outcome_fa,
                outcome_en,
                content_fa,
                content_en,
                featured,
                status,
                published_at,
                created_at
            FROM {LEGACY_TABLES['portfolio']}
            ORDER BY created_at
        """)
    except psycopg2.Error as e:
        print(f"  Skipping portfolio import (table may not exist): {e}")
        cursor.connection.rollback()
        return

    rows = cursor.fetchall()
    imported = 0

    for row in rows:
        (
            legacy_id,
            slug_fa,
            slug_en,
            title_fa,
            title_en,
            role_fa,
            role_en,
            client_fa,
            client_en,
            date_start,
            date_end,
            technologies,
            outcome_fa,
            outcome_en,
            content_fa,
            content_en,
            featured,
            status,
            published_at,
            created_at,
        ) = row

        if CaseStudy.objects.filter(slug_en=slug_en).exists():
            continue

        new_status = _map_status(status)

        # Parse technologies (might be comma-separated string or JSON array)
        tech_list = _parse_technologies(technologies)

        case = CaseStudy.objects.create(
            slug_fa=slug_fa or slug_en,
            slug_en=slug_en,
            title_fa=title_fa or title_en,
            title_en=title_en,
            role_fa=role_fa or "",
            role_en=role_en or "",
            client_fa=client_fa or "",
            client_en=client_en or "",
            date_start=date_start,
            date_end=date_end,
            technologies=tech_list,
            outcome_fa=outcome_fa or "",
            outcome_en=outcome_en or "",
            featured=bool(featured),
            status=new_status,
            published_at=published_at,
            created_by="legacy_import",
            updated_by="legacy_import",
        )

        # Create narrative blocks from content
        if content_fa:
            _create_case_study_blocks(case, "fa", content_fa)
        if content_en:
            _create_case_study_blocks(case, "en", content_en)

        imported += 1

    print(f"  Imported {imported} case studies ({len(rows)} total in legacy)")


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------


def _map_status(legacy_status):
    """Map legacy status values to new Django model status values."""
    if not legacy_status:
        return "draft"
    status_lower = legacy_status.lower()
    mapping = {
        "published": "published",
        "active": "published",
        "live": "published",
        "draft": "draft",
        "pending": "draft",
        "archived": "archived",
        "deleted": "archived",
    }
    return mapping.get(status_lower, "draft")


def _estimate_reading_time(content, locale):
    """Estimate reading time in minutes from text content."""
    if not content:
        return 0
    word_count = len(content.split())
    # Persian reading speed ~180 wpm, English ~230 wpm
    wpm = 180 if locale == "fa" else 230
    return max(1, round(word_count / wpm))


def _parse_technologies(technologies):
    """Parse technologies field from legacy format to Python list."""
    if not technologies:
        return []
    if isinstance(technologies, list):
        return technologies
    if isinstance(technologies, str):
        # Try JSON first
        import json

        try:
            parsed = json.loads(technologies)
            if isinstance(parsed, list):
                return parsed
        except (json.JSONDecodeError, TypeError):
            pass
        # Fall back to comma-separated
        return [t.strip() for t in technologies.split(",") if t.strip()]
    return []


def _create_article_blocks(article, locale, content):
    """Convert legacy content (HTML/Markdown/plain text) into ArticleBlocks.

    This is a simplified converter. For production use, consider using
    a proper HTML parser (BeautifulSoup) or Markdown parser to extract
    structured blocks.
    """
    # Simple approach: create one paragraph block with the full content
    # For a more sophisticated approach, parse HTML into heading/paragraph blocks
    paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]

    if not paragraphs:
        paragraphs = [content]

    for i, para in enumerate(paragraphs):
        block_type = "paragraph"
        block_content = {"text": para}

        # Simple heuristic: if line starts with # or is short + bold-like, treat as heading
        if para.startswith("#"):
            block_type = "heading"
            level = min(para.count("#", 0, 6), 6)
            block_content = {"text": para.lstrip("#").strip(), "level": level}
        elif para.startswith("<h") and ">" in para:
            block_type = "heading"
            block_content = {"text": _strip_html(para), "level": 2}

        ArticleBlock.objects.create(
            article=article,
            locale=locale,
            block_type=block_type,
            content=block_content,
            ordering=i,
        )


def _create_case_study_blocks(case_study, locale, content):
    """Convert legacy portfolio content into CaseStudyBlocks."""
    paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]

    if not paragraphs:
        paragraphs = [content]

    for i, para in enumerate(paragraphs):
        CaseStudyBlock.objects.create(
            case_study=case_study,
            locale=locale,
            block_type="paragraph",
            content={"text": para},
            ordering=i,
        )


def _import_article_topics(cursor, legacy_article_id, article, topic_map):
    """Import topic associations for an article from a junction table."""
    try:
        cursor.execute(
            """
            SELECT category_id FROM article_categories
            WHERE article_id = %s
            """,
            (legacy_article_id,),
        )
        for (topic_id,) in cursor.fetchall():
            topic = topic_map.get(topic_id)
            if topic:
                article.topics.add(topic)
    except psycopg2.Error:
        cursor.connection.rollback()


def _strip_html(text):
    """Naively strip HTML tags from text."""
    import re

    return re.sub(r"<[^>]+>", "", text).strip()


# ---------------------------------------------------------------------------
# Main execution
# ---------------------------------------------------------------------------


def main():
    """Run the full legacy data import."""
    print("=" * 60)
    print("Legacy Data Import — TahaMohamadi.ir")
    print("=" * 60)
    print(f"Legacy DB: {LEGACY_DB_CONFIG['dbname']}@{LEGACY_DB_CONFIG['host']}:{LEGACY_DB_CONFIG['port']}")
    print()

    conn = get_legacy_connection()
    cursor = conn.cursor()

    try:
        media_map = import_media(cursor)
        topic_map = import_topics(cursor)
        import_articles(cursor, topic_map, media_map)
        import_pages(cursor)
        import_portfolio(cursor, media_map)
    finally:
        cursor.close()
        conn.close()

    print("\n" + "=" * 60)
    print("Import complete!")
    print("=" * 60)
    print("\nNotes:")
    print("  - Media files must be copied separately to the media directory")
    print("  - Review imported content for formatting issues")
    print("  - Run 'python manage.py check' to verify model integrity")
    print("  - Consider running content sanitization on imported HTML")


if __name__ == "__main__":
    main()
