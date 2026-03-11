

# تعديلات المرحلة الثانية + تغيير الخلفية والأنماط

## 1. نقل اسم الأيقونة المختارة فوق العجلة (المرحلة الثانية)

**المشكلة:** الاسم يدور مع الأيقونة ويُقطع أو يتوقف بشكل متكرر.

**الحل:** حذف الـ outer-orbit label المتحرك (سطر 163-189 في NewRequest.tsx) واستبداله بعنصر **ثابت** فوق العجلة الدوارة يعرض اسم الفئة المختارة. سيكون `div` مُموضَع فوق حاوية الـ OrbitalHub مباشرة، بنفس لون الفئة المختارة.

## 2. تغيير خلفية الصفحة وتطبيق تأثير Glass/Blur

**المشكلة:** اللون السوداوي الداكن للخلفية والأيقونات غير مرغوب فيه.

**الحل:** استبدال التدرج الحالي بتدرج أزرق-سماوي (teal to blue gradient) مشابه للصورة المرجعية، وتطبيق `backdrop-filter: blur` + خلفية شبه شفافة على جميع البطاقات والأيقونات.

## التعديلات التقنية

### `src/pages/NewRequest.tsx`
- **حذف** كتلة outer-orbit label (سطر 163-189): الاسم المتحرك خارج المدار
- **إضافة** في المكون `OrbitalHub`: عندما `isSmall && selectedKey`، عرض اسم الفئة المختارة كـ `div` ثابت فوق العجلة (خارج الحاوية الدائرية، أعلاها)
- تعديل موضع العرض: إرجاع الاسم كجزء من الـ return value ليُعرض فوق العجلة

### `src/index.css` — تغيير الألوان والأنماط

| الكلاس | التعديل |
|---|---|
| `.futuristic-bg` | تدرج من `hsl(195 80% 25%)` إلى `hsl(210 70% 20%)` (أزرق-سماوي عميق) |
| `.futuristic-bg::before` | تحديث الـ radial gradients بألوان teal/cyan أفتح |
| `.orbital-item-default` | `background: rgba(255 255 255 / 0.08)` + `backdrop-filter: blur(12px)` + حدود شبه شفافة |
| `.orbital-item-selected` | `background: rgba(255 255 255 / 0.15)` + `backdrop-filter: blur(16px)` |
| `.orbital-center` | خلفية زجاجية شفافة بدل السوداء |
| `.futuristic-card` | `background: rgba(255 255 255 / 0.1)` + `backdrop-filter: blur(20px)` + حدود `rgba(255 255 255 / 0.15)` |
| `.futuristic-level-card` | نفس النمط الزجاجي |
| `.futuristic-upload-zone` | خلفية زجاجية |
| `.futuristic-review-card` | خلفية زجاجية |
| `.futuristic-file-item` | خلفية زجاجية |
| `.futuristic-btn-primary` | إبقاء التدرج مع إضافة blur |

