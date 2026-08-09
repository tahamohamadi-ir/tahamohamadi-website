"""Blog views.

Provides:
- ``AdminArticleViewSet`` — ModelViewSet for CRUD operations on Articles.
- ``AdminTopicViewSet`` — ModelViewSet for CRUD operations on Topics.

Auth/CSRF enforcement: DRF defaults (SessionAuthentication + IsAuthenticated)
are applied globally.

Requirements: 1.3, 6.1
"""

from __future__ import annotations

from django.db.models import Q
from rest_framework import status
from rest_framework.filters import SearchFilter
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from django_filters.rest_framework import DjangoFilterBackend

from apps.blog.models import Article, Topic
from apps.media.models import MediaAsset
from apps.blog.serializers import (
    ArticleListSerializer,
    ArticleSerializer,
    PublicArticleListSerializer,
    PublicArticleSerializer,
    TopicSerializer,
)
from apps.blog.services import (
    generate_toc,
    sanitize_article_blocks,
    update_article_reading_times,
    validate_article_content,
)
from apps.core.exceptions import build_problem, PROBLEM_CONTENT_TYPE
from apps.core.services import ConflictError, save_with_optimistic_lock


def _active_media_ids() -> set[str]:
    return {
        str(media_id)
        for media_id in MediaAsset.objects.filter(status="active").values_list(
            "id", flat=True
        )
    }


