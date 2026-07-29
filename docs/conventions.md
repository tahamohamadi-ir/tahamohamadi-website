# قراردادهای کدنویسی — TahaMohamadi.ir

> **نسخه:** 1.0  
> **آخرین بروزرسانی:** 2025-07

---

## 1. Git Workflow

### Commit Conventions (Conventional Commits)

```
<type>(<scope>): <description>

feat(cms): add block reordering API
fix(media): prevent duplicate upload on retry
docs(readme): update development setup instructions
refactor(blog): extract article service from views
test(portfolio): add integration tests for project CRUD
chore(deps): upgrade Django to 5.1.3
```

| Type | Usage |
|------|-------|
| `feat` | Feature جدید |
| `fix` | Bug fix |
| `docs` | فقط documentation |
| `refactor` | تغییر code بدون تغییر behavior |
| `test` | اضافه/تغییر test |
| `chore` | Build, CI, deps |
| `style` | Formatting (no logic change) |
| `perf` | Performance improvement |

### Branch Naming

```
feat/cms-block-reordering
fix/media-upload-duplicate
docs/api-documentation
refactor/blog-service-layer
```

### Workflow

1. از `main` branch بسازید
2. Small, focused commits (هر commit یک تغییر logical)
3. PR به `main` — هرگز مستقیم push نکنید
4. PR title = commit message format
5. Squash merge preferred

---

## 2. Python / Django Conventions

### Code Style

- **Formatter:** `ruff format` (Black-compatible)
- **Linter:** `ruff check`
- **Import sorting:** `ruff` isort rules
- **Line length:** 88 characters
- **Quotes:** Double quotes (`"`)

### Naming

| Element | Convention | Example |
|---------|------------|---------|
| App name | lowercase singular | `cms`, `blog`, `media` |
| Model | PascalCase | `BlogArticle`, `MediaAsset` |
| Field | snake_case | `created_at`, `title_fa` |
| Service function | snake_case verb | `create_page()`, `publish_article()` |
| Serializer | `{Model}Serializer` | `PageSerializer`, `ArticleListSerializer` |
| View | `{Model}ViewSet` | `PageViewSet` |
| URL prefix | kebab-case | `/api/admin/blog-articles/` |
| Test file | `test_{module}.py` | `test_services.py` |
| Fixture | `{noun}_{state}` | `article_published`, `user_admin` |

### Service Layer Pattern

```python
# ✅ درست — logic در service
# services.py
def create_page(*, data: dict, user: User) -> Page:
    """Create a new CMS page with validation."""
    validate_page_data(data)
    page = Page.objects.create(**data, created_by=user)
    log_audit_event(user=user, action="page.create", target=page)
    return page

# views.py — thin، فقط orchestration
class PageViewSet(viewsets.ModelViewSet):
    def create(self, request):
        serializer = PageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        page = create_page(data=serializer.validated_data, user=request.user)
        return Response(PageSerializer(page).data, status=201)
```

```python
# ❌ غلط — logic در view
class PageViewSet(viewsets.ModelViewSet):
    def create(self, request):
        # business logic should NOT be here
        page = Page.objects.create(...)
        AuditLog.objects.create(...)
        return Response(...)
```

### Serializer Patterns

```python
# Input serializer (DTO)
class PageCreateSerializer(serializers.Serializer):
    title_fa = serializers.CharField(max_length=200)
    title_en = serializers.CharField(max_length=200)
    slug_fa = serializers.SlugField()
    slug_en = serializers.SlugField()

# Output serializer (DTO)
class PageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = ["id", "title_fa", "title_en", "slug_fa", "slug_en", "status", "version"]
```

---

## 3. TypeScript / React Conventions

### Code Style

- **Formatter:** Prettier
- **Linter:** ESLint with Next.js config
- **Quotes:** Single quotes for JS/TS, double for JSX attributes
- **Semicolons:** No semicolons
- **Line length:** 100 characters

