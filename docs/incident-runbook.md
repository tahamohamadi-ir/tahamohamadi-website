# Incident Runbook — tahamohamadi.ir

مستند عملیاتی برای بکاپ، ریستور، مایگریشن و رویه‌های اضطراری.

---

## 1. بکاپ گرفتن

### بکاپ خودکار (روزانه)

```bash
# اجرا از ریشه پروژه
./scripts/backup.sh

# با تنظیمات سفارشی
./scripts/backup.sh -d /path/to/backups -k 14 -f docker-compose.prod.yml
```

**محتوای بکاپ:** PostgreSQL dump (`pg_dump -Fc`) + media files → یک فایل `.tar.gz`

### تنظیم Cron (روی سرور)

```bash
# هر شب ساعت ۲:۰۰ صبح
0 2 * * * cd /opt/tahamohamadi-website && ./scripts/backup.sh >> /var/log/backup.log 2>&1
```

### بررسی موفقیت بکاپ

```bash
ls -la backups/
# خروجی نمونه: backup_20260809_020000.tar.gz (باید سایز > 0 داشته باشد)

tar -tzf backups/backup_20260809_020000.tar.gz | head
# باید db.dump و media/ را نشان دهد
```

---

## 2. ریستور از بکاپ

### ریستور کامل (Database + Media)

```bash
./scripts/restore.sh backups/backup_20260809_020000.tar.gz
```

### ریستور فقط دیتابیس

```bash
./scripts/restore.sh --db-only backups/backup_20260809_020000.tar.gz
```

### ریستور فقط مدیا

```bash
./scripts/restore.sh --media-only backups/backup_20260809_020000.tar.gz
```

> [!CAUTION]
> ریستور دیتابیس، **تمام داده‌های فعلی را جایگزین** می‌کند. حتماً قبل از ریستور، یک بکاپ جدید بگیرید.

---

## 3. مایگریشن دیتابیس

### اعمال مایگریشن‌ها

```bash
docker compose -f docker-compose.prod.yml exec django python manage.py migrate
```

### بررسی مایگریشن‌های pending

```bash
docker compose -f docker-compose.prod.yml exec django python manage.py showmigrations | grep "\[ \]"
```

### رول‌بک مایگریشن

```bash
# رول‌بک به مایگریشن خاص (مثال: portfolio app به مایگریشن 0003)
docker compose -f docker-compose.prod.yml exec django python manage.py migrate portfolio 0003

# بررسی وضعیت بعد از رول‌بک
docker compose -f docker-compose.prod.yml exec django python manage.py showmigrations portfolio
```

> [!WARNING]
> مایگریشن‌هایی که data migration دارند ممکن است قابل رول‌بک نباشند. قبل از اعمال مایگریشن در production، حتماً در staging تست کنید.

---

## 4. رویه اضطراری — سایت Down است

### چک‌لیست تشخیص

```bash
# 1. بررسی سرویس‌ها
docker compose -f docker-compose.prod.yml ps

# 2. بررسی لاگ‌ها
docker compose -f docker-compose.prod.yml logs --tail=50 django
docker compose -f docker-compose.prod.yml logs --tail=50 nginx
docker compose -f docker-compose.prod.yml logs --tail=50 postgres

# 3. Health check
curl -s http://localhost:8000/api/public/health/ | python -m json.tool
```

### ری‌استارت سرویس‌ها

```bash
# ری‌استارت همه
docker compose -f docker-compose.prod.yml restart

# ری‌استارت سرویس خاص
docker compose -f docker-compose.prod.yml restart django
docker compose -f docker-compose.prod.yml restart nginx
```

### PostgreSQL کرش کرده

```bash
# بررسی وضعیت
docker compose -f docker-compose.prod.yml exec postgres pg_isready

# ری‌استارت PostgreSQL
docker compose -f docker-compose.prod.yml restart postgres

# اگر volume خراب شده، ریستور از بکاپ
docker compose -f docker-compose.prod.yml down
docker volume rm tahamohamadi-website_postgres_data
docker compose -f docker-compose.prod.yml up -d postgres
# صبر کنید تا healthy شود، سپس:
./scripts/restore.sh --db-only backups/LATEST_BACKUP.tar.gz
docker compose -f docker-compose.prod.yml up -d
```

---

## 5. دیپلوی نسخه جدید

### رویه استاندارد

```bash
# 1. بکاپ قبل از دیپلوی
./scripts/backup.sh

# 2. پول کردن تغییرات
git pull origin main

# 3. بیلد و ری‌استارت
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 4. مایگریشن
docker compose -f docker-compose.prod.yml exec django python manage.py migrate

# 5. Collect static (اگر لازم باشد)
docker compose -f docker-compose.prod.yml exec django python manage.py collectstatic --noinput

# 6. بررسی سلامت
curl -s http://localhost:8000/api/public/health/
```

### رول‌بک دیپلوی

```bash
# 1. برگشت به commit قبلی
git log --oneline -5  # پیدا کردن commit قبلی
git checkout <PREVIOUS_COMMIT_HASH>

# 2. ریبیلد و ری‌استارت
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 3. رول‌بک مایگریشن (اگر لازم باشد)
docker compose -f docker-compose.prod.yml exec django python manage.py migrate <app> <previous_migration>
```

---

## 6. SSL Certificate تمدید

```bash
# تمدید خودکار
docker compose -f docker-compose.prod.yml run --rm certbot renew
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

# تنظیم Cron (ماهانه)
0 3 1 * * cd /opt/tahamohamadi-website && docker compose -f docker-compose.prod.yml run --rm certbot renew && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload >> /var/log/cert-renew.log 2>&1
```

---

## 7. مانیتورینگ فوری

| چه چیزی | کجا | دستور |
| --- | --- | --- |
| Django health | `/api/public/health/` | `curl -s localhost:8000/api/public/health/` |
| Admin health | `/api/admin/health/` | `curl -s localhost:8000/api/admin/health/` (with auth) |
| DB connectivity | postgres container | `docker compose exec postgres pg_isready` |
| Disk usage | سرور | `df -h` |
| Docker disk | سرور | `docker system df` |
| Container logs | هر سرویس | `docker compose logs --tail=100 <service>` |

---

## 8. تماس‌ها و اسکیلیشن

| سطح | زمان پاسخ | اقدام |
| --- | --- | --- |
| P0 — سایت Down | فوری | ری‌استارت → بررسی لاگ → ریستور |
| P1 — عملکرد کند | ۱ ساعت | بررسی لاگ → ری‌استارت سرویس مشکل‌دار |
| P2 — باگ UI | ۲۴ ساعت | لاگ → fix → دیپلوی |
| P3 — بهبود | هفتگی | backlog |
