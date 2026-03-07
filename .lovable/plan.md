

# تحديث تسلسل حركات اللوغو

## الوصف
إنشاء مكوّن `AnimatedLogo` مع تسلسل زمني صحيح:
- **الثواني 0–3**: لمعان دوران على المحيط الدائري فقط
- **الثواني 3–6**: وميض بريق كهربائي داخلي فقط
- **تكرار لا نهائي** بدورة 6 ثوانٍ

## التفاصيل التقنية

### 1. إنشاء `src/components/AnimatedLogo.tsx`
- حاوية دائرية (`rounded-full`, `overflow-hidden`)
- طبقة دوران محيطية: `conic-gradient` بلون سيان/نيون، `animation: border-shine 6s linear infinite` — تدور فقط في النصف الأول (0-3s) عبر تحكم `opacity` بـ keyframes
- طبقة وميض داخلي: `radial-gradient` أبيض، `animation: sparkle 6s infinite` — تظهر فقط في النصف الثاني (3s-6s)
- Props: `size`, `className`

### 2. Keyframes في `src/index.css`
```css
/* الدوران المحيطي: يظهر 0-50% (0-3s)، يختفي 50-100% */
@keyframes logo-border-shine {
  0%   { opacity: 1; transform: rotate(0deg); }
  50%  { opacity: 1; transform: rotate(360deg); }
  50.1%{ opacity: 0; transform: rotate(360deg); }
  100% { opacity: 0; transform: rotate(720deg); }
}

/* الوميض الداخلي: يختفي 0-50% (0-3s)، يظهر 50-100% */
@keyframes logo-sparkle {
  0%   { opacity: 0; }
  50%  { opacity: 0; }
  55%  { opacity: 0.7; }
  75%  { opacity: 0.3; }
  85%  { opacity: 0.6; }
  95%  { opacity: 0; }
  100% { opacity: 0; }
}
```

### 3. استبدال اللوغو في 12 ملف
- نسخ `FNEUMT.png` إلى `src/assets/logo-fne.png`
- استبدال كل `<img src={logoFne} ...>` بـ `<AnimatedLogo size="..." />`
- الأحجام حسب السياق: `w-24 h-24` للهيرو، `w-10 h-10` للهيدر، `w-14 h-14` و `w-16 h-16` للصفحات الأخرى

