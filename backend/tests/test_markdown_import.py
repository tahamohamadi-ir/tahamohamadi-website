"""Tests for blog.services.import_markdown (Requirement 6.6).

Covers:
- Heading parsing at all levels
- Paragraph parsing
- Blockquote parsing
- Code block parsing with language detection
- Unordered and ordered list parsing
- Divider parsing (--- and ***)
- Image parsing with warning
- HTML detection and skipping
- Table detection with fallback and warning
- Footnote detection and warning
- Task list fallback with warning
- Complex inline link warning
- Ordering consistency
- Empty input handling
"""

import pytest

from apps.blog.services import import_markdown


class TestHeadings:
    """Test heading block generation."""

    def test_h1(self):
        blocks, warnings = import_markdown("# Hello World", "en")
        assert len(blocks) == 1
        assert blocks[0]["block_type"] == "heading"
        assert blocks[0]["content"] == {"text": "Hello World", "level": 1}
        assert blocks[0]["locale"] == "en"
        assert blocks[0]["ordering"] == 1
        assert warnings == []

    def test_h2(self):
        blocks, _ = import_markdown("## Subtitle", "en")
        assert blocks[0]["content"] == {"text": "Subtitle", "level": 2}

    def test_h3(self):
        blocks, _ = import_markdown("### Section", "fa")
        assert blocks[0]["content"] == {"text": "Section", "level": 3}
        assert blocks[0]["locale"] == "fa"

    def test_h6(self):
        blocks, _ = import_markdown("###### Deep", "en")
        assert blocks[0]["content"] == {"text": "Deep", "level": 6}

    def test_multiple_headings(self):
        md = "# Title\n\n## Subtitle\n\n### Section"
        blocks, _ = import_markdown(md, "en")
        assert len(blocks) == 3
        assert blocks[0]["content"]["level"] == 1
        assert blocks[1]["content"]["level"] == 2
        assert blocks[2]["content"]["level"] == 3


class TestParagraphs:
    """Test paragraph block generation."""

    def test_single_paragraph(self):
        blocks, _ = import_markdown("Hello world, this is a test.", "en")
        assert len(blocks) == 1
        assert blocks[0]["block_type"] == "paragraph"
        assert blocks[0]["content"] == {"text": "Hello world, this is a test."}

    def test_multiline_paragraph(self):
        md = "Line one\nLine two\nLine three"
        blocks, _ = import_markdown(md, "en")
        assert len(blocks) == 1
        assert "Line one\nLine two\nLine three" == blocks[0]["content"]["text"]

    def test_multiple_paragraphs(self):
        md = "First paragraph.\n\nSecond paragraph."
        blocks, _ = import_markdown(md, "en")
        assert len(blocks) == 2
        assert blocks[0]["content"]["text"] == "First paragraph."
        assert blocks[1]["content"]["text"] == "Second paragraph."

    def test_paragraph_with_inline_formatting(self):
        md = "This has **bold** and *italic* text."
        blocks, _ = import_markdown(md, "en")
        assert blocks[0]["content"]["text"] == "This has **bold** and *italic* text."


class TestBlockquotes:
    """Test blockquote/quote block generation."""

    def test_single_line_quote(self):
        blocks, _ = import_markdown("> This is a quote", "en")
        assert len(blocks) == 1
        assert blocks[0]["block_type"] == "quote"
        assert blocks[0]["content"] == {"text": "This is a quote"}

    def test_multiline_quote(self):
        md = "> Line one\n> Line two\n> Line three"
        blocks, _ = import_markdown(md, "en")
        assert len(blocks) == 1
        assert blocks[0]["content"]["text"] == "Line one\nLine two\nLine three"

    def test_quote_with_empty_prefix(self):
        md = "> First line\n>\n> Third line"
        blocks, _ = import_markdown(md, "en")
        assert blocks[0]["block_type"] == "quote"


class TestCodeBlocks:
    """Test fenced code block generation."""

    def test_code_block_with_language(self):
        md = "```python\ndef hello():\n    print('hi')\n```"
        blocks, _ = import_markdown(md, "en")
        assert len(blocks) == 1
        assert blocks[0]["block_type"] == "code"
        assert blocks[0]["content"]["language"] == "python"
        assert blocks[0]["content"]["code"] == "def hello():\n    print('hi')"

    def test_code_block_without_language(self):
        md = "```\nsome code\n```"
        blocks, _ = import_markdown(md, "en")
        assert blocks[0]["content"]["language"] == ""
        assert blocks[0]["content"]["code"] == "some code"

    def test_code_block_with_multiple_lines(self):
        md = "```js\nconst x = 1;\nconst y = 2;\nreturn x + y;\n```"
        blocks, _ = import_markdown(md, "en")
        assert blocks[0]["content"]["code"] == "const x = 1;\nconst y = 2;\nreturn x + y;"
        assert blocks[0]["content"]["language"] == "js"


class TestLists:
    """Test list block generation."""

    def test_unordered_list_dash(self):
        md = "- Item one\n- Item two\n- Item three"
        blocks, _ = import_markdown(md, "en")
        assert len(blocks) == 1
        assert blocks[0]["block_type"] == "list"
        assert blocks[0]["content"]["items"] == ["Item one", "Item two", "Item three"]
        assert blocks[0]["content"]["ordered"] is False

    def test_unordered_list_asterisk(self):
        md = "* First\n* Second"
        blocks, _ = import_markdown(md, "en")
        assert blocks[0]["block_type"] == "list"
        assert blocks[0]["content"]["ordered"] is False

    def test_ordered_list(self):
        md = "1. First\n2. Second\n3. Third"
        blocks, _ = import_markdown(md, "en")
        assert len(blocks) == 1
        assert blocks[0]["block_type"] == "list"
        assert blocks[0]["content"]["items"] == ["First", "Second", "Third"]
        assert blocks[0]["content"]["ordered"] is True


