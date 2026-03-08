

## خطة التعديل

### المشكلة
المسجلون الذين تم إسناد منصب لهم (دور غير `teacher`) يظهرون في صفحة التحقق من الانخراط، بينما لا يجب أن يظهروا.

### الحل
في `fetchUsers` بملف `src/pages/MembershipVerification.tsx`، بعد جلب الملفات الشخصية، نجلب أدوار المستخدمين من جدول `user_roles` ونستبعد كل من لديه دور غير `teacher`.

### التنفيذ
1. بعد جلب `profiles`، نجلب من `user_roles` قائمة `user_id` الذين لديهم دور غير `teacher`
2. نستبعد هؤلاء من قائمة المستخدمين المعروضة

```typescript
// After fetching profiles, fetch promoted users
const { data: promotedRoles } = await supabase
  .from('user_roles')
  .select('user_id')
  .neq('role', 'teacher');

const promotedUserIds = new Set((promotedRoles || []).map(r => r.user_id));
const filteredData = (data || []).filter(u => !promotedUserIds.has(u.user_id));
setUsers(filteredData);
```

### الملف المعني
`src/pages/MembershipVerification.tsx` فقط.

