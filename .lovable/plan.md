

# خطة التحسينات الأربعة

## 1. المسمى الوظيفي الديناميكي في إعدادات الناشر

### المشكلة
placeholder الصفة الوظيفية ثابت على "الكاتب العام الوطني" لكل الحسابات.

### الحل
في `PublisherSettings.tsx`:
- استيراد `useAuth` → الحصول على `role`
- استيراد `useI18n` → الحصول على `t`
- استخدام `t[`role_${role}`]` كـ placeholder ديناميكي حسب دور المستخدم الفعلي
- مثال: الأدمين يرى "أدمين"، الكاتب العام يرى "الكاتب العام الوطني"

### التأكد من عمل زر الحفظ
الزر يعمل منطقياً (upsert) لكن يجب التأكد من أن الـ RLS تسمح بالـ INSERT (السياسة الحالية `user_id = auth.uid()` للـ ALL — صحيحة).

---

## 2. فلاتر المستلمين + إيموجي في ركن المعلنين

### الحل
في `SponsoredPostComposer.tsx`:
- نسخ نفس منطق الفلاتر من `PostComposer.tsx` (أكاديمية، مديرية، مكتب محلي، مهمة، جنس، عضوية، اسم، رقم PPR، سن)
- تغيير لون الفلاتر من `hsl(225,70%,45%)` (أزرق) إلى `hsl(42,80%,50%)` (ذهبي)
- إضافة أيقونة Emoji picker تحت حقل المحتوى (نفس EMOJI_LIST من PostComposer)
- إضافة حقل `filters` و`recipients` في `sponsored_posts` أو إنشاء جدول `sponsored_post_recipients`

### تعديل قاعدة البيانات
- إضافة عمود `filters jsonb` إلى `sponsored_posts`
- إنشاء جدول `sponsored_post_recipients` مشابه لـ `post_recipients` لتتبع المستلمين

---

## 3. عرض المرفقات داخل المنشور (Facebook-style)

### الحل
في `PostFeed.tsx` و `SponsoredPostCard.tsx`:
- **الصور**: عرضها بعرض المنشور الكامل (w-full) بدل مصغرات 24x24
  - صورة واحدة: عرض كامل
  - صورتان: شبكة 2 أعمدة
  - 3+: شبكة مع عداد "+N" للباقي
- **الفيديو**: عرض `<video>` مع controls بعرض المنشور
- **PDF**: بطاقة معاينة كبيرة مع أيقونة وزر تحميل
- النقر على الصورة يفتحها في lightbox أو يحملها

---

## 4. روابط المعلنين مع معاينة (Link Preview)

### الحل
في `SponsoredPostComposer.tsx`:
- إضافة حقل رابط URL
- عند لصق رابط: محاولة جلب Open Graph metadata (العنوان، الوصف، الصورة) عبر edge function
- عرض معاينة الرابط (صورة + عنوان + وصف) مع زر X لحذف المعاينة
- إمكانية استبدال صورة المعاينة بصورة مخصصة أو فيديو
- إضافة عمود `link_url text` و `link_preview jsonb` إلى `sponsored_posts`

في `SponsoredPostCard.tsx`:
- عرض معاينة الرابط بشكل بطاقة أنيقة أسفل المحتوى (مثل Facebook)
- النقر يفتح الرابط في تبويب جديد

### Edge Function: `fetch-link-preview`
- تأخذ URL كمدخل
- تجلب HTML وتستخرج og:title, og:description, og:image
- تُرجع JSON

---

## تعديلات قاعدة البيانات
```sql
-- إضافة أعمدة للروابط والفلاتر
ALTER TABLE sponsored_posts ADD COLUMN filters jsonb;
ALTER TABLE sponsored_posts ADD COLUMN link_url text;
ALTER TABLE sponsored_posts ADD COLUMN link_preview jsonb;

-- جدول مستلمي الإعلانات
CREATE TABLE sponsored_post_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES sponsored_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sponsored_post_recipients ENABLE ROW LEVEL SECURITY;
```

## الملفات المتأثرة
- **معدلة**: `PublisherSettings.tsx`, `SponsoredPostComposer.tsx`, `PostFeed.tsx`, `SponsoredPostCard.tsx`
- **جديدة**: `supabase/functions/fetch-link-preview/index.ts`
- **قاعدة البيانات**: 3 أعمدة جديدة + جدول مستلمين

