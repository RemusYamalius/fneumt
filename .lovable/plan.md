

# إظهار لوحة الإشراف لنواب المشرف الجهوي ونواب المسؤول الإقليمي

## المشكلة
أدوار `deputy_regional_*` و `deputy_provincial_*` مسموح لها بالدخول إلى `/supervisor` (عبر RoleGuard)، لكنها غير مدرجة في `TRIO_ROLES` أو `AREA_CONFIG`، فلا يتم جلب أي مرؤوسين لها ← تظهر لوحة فارغة.

## التسلسل الهرمي
- `deputy_regional_*` → يعيّن `provincial_manager` (مرؤوس واحد، نطاق: الأكاديمية)
- `deputy_provincial_*` → يعيّن `local_coordinator` (مرؤوس واحد، نطاق: الأكاديمية + المديرية)

هذه ليست أدوار "ثلاثية" (trio) بل لكل نائب مرؤوس واحد فقط.

## الحل

### تعديل `src/pages/SupervisorDashboard.tsx`

1. **إضافة أدوار النواب إلى `AREA_CONFIG`:**
```typescript
deputy_regional_primary: { subordinates: ['provincial_manager'], matchFields: ['academy'] },
deputy_regional_middle: { subordinates: ['provincial_manager'], matchFields: ['academy'] },
deputy_regional_high: { subordinates: ['provincial_manager'], matchFields: ['academy'] },
deputy_provincial_primary: { subordinates: ['local_coordinator'], matchFields: ['academy', 'directorate'] },
deputy_provincial_middle: { subordinates: ['local_coordinator'], matchFields: ['academy', 'directorate'] },
deputy_provincial_high: { subordinates: ['local_coordinator'], matchFields: ['academy', 'directorate'] },
```

2. **إضافة placeholders للنواب أيضاً** — بما أن كل نائب يتوقع مرؤوساً واحداً فقط، نضيف placeholder إذا لم يكن معيّناً بعد:
```typescript
const SINGLE_SUBORDINATE: Record<string, string> = {
  deputy_regional_primary: 'provincial_manager',
  deputy_regional_middle: 'provincial_manager',
  deputy_regional_high: 'provincial_manager',
  deputy_provincial_primary: 'local_coordinator',
  deputy_provincial_middle: 'local_coordinator',
  deputy_provincial_high: 'local_coordinator',
};
```
بعد جلب البيانات، إذا كان الدور في `SINGLE_SUBORDINATE` ولم يُعثر على مرؤوس حقيقي، يُضاف placeholder.

### لا تغييرات على قاعدة البيانات
السياسات والدوال الحالية كافية — البحث يتم عبر `promoted_by` + التطابق الجغرافي الموجود أصلاً.

