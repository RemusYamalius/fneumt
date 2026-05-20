## التشخيص

بعد فحص قاعدة البيانات والشيفرة، البطاقات الست في قسم **"المهام الوظيفية"** تُعرَض فعلاً للحسابات السامية الثلاثة (admin، الكاتب العام الوطني، نائب الكاتب العام الوطني)، لكن **المعطيات داخل بعض هذه البطاقات تكون فارغة** لحسابَي SG ونائبه، والسبب موجود في قواعد الحماية (RLS) لجدول `requests`:

```text
جدول requests:
  Admins can view all requests          ← admin فقط
  Officers can view assigned requests   ← assigned_to = auth.uid()
  Coordinators can view deputy requests ← المنسّقون فقط
  (لا توجد قاعدة لـ national_secretary / deputy_national_secretary)
```

النتيجة: عند دخول الكاتب العام أو نائبه إلى "الطلبات الواردة"، تُرجع Supabase 0 صفوف رغم أن البطاقة ظاهرة.

أما باقي الجداول (`join_requests`، `profiles`، `posts`، `local_offices`...) فهي تستخدم دالّة `is_promoter()` التي تشمل الثلاثة، لذلك تعمل طبيعياً.

كذلك جدول `requests` ينقصه سياسة **UPDATE** للحسابين كي يتمكّنا من تغيير حالة الطلب (مُعالَج، مقبول، ...).

## الخطة

### 1. ترحيل قاعدة البيانات (migration واحد)

إضافة سياستَين على جدول `public.requests`:

- **SELECT** لكلٍّ من `national_secretary` و `deputy_national_secretary` على كل الطلبات.
- **UPDATE** لنفس الدورَين على كل الطلبات (مع `WITH CHECK` متطابق).

نستعمل دالة `has_role(auth.uid(), 'national_secretary')` و `has_role(auth.uid(), 'deputy_national_secretary')` الموجودتَين أصلاً.

### 2. لا تغيير على الواجهة

- منطق عرض البطاقات في `src/pages/Dashboard.tsx` صحيح (`isAdminLike` يشمل الثلاثة لكل البطاقات الست + قاعدة البيانات).
- منطق `useHierarchicalFilter` للأدوار الوطنية لا يفرض `assigned_to`، فيكفي أن تسمح RLS برؤية الكل.
- صفحة `IncomingRequests.tsx` ستعرض الطلبات تلقائياً بمجرد فتح RLS.

### 3. التحقق بعد التطبيق

- تسجيل الدخول كـ Said Assemahli → فتح "الطلبات الواردة" → يجب أن تظهر القائمة الكاملة.
- تجربة تغيير حالة طلب → يجب أن ينجح بدون خطأ صلاحيات.
- التأكد أن "طلبات الانضمام" و"التحقق من الانخراط" و"لوحة الإشراف" و"إدارة المستخدمين" و"قاعدة البيانات" تعمل (كانت تعمل سلفاً عبر `is_promoter`).

## التفاصيل التقنية (للمرجع)

```sql
CREATE POLICY "Supreme accounts can view all requests"
  ON public.requests FOR SELECT
  USING (
    public.has_role(auth.uid(), 'national_secretary'::public.app_role)
    OR public.has_role(auth.uid(), 'deputy_national_secretary'::public.app_role)
  );

CREATE POLICY "Supreme accounts can update any request"
  ON public.requests FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'national_secretary'::public.app_role)
    OR public.has_role(auth.uid(), 'deputy_national_secretary'::public.app_role)
  );
```

ملاحظة: سياسة `admin` الحالية تبقى كما هي؛ السياسات الجديدة تُضاف بجانبها (PostgreSQL يجمع بين السياسات بـ OR).
