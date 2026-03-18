

# إضافة فلتر "المكتب المحلي" في فلاتر المستلمين

## التعديل

### `src/components/PostComposer.tsx`

1. **State جديد**: إضافة `filterLocalOffice` + `localOffices` (قائمة المكاتب المجلوبة من DB)

2. **جلب المكاتب**: `useEffect` يجلب من `local_offices` (id, office_name, directorate, academy) ويفلترها حسب الأكاديمية/المديرية المختارة إن وُجدت

3. **واجهة الفلتر**: إضافة Select جديد بعنوان "المكتب المحلي" بين فلتر المديرية وفلتر المؤسسة في الشبكة. يعرض أسماء المكاتب المتاحة (فارغ حالياً لعدم وجود مكاتب)

4. **منطق الفلترة**: عند اختيار مكتب محلي في `fetchRecipientIds`:
   - جلب أعضاء المكتب من `local_office_members` حيث `office_id = filterLocalOffice`
   - إضافة `user_id` الأعضاء كشرط `.in('user_id', memberIds)` على استعلام profiles
   - يضاف إلى `buildFilters` كـ `localOffice`

### الملفات المعنية

| الملف | التعديل |
|---|---|
| `src/components/PostComposer.tsx` | إضافة state + useEffect لجلب المكاتب + Select في الفلاتر + تحديث fetchRecipientIds |

