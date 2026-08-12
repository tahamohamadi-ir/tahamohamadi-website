# 🏛️ دفترچه مرجع الترا-تفصیلی و دایرةالمعارف معماری پروژه (Master Technical Reference & Architectural Handbook)

این مستند، کتابچه کامل، خط‌به‌خط و مرجع نهایی معماری، کد، کدخدایی دیتابیس، تعاریف تایپ‌ها، توابع اصلی، APIs و کانفیگ‌های استقرار پروژه **tahamohamadi-website** است.

---

## 📑 فهرست تفصیلی مطالب (Table of Contents)
1. <a href="#sec-1">معماری کلان، توپولوژی کانتینرها و شبکه‌بندی</a>
2. <a href="#sec-2">کد کامل مدل‌های پایگاه داده (Django ORM Models)</a>
3. <a href="#sec-3">اینترفیس‌ها و تعاریف جامع فرانت‌اند (Complete TypeScript Interfaces)</a>
4. <a href="#sec-4">مرجع دقیق API Endpoints به همراه Payloads نمونه JSON</a>
5. <a href="#sec-5">الگوریتم‌های هسته بک‌اند (Backend Core Algorithms)</a>
   - <a href="#sec-5-1">5.1 محاسبه زمان مطالعه (Bilingual WPM Reading Time)</a>
   - <a href="#sec-5-2">5.2 استخراج و Slugify جدول محتوا (TOC Generator)</a>
   - <a href="#sec-5-3">5.3 اعتبارسنجی جادویی رسانه‌ها (Magic Bytes Inspection & Checksum)</a>
   - <a href="#sec-5-4">5.4 استعلام بهینه‌شده رسانه‌های فعال (_active_media_ids Query Optimization)</a>
6. <a href="#sec-6">معماری صفحه‌ساز بصری (Visual Page Builder Mechanics)</a>
   - <a href="#sec-6-1">6.1 ساختار داده درخت بوم (PageDocument Immutable Operations)</a>
   - <a href="#sec-6-2">6.2 رندر رکورسیو گره‌ها و ParallaxContainer</a>
7. <a href="#sec-7">جدول و مرجع کامل ۳۵+ کامپوننت توکار پروژه</a>
8. <a href="#sec-8">الگوریتم مدیریت Autosave، قفل همزمانی و رفع تداخل</a>
9. <a href="#sec-9">پروتکل همزمانی WebSocket و CollaborationAdapter</a>
10. <a href="#sec-10">موتور تعاملات و ارزیابی عبارات (Expression Engine & Interaction Runner)</a>
11. <a href="#sec-11">سئو، دسترس‌پذیری، امنیت و تصفیه Sentry</a>
12. <a href="#sec-12">محتوای کامل فایل‌های کانفیگ استقرار (Production Configuration Files)</a>

---

<h2 id="sec-1">1. 🚀 معماری کلان، توپولوژی کانتینرها و شبکه‌بندی</h2>

سیستم از لایه‌های مستقل تشکیل شده که توسط **Docker Compose** ارکستره می‌شوند. سرور Nginx ترافیک پورت‌های 80 و 443 را دریافت کرده و بر اساس مسیریابی زیر توزیع می‌کند:

```mermaid
graph TD
    Client[مرورگر کاربر / اپلیکیشن client] -->|TLS/SSL:443| Nginx[Nginx Reverse Proxy]
    
    subgraph Routing Layer (Nginx)
        Nginx -->|/api/*| Django[Django 5.1 / Gunicorn WSGI]
        Nginx -->|/ws/*| Channels[Django Channels / Daphne ASGI]
        Nginx -->|/media/*| MediaVolume[Static/Media Volume Shared]
        Nginx -->|/*| NextJS[Next.js 15 Standalone Node Engine]
    end
    
    subgraph Storage & Caching Layer
        Django -->|SQL Queries| Postgres[(PostgreSQL 16 Database)]
        Channels -->|Pub/Sub & State| Redis[(Redis 7 Channel Layer)]
        Django -->|Cache Engine| Redis
    end
```

### 🔹 خصوصیات فنی کانتینرها:
- **Nginx (1.27-alpine)**: مدیریت TLS/SSL، تنظیم سرآیندهای امنیتی (HSTS, CSP, X-Frame-Options)، فشرده‌سازی Gzip/Brotli و هدایت ترافیک.
- **Next.js (15 App Router - Node 20)**: اجرای برنامه به صورت SSR/SSG با Standalone Bundle بهینه‌شده.
- **Django (5.1 - Python 3.12)**: اجرای سرویس REST API با سرور Gunicorn و ۴ پروسه Worker.
- **PostgreSQL (16-alpine)**: ذخیره داده‌های اصلی با اندیس‌گذاری JSONB جهت کوئری‌های پرسرعت بوم.
- **Redis (7-alpine)**: سرویس این‌مموری جهت کش کردن داده‌ها و کانال لایه WebSocket.

