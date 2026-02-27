

# خطة: تصحيح توجيه الطلبات + إضافة صيغة التأنيث "(ة)"

## 1. تصحيح trigger التوجيه التلقائي

المشكلة الحالية: الـ trigger يبحث عن `local_coordinator` أو النائب المطابق للسلك. المطلوب: البحث فقط عن **النائب المكلف بالسلك** (`deputy_local_*`) بدون `local_coordinator`، لأن المنسق المحلي مُشرف فقط ولا يستقبل الطلبات مباشرة.

كذلك يجب أن حقل `mission` (أستاذ/إداري) **لا يؤثر** في التوجيه — التوجيه يعتمد فقط على: `academy` + `directorate` + `corps`.

### Migration SQL
```sql
CREATE OR REPLACE FUNCTION public.auto_assign_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
DECLARE
  _profile RECORD;
  _coordinator_id uuid;
  _deputy_role app_role;
BEGIN
  SELECT academy, directorate, corps INTO _profile
  FROM public.profiles WHERE user_id = NEW.user_id;

  IF _profile.academy IS NULL OR _profile.directorate IS NULL OR _profile.corps IS NULL THEN
    RETURN NEW;
  END IF;

  _deputy_role := CASE _profile.corps
    WHEN 'primary' THEN 'deputy_local_primary'::app_role
    WHEN 'middle_school' THEN 'deputy_local_middle'::app_role
    WHEN 'high_school' THEN 'deputy_local_high'::app_role
    ELSE 'deputy_local_primary'::app_role
  END;

  -- البحث فقط عن نائب المنسق المحلي المكلف بالسلك
  SELECT ur.user_id INTO _coordinator_id
  FROM public.user_roles ur
  JOIN public.profiles p ON p.user_id = ur.user_id
  WHERE ur.role = _deputy_role
    AND p.academy = _profile.academy
    AND p.directorate = _profile.directorate
  LIMIT 1;

  IF _coordinator_id IS NOT NULL THEN
    NEW.assigned_to := _coordinator_id;
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (_coordinator_id, 'طلب جديد', 'تم استلام طلب جديد رقم ' || NEW.tracking_number, '/incoming-requests');
  END IF;

  RETURN NEW;
END;
$$;
```

## 2. تحديث `Dashboard.tsx`

تغيير شرط `isLocalCoordinator` ليشمل فقط النواب (بدون `local_coordinator`) لعرض بطاقة "الطلبات الواردة":
```typescript
const isDeputyLocal = role && [
  'deputy_local_primary', 'deputy_local_middle', 'deputy_local_high',
].includes(role);
```

## 3. إضافة صيغة التأنيث "(ة)" في الترجمات

### العربية — التغييرات:
| المفتاح | الحالي | الجديد |
|---------|--------|--------|
| `roleAdmin` | `مدير` | `مدير(ة)` |
| `role_admin` | `مدير` | `مدير(ة)` |
| `role_regional_supervisor` | `مشرف جهوي` | `مشرف(ة) جهوي(ة)` |
| `role_deputy_regional_*` | `نائب مشرف جهوي` | `نائب(ة) مشرف(ة) جهوي(ة)` |
| `role_provincial_manager` | `مسؤول إقليمي` | `مسؤول(ة) إقليمي(ة)` |
| `role_deputy_provincial_*` | `نائب مسؤول إقليمي` | `نائب(ة) مسؤول(ة) إقليمي(ة)` |
| `role_local_coordinator` | `منسق محلي` | `منسق(ة) محلي(ة)` |
| `role_deputy_local_*` | `نائب منسق محلي` | `نائب(ة) منسق(ة) محلي(ة)` |
| `role_union_officer` | `مسؤول نقابي` | `مسؤول(ة) نقابي(ة)` |
| `roleOfficer` | `مسؤول نقابي` | `مسؤول(ة) نقابي(ة)` |

### الفرنسية — التغييرات:
| المفتاح | الحالي | الجديد |
|---------|--------|--------|
| `roleAdmin` | `Administrateur` | `Administrateur(trice)` |
| `role_admin` | `Administrateur` | `Administrateur(trice)` |
| `role_regional_supervisor` | `Superviseur régional` | `Superviseur(e) régional(e)` |
| `role_deputy_regional_*` | `Adjoint régional` | `Adjoint(e) régional(e)` |
| `role_provincial_manager` | `Responsable provincial` | `Responsable provincial(e)` |
| `role_deputy_provincial_*` | `Adjoint provincial` | `Adjoint(e) provincial(e)` |
| `role_local_coordinator` | `Coordinateur local` | `Coordinateur(trice) local(e)` |
| `role_deputy_local_*` | `Adjoint local` | `Adjoint(e) local(e)` |
| `role_union_officer` | `Responsable syndical` | `Responsable syndical(e)` |

## الملفات المتأثرة
- **Migration SQL** — تعديل `auto_assign_request` لاستبعاد `local_coordinator`
- `src/lib/i18n.tsx` — تحديث جميع الأدوار بصيغة التأنيث
- `src/pages/Dashboard.tsx` — تغيير شرط عرض بطاقة الطلبات للنواب فقط

