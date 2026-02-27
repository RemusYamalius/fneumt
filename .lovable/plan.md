

# خطة: نظام توجيه الطلبات والإشعارات للمنسقين المحليين

## ملخص التغييرات

### 1. فحص اكتمال الملف الشخصي قبل تقديم طلب
- في `NewRequest.tsx`: جلب بيانات الملف الشخصي عند التحميل
- إذا لم تكن الحقول (academy, directorate, corps) مكتملة → عرض رسالة تنبيه مع رابط لصفحة الملف الشخصي بدل عرض الفئات
- المستخدم يدخل لصفحة "طلب جديد" لكن لا يمكنه اختيار فئة إلا بعد إكمال ملفه

### 2. توجيه الطلبات تلقائياً للمنسق المحلي المعني
- **Database trigger** جديد: عند إدراج طلب جديد في جدول `requests`:
  1. يجلب بيانات المرسل (academy, directorate, corps) من `profiles`
  2. يبحث عن منسق محلي أو نائبه المطابق للسلك في `user_roles` + `profiles` (نفس الأكاديمية + المديرية)
  3. يعيّنه في حقل `assigned_to`
  4. ينشئ إشعاراً في جدول `notifications` للمنسق

- **تحديث RLS** على `notifications`: السماح بـ INSERT من trigger (عبر SECURITY DEFINER function)

### 3. بطاقة "طلبات" في لوحة تحكم المنسقين المحليين
- في `Dashboard.tsx`: إضافة بطاقة "الطلبات الواردة" تظهر فقط للمنسقين المحليين ونوابهم
- **شارة الإشعار**: عدد الطلبات غير المقروءة يظهر كدائرة حمراء أعلى البطاقة
  - يمين في العربية، يسار في الفرنسية
- جلب العدد من `requests` حيث `assigned_to = user.id` و `status = 'submitted'`

### 4. صفحة الطلبات الواردة (جديدة: `IncomingRequests.tsx`)
- قائمة احترافية بالطلبات المعيّنة للمنسق
- كل طلب يعرض: رقم التتبع، الفئة، الموضوع، اسم المرسل، التاريخ، الحالة
- عند فتح طلب:
  - تحديث حالته إلى `received`
  - إضافة سجل في `request_status_history`
  - إرسال إشعار لصاحب الطلب: "تم التوصل بملفك رقم XXX وهو قيد المراجعة"
  - تنقيص عداد الإشعارات

### 5. الإشعارات بالصوت والاهتزاز
- إضافة ملف صوت رنة قصيرة في `public/notification.mp3`
- عند استلام إشعار جديد (عبر Supabase Realtime على جدول `notifications`):
  - تشغيل صوت الرنة
  - تفعيل الاهتزاز `navigator.vibrate(200)`

### 6. Realtime للإشعارات
- تفعيل Realtime على جدول `notifications`
- في `Dashboard.tsx` أو hook مخصص: الاشتراك في التغييرات لتحديث العداد مباشرة

## التفاصيل التقنية

### Migration SQL
```sql
-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Allow system inserts into notifications (for triggers)
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Function to auto-assign request to local coordinator
CREATE OR REPLACE FUNCTION public.auto_assign_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _profile RECORD;
  _coordinator_id uuid;
  _deputy_role app_role;
BEGIN
  SELECT academy, directorate, corps INTO _profile
  FROM public.profiles WHERE user_id = NEW.user_id;

  -- Map corps to deputy role
  _deputy_role := CASE _profile.corps
    WHEN 'primary' THEN 'deputy_local_primary'
    WHEN 'middle_school' THEN 'deputy_local_middle'
    WHEN 'high_school' THEN 'deputy_local_high'
  END;

  -- Find matching local_coordinator or deputy
  SELECT ur.user_id INTO _coordinator_id
  FROM public.user_roles ur
  JOIN public.profiles p ON p.user_id = ur.user_id
  WHERE ur.role IN ('local_coordinator', _deputy_role)
    AND p.academy = _profile.academy
    AND p.directorate = _profile.directorate
  LIMIT 1;

  IF _coordinator_id IS NOT NULL THEN
    NEW.assigned_to := _coordinator_id;
    -- Create notification
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (_coordinator_id, 'طلب جديد', 'تم استلام طلب جديد رقم ' || NEW.tracking_number, '/incoming-requests');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_assign_request
BEFORE INSERT ON public.requests
FOR EACH ROW EXECUTE FUNCTION public.auto_assign_request();
```

### الملفات المتأثرة
- **Migration SQL** — trigger + RLS + realtime
- `src/pages/NewRequest.tsx` — فحص اكتمال الملف الشخصي
- `src/pages/Dashboard.tsx` — بطاقة "طلبات" مع شارة + realtime
- `src/pages/IncomingRequests.tsx` — **جديد** صفحة الطلبات الواردة
- `src/App.tsx` — إضافة route `/incoming-requests`
- `src/lib/i18n.tsx` — ترجمات جديدة
- `src/hooks/useNotificationSound.ts` — **جديد** hook للصوت والاهتزاز
- `public/notification.mp3` — ملف صوت الرنة