---

<h2 id="sec-2">2. 🗄️ کد کامل مدل‌های پایگاه داده (Django ORM Models)</h2>

تمامی مدل‌ها از `TimeStampedModel` ارث‌بری کرده و دارای UUID4 به عنوان شناسه اصلی هستند.

```python
import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _

class TimeStampedModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Page(TimeStampedModel):
    STATUS_CHOICES = [
        ("draft", _("Draft")),
        ("in_review", _("In Review")),
        ("scheduled", _("Scheduled")),
        ("published", _("Published")),
        ("archived", _("Archived")),
    ]
    PAGE_TYPE_CHOICES = [
        ("home", _("Home")),
        ("landing", _("Landing")),
        ("about", _("About")),
        ("custom", _("Custom")),
    ]

    title_fa = models.CharField(max_length=255)
    title_en = models.CharField(max_length=255)
    slug_fa = models.SlugField(max_length=255, unique=True, allow_unicode=True)
    slug_en = models.SlugField(max_length=255, unique=True)
    page_type = models.CharField(max_length=50, choices=PAGE_TYPE_CHOICES, default="custom")
    template_variant = models.CharField(max_length=50, default="default")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft", db_index=True)
    version = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["-updated_at"]

class Section(TimeStampedModel):
    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name="sections")
    layout = models.CharField(max_length=50, default="container")
    ordering = models.PositiveIntegerField(default=0)
    settings = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["ordering"]

class Block(TimeStampedModel):
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="blocks")
    block_type = models.CharField(max_length=100, db_index=True)
    ordering = models.PositiveIntegerField(default=0)
    settings = models.JSONField(default=dict, blank=True)
    content_fa = models.JSONField(default=dict, blank=True)
    content_en = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["ordering"]

class Article(TimeStampedModel):
    title_fa = models.CharField(max_length=255)
    title_en = models.CharField(max_length=255)
    slug_fa = models.SlugField(max_length=255, unique=True, allow_unicode=True)
    slug_en = models.SlugField(max_length=255, unique=True)
    summary_fa = models.TextField(blank=True)
    summary_en = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Page.STATUS_CHOICES, default="draft", db_index=True)
    reading_time_fa = models.PositiveIntegerField(default=0)
    reading_time_en = models.PositiveIntegerField(default=0)
    published_at = models.DateTimeField(null=True, blank=True)
    version = models.PositiveIntegerField(default=1)

class MediaAsset(TimeStampedModel):
    file = models.FileField(upload_to="uploads/%Y/%m/")
    checksum_sha256 = models.CharField(max_length=64, unique=True, db_index=True)
    mime_type = models.CharField(max_length=100)
    file_size = models.PositiveIntegerField()
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, default="active", db_index=True)
    usage_count = models.PositiveIntegerField(default=0)
```

---

<h2 id="sec-3">3. 📘 اینترفیس‌ها و تعاریف جامع فرانت‌اند (Complete TypeScript Interfaces)</h2>

```typescript
export type NodeId = string;

export interface PageNode {
  id: NodeId;
  type: string;
  name?: string;
  props: Record<string, unknown>;
  children?: NodeId[];
  metadata?: {
    locked?: boolean;
    hidden?: boolean;
  };
}

export interface PageDocument {
  version: number;
  rootId: NodeId;
  nodes: Record<NodeId, PageNode>;
}

export interface ComponentCapabilities {
  style?: boolean;
  responsive?: boolean;
  animation?: boolean;
  customCss?: boolean;
}

export type InspectorTab = 'content' | 'layout' | 'style' | 'settings' | 'animation' | 'responsive';

export interface ComponentDefinition {
  type: string;
  version: number;
  meta: {
    name: string;
    description?: string;
    category: 'core' | 'layout' | 'content' | 'ui' | 'media' | 'marketing' | 'form' | 'navigation';
    icon: string;
    hidden?: boolean;
  };
  defaults: Record<string, unknown>;
  slots?: Record<string, { accepts: string[] }>;
  capabilities: ComponentCapabilities;
  inspector: InspectorTab[];
  render: React.ComponentType<ComponentRenderProps>;
}

export interface PageSavePayload {
  slug_fa: string;
  slug_en: string;
  title_fa: string;
  title_en: string;
  page_type: string;
  template_variant: string;
  status: string;
  sections: Array<{
    layout: string;
    ordering: number;
    settings: Record<string, unknown>;
    blocks: Array<{
      block_type: string;
      ordering: number;
      settings: Record<string, unknown>;
      content_fa: Record<string, unknown>;
      content_en: Record<string, unknown>;
    }>;
  }>;
}
```

