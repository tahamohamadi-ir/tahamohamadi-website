# Performance Audit Report

> Last verified: 2025-07-15
> Target: Core Web Vitals — LCP < 2.5s, CLS < 0.1, FID/INP < 100ms

## Summary

| Metric | Target | Expected | Status |
| -------- | -------- | ---------- | -------- |
| LCP (Largest Contentful Paint) | < 2.5s | < 1.5s | ✅ Architecture supports |
| CLS (Cumulative Layout Shift) | < 0.1 | ~0 | ✅ Architecture supports |
| FID/INP (First Input Delay / Interaction to Next Paint) | < 100ms | < 50ms | ✅ Architecture supports |

## Architecture Review

### 1. Server-Side Rendering (SSR) — No Client-Side Rendering for Public Pages

**Status: ✅ Verified**

All public pages under `app/[locale]/` are React Server Components (RSC). No `"use client"` directives exist in public page files:

- `app/[locale]/page.tsx` — SSR with `getPublicPage()` fetch
- `app/[locale]/blog/page.tsx` — SSR blog listing
- `app/[locale]/blog/[slug]/page.tsx` — SSR article detail
- `app/[locale]/portfolio/page.tsx` — SSR portfolio listing
- `app/[locale]/portfolio/[slug]/page.tsx` — SSR case study
- `app/[locale]/about/page.tsx` — SSR about page
- `app/[locale]/resume/page.tsx` — SSR resume page
- `app/[locale]/research/page.tsx` — SSR research page
- `app/[locale]/publications/page.tsx` — SSR publications page
- `app/[locale]/contact/page.tsx` — SSR contact page

**Impact on LCP:** HTML is server-rendered and sent immediately; no client-side data fetching delays first paint.

### 2. Image Optimization (next/image with AVIF/WebP)

**Status: ✅ Configured**

`next.config.ts` configures:

```typescript
images: {
  formats: ["image/avif", "image/webp"],
  qualities: [60, 75, 80, 90],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

- **AVIF preferred** (40-50% smaller than WebP) with WebP fallback
- **Responsive srcset** generated at multiple device/image sizes
- **Lazy loading** by default for below-fold images (Next.js behavior)
- **Priority loading** for above-fold hero images via `priority` prop

**Impact on LCP:** Hero images served in modern formats at optimal size, reducing download time.

### 3. Code Splitting (Separate Admin/Public Bundles)

**Status: ✅ Verified**

Next.js 15 App Router provides automatic per-route code splitting:

- **Route separation:** `app/[locale]/` (public) vs `app/admin/` (admin)
- **Admin-only deps isolated:** @dnd-kit, @tiptap packages only imported by `src/components/admin/`
- **No cross-contamination:** Public pages never import admin components
- **Per-route chunks:** Each route gets its own JS chunk via `.next/app-build-manifest.json`

**Impact on FID/INP:** Minimal JS on public pages (RSC = zero client JS for static content).

### 4. Font Optimization (Preconnect, Swap, next/font)

**Status: ✅ Configured**

Fonts are loaded via `next/font/google` with optimal settings:

```typescript
// Inter (Latin/English)
Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })

// Vazirmatn (Persian/Arabic)
Vazirmatn({ subsets: ["arabic"], variable: "--font-vazirmatn", display: "swap" })
```

- **`display: "swap"`** — prevents FOIT (Flash of Invisible Text), shows fallback immediately
- **`next/font`** — self-hosts fonts, eliminates third-party DNS lookup / render-blocking
- **Subset loading** — only loads required character subsets (latin, arabic)
- **CSS variable injection** — no layout shift from font loading

**Impact on CLS:** Zero layout shift from font loading (swap + matched fallback metrics).
**Impact on LCP:** No render-blocking font requests (self-hosted, preloaded).

### 5. No Render-Blocking Resources

**Status: ✅ Verified**

- **CSS:** Tailwind CSS 4 uses build-time processing; styles are inlined or efficiently chunked
- **JavaScript:** App Router defers non-critical JS; public pages have minimal client JS
- **Fonts:** Self-hosted via `next/font` (no external stylesheet blocking render)
- **No external CSS CDNs:** No Google Fonts stylesheet link (next/font handles this)
- **No third-party scripts:** No analytics/tracking scripts blocking first paint

### 6. Compression (Gzip)

**Status: ✅ Configured**

Nginx configuration enables gzip compression:

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_min_length 256;
gzip_types text/plain text/css text/javascript application/json
           application/javascript image/svg+xml font/woff font/woff2;
```

