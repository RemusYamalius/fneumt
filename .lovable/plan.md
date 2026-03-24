

# خطة: إصلاح توجيه الطلبات لنواب المنسقين المحليين

## المشكل
دالتا `auto_assign_request` و `auto_assign_join_request` في قاعدة البيانات تتوقفان عن العمل عندما يكون حقل `corps` فارغاً (null) في ملف المرسل. رغم أن الملف الشخصي مكتمل (حقل `mission` موجود)، فإن `corps` لا يُملأ دائماً — مما يمنع توجيه الطلب لأي نائب.

## السبب الجذري
```sql
IF _profile.corps IS NULL THEN
  RETURN NEW;  -- يتوقف هنا بدون تعيين
END IF;
```

الحقول الإلزامية في الواجهة تشمل `mission` لكن ليس `corps`. لذا كثير من المستخدمين لديهم `mission = 'teacher_middle'` مثلاً لكن `corps = null`.

## الحل: Migration واحد

### تحديث دالة `auto_assign_request`
- بدل التوقف عند `corps IS NULL`، يتم استنتاج السلك من `mission`:
  - `teacher_primary` / `inspector_primary` → `primary`
  - `teacher_middle` / `inspector_middle` → `middle_school`
  - `teacher_high` / `inspector_high` → `high_school`
  - أي قيمة أخرى → `primary` (افتراضي)
- يُستخدم هذا القيمة المستنتجة لتحديد نائب المنسق المناسب

### تحديث دالة `auto_assign_join_request` بنفس المنطق

### إصلاح الطلبات الحالية غير المعيّنة
- تشغيل `UPDATE` لتعيين الطلبات التي `assigned_to IS NULL` إلى النائب المناسب بناءً على الأكاديمية والمديرية والمهمة

## الملفات المتأثرة
- Migration SQL جديد فقط (لا تغييرات في الكود الأمامي)

## ملاحظة
- الوضع الحالي للواجهة يبقى كما هو: كل الحسابات تحتاج ملفاً كاملاً لتقديم طلب
- ذوو المناصب يتجاوزون العد التنازلي فقط (وهذا يعمل حالياً)

