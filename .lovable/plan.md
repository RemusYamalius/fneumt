

# تحليل أمني شامل وخطة الإصلاح

## التحليل الحالي

### مشاكل حرجة (ERROR)

| # | المشكلة | الخطورة |
|---|---------|---------|
| 1 | **جدول `requests` مكشوف للعموم** — سياسة "Anyone can search by tracking number" تمنح دور `anon` قراءة جميع الطلبات بدون مصادقة | حرج |
| 2 | **مرفقات المنشورات مكشوفة** — أي مستخدم مسجل يستطيع قراءة أي ملف في bucket `post-attachments` بدون التحقق من كونه مستلماً | حرج |
| 3 | **قنوات Realtime بدون حماية** — أي مستخدم مسجل يستطيع الاشتراك في أي قناة وتلقي أحداث لا تخصه | حرج |

### مشاكل متوسطة (WARN)

| # | المشكلة |
|---|---------|
| 4 | 4 دوال بدون `search_path` محدد (read_email_batch, enqueue_email, move_to_dlq, delete_email) |
| 5 | 3 buckets عامة تسمح بسرد الملفات (office-photos, publisher-avatars, sponsor-assets) |
| 6 | حماية كلمات المرور المسربة (HIBP) معطلة |
| 7 | منسقو المكاتب يستطيعون تعديل صور أي مكتب (office-photos) |

### نقاط ضعف في الكود

| # | المشكلة |
|---|---------|
| 8 | **لا يوجد تعقيم للمدخلات** — `.ilike()` يُستخدم مع مدخلات المستخدم مباشرة بدون تنظيف (QuickFilter, PostComposer, SponsoredPostComposer) |
| 9 | **لا يوجد Rate Limiting** على Edge Functions (delete-account, fetch-link-preview) |
| 10 | **لا يوجد تحقق من طول المدخلات** في نماذج البحث والتسجيل |

### ما هو آمن حالياً ✓
- مفاتيح API مخزنة في متغيرات بيئة (ليست مكتوبة في الكود)
- لا يوجد SQL خام — كل الاستعلامات عبر Supabase SDK المعلمي
- RLS مفعل على جميع الجداول
- دوال SECURITY DEFINER تستخدم `search_path = public`
- لا يوجد `dangerouslySetInnerHTML` مع مدخلات المستخدم

---

## خطة الإصلاح

### 1) إصلاح سياسة `requests` للمجهولين (حرج)
- **حذف** سياسة "Anyone can search by tracking number" 
- **إنشاء دالة** `search_by_tracking(text)` من نوع `SECURITY DEFINER` تُرجع فقط: `tracking_number`, `status`, `created_at`, `category` (بدون `user_id`, `assigned_to`, `subject`, `description`)
- **تحديث** `TrackRequest.tsx` لاستخدام `.rpc('search_by_tracking', { _tracking: query })`

### 2) تأمين bucket `post-attachments` (حرج)
- **تحديث** سياسة التخزين لتتحقق من أن المستخدم مستلم للمنشور المرتبط بالملف عبر ربط `file_path` بجدول `post_attachments` ثم `post_recipients`

### 3) تفعيل حماية كلمات المرور المسربة
- استخدام `configure_auth` لتفعيل `password_hibp_enabled: true`

### 4) إضافة `search_path` للدوال الناقصة
- Migration لتحديث 4 دوال: `read_email_batch`, `enqueue_email`, `move_to_dlq`, `delete_email` بإضافة `SET search_path TO 'public'`

### 5) تعقيم مدخلات البحث (Frontend)
- إنشاء دالة `sanitizeSearchInput(input)` في `src/lib/utils.ts` تزيل أحرف SQL الخاصة (`%`, `_`, `\`) وتحدد الطول الأقصى
- تطبيقها على كل استخدامات `.ilike()` في: QuickFilter, PostComposer, SponsoredPostComposer

### 6) Rate Limiting على Edge Functions
- إضافة حماية rate limiting بسيطة في `delete-account` و `fetch-link-preview` عبر فحص عدد الطلبات من نفس المستخدم خلال فترة زمنية

### 7) تأمين سياسات bucket `office-photos`
- تحديث سياسات INSERT/UPDATE/DELETE للتحقق من أن المنسق يملك المكتب المرتبط بالمسار

## الملفات المتأثرة
```
supabase/migrations/  — 4 migrations جديدة
src/pages/TrackRequest.tsx
src/pages/QuickFilter.tsx
src/components/PostComposer.tsx
src/components/SponsoredPostComposer.tsx
src/lib/utils.ts
supabase/functions/delete-account/index.ts
supabase/functions/fetch-link-preview/index.ts
```

