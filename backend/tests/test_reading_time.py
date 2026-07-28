"""Tests for blog reading time calculation (Requirement 6.5).

Tests cover:
- Word extraction from different block types
- Reading time calculation for Persian and English
- Minimum 1 minute guarantee
- Rounding up behavior
- Locale filtering
- Empty/edge cases
- Integration with Article model
"""

import pytest

from apps.blog.services import (
    READING_SPEED_EN,
    READING_SPEED_FA,
    _count_words,
    _extract_text_from_block,
    calculate_reading_time,
    update_article_reading_times,
)


# --- Unit tests for _extract_text_from_block ---


class TestExtractTextFromBlock:
    def test_paragraph_block(self):
        block = {"block_type": "paragraph", "content": {"text": "Hello world"}}
        assert _extract_text_from_block(block) == "Hello world"

    def test_heading_block(self):
        block = {"block_type": "heading", "content": {"text": "Chapter 1", "level": 1}}
        assert _extract_text_from_block(block) == "Chapter 1"

    def test_list_block(self):
        block = {
            "block_type": "list",
            "content": {"items": ["Item one", "Item two", "Item three"], "ordered": True},
        }
        assert _extract_text_from_block(block) == "Item one Item two Item three"

    def test_quote_block_with_attribution(self):
        block = {
            "block_type": "quote",
            "content": {"text": "To be or not to be", "attribution": "Shakespeare"},
        }
        assert _extract_text_from_block(block) == "To be or not to be Shakespeare"

    def test_callout_block(self):
        block = {
            "block_type": "callout",
            "content": {"text": "Important notice here", "type": "warning"},
        }
        assert _extract_text_from_block(block) == "Important notice here"

    def test_caption_block(self):
        block = {"block_type": "caption", "content": {"text": "Figure 1: Example"}}
        assert _extract_text_from_block(block) == "Figure 1: Example"

    def test_empty_content(self):
        block = {"block_type": "paragraph", "content": {}}
        assert _extract_text_from_block(block) == ""

    def test_missing_content_key(self):
        block = {"block_type": "paragraph"}
        assert _extract_text_from_block(block) == ""

    def test_non_dict_content(self):
        block = {"block_type": "paragraph", "content": "not a dict"}
        assert _extract_text_from_block(block) == ""

    def test_list_with_non_string_items(self):
        block = {
            "block_type": "list",
            "content": {"items": ["valid", 123, None, "also valid"], "ordered": False},
        }
        # Only string items are extracted
        assert _extract_text_from_block(block) == "valid also valid"

    def test_list_with_empty_items(self):
        block = {"block_type": "list", "content": {"items": [], "ordered": False}}
        assert _extract_text_from_block(block) == ""

    def test_quote_without_attribution(self):
        block = {"block_type": "quote", "content": {"text": "Just a quote"}}
        assert _extract_text_from_block(block) == "Just a quote"


# --- Unit tests for _count_words ---


class TestCountWords:
    def test_english_sentence(self):
        assert _count_words("The quick brown fox") == 4

    def test_persian_sentence(self):
        assert _count_words("سلام دنیا خوب است") == 4

    def test_empty_string(self):
        assert _count_words("") == 0

    def test_whitespace_only(self):
        assert _count_words("   \t\n  ") == 0

    def test_single_word(self):
        assert _count_words("hello") == 1

    def test_multiple_spaces(self):
        assert _count_words("hello    world") == 2

    def test_none_input(self):
        assert _count_words(None) == 0


# --- Unit tests for calculate_reading_time ---


