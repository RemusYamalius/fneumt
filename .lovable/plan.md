
# إصلاح التمزق اللوني (Tearing) على الهاتف فقط

## ملخص التشخيص
- **لا يوجد** في المشروع: `animate-float`, `whileInView`, `mask-image`, `will-change: transform` على containers، ولا `translate3d/translateZ` يدوية. الإصلاح إذن هو **حماية وقائية شاملة** عبر CSS عام + تعديلات نقطية على المكوّنات الأكثر خطورة.
- **مصادر الخطر الفعلية الموجودة**:
  - `backdrop-blur` كثيف في: header (`gradient-primary` + sticky)، `MoroccoMap` (طبقات tooltip و legend)، `OrbitalStats`، `SearchResultsTable`، `Dashboard`, `QuickFilter`, `PostStats`, `auth-frame`, `auth-top-link`، عشرات القواعد في `index.css` (أسطر 932–1428).
  - `framer-motion` بـ `initial={{ opacity: 0, ... }}` في `MoroccoMap`, `OrbitalStats`, `OrbitalFilter`, `PostStats`, `Index.tsx` (بطاقات الأزرار).
  - Sticky header مع gradient + shimmer beam + blur خلفه = compositing layer ضخم على الموبايل.

## نطاق التغييرات
**الملفات المعدّلة (3 فقط)**:
- `src/index.css` — إضافة طبقة حماية موبايل + utility classes جديدة
- `src/components/AuthenticatedLayout.tsx` — class `gpu-isolate` على `<header>`
- `src/pages/Index.tsx` — class `gpu-isolate` على `<header>` و `<main>`

**لا تغييرات** على Desktop، لا تغييرات في الـ layout، لا حذف أنيميشن خارج الموبايل.

## التفاصيل التقنية

### 1) Utilities جديدة في `src/index.css`
```css
@layer utilities {
  .gpu-isolate {
    isolation: isolate;
    contain: layout paint;
  }
  .gpu-contain {
    contain: layout paint;
  }
}
```

### 2) كتلة حماية موبايل شاملة (تُضاف في نهاية `src/index.css`)
```css
@media (max-width: 768px) {
  /* a) منع scroll horizontal accidents وتحسين اللمس */
  html, body {
    touch-action: pan-y;
    overflow-x: hidden;
  }

  /* b) استبدال backdrop-blur بـ solid fallback (السبب الرئيسي للـ tearing) */
  .glass,
  .glass-dark,
  .auth-frame,
  .auth-top-link,
  [class*="backdrop-blur"] {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  /* c) Header sticky: خلفية صلبة بدل شفّافة */
  header.gradient-primary,
  header.gpu-isolate {
    background: hsl(207 75% 17%) !important;
  }

  /* d) إلغاء will-change على أي parent (وقائي) */
  *, *::before, *::after {
    will-change: auto !important;
  }

  /* e) ضمان ظهور كل شيء بعد تعطيل أنيميشن الدخول */
  [data-framer-appear-id],
  .motion-safe-card,
  main section,
  main article,
  main [class*="card"] {
    opacity: 1 !important;
    visibility: visible !important;
    transform: none !important;
  }

  /* f) تعطيل أنيميشن الدخول الزخرفية، الإبقاء على الأنيميشن التفاعلية (hover/tap) */
  @media (prefers-reduced-motion: no-preference) {
    .animate-fade-in,
    .animate-scale-in,
    .animate-slide-in-right {
      animation: none !important;
    }
  }
}
```

### 3) `AuthenticatedLayout.tsx`
- إضافة `gpu-isolate` إلى `<header className="gradient-primary text-white shadow-lg sticky top-0 z-50">`.

### 4) `Index.tsx`
- إضافة `gpu-isolate` إلى `<header className="gradient-hero relative overflow-hidden">` و إلى `<main>`.
- إضافة `overflow-hidden` للـ wrapper الأم للبطاقات (موجود فعلياً).

## لماذا هذا النهج (وليس تعديل كل مكوّن)
- **السبب الجذري** للتمزق على iOS/Android Chrome هو تكدّس layers من `backdrop-filter` فوق sticky gradient فوق framer-motion transforms. التعطيل المركزي عبر media query واحدة يحلّ المشكلة دون لمس منطق المكوّنات.
- استخدام `[class*="backdrop-blur"]` يلتقط كل استخدامات Tailwind (`backdrop-blur-sm`, `-md`, `-xl`) دفعة واحدة.
- `opacity: 1 !important` + `transform: none !important` يضمن أن أي عنصر framer-motion عالق على `initial={{ opacity: 0 }}` يبقى مرئياً (تأمين ضد فشل أي entrance animation).

## التحقق بعد التطبيق
- مراجعة Preview بعرض 375px و 390px (بأداة الموبايل فوق المعاينة).
- التأكد من اختفاء الخطوط الملوّنة بين الـ sections.
- التأكد من أن Desktop (≥769px) **بدون أي تغيير بصري**.

