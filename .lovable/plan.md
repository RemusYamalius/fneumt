

# خطة: تحسين ألوان صفحة الطلبات الواردة

## 1. ألوان عناوين وخلفيات الفلاتر (سطور 426-467)

تطبيق نفس نمط `DatabaseDashboard` على عناوين الفلاتر:
- **البحث بالرقم**: `bg-blue-100/60 text-blue-700` + `text-sm font-bold`
- **الحالة**: `bg-amber-100/60 text-amber-700`
- **الفئة**: `bg-emerald-100/60 text-emerald-700`
- **مستوى المعالجة**: `bg-purple-100/60 text-purple-700`

تحويل زر "فلاتر متقدمة" إلى زر ملون بتدرج مع بريق shimmer وظل، كما في `DatabaseDashboard`.

## 2. تلوين أيقونات الإجراءات في الجدول (سطور 516-525)

تغيير لون كل أيقونة حسب الإجراء بدل `text-muted-foreground`:
- `in_progress` (Clock): `text-cyan-600`
- `accepted` (CheckCircle2): `text-emerald-600`
- `cancelled` (XCircle): `text-red-600`

إضافة hover ملون لكل زر أيضاً.

## 3. سحب الصفحة لبطاقة الطلب + تلوين عناصرها

### السحب التلقائي (سطر 158-161)
إضافة `scrollIntoView` بعد تحديد الطلب:
```typescript
setTimeout(() => {
  document.getElementById('request-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}, 100);
```

### تلوين عناصر بطاقة التفصيل (سطور 556-627)
- عنوان "المرسل": `text-blue-600`
- عنوان "الفئة": `text-emerald-600`
- عنوان "الوصف": `text-purple-600` مع خلفية `bg-purple-50/50`
- عنوان "المرفقات": `text-amber-600` مع خلفية `bg-amber-50/50`
- عنوان "تغيير الحالة": `text-cyan-600`
- رقم التتبع: يبقى `text-primary`

## الملف المتأثر
`src/pages/IncomingRequests.tsx`

