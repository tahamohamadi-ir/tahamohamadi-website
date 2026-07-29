"""Seed the database with realistic bilingual sample data for development.

Usage:
    python manage.py seed_data
    python manage.py seed_data --flush  # Clear existing data first

Creates:
- 1 superuser (admin / admin@tahamohamadi.ir)
- Sample pages (home, about, research, contact)
- Sample articles with topics
- Sample case studies with technologies
- Sample media assets (placeholder records)
"""

import uuid
from datetime import date

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.blog.models import Article, ArticleBlock, Topic
from apps.cms.models import Block, Page, Section
from apps.media.models import MediaAsset
from apps.portfolio.models import CaseStudy, CaseStudyBlock

User = get_user_model()


class Command(BaseCommand):
    help = "Seed database with bilingual sample data for development"

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete existing seed data before creating new data",
        )

    def handle(self, *args, **options):
        if options["flush"]:
            self.stdout.write("Flushing existing data...")
            self._flush()

        self.stdout.write("Seeding database...")
        self._create_superuser()
        media_assets = self._create_media_assets()
        self._create_pages()
        topics = self._create_topics()
        self._create_articles(topics, media_assets)
        self._create_case_studies(media_assets)
        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))

    def _flush(self):
        """Remove all seeded data."""
        CaseStudyBlock.objects.all().delete()
        CaseStudy.objects.all().delete()
        ArticleBlock.objects.all().delete()
        Article.objects.all().delete()
        Topic.objects.all().delete()
        Block.objects.all().delete()
        Section.objects.all().delete()
        Page.objects.all().delete()
        MediaAsset.objects.all().delete()
        User.objects.filter(is_superuser=True, email="admin@tahamohamadi.ir").delete()

    def _create_superuser(self):
        """Create development superuser."""
        if User.objects.filter(username="admin").exists():
            self.stdout.write("  Superuser 'admin' already exists, skipping.")
            return
        User.objects.create_superuser(
            username="admin",
            email="admin@tahamohamadi.ir",
            password="admin123!Dev",
            first_name="Taha",
            last_name="Mohamadi",
        )
        self.stdout.write("  Created superuser: admin / admin123!Dev")

    def _create_media_assets(self):
        """Create placeholder media asset records."""
        assets = []
        media_data = [
            {
                "original_filename": "hero-banner.jpg",
                "mime_type": "image/jpeg",
                "file_size": 245000,
                "width": 1920,
                "height": 1080,
                "checksum": "a1b2c3d4e5f6" + "0" * 52,
                "alt_text_fa": "تصویر بنر اصلی سایت",
                "alt_text_en": "Website main hero banner",
                "caption_fa": "",
                "caption_en": "",
            },
            {
                "original_filename": "profile-photo.jpg",
                "mime_type": "image/jpeg",
                "file_size": 120000,
                "width": 800,
                "height": 800,
                "checksum": "b2c3d4e5f6a1" + "0" * 52,
                "alt_text_fa": "عکس پروفایل طاها محمدی",
                "alt_text_en": "Taha Mohamadi profile photo",
                "caption_fa": "",
                "caption_en": "",
            },
            {
                "original_filename": "research-diagram.png",
                "mime_type": "image/png",
                "file_size": 350000,
                "width": 1200,
                "height": 800,
                "checksum": "c3d4e5f6a1b2" + "0" * 52,
                "alt_text_fa": "نمودار تحقیقاتی",
                "alt_text_en": "Research diagram",
                "caption_fa": "نمودار ساختار تحقیق",
                "caption_en": "Research structure diagram",
            },
            {
                "original_filename": "project-screenshot.png",
                "mime_type": "image/png",
                "file_size": 480000,
                "width": 1440,
                "height": 900,
                "checksum": "d4e5f6a1b2c3" + "0" * 52,
                "alt_text_fa": "تصویر صفحه پروژه",
                "alt_text_en": "Project screenshot",
                "caption_fa": "",
                "caption_en": "",
            },
        ]

        for data in media_data:
            asset, created = MediaAsset.objects.get_or_create(
                checksum=data["checksum"],
                defaults={
                    "file": f"media/seed/{data['original_filename']}",
                    **data,
                },
            )
            assets.append(asset)
            if created:
                self.stdout.write(f"  Created media: {data['original_filename']}")

        return assets

    def _create_pages(self):
        """Create sample CMS pages with sections and blocks."""
        pages_data = [
            {
                "slug_fa": "خانه",
                "slug_en": "home",
                "title_fa": "صفحه اصلی",
                "title_en": "Home",
                "page_type": "home",
                "status": "published",
                "sections": [
                    {
                        "ordering": 0,
                        "layout": "hero",
                        "blocks": [
                            {
                                "block_type": "hero",
                                "ordering": 0,
                                "settings": {
                                    "heading_fa": "طاها محمدی",
                                    "heading_en": "Taha Mohamadi",
                                    "subheading_fa": "پژوهشگر و توسعه‌دهنده نرم‌افزار",
                                    "subheading_en": "Researcher & Software Developer",
                                    "cta_text_fa": "درباره من",
                                    "cta_text_en": "About Me",
                                    "cta_link": "/about",
                                },
                            },
                        ],
                    },
                    {
                        "ordering": 1,
                        "layout": "grid",
                        "blocks": [
                            {
                                "block_type": "text",
                                "ordering": 0,
                                "settings": {
                                    "body_fa": "به وبسایت شخصی من خوش آمدید. اینجا درباره تحقیقات، پروژه‌ها و نوشته‌های من می‌توانید بیشتر بدانید.",
                                    "body_en": "Welcome to my personal website. Here you can learn more about my research, projects, and writing.",
                                },
                            },
                        ],
                    },
                ],
            },
            {
                "slug_fa": "درباره-من",
                "slug_en": "about",
                "title_fa": "درباره من",
                "title_en": "About",
                "page_type": "custom",
                "status": "published",
                "sections": [
                    {
                        "ordering": 0,
                        "layout": "default",
                        "blocks": [
                            {
                                "block_type": "text",
                                "ordering": 0,
                                "settings": {
                                    "body_fa": "من طاها محمدی هستم، پژوهشگر حوزه علوم کامپیوتر و توسعه‌دهنده نرم‌افزار. علاقه‌مند به هوش مصنوعی، یادگیری ماشین و سیستم‌های توزیع‌شده.",
                                    "body_en": "I am Taha Mohamadi, a computer science researcher and software developer. I am passionate about artificial intelligence, machine learning, and distributed systems.",
                                },
                            },
                        ],
                    },
                ],
            },
            {
                "slug_fa": "تحقیقات",
                "slug_en": "research",
                "title_fa": "تحقیقات",
                "title_en": "Research",
                "page_type": "custom",
                "status": "published",
                "sections": [
                    {
                        "ordering": 0,
                        "layout": "default",
                        "blocks": [
                            {
                                "block_type": "text",
                                "ordering": 0,
                                "settings": {
                                    "body_fa": "حوزه‌های تحقیقاتی من شامل پردازش زبان طبیعی، بینایی ماشین و سیستم‌های هوشمند است.",
                                    "body_en": "My research areas include natural language processing, computer vision, and intelligent systems.",
                                },
                            },
                        ],
                    },
                ],
            },
            {
                "slug_fa": "تماس",
                "slug_en": "contact",
                "title_fa": "تماس با من",
                "title_en": "Contact",
                "page_type": "custom",
                "status": "published",
                "sections": [
                    {
                        "ordering": 0,
                        "layout": "default",
                        "blocks": [
                            {
                                "block_type": "text",
                                "ordering": 0,
                                "settings": {
                                    "body_fa": "برای تماس با من می‌توانید از فرم زیر استفاده کنید یا از طریق ایمیل با من در ارتباط باشید.",
                                    "body_en": "You can reach me using the form below or contact me via email.",
                                },
                            },
                        ],
                    },
                ],
            },
        ]

        for page_data in pages_data:
            sections_data = page_data.pop("sections")
            page, created = Page.objects.get_or_create(
                slug_en=page_data["slug_en"],
                defaults={
                    **page_data,
                    "published_at": timezone.now(),
                    "created_by": "seed",
                    "updated_by": "seed",
                },
            )
            if not created:
                self.stdout.write(
                    f"  Page '{page_data['slug_en']}' already exists, skipping."
                )
                continue

            for section_data in sections_data:
                blocks_data = section_data.pop("blocks")
                section = Section.objects.create(page=page, **section_data)
                for block_data in blocks_data:
                    Block.objects.create(section=section, **block_data)

            self.stdout.write(f"  Created page: {page_data['slug_en']}")

    def _create_topics(self):
        """Create blog topics."""
        topics_data = [
            {"slug": "ai", "name_fa": "هوش مصنوعی", "name_en": "Artificial Intelligence"},
            {"slug": "web-dev", "name_fa": "توسعه وب", "name_en": "Web Development"},
            {"slug": "machine-learning", "name_fa": "یادگیری ماشین", "name_en": "Machine Learning"},
            {"slug": "devops", "name_fa": "دواپس", "name_en": "DevOps"},
            {"slug": "research", "name_fa": "تحقیقات", "name_en": "Research"},
        ]
        topics = []
        for data in topics_data:
            topic, created = Topic.objects.get_or_create(slug=data["slug"], defaults=data)
            topics.append(topic)
            if created:
                self.stdout.write(f"  Created topic: {data['name_en']}")
        return topics

    def _create_articles(self, topics, media_assets):
        """Create sample blog articles with blocks."""
        articles_data = [
            {
                "slug_fa": "مقدمه-ای-بر-هوش-مصنوعی",
                "slug_en": "introduction-to-artificial-intelligence",
                "title_fa": "مقدمه‌ای بر هوش مصنوعی",
                "title_en": "Introduction to Artificial Intelligence",
                "excerpt_fa": "هوش مصنوعی یکی از مهم‌ترین حوزه‌های علوم کامپیوتر است که در دهه‌های اخیر رشد چشمگیری داشته است.",
                "excerpt_en": "Artificial intelligence is one of the most important fields in computer science that has experienced remarkable growth in recent decades.",
                "status": "published",
                "reading_time_fa": 5,
                "reading_time_en": 4,
                "topic_slugs": ["ai", "research"],
                "blocks": {
                    "fa": [
                        {"block_type": "heading", "ordering": 0, "content": {"text": "هوش مصنوعی چیست؟", "level": 2}},
                        {"block_type": "paragraph", "ordering": 1, "content": {"text": "هوش مصنوعی شاخه‌ای از علوم کامپیوتر است که به ساخت سیستم‌های هوشمند می‌پردازد. این سیستم‌ها قادر به انجام وظایفی هستند که معمولاً نیاز به هوش انسانی دارند."}},
                        {"block_type": "heading", "ordering": 2, "content": {"text": "تاریخچه", "level": 2}},
                        {"block_type": "paragraph", "ordering": 3, "content": {"text": "مفهوم هوش مصنوعی از دهه ۱۹۵۰ مطرح شد و از آن زمان تاکنون پیشرفت‌های قابل توجهی داشته است."}},
                    ],
                    "en": [
                        {"block_type": "heading", "ordering": 0, "content": {"text": "What is Artificial Intelligence?", "level": 2}},
                        {"block_type": "paragraph", "ordering": 1, "content": {"text": "Artificial intelligence is a branch of computer science that focuses on building intelligent systems. These systems are capable of performing tasks that typically require human intelligence."}},
                        {"block_type": "heading", "ordering": 2, "content": {"text": "History", "level": 2}},
                        {"block_type": "paragraph", "ordering": 3, "content": {"text": "The concept of AI was introduced in the 1950s and has seen remarkable advancements since then."}},
                    ],
                },
            },
            {
                "slug_fa": "معماری-میکروسرویس",
                "slug_en": "microservices-architecture-guide",
                "title_fa": "راهنمای معماری میکروسرویس",
                "title_en": "Microservices Architecture Guide",
                "excerpt_fa": "معماری میکروسرویس رویکردی مدرن برای طراحی سیستم‌های نرم‌افزاری مقیاس‌پذیر است.",
                "excerpt_en": "Microservices architecture is a modern approach to designing scalable software systems.",
                "status": "published",
                "reading_time_fa": 8,
                "reading_time_en": 7,
                "topic_slugs": ["web-dev", "devops"],
                "blocks": {
                    "fa": [
                        {"block_type": "heading", "ordering": 0, "content": {"text": "میکروسرویس چیست؟", "level": 2}},
                        {"block_type": "paragraph", "ordering": 1, "content": {"text": "معماری میکروسرویس یک سبک معماری است که یک برنامه کاربردی را به مجموعه‌ای از سرویس‌های کوچک و مستقل تقسیم می‌کند."}},
                        {"block_type": "heading", "ordering": 2, "content": {"text": "مزایا و چالش‌ها", "level": 2}},
                        {"block_type": "paragraph", "ordering": 3, "content": {"text": "مقیاس‌پذیری، استقلال تیمی و انعطاف‌پذیری فناوری از مزایای اصلی هستند. پیچیدگی عملیاتی و مدیریت داده توزیع‌شده از چالش‌ها محسوب می‌شوند."}},
                    ],
                    "en": [
                        {"block_type": "heading", "ordering": 0, "content": {"text": "What are Microservices?", "level": 2}},
                        {"block_type": "paragraph", "ordering": 1, "content": {"text": "Microservices architecture is an architectural style that divides an application into a collection of small, independent services."}},
                        {"block_type": "heading", "ordering": 2, "content": {"text": "Benefits and Challenges", "level": 2}},
                        {"block_type": "paragraph", "ordering": 3, "content": {"text": "Scalability, team independence, and technology flexibility are key benefits. Operational complexity and distributed data management are the main challenges."}},
                    ],
                },
            },
            {
                "slug_fa": "یادگیری-عمیق-با-پایتون",
                "slug_en": "deep-learning-with-python",
                "title_fa": "یادگیری عمیق با پایتون",
                "title_en": "Deep Learning with Python",
                "excerpt_fa": "آموزش عملی یادگیری عمیق با استفاده از کتابخانه‌های پایتون مانند TensorFlow و PyTorch.",
                "excerpt_en": "Practical deep learning tutorial using Python libraries like TensorFlow and PyTorch.",
                "status": "draft",
                "reading_time_fa": 12,
                "reading_time_en": 10,
                "topic_slugs": ["machine-learning", "ai"],
                "blocks": {
                    "fa": [
                        {"block_type": "heading", "ordering": 0, "content": {"text": "شروع کار", "level": 2}},
                        {"block_type": "paragraph", "ordering": 1, "content": {"text": "برای شروع کار با یادگیری عمیق، ابتدا باید محیط توسعه خود را آماده کنید."}},
                    ],
                    "en": [
                        {"block_type": "heading", "ordering": 0, "content": {"text": "Getting Started", "level": 2}},
                        {"block_type": "paragraph", "ordering": 1, "content": {"text": "To get started with deep learning, you first need to set up your development environment."}},
                    ],
                },
            },
        ]

        for article_data in articles_data:
            topic_slugs = article_data.pop("topic_slugs")
            blocks_data = article_data.pop("blocks")

            article, created = Article.objects.get_or_create(
                slug_en=article_data["slug_en"],
                defaults={
                    **article_data,
                    "featured_image": media_assets[0] if media_assets else None,
                    "published_at": timezone.now() if article_data["status"] == "published" else None,
                    "created_by": "seed",
                    "updated_by": "seed",
                },
            )

            if not created:
                self.stdout.write(f"  Article '{article_data['slug_en']}' already exists, skipping.")
                continue

            # Assign topics
            for slug in topic_slugs:
                try:
                    topic = Topic.objects.get(slug=slug)
                    article.topics.add(topic)
                except Topic.DoesNotExist:
                    pass

            # Create blocks
            for locale, blocks in blocks_data.items():
                for block in blocks:
                    ArticleBlock.objects.create(article=article, locale=locale, **block)

            self.stdout.write(f"  Created article: {article_data['slug_en']}")

    def _create_case_studies(self, media_assets):
        """Create sample portfolio case studies."""
        cases_data = [
            {
                "slug_fa": "سیستم-مدیریت-محتوا",
                "slug_en": "content-management-system",
                "title_fa": "سیستم مدیریت محتوا",
                "title_en": "Content Management System",
                "role_fa": "توسعه‌دهنده ارشد",
                "role_en": "Lead Developer",
                "client_fa": "شرکت فناوری اطلاعات",
                "client_en": "IT Solutions Company",
                "date_start": date(2023, 1, 15),
                "date_end": date(2023, 8, 30),
                "technologies": ["Django", "React", "PostgreSQL", "Docker", "Redis"],
                "outcome_fa": "افزایش ۴۰ درصدی بهره‌وری تیم تولید محتوا و کاهش ۶۰ درصدی زمان انتشار.",
                "outcome_en": "40% increase in content team productivity and 60% reduction in publishing time.",
                "featured": True,
                "status": "published",
                "blocks": {
                    "fa": [
                        {"block_type": "heading", "ordering": 0, "content": {"text": "چالش", "level": 2}},
                        {"block_type": "paragraph", "ordering": 1, "content": {"text": "مشتری نیاز به یک سیستم مدیریت محتوای سفارشی داشت که بتواند محتوای چندزبانه را مدیریت کند."}},
                        {"block_type": "heading", "ordering": 2, "content": {"text": "راه‌حل", "level": 2}},
                        {"block_type": "paragraph", "ordering": 3, "content": {"text": "ما یک CMS کامل با قابلیت ویرایش بصری، مدیریت رسانه و گردش کار انتشار طراحی و پیاده‌سازی کردیم."}},
                    ],
                    "en": [
                        {"block_type": "heading", "ordering": 0, "content": {"text": "Challenge", "level": 2}},
                        {"block_type": "paragraph", "ordering": 1, "content": {"text": "The client needed a custom content management system capable of handling multilingual content."}},
                        {"block_type": "heading", "ordering": 2, "content": {"text": "Solution", "level": 2}},
                        {"block_type": "paragraph", "ordering": 3, "content": {"text": "We designed and implemented a full CMS with visual editing, media management, and publishing workflows."}},
                    ],
                },
            },
            {
                "slug_fa": "پلتفرم-تحلیل-داده",
                "slug_en": "data-analytics-platform",
                "title_fa": "پلتفرم تحلیل داده",
                "title_en": "Data Analytics Platform",
                "role_fa": "معمار نرم‌افزار",
                "role_en": "Software Architect",
                "client_fa": "شرکت تحلیل داده",
                "client_en": "Data Analytics Corp",
                "date_start": date(2022, 6, 1),
                "date_end": date(2023, 2, 28),
                "technologies": ["Python", "Apache Spark", "Kubernetes", "FastAPI", "Vue.js"],
                "outcome_fa": "پردازش ۱۰ میلیون رکورد در ثانیه با ۹۹.۹ درصد دسترس‌پذیری.",
                "outcome_en": "Processing 10 million records per second with 99.9% availability.",
                "featured": True,
                "status": "published",
                "blocks": {
                    "fa": [
                        {"block_type": "heading", "ordering": 0, "content": {"text": "چالش", "level": 2}},
                        {"block_type": "paragraph", "ordering": 1, "content": {"text": "طراحی یک پلتفرم تحلیل داده با قابلیت پردازش بلادرنگ حجم بالای داده."}},
                        {"block_type": "heading", "ordering": 2, "content": {"text": "راه‌حل", "level": 2}},
                        {"block_type": "paragraph", "ordering": 3, "content": {"text": "پیاده‌سازی معماری میکروسرویس با Apache Spark برای پردازش توزیع‌شده و Kubernetes برای مقیاس‌پذیری خودکار."}},
                    ],
                    "en": [
                        {"block_type": "heading", "ordering": 0, "content": {"text": "Challenge", "level": 2}},
                        {"block_type": "paragraph", "ordering": 1, "content": {"text": "Design a data analytics platform capable of real-time processing of high-volume data streams."}},
                        {"block_type": "heading", "ordering": 2, "content": {"text": "Solution", "level": 2}},
                        {"block_type": "paragraph", "ordering": 3, "content": {"text": "Implemented a microservices architecture with Apache Spark for distributed processing and Kubernetes for auto-scaling."}},
                    ],
                },
            },
        ]

        for case_data in cases_data:
            blocks_data = case_data.pop("blocks")

            case, created = CaseStudy.objects.get_or_create(
                slug_en=case_data["slug_en"],
                defaults={
                    **case_data,
                    "published_at": timezone.now() if case_data["status"] == "published" else None,
                    "created_by": "seed",
                    "updated_by": "seed",
                },
            )

            if not created:
                self.stdout.write(f"  Case study '{case_data['slug_en']}' already exists, skipping.")
                continue

            # Add gallery images
            if media_assets:
                case.gallery.add(*media_assets[:2])

            # Create narrative blocks
            for locale, blocks in blocks_data.items():
                for block in blocks:
                    CaseStudyBlock.objects.create(case_study=case, locale=locale, **block)

            self.stdout.write(f"  Created case study: {case_data['slug_en']}")
