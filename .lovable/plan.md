

## التغييرات المطلوبة

إعادة تسمية حقل "المهمة" إلى "الإطار / المهمة" وتوسيع قائمة الاختيارات لتشمل جميع الخيارات الظاهرة في الصورة المرفقة.

---

### الملفات المعنية

**1. `src/lib/i18n.tsx`**
- تغيير `missionLabel` من `'المهمة'` إلى `'الإطار / المهمة'` (بالعربية) و `'Cadre / Mission'` (بالفرنسية)
- حذف `missionTeaching` و `missionAdministration`
- إضافة مفاتيح جديدة لكل خيار من الصورة (16 خيار):

| القيمة (value) | العربية | الفرنسية |
|---|---|---|
| `teacher_primary` | أستاذ التعليم الابتدائي | Enseignant du primaire |
| `teacher_middle` | أستاذ التعليم الثانوي الإعدادي | Enseignant du collège |
| `teacher_high` | أستاذ التعليم الثانوي التأهيلي | Enseignant du lycée |
| `support_staff` | إطار الدعم | Cadre de soutien |
| `supplier` | ممون | Fournisseur |
| `educational_advisor` | ملحق تربوي | Conseiller pédagogique |
| `guard` | حارس عام للخارجية | Surveillant général externe |
| `director` | مدير | Directeur |
| `administrator` | متصرف | Administrateur |
| `educational_inspector` | مفتش تربوي | Inspecteur pédagogique |
| `tech_assistant` | مساعد تقني | Assistant technique |
| `economy_admin` | ملحق الاقتصاد و الادارة | Attaché d'économie et admin |
| `treasurer` | قيم على الخزانة | Trésorier |
| `other` | آخر | Autre |

**2. `src/pages/Profile.tsx`**
- تحديث `missionOptions` لتشمل جميع الخيارات الـ 14 الجديدة بدل الخيارين القديمين.

**3. `src/pages/NewRequest.tsx`** (إن كان يستخدم نفس الخيارات — سأتحقق أثناء التنفيذ)

> لا حاجة لتغيير قاعدة البيانات لأن حقل `mission` هو من نوع `text` ويقبل أي قيمة.

