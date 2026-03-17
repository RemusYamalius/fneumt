

# المكتب المحلي — خطة التنفيذ

## ملخص
إضافة صفحة "المكتب المحلي" خاصة بالمنسقين المحليين (`local_coordinator`) تتضمن بطاقتين: "تشكيل المكتب" و"بطائق الانخراط".

---

## التغييرات المطلوبة

### 1. قاعدة البيانات — 3 جداول جديدة + Storage bucket

**جدول `local_offices`** — معلومات المكتب:
- `id`, `coordinator_id` (user_id للمنسق), `office_name`, `secretary_photo_url`, `academy`, `directorate`, `created_at`, `updated_at`

**جدول `local_office_members`** — أعضاء المكتب:
- `id`, `office_id` (FK → local_offices), `user_id` (FK → profiles.user_id), `position` (enum: local_secretary, deputy_secretary_primary, deputy_secretary_middle, deputy_secretary_high, treasurer, deputy_treasurer, rapporteur, deputy_rapporteur, advisor), `created_at`
- Unique constraint على (office_id, position) للمناصب الفردية فقط (باستثناء advisor)

**جدول `membership_cards`** — بطائق الانخراط:
- `id`, `office_id` (FK → local_offices), `member_user_id`, `card_number`, `is_paid` (boolean, default false), `created_at`, `updated_at`

**جدول `office_finances`** — المالية:
- `id`, `office_id` (FK → local_offices), `total_collected`, `remaining`, `paid_to_provincial`, `updated_at`

**Storage bucket**: `office-photos` (public) لصورة بروفايل الكاتب المحلي.

**سياسات RLS**: المنسق المحلي يستطيع CRUD على مكتبه فقط. المشرفون الأعلى يستطيعون القراءة فقط.

### 2. صفحة جديدة: `src/pages/LocalOffice.tsx`

#### البطاقة الأولى: تشكيل المكتب
- حقل اسم المكتب (نص)
- رفع صورة الكاتب المحلي (مع معاينة)
- جدول بحث عن المسجلين من نفس المديرية (بحث بالاسم، رقم التأجير، المؤسسة)
- عند تحديد شخص → اختيار الصفة من قائمة منسدلة
- عرض الأعضاء المعينين حاليا مع إمكانية الحذف/التعديل
- زر حفظ

**المناصب الـ8 الفردية** (شخص واحد لكل منصب):
- الكاتب المحلي، نائب الكاتب (ابتدائي/إعدادي/تأهيلي)، أمين المال، نائب أمين المال، المقرر، نائب المقرر

**المنصب المتعدد**: مستشار (بدون حد)

#### البطاقة الثانية: بطائق الانخراط
- جدول بالمنخرطين المسجلين (is_member = true من نفس المديرية)
- أعمدة: الاسم، رقم البطاقة (قابل للتعديل)، حالة الدفع (checkbox)
- ملخص مالي: المبلغ المستخلص، المتبقي، المدفوع للمكتب الإقليمي
- زر حفظ

### 3. التوجيه والتنقل

- إضافة route `/local-office` في `App.tsx` محمي بـ `RoleGuard` للـ `local_coordinator`
- إضافة بطاقة "المكتب المحلي" في `Dashboard.tsx` ضمن `professionalCards` للمنسقين المحليين
- إضافة الترجمات اللازمة في `i18n.tsx`

### 4. الترجمات (عربي/فرنسي)
إضافة ~30 مفتاح ترجمة جديد لعناوين البطاقات والأعمدة والأزرار والمناصب.

---

## ملاحظات تقنية
- البحث عن المسجلين يتم عبر query على جدول `profiles` مع فلتر `directorate` مطابق للمنسق
- الصورة ترفع إلى bucket `office-photos` ويخزن الرابط في `local_offices`
- واجهة البحث تستخدم `Input` مع debounce للأداء
- التحقق من عدم تكرار المناصب الفردية يتم client-side + DB constraint