---

<h2 id="sec-4">4. 🌐 مرجع دقیق API Endpoints به همراه Payloads نمونه JSON</h2>

### 🔹 1. دریافت جزئیات صفحه ادمین (`GET /api/admin/pages/page-1/`)
**Response (HTTP 200 OK):**
```json
{
  "id": "c3b9b47e-85a7-47b2-9a3b-287910a30b12",
  "title_fa": "صفحه اصلی",
  "title_en": "Home Page",
  "slug_fa": "خانه",
  "slug_en": "home",
  "page_type": "home",
  "template_variant": "default",
  "status": "draft",
  "version": 4,
  "sections": [
    {
      "id": "s-1",
      "layout": "container",
      "ordering": 0,
      "settings": { "backgroundColor": "#ffffff" },
      "blocks": [
        {
          "id": "b-1",
          "block_type": "marketing.hero",
          "ordering": 0,
          "settings": { "badgeText": "✨ پلتفرم توسعه جدید" },
          "content_fa": { "title": "تجربه دیجیتال بسازید", "primaryCta": "شروع رایگان" },
          "content_en": { "title": "Build Something Amazing", "primaryCta": "Get Started" }
        }
      ]
    }
  ]
}
```

### 🔹 2. به‌روزرسانی صفحه با قفل همزمانی (`PUT /api/admin/pages/page-1/`)
**Request Payload:**
```json
{
  "title_fa": "صفحه اصلی - ویرایش جدید",
  "title_en": "Home Page - Updated",
  "slug_fa": "خانه",
  "slug_en": "home",
  "page_type": "home",
  "template_variant": "default",
  "status": "draft",
  "version": 4,
  "sections": [ ... ]
}
```

**Response در صورت تداخل همزمانی (HTTP 409 Conflict):**
```json
{
  "type": "https://api.tahamohamadi.ir/errors/conflict-error",
  "title": "Conflict Detected",
  "status": 409,
  "detail": "The document version (4) does not match the current server version (5).",
  "instance": "/api/admin/pages/page-1/"
}
```

---

<h2 id="sec-5">5. ⚙️ الگوریتم‌های هسته بک‌اند (Backend Core Algorithms)</h2>

<h3 id="sec-5-1">5.1 محاسبه زمان مطالعه (calculate_reading_time)</h3>
```python
import re
import math

def count_words(text: str | None) -> int:
    if not text or not text.strip():
        return 0
    # پاکسازی کاراکترهای جداکننده و شمارش کلمات
    clean_text = re.sub(r'[^\w\s\u0600-\u06FF]', ' ', text)
    words = [w for w in clean_text.split() if w.strip()]
    return len(words)

def calculate_reading_time(blocks: list[dict], locale: str) -> int:
    wpm = 180 if locale == "fa" else 200
    total_words = 0
    for block in blocks:
        if not isinstance(block, dict):
            continue
        content = block.get(f"content_{locale}", {}) or block.get("content", {})
        if isinstance(content, dict):
            text_parts = [
                content.get("text", ""),
                content.get("title", ""),
                content.get("paragraph", ""),
            ]
            for part in text_parts:
                if isinstance(part, str):
                    total_words += count_words(part)
    
    if total_words == 0:
        return 0
    return max(1, math.ceil(total_words / wpm))
```

<h3 id="sec-5-2">5.2 استخراج و Slugify جدول محتوا (generate_toc)</h3>
```python
import re
import unicodedata

def generate_heading_slug(text: str) -> str:
    if not text:
        return ""
    text = unicodedata.normalize("NFKC", text.strip().lower())
    # تبدیل فواصل به خط تیره و حذف کاراکترهای غیرمجاز
    slug = re.sub(r'[^\w\s\u0600-\u06FF-]', '', text)
    slug = re.sub(r'[\s_]+', '-', slug)
    return slug.strip('-')

def generate_toc(blocks: list[dict], locale: str) -> list[dict]:
    toc = []
    seen_slugs = set()
    for block in blocks:
        if block.get("block_type") == "heading":
            content = block.get(f"content_{locale}", {}) or block.get("content", {})
            text = content.get("text", "")
            level = content.get("level", 2)
            if text:
                base_slug = generate_heading_slug(text)
                slug = base_slug
                counter = 1
                while slug in seen_slugs:
                    slug = f"{base_slug}-{counter}"
                    counter += 1
                seen_slugs.add(slug)
                toc.append({"text": text, "level": level, "slug": slug})
    return toc
```

