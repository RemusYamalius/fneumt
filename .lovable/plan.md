

## التغييرات المطلوبة

استبدال فئات الطلبات الحالية (7 فئات) بقائمة جديدة من 11 موضوعاً مستوحاة من الصورة المرفقة، مع تحسين بصري احترافي للبطاقات وتغيير العنوان من "اختر الفئة" إلى "موضوع الطلب".

---

### 1. `src/lib/i18n.tsx`

**تغيير التسميات:**
- `selectCategory` → `'موضوع الطلب'` / `'Objet de la demande'`
- `stepCategory` → `'الموضوع'` / `'Objet'`

**حذف الفئات القديمة** (cat_medical_file, cat_mohammed_vi_foundation, etc.) واستبدالها بـ 11 مفتاحاً جديداً:

| المفتاح | العربية | الفرنسية |
|---|---|---|
| `cat_rank_promotion` | الترقية في الرتبة | Promotion de grade |
| `cat_grade_promotion` | الترقية في الدرجة | Promotion d'échelon |
| `cat_schedules` | جداول الحصص | Emplois du temps |
| `cat_infrastructure` | البنية المادية للمؤسسة | Infrastructure |
| `cat_financial_compensation` | التعويضات المالية | Indemnités financières |
| `cat_zone_compensation` | تعويضات المنطقة | Indemnités de zone |
| `cat_equipment` | التجهيزات | Équipements |
| `cat_grievances` | تظلمات | Réclamations |
| `cat_assignments` | تكليفات | Affectations |
| `cat_inspection_score` | نقطة التفتيش | Note d'inspection |
| `cat_other` | آخر | Autre |

### 2. `src/pages/NewRequest.tsx`

- تحديث `RequestCategory` type ليشمل 11 قيمة جديدة
- تحديث مصفوفة `CATEGORIES` بأيقونات مناسبة لكل موضوع (مثلاً: `Award` للترقية، `Clock` للحصص، `Building2` للبنية، `Coins` للتعويضات، `Wrench` للتجهيزات، `AlertTriangle` للتظلمات، `ClipboardList` للتكليفات، `Search` للتفتيش، `MoreHorizontal` لآخر)
- تحسين بصري للبطاقات: إضافة حركات framer-motion (scale + fadeIn عند الظهور)، تدرجات لونية فريدة لكل بطاقة، ظلال ناعمة، تأثير hover أقوى
- تغيير الشبكة إلى `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` لاستيعاب 11 بطاقة

### 3. ملفات أخرى تستخدم `categoryLabel`

- `src/pages/TrackRequest.tsx` و `src/pages/SupervisorDashboard.tsx` — يستخدمان `t[cat_${category}]` ديناميكياً فلا حاجة لتعديلهما، ستعمل المفاتيح الجديدة تلقائياً.

> **ملاحظة:** حقل `category` في قاعدة البيانات هو `text` فلا حاجة لتعديل DB.

