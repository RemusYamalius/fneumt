

# تحسين الشريط العلوي + نظام البادجات + صفحة التحقق من الانخراط

## 1. قاعدة البيانات
إضافة عمود `membership_verified` (boolean, default false) إلى جدول `profiles` لتخزين حالة التحقق من الانخراط.

إضافة سياسة RLS تسمح لنواب المنسقين المحليين بتحديث حقلي `is_member` و `membership_verified` لمستخدمين في نفس النطاق الجغرافي.

## 2. مكون البادج (VerifiedBadge)
إنشاء `src/components/VerifiedBadge.tsx` — شكل نجمة/ختم (seal) مثل الصورة المرفقة بحواف بيضاء مظللة، باستخدام SVG:
- **غير منخرط**: رمادي
- **منخرط (غير مفعل)**: أسود
- **منخرط مفعل** (`membership_verified = true`): أزرق
- **ذوو المناصب** (أي دور غير teacher): ذهبي

يُعرض البادج في الشريط العلوي بجانب اسم المستخدم.

## 3. تحسين الشريط العلوي (Dashboard.tsx)
- تحسين عرض النص بجانب اللوغو (تكبير الخط، تباعد أفضل، عرض الاسم + البادج)
- إضافة مكون VerifiedBadge بجانب اسم المنصة أو اسم المستخدم

## 4. صفحة التحقق من الانخراط
إنشاء `src/pages/MembershipVerification.tsx`:
- تُعرض قائمة المستخدمين المسجلين في نفس النطاق الجغرافي (academy + directorate)
- كل صف يعرض: الاسم الكامل، رقم التأجير، المؤسسة، رقم بطاقة الانخراط
- مربعان اختيار: "منخرط" و "غير منخرط"
- تصميم أنيق يشبه أسلوب الإشعارات في بطاقة الطلبات الواردة
- إشعار realtime عند تحديث جديد

## 5. تحديث لوحة التحكم (Dashboard.tsx)
- إضافة بطاقة "التحقق من الانخراط" في المهام الوظيفية لنواب المنسقين المحليين
- لون مميز للبطاقة

## 6. تحديث التوجيه (App.tsx)
- إضافة مسار `/membership-verification` محمي بـ RoleGuard للنواب المحليين

## 7. الترجمات (i18n.tsx)
إضافة مفاتيح جديدة بالعربية والفرنسية:
- `membershipVerification`, `membershipVerificationDesc`
- `memberVerified`, `memberNotVerified`
- `verifyMembership`

## الملفات المتأثرة
1. Migration SQL (جدول profiles + RLS)
2. `src/components/VerifiedBadge.tsx` (جديد)
3. `src/pages/MembershipVerification.tsx` (جديد)
4. `src/pages/Dashboard.tsx` (شريط علوي + بطاقة جديدة)
5. `src/App.tsx` (مسار جديد)
6. `src/lib/i18n.tsx` (ترجمات)

