

# خطة التعديلات الأربعة

## 1. محاذاة تبويبات "المسجلون" و "المكاتب المحلية" لليمين في RTL

### `src/pages/DatabaseDashboard.tsx` (سطر 521)
تغيير `justify-start` إلى `justify-end rtl:justify-end ltr:justify-start` في `TabsList`، أو الأبسط: استخدام `justify-start` مع `dir={dir}` على العنصر الأب — لكن المشكلة أن `TabsList` لا يحترم `dir`. الحل: إضافة `dir={dir}` على `TabsList` أو تغيير `justify-start` إلى class يراعي الاتجاه.

**الحل**: تغيير `justify-start` في `TabsList` إلى فقط حذفها (أو استبدالها بـ `justify-start`) مع إضافة `dir={dir}` على عنصر `Tabs`.

## 2. زر "فلاتر متقدمة" ملون مع بريق وظل

### `src/pages/DatabaseDashboard.tsx` (سطر 388-404)
- تحويل الزر إلى زر ملون بتدرج (gradient) مثل أزرار "العودة"
- إضافة `shadow-lg` للظل البارز
- إضافة تأثير بريق (shimmer) عبر CSS animation باستخدام `@keyframes shimmer` مع pseudo-element `::after` أو عبر كلاس Tailwind مخصص

### `src/index.css`
إضافة `@keyframes shimmer` animation يمر كل 3 ثوان.

## 3. تلوين عناوين خانات الفلاتر بخلفيات مختلفة

### `src/pages/DatabaseDashboard.tsx` (سطور 417-504)
تحويل كل `<label>` داخل الفلاتر من `text-xs font-medium text-muted-foreground` إلى نص أكبر (`text-sm font-bold`) مع خلفية ملونة خفيفة (`px-2 py-0.5 rounded-md`) بلون مختلف لكل فلتر:
- الأكاديمية: `bg-blue-100/60 text-blue-700`
- المديرية: `bg-emerald-100/60 text-emerald-700`
- المؤسسة: `bg-amber-100/60 text-amber-700`
- النوع: `bg-pink-100/60 text-pink-700`
- المهمة: `bg-purple-100/60 text-purple-700`
- السن: `bg-cyan-100/60 text-cyan-700`
- الانخراط: `bg-orange-100/60 text-orange-700`
- رقم التأجير: `bg-indigo-100/60 text-indigo-700`
- الهاتف: `bg-teal-100/60 text-teal-700`

## 4. إصلاح محاذاة إحصائيات المنشور في PostStats (RTL)

### `src/components/PostStats.tsx`
- سطر 162: إضافة `dir={dir}` على الحاوية الرئيسية `<div className="space-y-4" dir={dir}>`
- سطر 203: إضافة `flex-wrap` وتأكيد أن `flex` يحترم الاتجاه

## الملفات المتأثرة
- `src/pages/DatabaseDashboard.tsx` — تبويبات + زر فلاتر + عناوين الخانات
- `src/components/PostStats.tsx` — محاذاة RTL
- `src/index.css` — animation shimmer

