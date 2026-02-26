

# نظام تراتبية المناصب الهرمي

## الوضع الحالي
النظام يستخدم 3 أدوار فقط: `teacher`, `union_officer`, `admin`. نحتاج إلى توسيعه لـ 14 دور هرمي مع قواعد ترقية محددة لكل مستوى.

## الأدوار الجديدة (14 دور)

```text
admin (مدير)
├── regional_supervisor (مشرف جهوي)
│   ├── deputy_regional_primary (نائب مشرف جهوي - ابتدائي)
│   ├── deputy_regional_middle (نائب مشرف جهوي - ثانوي إعدادي)
│   └── deputy_regional_high (نائب مشرف جهوي - ثانوي تأهيلي)
├── provincial_manager (مسؤول إقليمي)
│   ├── deputy_provincial_primary (نائب مسؤول إقليمي - ابتدائي)
│   ├── deputy_provincial_middle (نائب مسؤول إقليمي - ثانوي إعدادي)
│   └── deputy_provincial_high (نائب مسؤول إقليمي - ثانوي تأهيلي)
├── local_coordinator (منسق محلي)
│   ├── deputy_local_primary (نائب منسق محلي - ابتدائي)
│   ├── deputy_local_middle (نائب منسق محلي - ثانوي إعدادي)
│   └── deputy_local_high (نائب منسق محلي - ثانوي تأهيلي)
└── teacher (أستاذ/ة) — الافتراضي
```

## قواعد الترقية

| من يرقّي | يرقّي إلى | شرط جغرافي |
|---|---|---|
| admin | أي منصب | بدون قيود |
| regional_supervisor | deputy_regional_primary/middle/high | نفس الأكاديمية |
| regional_supervisor + نوابه | provincial_manager | نفس الأكاديمية |
| provincial_manager | deputy_provincial_primary/middle/high | نفس المديرية + الأكاديمية |
| provincial_manager + نوابه | local_coordinator | نفس المديرية + الأكاديمية |
| local_coordinator | deputy_local_primary/middle/high | نفس المديرية + الأكاديمية |

## التفاصيل التقنية

### 1. تعديل قاعدة البيانات (Migration)
- إضافة 11 قيمة جديدة لـ enum `app_role` (الحالي: teacher, union_officer, admin)
- تحويل أي مستخدم بدور `union_officer` إلى `teacher`
- حذف قيمة `union_officer` من الـ enum
- تحديث دالة `has_role` لتبقى متوافقة

```sql
-- Add new values to app_role enum
ALTER TYPE app_role ADD VALUE 'regional_supervisor';
ALTER TYPE app_role ADD VALUE 'deputy_regional_primary';
-- ... (11 values total)

-- Migrate existing union_officer to teacher
UPDATE user_roles SET role = 'teacher' WHERE role = 'union_officer';
```

### 2. صفحة إدارة المستخدمين المحدّثة (`UserManagement.tsx`)
- عرض فلتر حسب الأكاديمية والمديرية
- عرض فقط المستخدمين المسموح بترقيتهم حسب دور المستخدم الحالي ومنطقته الجغرافية
- القائمة المنسدلة للأدوار تعرض فقط المناصب المسموح بها
- يجب أن يكون المستخدم المُستهدف قد ملأ ملفه الشخصي (الأكاديمية والمديرية)

### 3. حارس الأدوار (`RoleGuard.tsx`)
- تحديث لدعم الأدوار الجديدة

### 4. لوحة التحكم (`Dashboard.tsx`)
- إظهار رابط "إدارة المستخدمين" لكل من لديه صلاحية ترقية (ليس فقط admin)

### 5. سياق المصادقة (`useAuth.tsx`)
- تحديث النوع `AppRole` ليشمل الأدوار الجديدة

### 6. الترجمات (`i18n.tsx`)
- إضافة أسماء جميع المناصب بالعربية والفرنسية

### 7. Edge Function للترقية الآمنة (اختياري لكن مُوصى به)
- بدلاً من السماح بتحديث `user_roles` مباشرة من العميل، يمكن إنشاء دالة خادمية تتحقق من صلاحيات الترقية
- لكن يمكن أيضاً الاعتماد على سياسات RLS مع دوال SECURITY DEFINER

### الملفات المتأثرة
- **Migration SQL** — إضافة الأدوار الجديدة وتحديث RLS
- `src/hooks/useAuth.tsx` — تحديث AppRole type
- `src/pages/admin/UserManagement.tsx` — إعادة بناء كامل مع منطق الترقية
- `src/pages/Dashboard.tsx` — إظهار رابط الإدارة للمناصب المخولة
- `src/components/RoleGuard.tsx` — تحديث الأنواع
- `src/lib/i18n.tsx` — أسماء المناصب الـ 14

