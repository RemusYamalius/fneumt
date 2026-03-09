

# إظهار بطاقات "في انتظار التعيين" لجميع المناصب المفقودة

## تحليل الوضع الحالي

البيانات الحالية تُظهر أن كل مستوى هرمي يحتوي فقط على السلك **الإعدادي** (middle):
- `deputy_regional_middle` ← بدون primary و high
- `deputy_provincial_middle` ← بدون primary و high
- `deputy_local_middle` ← بدون primary و high

**منطق Placeholder الحالي** يعمل فقط لـ 3 أدوار: `local_coordinator`, `provincial_manager`, `regional_supervisor` (عبر `TRIO_ROLES`). **لا يعمل** لـ:
1. **Admin** — يرى فقط `regional_supervisor` بدون placeholders للمناصب المفقودة الأخرى
2. **النواب** (`deputy_regional_*`, `deputy_provincial_*`) — يرون مرؤوساً واحداً فقط بدون placeholders

## الحل

### تعديل `src/pages/SupervisorDashboard.tsx`

**1. لوحة Admin الشاملة:**
بدلاً من عرض `regional_supervisor` فقط، يعرض Admin **جميع** الأدوار الإشرافية المعينة + placeholders لكل المناصب المفقودة في الهيكل الكامل:

```typescript
if (role === 'admin') {
  // Fetch ALL non-teacher roles
  const { data } = await supabase.from('user_roles')
    .select('user_id, role, promoted_by')
    .neq('role', 'teacher');
  allDeputyRoles = data || [];
  
  // Inject placeholders for ALL 13 supervisory roles that don't exist
  const ALL_SUPERVISORY_ROLES = [
    'regional_supervisor',
    'deputy_regional_primary', 'deputy_regional_middle', 'deputy_regional_high',
    'provincial_manager',
    'deputy_provincial_primary', 'deputy_provincial_middle', 'deputy_provincial_high',
    'local_coordinator',
    'deputy_local_primary', 'deputy_local_middle', 'deputy_local_high',
  ];
  const existingRoles = new Set(allDeputyRoles.map(r => r.role));
  ALL_SUPERVISORY_ROLES.forEach(r => {
    if (!existingRoles.has(r)) {
      allDeputyRoles.push({ user_id: `placeholder_${r}`, role: r, promoted_by: null });
    }
  });
}
```

**2. أدوار النواب — إضافة trio للمرؤوس الموجود:**
عندما يكون النائب (مثل `deputy_regional_middle`) لديه مرؤوس (`provincial_manager`)، نضيف أيضاً placeholders لأدوار trio الخاصة بذلك المرؤوس إذا لم تكن موجودة. هذا يعني أن `deputy_regional_middle` سيرى:
- `provincial_manager` (حقيقي)
- + اختيارياً أدوار trio التابعة له كمعلومات إضافية

لكن هذا سيغير هيكل اللوحة بشكل كبير. الأبسط: **لا تغيير للنواب** — هم يرون مرؤوسهم المباشر فقط (وهذا صحيح هيكلياً).

**3. ترتيب البطاقات:**
ترتيب البطاقات حسب مستوى الدور في الهيكل الهرمي لتسهيل القراءة (جهوي → إقليمي → محلي).

## الملفات المعنية

| الملف | التعديل |
|---|---|
| `src/pages/SupervisorDashboard.tsx` | تعديل مسار Admin ليعرض جميع الأدوار + placeholders |

