

# خطة: إصلاح جرس الإشعارات + التمرير + خطأ 404

## تحليل المشاكل

### 1. خطأ 404 عند النقر على "لديك منشور غير مقروء"
**السبب**: البانر يوجه إلى `/communication-hub` لكن المسار الفعلي في `App.tsx` هو `/communication` (سطر 56).
**الحل**: تصحيح المسار في `NotificationPanel.tsx` من `/communication-hub` إلى `/communication`.

### 2. عدم إمكانية التمرير (Scrolling)
**السبب**: `ScrollArea` مع `max-h-[400px]` لا يعمل بشكل صحيح مع Radix ScrollArea. يحتاج لارتفاع ثابت أو تقنية CSS مختلفة.
**الحل**: تغيير `ScrollArea` إلى `div` عادي مع `overflow-y-auto max-h-[400px]` لضمان التمرير.

### 3. "غير مقروءة" (18) أكبر من "الكل" (17)
**السبب**: الحد الأقصى للاستعلام هو `limit(20)` في تبويب "الكل"، لكن `notificationsUnreadCount` يُحسب من القائمة المعروضة فقط (أقصى 20). العدد على الجرس (18) يشمل `post_recipients` + `requests` + `notifications`. لكن المشكل هو أن العدد المحلي `notificationsUnreadCount` يعرض عدد الإشعارات غير المقروءة في القائمة المعروضة فحسب — وليس العدد الحقيقي.
**الحل**: 
- في تبويب "غير مقروءة"، العدد = `notifications.length` (صحيح لأنه يجلب فقط غير المقروءة)
- في تبويب "الكل"، العدد = عدد الإشعارات التي `is_read = false` في القائمة المحملة
- رفع `limit` إلى 50 لتغطية أكبر

### 4. صورة البروفايل
المستخدم اختار الحفاظ على الحرف الأول مؤقتاً — لا تعديل مطلوب.

## التعديلات

### `src/components/NotificationPanel.tsx`
1. تصحيح `/communication-hub` → `/communication` (سطران: 108-109)
2. استبدال `<ScrollArea className="max-h-[400px]">` بـ `<div className="overflow-y-auto max-h-[400px]">`
3. رفع `limit(20)` إلى `limit(50)`

## الملفات المتأثرة
- `src/components/NotificationPanel.tsx` فقط