### File Structure & Naming

| Element | Convention | Example |
|---------|------------|---------|
| Component file | PascalCase | `ArticleCard.tsx` |
| Utility file | camelCase | `formatDate.ts` |
| Hook file | camelCase | `useArticles.ts` |
| Type file | camelCase | `article.types.ts` |
| Page file | `page.tsx` (App Router) | `app/[locale]/blog/page.tsx` |
| Layout file | `layout.tsx` | `app/[locale]/layout.tsx` |

### Component Patterns

```tsx
// ✅ درست — Server Component (default in App Router)
// components/blocks/HeroBlock.tsx
import { type HeroBlockData } from '@/types/blocks'

interface HeroBlockProps {
  data: HeroBlockData
  locale: 'fa' | 'en'
}

export function HeroBlock({ data, locale }: HeroBlockProps) {
  return (
    <section className="py-16 text-center">
      <h1 className="text-4xl font-bold">{data.title}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{data.subtitle}</p>
    </section>
  )
}
```

```tsx
// ✅ درست — Client Component (interactive)
// components/admin/BlockEditor.tsx
'use client'

import { useState } from 'react'

export function BlockEditor({ block, onSave }: BlockEditorProps) {
  const [data, setData] = useState(block.data)
  // ...
}
```

### Hook Patterns

```tsx
// ✅ Custom hook — data fetching
export function useArticles(locale: string) {
  return useQuery({
    queryKey: ['articles', locale],
    queryFn: () => apiClient.get(`/api/public/blog/articles?locale=${locale}`),
  })
}
```

---

## 4. API Conventions

### URL Structure

```
/api/public/{resource}/              # List (GET)
/api/public/{resource}/{id}/         # Detail (GET)
/api/admin/{resource}/               # List (GET) + Create (POST)
/api/admin/{resource}/{id}/          # Detail (GET) + Update (PUT/PATCH) + Delete (DELETE)
```

### Response Format (Success)

```json
// List response
{
  "count": 42,
  "next": "/api/public/blog/articles/?page=2",
  "previous": null,
  "results": [...]
}

// Detail response
{
  "id": "uuid",
  "title_fa": "...",
  "title_en": "...",
  "status": "published",
  "version": 3
}
```

### Error Response (RFC 7807 Problem Details)

```json
{
  "type": "https://tahamohamadi.ir/errors/validation",
  "title": "Validation Error",
  "status": 422,
  "detail": "Field 'title_fa' is required.",
  "instance": "/api/admin/cms/pages/",
  "errors": [
    { "field": "title_fa", "message": "This field is required." }
  ]
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET/PUT/PATCH |
| 201 | Successful POST (created) |
| 204 | Successful DELETE |
| 400 | Bad request (malformed) |
| 401 | Not authenticated |
| 403 | Not authorized (permission denied) |
| 404 | Resource not found |
| 409 | Conflict (optimistic locking) |
| 422 | Validation error |
| 429 | Rate limited |
| 500 | Server error |

---

## 5. CSS / Tailwind Conventions

### قوانین اصلی

1. **Token-first:** هرگز hardcoded color یا spacing استفاده نکنید
2. **Logical properties:** `ms-4` نه `ml-4`، `ps-2` نه `pl-2`
3. **No `!important`:** اگر نیاز شد، مشکل architecture دارید
4. **Component extraction:** فقط وقتی ≥ 3 بار تکرار شد
5. **Responsive mobile-first:** base = mobile، `md:` = tablet، `lg:` = desktop

### Token Consumption

```tsx
// ✅ درست — semantic classes
<div className="bg-background text-foreground border-border">

// ✅ درست — Tailwind token reference
<div className="text-muted-foreground bg-muted">

// ❌ غلط — hardcoded hex
<div className="bg-[#F9FAFB] text-[#111827]">