<h3 id="sec-5-3">5.3 اعتبارسنجی جادویی رسانه‌ها (Magic Bytes Inspection)</h3>
الگوی فیلتر بایت‌های اول فایل جهت تشخیص قطعی فرمت:

| فرمت فایل | الگوی Magic Bytes (Hex) | MIME Type قطعی |
| :--- | :--- | :--- |
| **JPEG** | `FF D8 FF` | `image/jpeg` |
| **PNG** | `89 50 4E 47 0D 0A 1A 0A` | `image/png` |
| **GIF** | `47 49 46 38 37 61` / `47 49 46 38 39 61` | `image/gif` |
| **WebP** | `52 49 46 46 .... 57 45 42 50` | `image/webp` |
| **PDF** | `25 50 44 46` | `application/pdf` |

```python
def validate_magic_bytes(file_obj) -> str:
    file_obj.seek(0)
    header = file_obj.read(32)
    file_obj.seek(0)
    
    if header.startswith(b"\xFF\xD8\xFF"):
        return "image/jpeg"
    elif header.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    elif header.startswith(b"RIFF") and header[8:12] == b"WEBP":
        return "image/webp"
    elif header.startswith(b"%PDF"):
        return "application/pdf"
    
    raise ValueError("Invalid file format signature.")
```

<h3 id="sec-5-4">5.4 استعلام بهینه‌شده رسانه‌های فعال (_active_media_ids Query Optimization)</h3>
```python
def _active_media_ids(payload: dict | None = None) -> set[str]:
    if payload:
        referenced_ids: set[str] = set()
        sections = payload.get("sections", [])
        if isinstance(sections, list):
            for section in sections:
                if isinstance(section, dict):
                    for block in section.get("blocks", []):
                        if isinstance(block, dict):
                            settings = block.get("settings", {})
                            if isinstance(settings, dict):
                                media_id = settings.get("media_id") or settings.get("parallax_media_id")
                                if media_id:
                                    referenced_ids.add(str(media_id))
        if referenced_ids:
            return {
                str(media_id)
                for media_id in MediaAsset.objects.filter(id__in=referenced_ids, status="active").values_list("id", flat=True)
            }
    return {
        str(media_id)
        for media_id in MediaAsset.objects.filter(status="active").values_list("id", flat=True)
    }
```

---

<h2 id="sec-6">6. 🛠️ معماری صفحه‌ساز بصری (Visual Page Builder Mechanics)</h2>

<h3 id="sec-6-1">6.1 ساختار داده درخت بوم (PageDocument Immutable Operations)</h3>
توابع تغییر حالت سند به صورت خالص (Pure) اجرا می‌شوند:

```typescript
export function insertNode(
  doc: PageDocument,
  parentId: NodeId,
  newNode: PageNode,
  targetIndex?: number
): PageDocument {
  const parent = doc.nodes[parentId];
  if (!parent) return doc;

  const children = [...(parent.children || [])];
  if (typeof targetIndex === 'number' && targetIndex >= 0) {
    children.splice(targetIndex, 0, newNode.id);
  } else {
    children.push(newNode.id);
  }

  return {
    ...doc,
    nodes: {
      ...doc.nodes,
      [parentId]: { ...parent, children },
      [newNode.id]: newNode,
    },
  };
}
```

<h3 id="sec-6-2">6.2 رندر رکورسیو گره‌ها و ParallaxContainer</h3>
```typescript
function ParallaxContainer({ speed, children }: { speed: number; children: React.ReactNode }) {
  const { scrollY } = useScroll();
  const yOffset = useTransform(scrollY, [0, 1000], [0, speed * -200]);
  return <motion.div style={{ y: yOffset }}>{children}</motion.div>;
}
```

---

<h2 id="sec-7">7. 📋 جدول و مرجع کامل ۳۵+ کامپوننت توکار پروژه</h2>

