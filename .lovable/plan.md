

# إصلاح عداد المرؤوسين المعينين وإضافة تحديد السلك/المديرية

## المشكلتان

### 1. عداد "المرؤوسون المعينون" يظهر 0
**السبب:** حساب `teamSize` يعتمد حصرياً على حقل `promoted_by` في جدول `user_roles`. لكن البيانات الحالية تُظهر أن `promoted_by` فارغ (NULL) لجميع الأدوار — أي لم يتم تسجيل من عيّن من. لذا الاستعلام يرجع 0 دائماً.

**الحل:** تعديل حساب `teamSize` ليستخدم نفس منطق الاكتشاف الجغرافي (area-based matching) المستخدم أصلاً لاكتشاف المرؤوسين. لكل مرؤوس حقيقي:
- جلب ملفه الشخصي (academy, directorate)
- البحث عن الأدوار التابعة له حسب `TRIO_ROLES` أو `AREA_CONFIG` في نفس النطاق الجغرافي
- عدّ النتائج كـ `teamSize`

### 2. إضافة تحديد السلك/المديرية على بطاقة المسؤول الإقليمي
عند عرض بطاقة `provincial_manager`، إضافة المديرية الإقليمية (directorate) كمعلومة تعريفية إضافية تحت اسم الدور. هذا يميّز المسؤولين الإقليميين عن بعضهم.

## التعديلات في `src/pages/SupervisorDashboard.tsx`

### أ. تخزين بيانات الملف الشخصي لكل مرؤوس
توسيع واجهة `Deputy` لتشمل `academy` و `directorate`:
```typescript
interface Deputy {
  user_id: string;
  full_name: string | null;
  role: string;
  teamSize?: number;
  academy?: string | null;
  directorate?: string | null;
}
```

### ب. حساب teamSize بالمطابقة الجغرافية
بعد جلب الملفات الشخصية للمرؤوسين، لكل مرؤوس حقيقي:
- تحديد أدواره التابعة من `TRIO_ROLES` أو `AREA_CONFIG`
- استعلام `user_roles` + `profiles` للبحث عن مستخدمين بنفس النطاق الجغرافي وبالأدوار المتوقعة
- تعيين العدد كـ `teamSize`

### ج. عرض المديرية على بطاقة المسؤول الإقليمي
في قسم Deputy Header، إضافة سطر يعرض `dep.directorate` (وربما `dep.academy`) كنص صغير تحت اسم الدور.

### د. ترجمات جديدة في `src/lib/i18n.tsx`
لا حاجة لترجمات إضافية — المديرية تُعرض كقيمة مباشرة من قاعدة البيانات.

## الملفات المعنية
| الملف | التعديل |
|---|---|
| `src/pages/SupervisorDashboard.tsx` | توسيع Deputy interface، تعديل fetchData لحساب teamSize جغرافياً، عرض directorate على البطاقات |

