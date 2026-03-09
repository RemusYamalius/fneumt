

# خطة إعادة بناء لوحة الإشراف للمنسق المحلي

## الوضع الحالي

- صفحة `SupervisorDashboard` موجودة لكنها بسيطة: بطاقات نواب + رسم بياني عام + جدول
- المنسق المحلي (`local_coordinator`) **غير مضمّن** في `showSupervisorDashboard` بالداشبورد، رغم أنه مسموح له بالوصول للصفحة عبر `RoleGuard`
- البيانات المتاحة: `requests` (الحالة، التاريخ، المعيّن إليه)، `request_status_history` (تواريخ التغييرات)، `profiles` (التحقق من العضوية)

## التغييرات المطلوبة

### 1. إضافة `local_coordinator` لبطاقة لوحة الإشراف في Dashboard
**ملف:** `src/pages/Dashboard.tsx`
- إضافة `'local_coordinator'` لمصفوفة `showSupervisorDashboard`

### 2. إعادة بناء `SupervisorDashboard.tsx` بالكامل
**ملف:** `src/pages/SupervisorDashboard.tsx`

بتصميم مستوحى من الصورة المرفقة (Budget Planner Dashboard) مع بطاقة مفصّلة لكل نائب:

#### أ. بطاقات ملخّصة عُلوية (Summary KPIs)
4 بطاقات رئيسية متحركة:
- **إجمالي الطلبات** الواردة على جميع النواب
- **الطلبات المعالَجة** (accepted)
- **معدل الاستجابة** (نسبة المطّلع عليها من المجموع)
- **التحقق من العضوية** (عدد الأساتذة المتحقق منهم)

#### ب. بطاقة مفصّلة لكل نائب (قابلة للتوسيع)
كل بطاقة تحتوي على:

1. **رأس البطاقة**: اسم النائب، دوره، عدد الطلبات، شارة الحالة
2. **صف KPIs مصغّرة**: طلبات واردة | مطّلع عليها | قيد الإجراء | مقبولة | ملغاة
3. **رسم أعمدة (Bar Chart)**: توزيع الطلبات حسب الحالة
4. **رسم دائري (Donut Chart)**: توزيع الطلبات حسب الفئة
5. **رسم خطّي (Area Chart)**: حجم الطلبات عبر الزمن (آخر 30 يوم)
6. **بطاقات معدلات**:
   - معدل الاستجابة (% المطّلع عليها)
   - متوسط وقت الاستجابة (من الإيداع للاطلاع)
   - نسبة القبول vs الإلغاء
7. **جدول آخر الطلبات** (أحدث 5)

#### ج. مصادر البيانات
- `user_roles` (promoted_by = user.id) → قائمة النواب
- `requests` (assigned_to IN deputy_ids) → الطلبات
- `request_status_history` (request_id) → حساب أوقات الاستجابة
- `profiles` (academy, directorate مطابقة) → إحصاءات التحقق من العضوية

### 3. إضافة ترجمات i18n
**ملف:** `src/lib/i18n.tsx`

مفاتيح جديدة: `responseRate`, `avgResponseTime`, `processedRequests`, `verifiedMembers`, `acceptanceRate`, `recentRequests`, `requestsOverTime`, `hours`, `viewedRate`, `pendingRequests`

### 4. RLS - لا تغييرات مطلوبة
البيانات المطلوبة متاحة بالفعل عبر سياسات RLS الحالية:
- `Promoters can view all roles` → user_roles
- `Officers can view assigned requests` + select policies → requests
- `Promoters can view all profiles` → profiles
- `Officers can view assigned request history` → request_status_history (قد نحتاج سياسة إضافية للمنسق ليرى تاريخ طلبات نوابه)

### 5. سياسة RLS إضافية محتملة
**Migration SQL**: إضافة سياسة SELECT على `request_status_history` تسمح للمنسق المحلي بعرض سجل الطلبات المعيّنة لنوابه.

### التصميم البصري
- خلفية رمادية فاتحة مع بطاقات بيضاء بظلال ناعمة (كما في الصورة)
- تدرجات لونية: أزرق داكن/بنفسجي للعناوين، أخضر للإيجابي، أحمر للسلبي
- `framer-motion`: fade-in + stagger للبطاقات، scale-in للأرقام، slide-up للرسوم البيانية
- بطاقات النواب قابلة للتوسيع بأنيميشن accordion
- أرقام KPI مع تأثير عداد متحرك (count-up animation)