### 7. Caching Strategy

**Status: ✅ Partially Configured**

- **Static assets** (`/static/`): `expires 30d` + `Cache-Control: public, immutable`
- **Media files** (`/media/`): `expires 30d` + `Cache-Control: public, immutable`
- **Next.js `_next/static/`**: Immutable by default (content-hashed filenames)

### 8. Standalone Output

**Status: ✅ Configured**

```typescript
output: "standalone"
```

Produces a minimal production bundle with only required dependencies, reducing container size and cold-start time.

## CLS Prevention Checklist

| Technique | Status | Notes |
| ----------- | -------- | ------- |
| Reserved image dimensions | ✅ | next/image provides width/height |
| Font swap with matched metrics | ✅ | next/font auto-generates fallback metrics |
| No injected banners/ads above fold | ✅ | No third-party injections |
| Stable layout (no dynamic inserts above fold) | ✅ | SSR provides full layout on first paint |
| No late-loading CSS that shifts layout | ✅ | Tailwind is build-time; no FOUC |

## LCP Optimization Checklist

| Technique | Status | Notes |
| ----------- | -------- | ------- |
| SSR (no client-fetch delay) | ✅ | All public pages are RSC |
| Image format optimization (AVIF/WebP) | ✅ | Configured in next.config.ts |
| Priority loading for hero images | ✅ | Use `priority` prop on above-fold images |
| Self-hosted fonts (no DNS lookup) | ✅ | next/font/google with self-hosting |
| Gzip compression | ✅ | Nginx level 6 compression |
| No render-blocking resources | ✅ | No external CSS/JS blocking paint |

## FID/INP Optimization Checklist

| Technique | Status | Notes |
| ----------- | -------- | ------- |
| Minimal client JS on public pages | ✅ | RSC = zero client bundle for static content |
| Admin code not shipped to public | ✅ | Separate route groups, no cross-imports |
| No heavy computations on main thread | ✅ | No client-side data processing |
| Event handlers are lightweight | ✅ | Only minimal interactivity (language switcher) |

## Manual Lighthouse Testing Steps

### Prerequisites

1. Build the production frontend: `cd frontend && npm run build`
2. Start the production stack: `docker compose up -d`
3. Ensure the site is accessible at `http://localhost` or your staging URL

### Running Lighthouse

#### Option A: Chrome DevTools

1. Open Chrome → Navigate to the target page (e.g., `http://localhost/fa`)
2. Open DevTools (F12) → **Lighthouse** tab
3. Select:
   - Categories: **Performance**, **Accessibility**, **Best Practices**, **SEO**
   - Device: **Mobile** (primary target) and **Desktop**
4. Click **Analyze page load**
5. Review metrics: LCP, CLS, FID/TBT

#### Option B: Lighthouse CLI

```bash
# Install globally
npm install -g lighthouse

# Run against public pages
lighthouse http://localhost/fa --output=html --output-path=./lighthouse-fa.html
lighthouse http://localhost/en --output=html --output-path=./lighthouse-en.html
lighthouse http://localhost/fa/blog --output=html --output-path=./lighthouse-blog.html
lighthouse http://localhost/fa/portfolio --output=html --output-path=./lighthouse-portfolio.html
```

#### Option C: Lighthouse CI (Automated)

```bash
# Install
npm install -g @lhci/cli

# Run with config
lhci autorun --config=.lighthouserc.json
```

### Pages to Audit

| Page | URL | Priority |
| ------ | ----- | ---------- |
| Home (fa) | `/fa` | High |
| Home (en) | `/en` | High |
| Blog listing | `/fa/blog` | High |
| Blog article | `/fa/blog/[slug]` | High |
| Portfolio | `/fa/portfolio` | Medium |
| Case study | `/fa/portfolio/[slug]` | Medium |
| About | `/fa/about` | Low |
| Contact | `/fa/contact` | Low |

### Expected Results

Based on the architecture review, expected Lighthouse scores for public pages:

| Category | Expected Score |
| ---------- | --------------- |
| Performance | 90-100 |
| Accessibility | 90-100 |
| Best Practices | 90-100 |
| SEO | 95-100 |

### Troubleshooting

If scores are below target:

1. **LCP > 2.5s** — Check hero image size, ensure `priority` prop is set, verify server response time
2. **CLS > 0.1** — Look for images without dimensions, late-loading content, dynamic content injection
3. **FID/INP > 100ms** — Check for heavy client-side JS, long tasks, third-party scripts
4. **TBT (Total Blocking Time) high** — Indicates too much JS executing on main thread