// ❌ غلط — physical direction
<div className="ml-4 pl-2 text-left">

// ✅ درست — logical direction
<div className="ms-4 ps-2 text-start">
```

---

## 6. Testing Conventions

### Naming

```python
# Python — descriptive test names
def test_create_page_returns_201_with_valid_data():
def test_create_page_returns_409_on_version_conflict():
def test_publish_article_sends_audit_event():
```

```typescript
// TypeScript — describe/it pattern
describe('ArticleCard', () => {
  it('renders title and excerpt', () => { ... })
  it('shows published date in correct locale', () => { ... })
  it('links to article detail page', () => { ... })
})
```

### Arrange-Act-Assert

```python
def test_upload_media_generates_thumbnail():
    # Arrange
    image_file = create_test_image(width=1200, height=800)
    user = create_admin_user()

    # Act
    asset = upload_media(file=image_file, user=user)

    # Assert
    assert asset.thumbnail_url is not None
    assert asset.width == 1200
    assert asset.height == 800
```

### Fixture Patterns

```python
# conftest.py — reusable fixtures
@pytest.fixture
def admin_user(db):
    return UserFactory(role="admin")

@pytest.fixture
def published_article(db, admin_user):
    return ArticleFactory(status="published", created_by=admin_user)
```

---

## 7. Documentation Conventions

### When to Document

| Situation | Where |
|-----------|-------|
| Public API endpoint | Serializer docstrings + DRF spectacular |
| Service function | Python docstring (Google style) |
| Complex business logic | Inline comments |
| Architecture decision | `/docs/` markdown file |
| Component usage | Storybook or JSDoc |
| Environment setup | `/docs/` or README |

### Docstring Style (Google)

```python
def create_page(*, data: dict, user: User) -> Page:
    """Create a new CMS page.

    Validates input data, creates the page record, and logs
    an audit event for the creation.

    Args:
        data: Validated page data from serializer.
        user: The authenticated user creating the page.

    Returns:
        The newly created Page instance.

    Raises:
        ValidationError: If page data fails business rules.
    """
```

---

## 8. i18n Conventions

### Locale Handling

- **Supported locales:** `fa` (Persian), `en` (English)
- **Default locale:** `fa`
- **URL pattern:** `/{locale}/path` (e.g., `/fa/blog`, `/en/blog`)
- **No fallback policy:** اگر محتوای یک زبان موجود نیست، 404 — هرگز fallback به زبان دیگر

### Translation Keys

```json
// messages/fa.json
{
  "common": {
    "readMore": "ادامه مطلب",
    "publishedAt": "منتشر شده در {date}"
  },
  "blog": {
    "title": "وبلاگ",
    "noResults": "مقاله‌ای یافت نشد"
  }
}
```

### Content Storage

```python
# مدل‌ها: ستون‌های جداگانه per locale
class Article(VersionedModel):
    title_fa = models.CharField(max_length=200)
    title_en = models.CharField(max_length=200)
    slug_fa = models.SlugField(unique=True)
    slug_en = models.SlugField(unique=True)
    content_fa = models.TextField()
    content_en = models.TextField()
```

---

## 9. Security Conventions

### قوانین امنیتی

| Rule | Description |
|------|-------------|
| Never log secrets | Password, token, API key هرگز در log |
| Sanitize all input | Django serializers validate everything |
| CSRF on mutations | تمام POST/PUT/PATCH/DELETE نیاز به CSRF token |
| Parameterized queries | فقط ORM — هرگز raw SQL interpolation |
| Rate limit auth | Login endpoint: max 5 attempts/minute |
| Hash passwords | Argon2 (Django default) |
| Validate uploads | Whitelist MIME + extension + size limit |
| Audit sensitive ops | Login, permission change, content publish |
| No secrets in code | `.env` only — never commit secrets |
| HTTPS only | HSTS enabled in production |
| Principle of least privilege | هر role فقط permission‌های لازم |