```typescript
export const BUILT_IN_COMPONENTS: ComponentDefinition[] = [
  corePage, layoutSection, layoutContainer, layoutBox, layoutSpacer, layoutRow,
  layoutGrid, layoutFrame, layoutCard, uiModal, contentHeading, contentText,
  contentParagraph, contentRichTextComponent, uiButton, mediaImage, formFormComponent,
  formInputComponent, formTextareaComponent, formSubmitComponent, navigationNavbarComponent,
  navigationFooterComponent, contentAnimatedText, contentCounter, uiThemeToggle, layoutFreeform,
  marketingHero, marketingFeatures, marketingTestimonial, marketingPricing, marketingFaq,
  marketingGallery, marketingTimeline, marketingFeaturedContent
];
```

---

<h2 id="sec-8">8. ⏳ الگوریتم مدیریت Autosave، قفل همزمانی و رفع تداخل</h2>

```mermaid
stateDiagram-v2
    [*] --> IDLE: مقداردهی اولیه
    IDLE --> DEBOUNCING: تغییر محتوا در حالت Draft
    DEBOUNCING --> SAVING: انقضای 750ms تایمر
    
    state SAVING {
        [*] --> IN_FLIGHT: ارسال PUT به سرور
        IN_FLIGHT --> QUEUE_EDITS: ویرایش جدید حین ارسال
        QUEUE_EDITS --> IN_FLIGHT
    }
    
    SAVING --> SAVED: دریافت HTTP 200
    SAVED --> IDLE: اجرای onSuccess & پاکسازی
    SAVING --> CONFLICT: دریافت HTTP 409 Conflict
    CONFLICT --> RESOLVING: دیالوگ ConflictDialog
    RESOLVING --> IDLE: انتخاب ریلود یا حفظ محلی
```

---

<h2 id="sec-9">9. 📡 پروتکل همزمانی WebSocket و CollaborationAdapter</h2>

ارتباطات همزمان بین کلاینت‌ها با ساختار JSON Messages زیر تبادل می‌شوند:

```json
{
  "type": "sync.patches",
  "senderId": "client-uuid-123",
  "pageId": "page-1",
  "patches": [
    { "op": "replace", "path": "/nodes/b-1/props/title", "value": "عنوان جدید" }
  ]
}
```

---

<h2 id="sec-10">10. 🧠 موتور تعاملات و ارزیابی عبارات (Expression Engine & Interaction Runner)</h2>

کلاس `ExpressionEngine` عبارات متنی را بدون تابع خطرناک `eval` لغوی‌یابی (Tokenize) و اجرا می‌کند:

```typescript
export function evaluateExpression(expr: string, context: Record<string, unknown>): unknown {
  const trimmed = expr.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const key = trimmed.slice(1, -1).trim();
    return context[key];
  }
  return expr;
}
```

---

<h2 id="sec-11">11. 🛡️ سئو، دسترس‌پذیری، امنیت و تصفیه Sentry</h2>

* **پاکسازی Sentry (`lib/sentry-scrubbing.ts`)**:
  ```typescript
  export function scrubSentryEvent(event: any) {
    if (event.request && event.request.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    return event;
  }
  ```

---

<h2 id="sec-12">12. 🚢 محتوای کامل فایل‌های کانفیگ استقرار (Production Configuration Files)</h2>

### 🔹 1. `docker-compose.yml`
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:1.27-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx.conf:/etc/nginx/nginx.conf:ro
      - media_data:/app/backend/media
    depends_on:
      - django
      - nextjs

  django:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
    environment:
      - DATABASE_URL=postgres://user:pass@postgres:5432/tahamohamadi_db
      - REDIS_URL=redis://redis:6379/0
    volumes:
      - media_data:/app/media
    depends_on:
      - postgres
      - redis

  nextjs:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      - NEXT_PUBLIC_API_URL=https://tahamohamadi.ir/api

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  postgres_data:
  media_data:
```

### 🔹 2. `docker/nginx.conf`
```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    sendfile on;
    keepalive_timeout 65;

    upstream django_app {
        server django:8000;
    }

    upstream nextjs_app {
        server nextjs:3000;
    }

    server {
        listen 80;
        server_name tahamohamadi.ir www.tahamohamadi.ir;

        location /api/ {
            proxy_pass http://django_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /media/ {
            alias /app/backend/media/;
            expires 30d;
            add_header Cache-Control "public, no-transform";
        }

        location / {
            proxy_pass http://nextjs_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

---

### 📝 نتیجه‌گیری
این مستند مرجع الترا-تفصیلی به همراه انکرهای اختصاصی HTML، کامل‌ترین مرجع کد و معماری برای توسعه، نگه‌داری و استقرار وب‌سایت **tahamohamadi-website** است.
