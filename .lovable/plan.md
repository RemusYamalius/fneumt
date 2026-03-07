

# تعديل أزرار التبويب وتغيير الخط في صفحة تسجيل الدخول

## التعديلات المطلوبة

### 1. موضع الأزرار — محاذاة لحافة اللوحة البيضاء
- في `src/pages/Login.tsx`: تغيير حاوية الأزرار لتكون `items-end` (RTL = أقصى اليسار، LTR = أقصى اليمين) مع `pe-0` و `ps-0` حسب الاتجاه
- الأزرار حالياً `width: 100%` — يجب تغييرها إلى `width: auto` لتتقلص حول النص

### 2. تقليص حجم الأزرار
- في `src/index.css` `.login-left-tab`: تغيير `width: 100%` إلى `width: auto` وتقليل `padding` من `0.75rem 2rem` إلى `0.6rem 1.2rem`
- ضمان أن الزرين لهما نفس العرض عبر `min-width` مشترك أو ترك `auto` مع padding متساوي

### 3. تغيير الخط
- استبدال خط Tajawal/Roboto بخط أكثر أناقة: **Cairo** للعربية و **Inter** للاتينية
- تحديث `@import` في `src/index.css` وقواعد `font-family` في `[dir="rtl"]` و `[dir="ltr"]`
- تحديث `tailwind.config.ts` بالخطوط الجديدة

### الملفات المعدلة
- `src/index.css` — خط جديد + تعديل `.login-left-tab`
- `src/pages/Login.tsx` — تعديل حاوية الأزرار
- `tailwind.config.ts` — تحديث fontFamily

