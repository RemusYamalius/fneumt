

# خطة: تصدير Excel + إصلاح اللغة الإنجليزية + عكس ترتيب الأعمدة RTL

## المشاكل المحددة
1. المبيانات والجدول تعرض قيم المهام بالإنجليزية (`teaching`, `teacher_middle`) لأن `MISSIONS_LIST` يستخدم مفاتيح ترجمة (`missionTeacherPrimary`) بينما قاعدة البيانات تخزن قيم مختلفة (`teacher_primary`)
2. أعمدة الجدول مرتبة من اليسار لليمين (LTR) رغم أن اللغة عربية
3. لا يوجد زر تصدير Excel

## التغييرات

### 1. `src/pages/DatabaseDashboard.tsx`

**إصلاح ترجمة المهام:**
- إنشاء خريطة (map) تربط قيم قاعدة البيانات بمفاتيح الترجمة:
```typescript
const MISSION_VALUE_TO_KEY: Record<string, string> = {
  'teacher_primary': 'missionTeacherPrimary',
  'teacher_middle': 'missionTeacherMiddle',
  'teacher_high': 'missionTeacherHigh',
  'teaching': 'missionTeacherPrimary', // fallback for legacy
  // ... all 26 values
};
const getMissionLabel = (val: string) => (t as any)[MISSION_VALUE_TO_KEY[val]] || val;
```
- تحديث `MISSIONS_LIST` ليستخدم القيم الحقيقية من DB بدل مفاتيح الترجمة
- استخدام `getMissionLabel` في: الفلتر Select، الجدول، بيانات المبيان `missionChartData`

**عكس ترتيب أعمدة الجدول للعربية:**
- عكس ترتيب الأعمدة: الدور ← حالة الانخراط ← الهاتف ← المؤسسة ← المديرية ← الأكاديمية ← الإطار ← N°PPR ← تاريخ الازدياد ← النوع ← الاسم
- هذا يجعل "الدور" أول عمود من اليمين و"الاسم" آخر عمود (حسب اتجاه القراءة العربية)

**إضافة زر تصدير Excel:**
- زر في أعلى الجدول بجانب "عرض النتائج"
- يستخدم مكتبة `xlsx` المثبتة مسبقاً
- يصدّر البيانات المفلترة الحالية (ليس فقط الصفحة الحالية) مع عناوين أعمدة مترجمة
- اسم الملف: `database-export-{date}.xlsx`

### 2. `src/lib/i18n.tsx`
- إضافة ترجمة `exportToExcel`: تصدير إلى Excel / Exporter en Excel

