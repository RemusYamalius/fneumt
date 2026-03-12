

# طلبات الانضمام — رسالة ترحيب + إشعار فوري + بطاقة وظيفية + إحصاءات

## ملخص
إضافة نظام "طلبات الانضمام" كامل: رسالة ترحيبية أنيقة للمسجلين غير المنخرطين، زر انضمام يُرسل إشعاراً صوتياً فورياً لنائب المنسق المحلي، بطاقة وظيفية جديدة في لوحة التحكم، وإحصاءات في لوحات الإشراف.

---

## التعديلات

### 1. قاعدة البيانات — جدول `join_requests`
إنشاء جدول جديد لتخزين طلبات الانضمام:
```sql
CREATE TABLE public.join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  assigned_to uuid,
  status text NOT NULL DEFAULT 'pending', -- pending, contacted, accepted, rejected
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
```
مع سياسات RLS مناسبة + تفعيل Realtime عليه.

### 2. `src/lib/i18n.tsx` — ترجمات جديدة
إضافة مفاتيح:
- `joinWelcomeTitle` / `joinWelcomeBody` / `joinWelcomeButton` / `joinWelcomeFooter`
- `joinRequests` / `joinRequestsDesc`
- `joinRequestSent` / `joinRequestAlready`
- `totalJoinRequests` (للإحصاءات)

### 3. `src/pages/Dashboard.tsx` — رسالة الترحيب + بطاقة وظيفية
**رسالة الترحيب**: تظهر فقط للمستخدمين الذين `is_member === false && membership_verified === false` (غير منخرطين). تصميم أنيق بتدرج أزرق سماوي/تيلي مع:
- عنوان "مرحبا بك في القلعة الزرقاء"
- النص التوضيحي
- زر "انضم إلينا" بتدرج لوني متناسق
- عند النقر: إدراج صف في `join_requests` + إرسال إشعار لنائب المنسق المحلي المناسب (نفس منطق `auto_assign_request`)

**بطاقة وظيفية**: إضافة بطاقة "طلبات الانضمام" (`UserPlus` icon) في `professionalCards` لنواب المنسقين المحليين بلون `from-[hsl(195,70%,42%)] to-[hsl(195,70%,55%)]` مع badge لعدد الطلبات المعلقة.

### 4. `src/pages/JoinRequests.tsx` — صفحة جديدة
صفحة لعرض طلبات الانضمام الواردة لنواب المنسقين المحليين:
- قائمة الطلبات مع اسم المرسل ومؤسسته و N°PPR
- إمكانية تغيير الحالة (تم التواصل / مقبول / مرفوض)
- تصميم متناسق مع باقي الصفحات

### 5. `src/App.tsx` — مسار جديد
إضافة `/join-requests` محمي بـ `RoleGuard` لنواب المنسقين المحليين.

### 6. `src/hooks/useRealtimeNotifications.ts` — إشعارات فورية
إضافة اشتراك Realtime على جدول `join_requests` لنواب المنسقين المحليين لتشغيل الصوت فوراً عند ورود طلب انضمام جديد.

### 7. `src/pages/SupervisorDashboard.tsx` — إحصاءات
إضافة KPI جديد "طلبات الانضمام" في البطاقات الإحصائية العامة، مع استعلام `join_requests` وعرض العدد الإجمالي.

### 8. قاعدة البيانات — دالة تعيين تلقائي
إنشاء trigger على `join_requests` (مشابه لـ `auto_assign_request`) لتعيين `assigned_to` تلقائياً + إدراج إشعار في جدول `notifications`.