class AdminArticleViewSet(ModelViewSet):
    """Admin CRUD for blog articles with nested blocks.

    - list: paginated, search by title/slug, filter by status/topics
    - retrieve: full article with nested blocks
    - create: validate + sanitize blocks, calculate reading times, save
    - update: optimistic locking (version check), validate + sanitize,
              recalculate reading times
    - delete: standard destroy

    Requirements: 1.3, 6.1
    """

    queryset = Article.objects.prefetch_related("blocks", "topics").all()
    filterset_fields = ["status", "topics"]
    search_fields = ["title_fa", "title_en", "slug_fa", "slug_en"]
    filter_backends = [DjangoFilterBackend, SearchFilter]

    def get_serializer_class(self):
        if self.action == "list":
            return ArticleListSerializer
        return ArticleSerializer

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Validate and sanitize blocks before persisting
        blocks_data = request.data.get("blocks", [])
        content_errors = validate_article_content(
            blocks_data, known_media_ids=_active_media_ids()
        )
        if content_errors:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                "Article content validation failed.",
                instance=request.path,
                errors={"content": content_errors},
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Sanitize blocks (strip HTML tags, etc.)
        sanitized_blocks, _warnings = sanitize_article_blocks(blocks_data)

        # Replace blocks in serializer's validated data with sanitized version
        serializer.validated_data["blocks"] = sanitized_blocks

        self.perform_create(serializer)

        # Recalculate reading times after blocks are saved
        article = serializer.instance
        update_article_reading_times(article)

        # Re-serialize to include updated reading times
        output_serializer = self.get_serializer(article)
        headers = self.get_success_headers(output_serializer.data)
        return Response(
            output_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    # ------------------------------------------------------------------
    # Update (with optimistic locking)
    # ------------------------------------------------------------------

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # Validate and sanitize blocks before persisting
        blocks_data = request.data.get("blocks", [])
        content_errors = validate_article_content(
            blocks_data, known_media_ids=_active_media_ids()
        )
        if content_errors:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                "Article content validation failed.",
                instance=request.path,
                errors={"content": content_errors},
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Sanitize blocks
        sanitized_blocks, _warnings = sanitize_article_blocks(blocks_data)
        serializer.validated_data["blocks"] = sanitized_blocks

        # Extract version for optimistic locking
        incoming_version = serializer.validated_data.get("version")
        if incoming_version is None:
            problem = build_problem(
                status.HTTP_400_BAD_REQUEST,
                "Field 'version' is required for updates (optimistic locking).",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_400_BAD_REQUEST,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Optimistic locking: check version
        try:
            save_with_optimistic_lock(instance, incoming_version, {})
        except ConflictError as exc:
            problem = build_problem(
                status.HTTP_409_CONFLICT,
                str(exc),
                instance=request.path,
                extra={"current_version": exc.current_version},
            )
            return Response(
                problem,
                status=status.HTTP_409_CONFLICT,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Version check passed — perform the actual serializer update.
        # Reload instance to get the incremented version from optimistic lock.
        instance.refresh_from_db()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.validated_data["blocks"] = sanitized_blocks
        self.perform_update(serializer)

        # Recalculate reading times after blocks are updated
        article = serializer.instance
        update_article_reading_times(article)

        # Re-serialize to include updated reading times
        output_serializer = self.get_serializer(article)
        return Response(output_serializer.data)


class AdminTopicViewSet(ModelViewSet):
    """Admin CRUD for blog topics.

    - list: all topics, searchable by name
    - retrieve/create/update/delete: standard CRUD

    Requirements: 1.3, 6.1
    """

    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    search_fields = ["name_fa", "name_en"]
    filter_backends = [SearchFilter]


# ---------------------------------------------------------------------------
# Public Views (anonymous)
# ---------------------------------------------------------------------------


class PublicArticleListView(ListAPIView):
    """Public endpoint: list published articles with pagination and topic filter.

    Query parameters:
        locale: "en" (default) or "fa" — passed to serializer context.
        topic: topic slug — filters articles by topic.

    Returns paginated list of published articles ordered by -published_at.

    Requirements: 6.10, 1.3
    """

    permission_classes = [AllowAny]
    authentication_classes: list = []
    serializer_class = PublicArticleListSerializer

    def get_queryset(self):
        qs = Article.objects.filter(status="published").order_by("-published_at")
        qs = qs.prefetch_related("topics", "featured_image")

        # Filter by topic slug
        topic_slug = self.request.query_params.get("topic")
        if topic_slug:
            qs = qs.filter(topics__slug=topic_slug)

        query = self.request.query_params.get("q", "").strip()
        if query:
            qs = qs.filter(
                Q(title_fa__icontains=query)
                | Q(title_en__icontains=query)
                | Q(excerpt_fa__icontains=query)
                | Q(excerpt_en__icontains=query)
                | Q(slug_fa__icontains=query)
                | Q(slug_en__icontains=query)
            )

        return qs.distinct()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["locale"] = self.request.query_params.get("locale", "en")
        return context


class PublicTopicListView(ListAPIView):
    """Public endpoint: list topics used by at least one published article."""

    permission_classes = [AllowAny]
    authentication_classes: list = []
    pagination_class = None
    serializer_class = TopicSerializer

    def get_queryset(self):
        return (
            Topic.objects.filter(articles__status="published")
            .order_by("slug")
            .distinct()
        )


class PublicArticleDetailView(APIView):
    """Public endpoint: retrieve a published article by slug.

    Looks up the article by slug using the locale to determine which slug
    field to match (slug_en or slug_fa).

    Includes:
        - Full article data via PublicArticleSerializer
        - TOC generated from heading blocks
        - Up to 3 related articles (same topics, published, excluding self)

    Query parameters:
        locale: "en" (default) or "fa"

    Requirements: 6.10, 1.3
    """

    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request, slug: str):
        locale = request.query_params.get("locale", "en")

        # Locale-aware slug lookup
        if locale == "fa":
            article = (
                Article.objects.filter(slug_fa=slug, status="published")
                .prefetch_related("blocks", "topics", "featured_image")
                .first()
            )
        else:
            article = (
                Article.objects.filter(slug_en=slug, status="published")
                .prefetch_related("blocks", "topics", "featured_image")
                .first()
            )

        if not article:
            problem = build_problem(
                status.HTTP_404_NOT_FOUND,
                "Article not found or not published.",
                instance=request.path,
            )
            return Response(
                problem,
                status=status.HTTP_404_NOT_FOUND,
                content_type=PROBLEM_CONTENT_TYPE,
            )

        # Serialize the article
        serializer = PublicArticleSerializer(article, context={"locale": locale})
        data = serializer.data

        # Generate TOC only from the validated public block projection.
        data["toc"] = generate_toc(data["blocks"], locale)

        # Related articles: same topics, published, excluding self, max 3
        topic_ids = article.topics.values_list("id", flat=True)
        related_qs = (
            Article.objects.filter(
                status="published",
                topics__id__in=topic_ids,
            )
            .exclude(id=article.id)
            .distinct()
            .order_by("-published_at")[:3]
        )
        related_qs = related_qs.prefetch_related("topics", "featured_image")
        data["related"] = PublicArticleListSerializer(
            related_qs, many=True, context={"locale": locale}
        ).data

        return Response(data)
