# Composer demo seed (development only)

Run the demo only against an **empty development database**:

```text
python manage.py seed_composer_demo
```

The command is opt-in and runs only when `DEBUG=true`. It creates a bilingual,
Draft-only Composer page, neutral development SVG media, draft site records, and
a draft case study. It never creates a user or published content.

Do not run this command in production. Do not use its demo content or assets as
production content. The command refuses a non-empty CMS, identity, siteconfig,
or portfolio dataset.
