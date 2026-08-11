'use client';

import React, { useState } from 'react';
import { defineComponent } from '../component-registry';
import type { ComponentRenderProps } from '../registry-types';

// ---------------------------------------------------------------------------
// marketing.hero
// ---------------------------------------------------------------------------
function HeroRenderer({ props }: ComponentRenderProps) {
  const title = (props.title as string) || 'تجربه دیجیتال فوق‌العاده بسازید';
  const subtitle = (props.subtitle as string) || 'پلتفرم هوشمند و مدرن برای طراحی، توسعه و مدیریت وب‌سایت‌های پیشرفته با سرعت و کیفیت بی‌نظیر.';
  const primaryCta = (props.primaryCta as string) || 'شروع رایگان';
  const secondaryCta = (props.secondaryCta as string) || 'مشاهده دموی زنده';
  const badgeText = (props.badgeText as string) || '✨ نسل جدید پلتفرم توسعه وب';
  const customStyles = (props.styles as React.CSSProperties) || {};

  return (
    <section
      data-builder-type="marketing.hero"
      style={{
        position: 'relative',
        padding: '6.5rem 1.5rem 5.5rem 1.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.06) 40%, rgba(0, 0, 0, 0) 70%)',
        ...customStyles,
      }}
    >
      {/* Subtle background glow */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '550px',
          height: '550px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.05) 50%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Glassmorphic Pill Badge */}
      {badgeText && (
        <div
          style={{
            zIndex: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: '2rem',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            backdropFilter: 'blur(12px)',
            color: 'var(--foreground, #4f46e5)',
            boxShadow: '0 4px 15px -3px rgba(99, 102, 241, 0.12)',
          }}
        >
          {badgeText}
        </div>
      )}

      {/* Gradient Main Title */}
      <h1
        style={{
          zIndex: 1,
          fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
          fontWeight: 900,
          marginBottom: '1.5rem',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          maxWidth: '54rem',
          background: 'linear-gradient(135deg, var(--foreground, #0f172a) 30%, #4f46e5 70%, #9333ea 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {title}
      </h1>

      {/* Subtitle */}
      <p
        style={{
          zIndex: 1,
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          maxWidth: '42rem',
          marginBottom: '2.75rem',
          lineHeight: 1.7,
          opacity: 0.85,
          color: 'var(--muted-foreground, #475569)',
        }}
      >
        {subtitle}
      </p>

      {/* Action Buttons */}
      <div style={{ zIndex: 1, display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
        <button
          style={{
            padding: '0.875rem 2rem',
            fontSize: '1rem',
            fontWeight: 700,
            borderRadius: '0.75rem',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4), 0 4px 10px -2px rgba(79, 70, 229, 0.2)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(79, 70, 229, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(79, 70, 229, 0.4)';
          }}
        >
          {primaryCta}
          <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>

        {secondaryCta && (
          <button
            style={{
              padding: '0.875rem 2rem',
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '0.75rem',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(10px)',
              color: 'var(--foreground, #0f172a)',
              border: '1px solid var(--border, rgba(203, 213, 225, 0.8))',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = '#818cf8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border, rgba(203, 213, 225, 0.8))';
            }}
          >
            {secondaryCta}
          </button>
        )}
      </div>

      {/* Feature Highlights Row */}
      <div
        style={{
          zIndex: 1,
          marginTop: '3.5rem',
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          fontSize: '0.875rem',
          fontWeight: 600,
          opacity: 0.85,
          color: 'var(--muted-foreground, #64748b)',
        }}
      >
        <span>⚡ ۱۰ برابر سریع‌تر</span>
        <span>•</span>
        <span>🚀 ۹۹.۹٪ پایداری سرور</span>
        <span>•</span>
        <span>🎨 طراحی ۱۰۰٪ واکنش‌گرا</span>
      </div>
    </section>
  );
}

export const marketingHero = defineComponent({
  type: 'marketing.hero',
  version: 1,
  meta: { name: 'Hero Section', description: 'Main hero block with title and CTAs', category: 'marketing', icon: 'layout' },
  defaults: {
    title: 'تجربه دیجیتال فوق‌العاده بسازید',
    subtitle: 'پلتفرم هوشمند و مدرن برای طراحی، توسعه و مدیریت وب‌سایت‌های پیشرفته با سرعت و کیفیت بی‌نظیر.',
    primaryCta: 'شروع رایگان',
    secondaryCta: 'مشاهده دموی زنده',
    badgeText: '✨ نسل جدید پلتفرم توسعه وب',
  },
  slots: {},
  capabilities: { style: true, animation: true, responsive: true },
  inspector: ['content', 'style', 'settings', 'animation'],
  render: HeroRenderer,
});

// ---------------------------------------------------------------------------
// marketing.features
// ---------------------------------------------------------------------------
function FeaturesRenderer({ props }: ComponentRenderProps) {
  const items = (props.items as Array<{ title: string; desc: string; icon?: string }>) || [
    { title: 'عملکرد فوق‌العاده سریع', desc: 'بهینه‌سازی شده برای بالاترین سرعت بارگذاری و رتبه عالی سئو در موتورهای جستجو.' },
    { title: 'طراحی مدرن و حرفه‌ای', desc: 'ظاهر تمیز، پیشرفته و واکنش‌گرا در تمام دستگا‌ه‌های موبایل و دسکتاپ.' },
    { title: 'استفاده آسان و انعطاف‌پذیر', desc: 'امکان مدیریت و سفارشی‌سازی کامل بدون نیاز به دانش برنامه‌نویسی پیچیده.' },
  ];
  const customStyles = (props.styles as React.CSSProperties) || {};

  const icons = [
    <svg key="1" style={{ width: '22px', height: '22px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    <svg key="2" style={{ width: '22px', height: '22px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>,
    <svg key="3" style={{ width: '22px', height: '22px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>,
  ];

  return (
    <section data-builder-type="marketing.features" style={{ padding: '5rem 1.5rem', ...customStyles }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              padding: '2.25rem',
              borderRadius: '1.25rem',
              backgroundColor: 'var(--background, #ffffff)',
              border: '1px solid var(--border, rgba(226, 232, 240, 0.8))',
              boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 20px 40px -15px rgba(99, 102, 241, 0.15)';
              e.currentTarget.style.borderColor = '#818cf8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(0, 0, 0, 0.04)';
              e.currentTarget.style.borderColor = 'var(--border, rgba(226, 232, 240, 0.8))';
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '0.875rem',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
              }}
            >
              {icons[i % icons.length]}
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.875rem', color: 'var(--foreground, #0f172a)' }}>{item.title}</h3>
            <p style={{ opacity: 0.85, lineHeight: 1.65, color: 'var(--muted-foreground, #475569)', fontSize: '0.95rem' }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export const marketingFeatures = defineComponent({
  type: 'marketing.features',
  version: 1,
  meta: { name: 'Features Grid', description: 'Grid of feature highlights', category: 'marketing', icon: 'grid' },
  defaults: {
    items: [
      { title: 'عملکرد فوق‌العاده سریع', desc: 'بهینه‌سازی شده برای بالاترین سرعت بارگذاری و رتبه عالی سئو در موتورهای جستجو.' },
      { title: 'طراحی مدرن و حرفه‌ای', desc: 'ظاهر تمیز، پیشرفته و واکنش‌گرا در تمام دستگا‌ه‌های موبایل و دسکتاپ.' },
      { title: 'استفاده آسان و انعطاف‌پذیر', desc: 'امکان مدیریت و سفارشی‌سازی کامل بدون نیاز به دانش برنامه‌نویسی پیچیده.' },
    ],
  },
  slots: {},
  capabilities: { style: true, animation: true, responsive: true },
  inspector: ['content', 'style', 'settings', 'animation'],
  render: FeaturesRenderer,
});

// ---------------------------------------------------------------------------
// marketing.testimonial
// ---------------------------------------------------------------------------
function TestimonialRenderer({ props }: ComponentRenderProps) {
  const quote = (props.quote as string) || "این پلتفرم کیفیت و سرعت توسعه پروژه‌های ما را به طور شگفت‌انگیزی ارتقا داد. استفاده از آن فوق‌العاده لذت‌بخش است!";
  const author = (props.author as string) || "سارا محمدی";
  const role = (props.role as string) || "مدیر محصول، استودیو خلاق";
  const customStyles = (props.styles as React.CSSProperties) || {};

  return (
    <div
      data-builder-type="marketing.testimonial"
      style={{
        padding: '3rem 2.5rem',
        borderRadius: '1.5rem',
        border: '1px solid var(--border, rgba(226, 232, 240, 0.8))',
        backgroundColor: 'var(--background, #ffffff)',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
        maxWidth: '650px',
        margin: '0 auto',
        position: 'relative',
        ...customStyles,
      }}
    >
      <div style={{ color: '#f59e0b', fontSize: '1.25rem', marginBottom: '1.25rem', letterSpacing: '0.2em' }}>★★★★★</div>
      <p style={{ fontSize: '1.15rem', fontStyle: 'normal', marginBottom: '2rem', lineHeight: 1.7, color: 'var(--foreground, #1e293b)', fontWeight: 500 }}>
        &quot;{quote}&quot;
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1.1rem',
          }}
        >
          {author.charAt(0)}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--foreground, #0f172a)' }}>{author}</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground, #64748b)', marginTop: '0.2rem' }}>{role}</div>
        </div>
      </div>
    </div>
  );
}

export const marketingTestimonial = defineComponent({
  type: 'marketing.testimonial',
  version: 1,
  meta: { name: 'Testimonial', description: 'Customer review card', category: 'marketing', icon: 'message-square' },
  defaults: { quote: 'کیفیت و سرعت بسیار بالا!', author: 'سارا محمدی', role: 'مدیر محصول' },
  slots: {},
  capabilities: { style: true, animation: true, responsive: true },
  inspector: ['content', 'style', 'settings', 'animation'],
  render: TestimonialRenderer,
});

// ---------------------------------------------------------------------------
// marketing.pricing
// ---------------------------------------------------------------------------
function PricingRenderer({ props }: ComponentRenderProps) {
  const plan = (props.plan as string) || "حرفه‌ای (Pro)";
  const price = (props.price as string) || "۲۹۰,۰۰۰ تومان";
  const features = (props.features as string[]) || ["پروژه‌های نامحدود", "پشتیبانی اختصاصی ۲۴/۷", "دامنه اختصاصی با SSL رایگان", "بهینه‌سازی سئو پیشرفته"];
  const isPopular = (props.isPopular as boolean) ?? true;
  const customStyles = (props.styles as React.CSSProperties) || {};

  return (
    <div
      data-builder-type="marketing.pricing"
      style={{
        padding: '3rem 2.25rem',
        borderRadius: '1.5rem',
        border: isPopular ? '2px solid #6366f1' : '1px solid var(--border, rgba(226, 232, 240, 0.8))',
        backgroundColor: 'var(--background, #ffffff)',
        boxShadow: isPopular ? '0 25px 50px -12px rgba(99, 102, 241, 0.25)' : '0 10px 30px -10px rgba(0, 0, 0, 0.05)',
        position: 'relative',
        maxWidth: '360px',
        margin: '0 auto',
        transition: 'all 0.3s ease',
        ...customStyles,
      }}
    >
      {isPopular && (
        <span
          style={{
            position: 'absolute',
            top: '-14px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            color: '#ffffff',
            padding: '0.35rem 1.25rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 800,
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
          }}
        >
          🔥 محبوب‌ترین انتخاب
        </span>
      )}
      <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--foreground, #0f172a)' }}>{plan}</h3>
      <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2rem', color: '#4f46e5' }}>
        {price}<span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--muted-foreground, #64748b)' }}> / ماهانه</span>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.95rem' }}>
            <svg style={{ width: '18px', height: '18px', color: '#10b981', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span style={{ color: 'var(--foreground, #334155)' }}>{f}</span>
          </li>
        ))}
      </ul>
      <button
        style={{
          width: '100%',
          padding: '0.875rem',
          borderRadius: '0.75rem',
          fontWeight: 700,
          fontSize: '1rem',
          background: isPopular ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : 'var(--muted, #f1f5f9)',
          color: isPopular ? '#ffffff' : 'var(--foreground, #0f172a)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: isPopular ? '0 10px 20px -5px rgba(79, 70, 229, 0.35)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        انتخاب پلن
      </button>
    </div>
  );
}

export const marketingPricing = defineComponent({
  type: 'marketing.pricing',
  version: 1,
  meta: { name: 'Pricing Card', description: 'Subscription tier card', category: 'marketing', icon: 'dollar-sign' },
  defaults: { plan: 'حرفه‌ای (Pro)', price: '۲۹۰,۰۰۰ تومان', isPopular: true, features: ['پروژه‌های نامحدود', 'پشتیبانی اختصاصی ۲۴/۷', 'دامنه اختصاصی با SSL رایگان'] },
  slots: {},
  capabilities: { style: true, animation: true, responsive: true },
  inspector: ['content', 'style', 'settings', 'animation'],
  render: PricingRenderer,
});

// ---------------------------------------------------------------------------
// marketing.faq
// ---------------------------------------------------------------------------
function FaqRenderer({ props, isEditor }: ComponentRenderProps) {
  const items = (props.items as Array<{ q: string; a: string }>) || [
    { q: 'چگونه می‌توانم طراحی وب‌سایت را شروع کنم؟', a: 'کافیست ثبت نام کنید و با استفاده از ابزار بصری، المان‌ها را با کشیدن و رها کردن بچینید.' },
    { q: 'آیا امکان اتصال دامنه اختصاصی وجود دارد؟', a: 'بله، در تمام پلن‌ها امکان اتصال دامنه شخصی با گواهی امنیت SSL رایگان فراهم است.' },
    { q: 'آیا پشتیبانی فنی ارائه می‌شود؟', a: 'تیم پشتیبانی ما ۲۴ ساعته در ۷ روز هفته آماده پاسخگویی و راهنمایی شماست.' },
  ];
  const customStyles = (props.styles as React.CSSProperties) || {};
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div data-builder-type="marketing.faq" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem', ...customStyles }}>
      {items.map((item, i) => {
        const isOpen = openIndex === i || isEditor;
        return (
          <div
            key={i}
            style={{
              borderRadius: '1rem',
              border: '1px solid var(--border, rgba(226, 232, 240, 0.8))',
              backgroundColor: 'var(--background, #ffffff)',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
            }}
          >
            <button 
              onClick={() => !isEditor && setOpenIndex(isOpen ? null : i)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                padding: '1.25rem 1.5rem',
                fontSize: '1.1rem',
                fontWeight: 700,
                cursor: isEditor ? 'default' : 'pointer',
                textAlign: 'right',
                color: 'var(--foreground, #0f172a)',
              }}
            >
              <span>{item.q}</span>
              <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', color: '#6366f1', fontSize: '1.2rem' }}>↓</span>
            </button>
            <div style={{ maxHeight: isOpen ? '300px' : '0px', opacity: isOpen ? 1 : 0, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden' }}>
              <p style={{ padding: '0 1.5rem 1.25rem 1.5rem', opacity: 0.85, lineHeight: 1.7, color: 'var(--muted-foreground, #475569)', fontSize: '0.95rem' }}>{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const marketingFaq = defineComponent({
  type: 'marketing.faq',
  version: 1,
  meta: { name: 'FAQ Accordion', description: 'Frequently asked questions list', category: 'marketing', icon: 'help-circle' },
  defaults: { items: [{ q: 'چگونه شروع کنم؟', a: 'کافیست المان‌ها را با کشیدن و رها کردن اضافه کنید.' }, { q: 'آیا رایگان است؟', a: 'بله، پلن رایگان در دسترس است.' }] },
  slots: {},
  capabilities: { style: true, animation: true, responsive: true },
  inspector: ['content', 'style', 'settings', 'animation'],
  render: FaqRenderer,
});

// ---------------------------------------------------------------------------
// marketing.gallery
// ---------------------------------------------------------------------------
function GalleryRenderer({ props, isEditor }: ComponentRenderProps) {
  const images = (props.images as Array<{ src: string; caption: string }>) || [
    { src: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80', caption: 'طراحی رابط کاربری' },
    { src: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80', caption: 'توسعه فرانت‌اند' },
    { src: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80', caption: 'هنر دیجیتال' },
    { src: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&q=80', caption: 'معماری مدرن' },
  ];
  const customStyles = (props.styles as React.CSSProperties) || {};

  return (
    <div data-builder-type="marketing.gallery" style={{ columns: '1 260px', columnGap: '1.25rem', padding: '1rem', ...customStyles }}>
      {images.map((img, i) => (
        <div
          key={i}
          style={{
            breakInside: 'avoid',
            marginBottom: '1.25rem',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '1rem',
            backgroundColor: '#f1f5f9',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
          }}
        >
          <img src={img.src} alt={img.caption} style={{ width: '100%', display: 'block', transition: 'transform 0.5s ease' }} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, transparent 60%)',
              opacity: isEditor ? 1 : 0.9,
              display: 'flex',
              alignItems: 'flex-end',
              padding: '1.5rem',
            }}
          >
            <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem' }}>{img.caption}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export const marketingGallery = defineComponent({
  type: 'marketing.gallery',
  version: 1,
  meta: { name: 'Masonry Gallery', description: 'Puzzle-style photo gallery', category: 'marketing', icon: 'image' },
  defaults: { images: [{ src: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80', caption: 'تصویر نمونه' }] },
  slots: {},
  capabilities: { style: true, animation: true, responsive: true },
  inspector: ['content', 'style', 'settings', 'animation'],
  render: GalleryRenderer,
});

// ---------------------------------------------------------------------------
// marketing.timeline
// ---------------------------------------------------------------------------
function TimelineRenderer({ props }: ComponentRenderProps) {
  const events = (props.events as Array<{ year: string; title: string; desc: string }>) || [
    { year: '۱۴۰۲ - تاکنون', title: 'ارتقای معماری وب‌سایت', desc: 'پیاده‌سازی پلتفرم Visual Builder و طراحی مدرن دو زبانه.' },
    { year: '۱۴۰۰ - ۱۴۰۲', title: 'توسعه سیستم مدیریت محتوا', desc: 'طراحی بک‌اند Django با ساختار بهینه بلاک‌ها و مدیریت رسانه.' },
    { year: '۱۳۹۸ - ۱۴۰۰', title: 'شروع پروژه', desc: 'تحقیق و راه‌اندازی اولیه پایگاه داده و هویت بصری.' },
  ];
  const customStyles = (props.styles as React.CSSProperties) || {};

  return (
    <div
      data-builder-type="marketing.timeline"
      style={{
        padding: '2rem 1.5rem',
        maxWidth: '800px',
        margin: '0 auto',
        borderRight: '3px solid #818cf8',
        position: 'relative',
        ...customStyles,
      }}
    >
      {events.map((evt, i) => (
        <div key={i} style={{ marginBottom: '2.5rem', paddingRight: '2rem', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              right: '-10px',
              top: '0.25rem',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#4f46e5',
              border: '3px solid var(--background, #ffffff)',
              boxShadow: '0 0 12px #6366f1',
            }}
          />
          <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#4f46e5', marginBottom: '0.35rem' }}>{evt.year}</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground, #0f172a)' }}>{evt.title}</h3>
          <p style={{ opacity: 0.85, lineHeight: 1.65, color: 'var(--muted-foreground, #475569)', fontSize: '0.95rem' }}>{evt.desc}</p>
        </div>
      ))}
    </div>
  );
}

export const marketingTimeline = defineComponent({
  type: 'marketing.timeline',
  version: 1,
  meta: { name: 'Timeline', description: 'Vertical timeline for resume or history', category: 'marketing', icon: 'list' },
  defaults: { events: [{ year: '۱۴۰۲', title: 'عنوان رویداد', desc: 'توضیحات کوتاه رویداد' }] },
  slots: {},
  capabilities: { style: true, animation: true, responsive: true },
  inspector: ['content', 'style', 'settings', 'animation'],
  render: TimelineRenderer,
});

// ---------------------------------------------------------------------------
// marketing.featured-content
// ---------------------------------------------------------------------------
function FeaturedContentRenderer({ props }: ComponentRenderProps) {
  const posts = (props.posts as Array<{ tag: string; title: string; img: string }>) || [
    { tag: 'تکنولوژی', title: 'آینده توسعه وب و هوش مصنوعی', img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80' },
    { tag: 'طراحی رابط کاربری', title: 'اصول فریم‌ورک‌های مدرن CSS', img: 'https://images.unsplash.com/photo-1542051812871-757500933585?w=800&q=80' },
  ];
  const customStyles = (props.styles as React.CSSProperties) || {};

  return (
    <div data-builder-type="marketing.featured-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', padding: '1rem', ...customStyles }}>
      {posts.map((post, i) => (
        <div
          key={i}
          style={{
            borderRadius: '1.25rem',
            overflow: 'hidden',
            backgroundColor: 'var(--background, #ffffff)',
            border: '1px solid var(--border, rgba(226, 232, 240, 0.8))',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
        >
          <div style={{ height: '210px', backgroundColor: '#cbd5e1', position: 'relative', overflow: 'hidden' }}>
            <img src={post.img} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} />
          </div>
          <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#4f46e5', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>{post.tag}</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', lineHeight: 1.5, color: 'var(--foreground, #0f172a)' }}>{post.title}</h3>
            <div style={{ marginTop: 'auto', fontWeight: 700, fontSize: '0.9rem', color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              مشاهده بیشتر <span>←</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export const marketingFeaturedContent = defineComponent({
  type: 'marketing.featured-content',
  version: 1,
  meta: { name: 'Featured Content', description: 'Blog or portfolio cards', category: 'marketing', icon: 'grid' },
  defaults: { posts: [{ tag: 'مقاله', title: 'عنوان مقاله نمونه', img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80' }] },
  slots: {},
  capabilities: { style: true, animation: true, responsive: true },
  inspector: ['content', 'style', 'settings', 'animation'],
  render: FeaturedContentRenderer,
});
