

# إظهار بطاقات جميع النواب الثلاثة (ابتدائي، إعدادي، ثانوي)

## المشكلة
حالياً لا يظهر سوى النائب المعيّن فعلاً. النائبان الآخران (اللذان لم يُعيَّنا بعد) لا يظهران.

## الحل
تعديل `fetchData` في `SupervisorDashboard.tsx` لإضافة بطاقات وهمية (placeholder) للأدوار الثلاثة غير الممثلة:

### التغيير في `src/pages/SupervisorDashboard.tsx`

**بعد جلب النواب الحقيقيين (سطر 179):**
- إضافة منطق يتحقق من وجود الأدوار الثلاثة: `deputy_local_primary`, `deputy_local_middle`, `deputy_local_high`
- لكل دور غير موجود، يُضاف عنصر placeholder بـ `user_id: placeholder_deputy_local_*` واسم `null`

```typescript
const DEPUTY_LOCAL_ROLES = ['deputy_local_primary', 'deputy_local_middle', 'deputy_local_high'];
if (role === 'local_coordinator') {
  const existingRoles = new Set(allDeputyRoles.map(r => r.role));
  DEPUTY_LOCAL_ROLES.forEach(depRole => {
    if (!existingRoles.has(depRole)) {
      allDeputyRoles.push({ user_id: `placeholder_${depRole}`, role: depRole, promoted_by: null });
    }
  });
}
```

**تعديل استعلامات البيانات:**
- فلترة الـ placeholders عند إرسال الاستعلامات لقاعدة البيانات (`realDeputyIds` فقط)
- في حالة عدم وجود نواب حقيقيين، لا يزال يتم تعيين deputies بالـ placeholders

**تعديل عرض رأس البطاقة:**
- إذا كان `full_name` فارغاً والـ `user_id` يبدأ بـ `placeholder_`: إظهار نص "في انتظار التعيين" بدلاً من الاسم
- إظهار شارة "غير معيّن" بلون رمادي

**إزالة شرط `deputies.length === 0`:**
- بما أن الـ placeholders ستضمن وجود 3 عناصر دائماً للمنسق المحلي، لن تظهر رسالة "لا يوجد نواب"

### إضافة ترجمات في `src/lib/i18n.tsx`
- `awaitingAssignment`: "في انتظار التعيين" / "En attente d'affectation"
- `notAssigned`: "غير معيّن" / "Non affecté"