class TestCalculateReadingTime:
    def test_english_200_words(self):
        """200 English words should take exactly 1 minute."""
        text = " ".join(["word"] * 200)
        blocks = [
            {"locale": "en", "block_type": "paragraph", "content": {"text": text}}
        ]
        assert calculate_reading_time(blocks, "en") == 1

    def test_english_201_words(self):
        """201 English words should round up to 2 minutes."""
        text = " ".join(["word"] * 201)
        blocks = [
            {"locale": "en", "block_type": "paragraph", "content": {"text": text}}
        ]
        assert calculate_reading_time(blocks, "en") == 2

    def test_persian_180_words(self):
        """180 Persian words should take exactly 1 minute."""
        text = " ".join(["کلمه"] * 180)
        blocks = [
            {"locale": "fa", "block_type": "paragraph", "content": {"text": text}}
        ]
        assert calculate_reading_time(blocks, "fa") == 1

    def test_persian_181_words(self):
        """181 Persian words should round up to 2 minutes."""
        text = " ".join(["کلمه"] * 181)
        blocks = [
            {"locale": "fa", "block_type": "paragraph", "content": {"text": text}}
        ]
        assert calculate_reading_time(blocks, "fa") == 2

    def test_minimum_one_minute(self):
        """Even a single word should return 1 minute."""
        blocks = [
            {"locale": "en", "block_type": "paragraph", "content": {"text": "hello"}}
        ]
        assert calculate_reading_time(blocks, "en") == 1

    def test_no_text_blocks_returns_zero(self):
        """If no text-bearing blocks exist, return 0."""
        blocks = [
            {"locale": "en", "block_type": "code", "content": {"code": "print('hi')", "language": "python"}},
            {"locale": "en", "block_type": "image", "content": {"url": "/img.png"}},
            {"locale": "en", "block_type": "divider", "content": {}},
        ]
        assert calculate_reading_time(blocks, "en") == 0

    def test_empty_blocks_list(self):
        """Empty blocks list returns 0."""
        assert calculate_reading_time([], "en") == 0

    def test_filters_by_locale(self):
        """Only blocks matching the locale are counted."""
        blocks = [
            {"locale": "en", "block_type": "paragraph", "content": {"text": " ".join(["word"] * 400)}},
            {"locale": "fa", "block_type": "paragraph", "content": {"text": "تنها یک کلمه"}},
        ]
        # English: 400 words / 200 wpm = 2 minutes
        assert calculate_reading_time(blocks, "en") == 2
        # Persian: 3 words / 180 wpm = ceil(0.0167) = 1 minute
        assert calculate_reading_time(blocks, "fa") == 1

    def test_multiple_text_blocks_combined(self):
        """Words from all text-bearing blocks are combined."""
        blocks = [
            {"locale": "en", "block_type": "paragraph", "content": {"text": " ".join(["word"] * 100)}},
            {"locale": "en", "block_type": "heading", "content": {"text": " ".join(["title"] * 50), "level": 2}},
            {"locale": "en", "block_type": "quote", "content": {"text": " ".join(["quote"] * 50)}},
            {"locale": "en", "block_type": "list", "content": {"items": [" ".join(["item"] * 10)] * 5}},
        ]
        # 100 + 50 + 50 + 50 = 250 words / 200 wpm = ceil(1.25) = 2
        assert calculate_reading_time(blocks, "en") == 2

    def test_skips_code_blocks(self):
        """Code blocks are not counted toward reading time."""
        blocks = [
            {"locale": "en", "block_type": "paragraph", "content": {"text": "short"}},
            {"locale": "en", "block_type": "code", "content": {"code": " ".join(["x"] * 1000), "language": "python"}},
        ]
        # Only 1 word from paragraph
        assert calculate_reading_time(blocks, "en") == 1

    def test_skips_image_gallery_divider_reference(self):
        """Non-text block types are skipped."""
        blocks = [
            {"locale": "en", "block_type": "image", "content": {"url": "/img.png"}},
            {"locale": "en", "block_type": "gallery", "content": {"media_ids": []}},
            {"locale": "en", "block_type": "divider", "content": {}},
            {"locale": "en", "block_type": "reference", "content": {"doi": "10.1234"}},
        ]
        assert calculate_reading_time(blocks, "en") == 0

    def test_large_article_reading_time(self):
        """A 1000-word English article should take 5 minutes."""
        text = " ".join(["word"] * 1000)
        blocks = [
            {"locale": "en", "block_type": "paragraph", "content": {"text": text}}
        ]
        assert calculate_reading_time(blocks, "en") == 5

    def test_large_persian_article(self):
        """A 900-word Persian article should take 5 minutes."""
        text = " ".join(["کلمه"] * 900)
        blocks = [
            {"locale": "fa", "block_type": "paragraph", "content": {"text": text}}
        ]
        # 900 / 180 = 5.0 exactly
        assert calculate_reading_time(blocks, "fa") == 5


# --- Integration test for update_article_reading_times ---


@pytest.mark.django_db
class TestUpdateArticleReadingTimes:
    def test_updates_both_locales(self):
        """update_article_reading_times calculates and saves reading times."""
        from apps.blog.models import Article, ArticleBlock

        article = Article.objects.create(
            slug_fa="تست-مقاله",
            slug_en="test-article",
            title_fa="مقاله تست",
            title_en="Test Article",
            status="draft",
        )

        # Create 400 words of English content (400/200 = 2 min)
        ArticleBlock.objects.create(
            article=article,
            locale="en",
            block_type="paragraph",
            content={"text": " ".join(["word"] * 400)},
            ordering=1,
        )

        # Create 360 words of Persian content (360/180 = 2 min)
        ArticleBlock.objects.create(
            article=article,
            locale="fa",
            block_type="paragraph",
            content={"text": " ".join(["کلمه"] * 360)},
            ordering=1,
        )

        update_article_reading_times(article)

        article.refresh_from_db()
        assert article.reading_time_en == 2
        assert article.reading_time_fa == 2

    def test_zero_when_no_blocks(self):
        """Article with no blocks has 0 reading time."""
        from apps.blog.models import Article

        article = Article.objects.create(
            slug_fa="خالی",
            slug_en="empty",
            title_fa="خالی",
            title_en="Empty",
            status="draft",
        )

        update_article_reading_times(article)

        article.refresh_from_db()
        assert article.reading_time_en == 0
        assert article.reading_time_fa == 0

    def test_only_counts_text_bearing_blocks(self):
        """Code and image blocks don't contribute to reading time."""
        from apps.blog.models import Article, ArticleBlock

        article = Article.objects.create(
            slug_fa="کد-مقاله",
            slug_en="code-article",
            title_fa="مقاله کد",
            title_en="Code Article",
            status="draft",
        )

        # Short paragraph (1 word)
        ArticleBlock.objects.create(
            article=article,
            locale="en",
            block_type="paragraph",
            content={"text": "hello"},
            ordering=1,
        )

        # Large code block (should not count)
        ArticleBlock.objects.create(
            article=article,
            locale="en",
            block_type="code",
            content={"code": " ".join(["x"] * 5000), "language": "python"},
            ordering=2,
        )

        update_article_reading_times(article)

        article.refresh_from_db()
        assert article.reading_time_en == 1  # minimum 1 minute for the paragraph word
        assert article.reading_time_fa == 0  # no fa blocks at all
