

# خطة: تقييد بحث "المكاتب المحلية" على أعضاء المكاتب فقط

## المشكلة
عند اختيار نطاق البحث "المكاتب المحلية"، النظام يعرض جميع المسجلين في الإقليم بدل الاقتصار على أعضاء المكاتب النقابية المحلية (المسجلين في جدول `local_office_members`).

## الحل — `src/pages/QuickFilter.tsx` (handleSearch)

### تعديل `handleSearch` لتمييز وضع البحث

عندما يكون `filters.mode === 'offices'`:

1. **جلب أعضاء المكاتب أولاً**: استعلام `local_office_members` مع `local_offices` للحصول على `user_id` لجميع أعضاء المكاتب في النطاق المحدد (الأكاديمية/المديرية)
2. **تصفية النتائج**: استعلام `profiles` مع تقييد `user_id` بقائمة الأعضاء المستخرجة من الخطوة 1 باستخدام `.in('user_id', memberIds)`
3. **تطبيق باقي الفلاتر** (المهمة، النوع، العمر...) كالمعتاد

```text
الخطوات التقنية:
1. إذا mode === 'offices':
   a. جلب local_offices حسب academy/directorate
   b. جلب local_office_members حسب office_ids المستخرجة
   c. استخراج user_ids
   d. استعلام profiles مع .in('user_id', memberUserIds)
2. إذا mode === 'users': السلوك الحالي (بدون تغيير)
```

## الملفات المتأثرة
```
src/pages/QuickFilter.tsx  — تعديل handleSearch فقط
```

