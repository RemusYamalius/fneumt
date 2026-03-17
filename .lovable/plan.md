

# تعديلات على الملف الشخصي

## 1. حذف خيار "آخر" من الإطار / المهمة

**الملفات:** `src/pages/Profile.tsx` + `src/lib/i18n.tsx`
- حذف السطر `{ value: 'other', label: t.missionOther }` من مصفوفة `missionOptions` في Profile.tsx
- حذف `missionOther` من الترجمات العربية والفرنسية في i18n.tsx

## 2. محاذاة النصوص في القوائم المنسدلة حسب اتجاه اللغة

**الملف:** `src/components/ui/select.tsx`

المشكلة: `SelectItem` يستخدم `pl-8 pr-2` وأيقونة التحديد بـ `left-2` بشكل ثابت (LTR). في العربية يجب أن تكون المحاذاة معكوسة.

**الحل:** استخدام خصائص RTL-aware:
- `SelectItem`: تغيير `pl-8 pr-2` → `ps-8 pe-2` (logical padding)
- أيقونة التحديد: تغيير `left-2` → `start-2` (logical positioning)
- `SelectLabel`: تغيير `pl-8 pr-2` → `ps-8 pe-2`
- إضافة `text-start` للنص ليكون على اليمين بالعربية وعلى اليسار بالفرنسية

