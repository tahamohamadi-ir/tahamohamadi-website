"""Blog admin configuration — placeholder."""

from django.contrib import admin

from apps.blog.models import Article, ArticleBlock, Topic

admin.site.register(Topic)
admin.site.register(Article)
admin.site.register(ArticleBlock)
