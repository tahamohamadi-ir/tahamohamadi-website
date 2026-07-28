"""Tests for the optimistic locking service.

Tests are split into:
- Unit tests for ConflictError (no DB needed)
- Integration tests for save_with_optimistic_lock (require PostgreSQL with
  SELECT FOR UPDATE support, marked with django_db transaction=True)
"""

import pytest

from apps.core.services import ConflictError, save_with_optimistic_lock


# ---------------------------------------------------------------------------
# Unit tests — ConflictError
# ---------------------------------------------------------------------------


class TestConflictError:
    """Verify ConflictError stores version and produces a clear message."""

    def test_stores_current_version(self):
        err = ConflictError(current_version=5)
        assert err.current_version == 5

    def test_message_contains_version(self):
        err = ConflictError(current_version=3)
        assert "3" in str(err)
        assert "conflict" in str(err).lower()

    def test_is_an_exception(self):
        err = ConflictError(current_version=1)
        assert isinstance(err, Exception)

    def test_can_be_raised_and_caught(self):
        with pytest.raises(ConflictError) as exc_info:
            raise ConflictError(current_version=7)
        assert exc_info.value.current_version == 7


# ---------------------------------------------------------------------------
# Integration tests — save_with_optimistic_lock (require PostgreSQL)
# ---------------------------------------------------------------------------


@pytest.mark.django_db(transaction=True)
class TestSaveWithOptimisticLock:
    """Integration tests for save_with_optimistic_lock.

    These require a running PostgreSQL database because they use
    SELECT FOR UPDATE. They will be skipped if using SQLite.
    """

    @pytest.fixture
    def page(self):
        """Create a test Page instance for locking tests."""
        from apps.cms.models import Page

        return Page.objects.create(
            slug_fa="قفل-تست",
            slug_en="test-lock-page",
            title_fa="تست قفل",
            title_en="Lock Test",
            page_type="custom",
            status="draft",
        )

    def test_successful_save_when_version_matches(self, page):
        """When incoming_version matches, data is applied and version increments."""
        updated = save_with_optimistic_lock(
            instance=page,
            incoming_version=page.version,
            data={"title_en": "updated-title"},
        )
        assert updated.title_en == "updated-title"
        assert updated.version == page.version + 1

    def test_conflict_error_when_version_mismatch(self, page):
        """When incoming_version doesn't match, ConflictError is raised."""
        wrong_version = page.version + 99
        with pytest.raises(ConflictError) as exc_info:
            save_with_optimistic_lock(
                instance=page,
                incoming_version=wrong_version,
                data={"title_en": "should-not-apply"},
            )
        assert exc_info.value.current_version == page.version

    def test_version_incremented_after_save(self, page):
        """Version field is incremented by exactly 1 after a successful save."""
        original_version = page.version
        updated = save_with_optimistic_lock(
            instance=page,
            incoming_version=original_version,
            data={"status": "published"},
        )
        assert updated.version == original_version + 1

    def test_data_fields_applied_correctly(self, page):
        """All fields in the data dict are applied to the instance."""
        updated = save_with_optimistic_lock(
            instance=page,
            incoming_version=page.version,
            data={"title_en": "new-title", "status": "published"},
        )
        assert updated.title_en == "new-title"
        assert updated.status == "published"
