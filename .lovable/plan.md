

# إصلاح لوحة الإشراف: النواب لا يظهرون

## المشكلة

حقل `promoted_by` فارغ (`null`) لدى النواب المحليين في قاعدة البيانات. الاستعلام الحالي يعتمد فقط على `promoted_by = user.id` لجلب النواب، فتظهر القائمة فارغة.

## الحل

استخدام استراتيجية مزدوجة لجلب النواب:
1. **أولاً**: البحث عبر `promoted_by` (الطريقة الحالية)
2. **ثانياً**: البحث عبر التطابق الجغرافي (الأكاديمية + المديرية) مع أدوار `deputy_local_*`

هذا يطابق المنطق المستخدم فعلاً في النظام (دالة `is_same_area_deputy`).

## التغييرات

### `src/pages/SupervisorDashboard.tsx` — تعديل `fetchData`

```typescript
// بدلاً من الاعتماد فقط على promoted_by:
const { data: rolesData } = await supabase
  .from('user_roles')
  .select('user_id, role, promoted_by')
  .eq('promoted_by', user.id);
```

يُستبدل بمنطق مزدوج:

1. جلب promoted_by = user.id
2. إذا كان الدور `local_coordinator`: جلب بيانات الملف الشخصي للمستخدم الحالي (academy, directorate)
3. جلب جميع `deputy_local_*` الذين لديهم نفس الأكاديمية والمديرية
4. دمج النتائج مع إزالة التكرار

### لا تغييرات على قاعدة البيانات أو RLS
السياسات الحالية كافية.

