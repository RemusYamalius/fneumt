

# خطة التنفيذ: 3 مهام

## 1. تغيير حالة الطلب من قبل نائب المنسق المحلي

**في `src/pages/IncomingRequests.tsx`:**
- إضافة أزرار تغيير الحالة عند فتح الطلب (قيد المعالجة / تمت التسوية / مرفوض)
- كل تغيير يُسجَّل في `request_status_history` ويُرسل إشعاراً لصاحب الطلب
- عرض الأزرار فقط للحالات المنطقية (مثلاً: لا يظهر "قيد المعالجة" إذا كان الطلب بالفعل قيد المعالجة)

**ترجمات جديدة في `src/lib/i18n.tsx`:**
- `markProcessing` / `markResolved` / `markRejected` بالعربية والفرنسية
- `statusChangedSuccess`

---

## 2. لوحة إحصاءات المنسق المحلي

**صفحة جديدة: `src/pages/SupervisorDashboard.tsx`**
- بطاقات لكل نائب (اسمه + السلك الموكل له)
- عند النقر على بطاقة نائب → عرض:
  - رسم بياني بالأعمدة (BarChart) لعدد الطلبات حسب الحالة
  - رسم بياني دائري (PieChart) لتوزيع الفئات
  - جدول بالأرقام التسلسلية للملفات وحالاتها
- استخدام مكتبة `recharts` (مثبتة بالفعل)
- البيانات: جلب الطلبات المُسندة لكل نائب (`assigned_to`)

**تحديد النواب:** استعلام `user_roles` للبحث عن المستخدمين الذين عيّنهم المنسق (يتطلب إضافة `promoted_by` — انظر القسم 3)

**تحديث `Dashboard.tsx`:** إضافة بطاقة "لوحة الإشراف" للمنسق المحلي

**تحديث `App.tsx`:** مسار `/supervisor`

---

## 3. تصحيح إدارة المستخدمين — إظهار المرؤوسين فقط

### المشكلة
حالياً كل promoter يرى جميع المستخدمين في نطاقه الجغرافي. المطلوب: كل مسؤول يرى فقط المستخدمين الذين عيّنهم شخصياً.

### الحل

**Migration SQL:**
```sql
ALTER TABLE public.user_roles ADD COLUMN promoted_by uuid;
```

**تحديث `handleRoleChange` في `UserManagement.tsx`:**
- عند تغيير الدور، حفظ `promoted_by = auth.uid()` مع الدور الجديد

**تحديث `filteredUsers` في `UserManagement.tsx`:**
- الأدمين يرى الجميع (كما هو)
- باقي المسؤولين يرون فقط المستخدمين حيث `promoted_by = user.id` في جدول `user_roles`
- بالإضافة للمستخدمين ذوي دور `teacher` في نطاقهم الجغرافي (لتعيينهم)

**تحديث `fetchUsers`:**
- جلب حقل `promoted_by` من `user_roles` مع البيانات

---

## التفاصيل التقنية

### Migration SQL
```sql
-- Add promoted_by to track who assigned each role
ALTER TABLE public.user_roles 
  ADD COLUMN promoted_by uuid;
```

### الملفات المتأثرة
| الملف | التغيير |
|-------|---------|
| **Migration SQL** | إضافة عمود `promoted_by` |
| `src/pages/IncomingRequests.tsx` | أزرار تغيير الحالة + إشعارات |
| `src/pages/SupervisorDashboard.tsx` | **جديد** — لوحة إشراف بالرسوم البيانية |
| `src/pages/admin/UserManagement.tsx` | فلترة بـ `promoted_by` + حفظه عند التعيين |
| `src/pages/Dashboard.tsx` | بطاقة لوحة الإشراف للمنسق المحلي |
| `src/App.tsx` | مسار `/supervisor` |
| `src/lib/i18n.tsx` | ترجمات جديدة |

