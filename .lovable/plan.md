

# خطة: إعدادات ركن التواصل + بطاقة ركن المعلنين

## الجزء الأول: إعدادات الحسابات السامية في ركن التواصل

### 1. جدول جديد: `publisher_settings`
```sql
CREATE TABLE public.publisher_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name text,
  display_title text,
  avatar_path text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.publisher_settings ENABLE ROW LEVEL SECURITY;
-- سياسات: المستخدم يقرأ/يعدل إعداداته فقط، والجميع يقرأ (لعرض الصورة في المنشورات)
```

### 2. Storage bucket: `publisher-avatars`
- لرفع صور بروفايل الناشر

### 3. تبويب "إعدادات" جديد في `CommunicationHub.tsx`
- إضافة تبويب رابع `settings` بأيقونة Settings للحسابات السامية
- داخله:
  - **صورة البروفايل**: رفع / تغيير / حذف (مع معاينة دائرية)
  - **اسم الناشر**: حقل نصي لتغيير الاسم المعروض
  - **الصفة كاسم**: زر تبديل لاستخدام المسمى الوظيفي بدل الاسم

### 4. تعديل `PostFeed.tsx`
- بدل جلب الاسم من `profiles` فقط، يتم أيضاً جلب `publisher_settings` (avatar + display_name)
- عرض صورة البروفايل الحقيقية بدل الحرف الأول إن وُجدت

---

## الجزء الثاني: بطاقة "ركن المعلنين" (أدمين فقط)

### 1. جداول جديدة
```sql
CREATE TABLE public.sponsored_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  advertiser_name text NOT NULL,
  advertiser_avatar_path text,
  content text,
  display_style text NOT NULL DEFAULT 'elegant',
  -- display_style: 'elegant' | 'spotlight' | 'immersive'
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.sponsored_post_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.sponsored_posts(id) ON DELETE CASCADE NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  file_size bigint,
  created_at timestamptz DEFAULT now()
);
```
- RLS: الأدمين فقط يقرأ/يكتب، الباقي يقرأ المنشورات النشطة

### 2. Storage bucket: `sponsor-assets`
- لرفع صور بروفايل المعلنين ومرفقاتهم

### 3. صفحة جديدة: `SponsoredHub.tsx`
- مسار: `/sponsored`
- مقيدة بـ RoleGuard: `admin` فقط
- واجهة إنشاء منشور معلن تشبه PostComposer مع:
  - حقل صورة بروفايل المعلن (رفع)
  - حقل اسم المعلن
  - علامة "معلن / Sponsorisé" تحت الاسم بخط أصغر
  - اختيار شكل العرض من 3 أنماط:

```text
┌─────────────────────────────────────────┐
│ Style 1: "Elegant"                      │
│ ─ حدود ذهبية متدرجة + خلفية كريمية    │
│ ─ شريط "Sponsorisé" ذهبي شفاف أعلاه   │
│ ─ تصميم أنيق وهادئ يندمج مع المحتوى   │
├─────────────────────────────────────────┤
│ Style 2: "Spotlight"                    │
│ ─ بطاقة بارزة بظل عميق + إطار متوهج   │
│ ─ شريط جانبي ملون بتدرج أزرق-بنفسجي   │
│ ─ تأثير shimmer خفيف على الحدود        │
├─────────────────────────────────────────┤
│ Style 3: "Immersive"                    │
│ ─ خلفية تدرج كامل (أزرق داكن-تيل)     │
│ ─ نص أبيض + صورة كبيرة ممتدة          │
│ ─ تأثير parallax خفيف عند التمرير      │
└─────────────────────────────────────────┘
```

### 4. عرض المنشورات المعلنة في `PostFeed.tsx`
- إدراج منشور معلن كل 3-5 منشورات عادية
- التمييز البصري حسب النمط المختار (elegant/spotlight/immersive)

### 5. بطاقة في Dashboard
- إضافة بطاقة ثالثة "ركن المعلنين" في `communicationCards` للأدمين فقط
- لون مميز (ذهبي/برتقالي متدرج)
- أيقونة Megaphone أو Star

### 6. مسار في `App.tsx`
```tsx
<Route path="/sponsored" element={
  <RoleGuard allowedRoles={['admin']}>
    <SponsoredHub />
  </RoleGuard>
} />
```

---

## الملفات المتأثرة
- **جديدة**: `src/pages/SponsoredHub.tsx`, `src/components/SponsoredPostComposer.tsx`, `src/components/SponsoredPostCard.tsx`
- **معدلة**: `src/pages/CommunicationHub.tsx` (تبويب إعدادات), `src/pages/Dashboard.tsx` (بطاقة المعلنين), `src/App.tsx` (مسار), `src/components/PostFeed.tsx` (صورة الناشر + إدراج إعلانات)
- **قاعدة البيانات**: جدولان جديدان + bucket تخزين

