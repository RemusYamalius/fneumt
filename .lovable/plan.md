

# إصلاح أسماء الأيقونات — السبب الحقيقي

## المشكلة الجذرية
في `src/index.css` (سطر 936-946)، الكلاس `.orbital-label-persistent` يحتوي على:
```css
max-width: 70px;
overflow: hidden;
text-overflow: ellipsis;
```
هذا هو ما يقطع النصوص الطويلة مثل "التعويضا..." و"الترقية في الر..." — بغض النظر عن أي `overflow: visible` على الحاويات الأم.

## الحل

### 1. تعديل `src/index.css` — كلاس `.orbital-label-persistent`
- **إزالة** `max-width: 70px` و `overflow: hidden` و `text-overflow: ellipsis`
- الإبقاء على باقي الخصائص (font-size, font-weight, white-space, transition, z-index)

### 2. المرحلة الثانية — المسافة
`outerDistance` الحالي = `baseRadius + itemSize/2 + 8` = 132px. بينما الأيقونة على 100px من المركز وحجمها 48px (نصف القطر 24px)، أي حافتها على 124px. الفرق 8px فقط — يبدو كافياً نظرياً لكن بما أن النص يتمركز (`translate(-50%, -50%)`) فقد يتداخل مع حافة الأيقونة. سنزيده قليلاً إلى `+14` بدل `+8`.

### الملفات المتأثرة
| الملف | التعديل |
|---|---|
| `src/index.css` | إزالة max-width/overflow/text-overflow من `.orbital-label-persistent` |
| `src/pages/NewRequest.tsx` | تغيير `+8` إلى `+14` في `outerDistance` (سطر 169) |

