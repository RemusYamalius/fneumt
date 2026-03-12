

# إشعار المستخدم عند تغيير حالة طلب الانضمام + التحقق من اكتمال الملف + تحسينات بصرية

## 1. قاعدة البيانات — Trigger لإرسال إشعار عند تغيير حالة طلب الانضمام

إنشاء trigger على `join_requests` يُطلق عند `UPDATE` على عمود `status`. يُدرج إشعاراً في جدول `notifications` للمستخدم صاحب الطلب (`user_id`) مع رسالة تتضمن الحالة الجديدة.

```sql
CREATE OR REPLACE FUNCTION public.notify_join_request_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status != 'pending' THEN
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (NEW.user_id, 'تحديث طلب الانضمام', 
      CASE NEW.status
        WHEN 'contacted' THEN 'تم التواصل معك بخصوص طلب انضمامك'
        WHEN 'accepted' THEN 'تم قبول طلب انضمامك'
        WHEN 'rejected' THEN 'تم رفض طلب انضمامك'
      END, '/dashboard');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_join_request_status_change
  AFTER UPDATE ON public.join_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_join_request_status_change();
```

## 2. `src/pages/Dashboard.tsx` — التحقق من اكتمال جميع حقول الملف الشخصي

تعديل شرط `isNonMember` ليشمل التحقق من أن **جميع** الحقول الإلزامية مملوءة (full_name, employee_number, institution, phone, corps, academy, directorate, zone) قبل إظهار رسالة الترحيب وزر الانضمام.

```typescript
const isNonMember = profile 
  && role === 'teacher' 
  && profile.is_member === false 
  && profile.membership_verified === false 
  && profile.full_name && profile.employee_number 
  && profile.institution && profile.phone 
  && profile.corps && profile.academy 
  && profile.directorate && profile.zone;
```

## 3. `src/pages/NewRequest.tsx` — وضع اللوغو في الدائرة الوسطى + تظليل النصوص

### 3.1 الدائرة الوسطى للعجلة
تعديل مكون `OrbitalHub` لعرض اللوغو (`logo-fne.png`) في الدائرة الوسطى بدلاً من النص فقط، مع إبقاء النص تحت اللوغو.

### 3.2 تظليل النصوص والأيقونات
- إضافة `textShadow` و `filter: drop-shadow(...)` للعنصر المختار في العجلة (موضوع الطلب) — تطبيقه على نص الـ label.
- إضافة نفس التأثير لأيقونات مستوى الحل (`RESOLUTION_LEVELS`) عند التحديد.
- تطبيق نفس التحسينات في فقرة المراجعة (Step 4): إضافة `textShadow` و `drop-shadow` لأسماء الفئة ومستوى الحل والأيقونات المعروضة.

## 4. `src/pages/JoinRequests.tsx` — عرض جميع حقول الملف الشخصي

الحقول معروضة بالفعل في الـ Dialog الحالي. سيتم التأكد من عدم إخفاء أي حقل (إزالة شرط `if (!value) return null` من `ProfileField` واستبداله بعرض "—" للحقول الفارغة) لضمان ظهور جميع الحقول دائماً.

## ملخص الملفات المعدلة
- **Migration SQL جديد**: Trigger لإشعار المستخدم
- **`src/pages/Dashboard.tsx`**: شرط اكتمال الملف
- **`src/pages/NewRequest.tsx`**: لوغو في الوسط + تظليل
- **`src/pages/JoinRequests.tsx`**: عرض كل الحقول

