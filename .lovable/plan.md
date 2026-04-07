

# خطة: تحسين أداء التصفح وتقليل البطء

## المشاكل المحددة

### 1. `useAnimationFrame` يُعيد رسم React على كل إطار (~60 مرة/ثانية)
في `OrbitalFilter.tsx`، كل `FilterRing` يستخدم `useAnimationFrame` مع `setCurrentRotation()` — أي **setState على كل إطار**. مع 5 حلقات (Gender, Membership, Academy, Directorate, Mission)، هذا يعني **~300 re-render في الثانية**. هذا هو السبب الرئيسي للبطء.

نفس المشكلة في `NewRequest.tsx` مع `setRotation` على كل إطار.

### 2. `backdrop-blur` فوق محتوى متحرك
عدة عناصر في QuickFilter و OrbitalFilter تستخدم `backdrop-blur-xl` فوق محتوى SVG متحرك، مما يُجبر المتصفح على إعادة حساب التمويه في كل إطار.

### 3. `AnimatedLogo` يستخدم `backdrop-blur-sm`
اللوغو المستخدم في كل صفحة (عبر AuthenticatedLayout) يحتوي على `backdrop-blur-sm`، مما يزيد تكلفة الرسم.

## الحلول

### الملف 1: `src/components/OrbitalFilter.tsx`
- **إزالة `setCurrentRotation` من `useAnimationFrame`**: بدلاً من setState، استخدام `ref` مباشرة لتحديث `transform` عبر DOM API (`groupRef.current.style.transform`). هذا يلغي إعادة رسم React تماماً أثناء الدوران.
- **إزالة `backdrop-blur-sm`** من زر fullscreen (سطر 502).

### الملف 2: `src/pages/NewRequest.tsx`
- نفس الإصلاح: تحويل `setRotation` إلى تحديث DOM مباشر عبر ref بدلاً من setState.

### الملف 3: `src/pages/QuickFilter.tsx`
- إزالة `backdrop-blur-xl` من overlay الـ fullscreen (سطر 220) واستبدالها بـ `bg-background`.
- إزالة `backdrop-blur-xl` من قسم الفلتر (سطر 316) واستبدالها بـ `bg-card`.
- إزالة `backdrop-blur-xl` من بطاقة "لا توجد نتائج" (سطر 349) واستبدالها بـ `bg-card/90` مع `text-shadow`.

### الملف 4: `src/components/AnimatedLogo.tsx`
- إزالة `backdrop-blur-sm` من الطبقة الخلفية (سطر 20) واستبدالها بـ `bg-white/15` فقط.

## النتيجة المتوقعة
- تقليل re-renders من ~300/ثانية إلى ~0 أثناء الدوران التلقائي
- إلغاء تكلفة `backdrop-blur` فوق المحتوى المتحرك
- تحسن ملحوظ في سلاسة التصفح خاصة على الأجهزة المحمولة

## الملفات المتأثرة
```
src/components/OrbitalFilter.tsx
src/pages/NewRequest.tsx
src/pages/QuickFilter.tsx
src/components/AnimatedLogo.tsx
```