class TestDividers:
    """Test divider/horizontal rule block generation."""

    def test_dashes(self):
        blocks, _ = import_markdown("---", "en")
        assert len(blocks) == 1
        assert blocks[0]["block_type"] == "divider"
        assert blocks[0]["content"] == {"style": "line"}

    def test_asterisks(self):
        blocks, _ = import_markdown("***", "en")
        assert blocks[0]["block_type"] == "divider"

    def test_underscores(self):
        blocks, _ = import_markdown("___", "en")
        assert blocks[0]["block_type"] == "divider"

    def test_long_dashes(self):
        blocks, _ = import_markdown("----------", "en")
        assert blocks[0]["block_type"] == "divider"


class TestImages:
    """Test image block generation with warnings."""

    def test_image_basic(self):
        md = "![Alt text](https://example.com/image.png)"
        blocks, warnings = import_markdown(md, "en")
        assert len(blocks) == 1
        assert blocks[0]["block_type"] == "image"
        assert blocks[0]["content"]["url"] == "https://example.com/image.png"
        assert blocks[0]["content"]["alt"] == "Alt text"
        assert len(warnings) == 1
        assert "not linked to media library" in warnings[0]

    def test_image_empty_alt(self):
        md = "![](https://example.com/img.jpg)"
        blocks, warnings = import_markdown(md, "en")
        assert blocks[0]["content"]["alt"] == ""
        assert len(warnings) == 1


class TestUnsupportedSyntax:
    """Test warning generation for unsupported elements."""

    def test_html_inline(self):
        md = "<div>Some content</div>"
        blocks, warnings = import_markdown(md, "en")
        assert len(blocks) == 0
        assert len(warnings) == 1
        assert "Inline HTML" in warnings[0]

    def test_html_table_tag(self):
        md = "<table><tr><td>Cell</td></tr></table>"
        blocks, warnings = import_markdown(md, "en")
        assert len(warnings) == 1
        assert "HTML" in warnings[0]

    def test_markdown_table(self):
        md = "| Col1 | Col2 |\n|------|------|\n| A    | B    |"
        blocks, warnings = import_markdown(md, "en")
        assert len(warnings) == 1
        assert "table" in warnings[0].lower()
        # Should have a fallback paragraph
        assert any(b["block_type"] == "paragraph" for b in blocks)

    def test_footnote(self):
        md = "[^1]: This is a footnote."
        blocks, warnings = import_markdown(md, "en")
        assert len(blocks) == 0
        assert len(warnings) == 1
        assert "Footnote" in warnings[0]

    def test_task_list(self):
        md = "- [ ] Todo item\n- [x] Done item"
        blocks, warnings = import_markdown(md, "en")
        assert len(blocks) == 1
        assert blocks[0]["block_type"] == "list"
        assert blocks[0]["content"]["ordered"] is False
        assert "Todo item" in blocks[0]["content"]["items"]
        assert "Done item" in blocks[0]["content"]["items"]
        assert len(warnings) == 1
        assert "Task list" in warnings[0]

    def test_complex_inline_link(self):
        md = 'Check [this link](https://example.com "Title") for details.'
        blocks, warnings = import_markdown(md, "en")
        assert len(blocks) == 1
        assert blocks[0]["block_type"] == "paragraph"
        assert len(warnings) == 1
        assert "Complex inline link" in warnings[0]


class TestOrdering:
    """Test that ordering is consistently incremented."""

    def test_ordering_increments(self):
        md = "# Title\n\nParagraph text.\n\n> A quote\n\n---"
        blocks, _ = import_markdown(md, "en")
        assert len(blocks) == 4
        orderings = [b["ordering"] for b in blocks]
        assert orderings == [1, 2, 3, 4]


class TestEdgeCases:
    """Test edge cases and empty input."""

    def test_empty_string(self):
        blocks, warnings = import_markdown("", "en")
        assert blocks == []
        assert warnings == []

    def test_whitespace_only(self):
        blocks, warnings = import_markdown("   \n\n  \n", "en")
        assert blocks == []
        assert warnings == []

    def test_locale_propagation(self):
        blocks, _ = import_markdown("# Hello", "fa")
        assert blocks[0]["locale"] == "fa"

    def test_mixed_content(self):
        md = """# Article Title

This is the introduction paragraph.

## Section 1

> An important quote

- Item one
- Item two

---

```python
print("hello")
```

![Photo](https://example.com/photo.jpg)

1. First step
2. Second step
"""
        blocks, warnings = import_markdown(md, "en")

        # Should parse all elements
        types = [b["block_type"] for b in blocks]
        assert "heading" in types
        assert "paragraph" in types
        assert "quote" in types
        assert "list" in types
        assert "divider" in types
        assert "code" in types
        assert "image" in types

        # Ordering should be contiguous
        orderings = [b["ordering"] for b in blocks]
        assert orderings == list(range(1, len(blocks) + 1))

        # Image warning should be present
        assert any("not linked to media library" in w for w in warnings)
