"""Seed the database with realistic bilingual sample data for development.

Usage:
    python manage.py seed_data
    python manage.py seed_data --flush  # Clear existing data first

Creates:
- 1 superuser (admin / admin@tahamohamadi.ir)
- Sample pages (home, about, research, contact)
- Sample articles with topics
- Sample case studies with technologies
- No placeholder media records (real media must be uploaded)
"""

import uuid
from datetime import date
from typing import Any

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.blog.models import Article, ArticleBlock, Topic
from apps.cms.models import Block, Page, Section
from apps.media.models import MediaAsset
from apps.portfolio.models import CaseStudy, CaseStudyBlock
from apps.identity.models import (
    Affiliation, Certification, Education, Experience, LanguageProficiency,
    Publication, ResearchInterest, ResearchProject, ResumeVariant, SiteProfile, Skill, SocialLink,
)
from apps.siteconfig.models import NavigationItem, RedirectRule, SiteSettings

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
        self._remove_broken_seed_media()
        self._create_identity_and_siteconfig_drafts()
        self._create_skills()
        self._create_experiences()
        self._create_educations()
        self._create_publications()
        self._create_social_links()
        self._create_pages()
        topics = self._create_topics()
        self._create_articles(topics, [])
        self._create_case_studies([])
        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))

    def _flush(self):
        """Remove all seeded data."""
        RedirectRule.objects.all().delete()
        NavigationItem.objects.all().delete()
        SiteSettings.objects.all().delete()
        ResumeVariant.objects.all().delete()
        Publication.objects.all().delete()
        ResearchInterest.objects.all().delete()
        ResearchProject.objects.all().delete()
        LanguageProficiency.objects.all().delete()
        Affiliation.objects.all().delete()
        Certification.objects.all().delete()
        Education.objects.all().delete()
        Experience.objects.all().delete()
        Skill.objects.all().delete()
        SocialLink.objects.all().delete()
        SiteProfile.objects.all().delete()
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
        """Create development superuser and basic RBAC groups."""
        from django.contrib.auth.models import Group
        
        # Create RBAC groups
        for group_name in ["Content Editor", "Reviewer", "Publisher", "Admin"]:
            Group.objects.get_or_create(name=group_name)
            
        if User.objects.filter(username="admin").exists():
            self.stdout.write("  Superuser 'admin' already exists, skipping.")
            return
        user = User.objects.create_superuser(
            username="admin",
            email="admin@tahamohamadi.ir",
            password="admin123!Dev",
            first_name="Taha",
            last_name="Mohamadi",
        )
        # Assign superuser to Admin group explicitly
        admin_group, _ = Group.objects.get_or_create(name="Admin")
        user.groups.add(admin_group)
        self.stdout.write("  Created superuser: admin / admin123!Dev")

    def _remove_broken_seed_media(self) -> int:
        """Remove obsolete seed records whose placeholder files do not exist.

        Only the historical ``media/seed/`` namespace is considered, so real
        uploads are untouched. Foreign keys use their configured safe deletion
        behavior (for example, featured images are set to null).
        """
        removed = 0
        for asset in MediaAsset.objects.filter(file__startswith="media/seed/").iterator():
            if not asset.file.storage.exists(asset.file.name):
                asset.delete()
                removed += 1

        if removed:
            self.stdout.write(f"  Removed {removed} broken seed media record(s).")
        return removed

    def _create_identity_and_siteconfig_drafts(self):
        """Create safe, review-only records without real contact data or assets."""
        profile, profile_created = SiteProfile.objects.get_or_create(
            name_en="Taha Mohamadi",
            defaults={
                "name_fa": "طاها محمدی",
                "headline_fa": "پژوهشگر و توسعه‌دهنده",
                "headline_en": "Researcher & Developer",
                "status": "published",
                "created_by": "seed",
                "updated_by": "seed",
            },
        )
        if profile_created:
            self.stdout.write("  Created published identity profile.")

        if not SiteSettings.objects.exists():
            SiteSettings.objects.create(
                site_title_fa="وبسایت شخصی طاها محمدی",
                site_title_en="Taha Mohamadi's Personal Website",
                primary_cta_label_fa="ارتباط با من",
                primary_cta_label_en="Contact Me",
                primary_cta_url="/en/contact",
                status="published",
                created_by="seed",
                updated_by="seed",
            )
            self.stdout.write("  Created published site settings.")

        NavigationItem.objects.get_or_create(
            label_en="Home",
            location="header",
            defaults={
                "label_fa": "خانه",
                "href": "/en",
                "ordering": 0,
                "status": "published",
                "created_by": "seed",
                "updated_by": "seed",
            },
        )

    def _create_skills(self):
        skills = [
            ("Python", "پایتون", "Backend", "بک‌اند", 1),
            ("Django", "جنگو", "Backend", "بک‌اند", 2),
            ("React", "ری‌اکت", "Frontend", "فرانت‌اند", 3),
            ("Next.js", "نکست‌جی‌اس", "Frontend", "فرانت‌اند", 4),
            ("Machine Learning", "یادگیری ماشین", "AI", "هوش مصنوعی", 5),
            ("Docker", "داکر", "DevOps", "دواپس", 6),
        ]
        for name_en, name_fa, cat_en, cat_fa, order in skills:
            Skill.objects.get_or_create(
                name_en=name_en,
                defaults={
                    "name_fa": name_fa,
                    "category_en": cat_en,
                    "category_fa": cat_fa,
                    "ordering": order,
                    "status": "published",
                    "created_by": "seed",
                    "updated_by": "seed",
                },
            )
        self.stdout.write("  Created skills.")

    def _create_experiences(self):
        Experience.objects.get_or_create(
            organization_en="Tech Company",
            title_en="Senior Developer",
            defaults={
                "organization_fa": "شرکت فناوری",
                "title_fa": "توسعه‌دهنده ارشد",
                "summary_en": "Developed scalable backend systems and AI models.",
                "summary_fa": "توسعه سیستم‌های بک‌اند مقیاس‌پذیر و مدل‌های هوش مصنوعی.",
                "started_on": date(2020, 1, 1),
                "ended_on": date(2024, 1, 1),
                "ordering": 1,
                "status": "published",
                "created_by": "seed",
                "updated_by": "seed",
            },
        )
        self.stdout.write("  Created experiences.")

    def _create_educations(self):
        Education.objects.get_or_create(
            institution_en="University of Technology",
            degree_en="Master of Science",
            defaults={
                "institution_fa": "دانشگاه صنعتی",
                "degree_fa": "کارشناسی ارشد",
                "field_en": "Computer Engineering",
                "field_fa": "مهندسی کامپیوتر",
                "started_on": date(2018, 9, 1),
                "ended_on": date(2020, 9, 1),
                "ordering": 1,
                "status": "published",
                "created_by": "seed",
                "updated_by": "seed",
            },
        )
        self.stdout.write("  Created educations.")

    def _create_publications(self):
        Publication.objects.get_or_create(
            title_en="An Approach to AI Development",
            defaults={
                "title_fa": "رویکردی بر توسعه هوش مصنوعی",
                "slug_en": "approach-to-ai-development",
                "slug_fa": "approach-to-ai-development",
                "publication_type": "article",
                "citation": "Journal of AI",
                "published_on": date(2022, 5, 15),
                "status": "published",
                "created_by": "seed",
                "updated_by": "seed",
            },
        )
        self.stdout.write("  Created publications.")

    def _create_social_links(self):
        SocialLink.objects.get_or_create(
            label_en="GitHub",
            url="https://github.com/tahamohamadi",
            defaults={
                "label_fa": "گیت‌هاب",
                "ordering": 1,
                "status": "published",
                "created_by": "seed",
                "updated_by": "seed",
            },
        )
        SocialLink.objects.get_or_create(
            label_en="LinkedIn",
            url="https://linkedin.com/in/tahamohamadi",
            defaults={
                "label_fa": "لینکدین",
                "ordering": 2,
                "status": "published",
                "created_by": "seed",
                "updated_by": "seed",
            },
        )
        self.stdout.write("  Created social links.")

    def _create_pages(self):
        """Create sample CMS pages with sections and blocks."""
        pages_data: list[dict[str, Any]] = [
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
        articles_data: list[dict[str, Any]] = [
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
        cases_data: list[dict[str, Any]] = [
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
