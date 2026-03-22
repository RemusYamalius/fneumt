

# خطة: إصلاح لوحة الإشعارات

## المشكلتان

### 1. اللبس في العدد على تبويب "غير مقروءة"
`unreadCount` يجمع من 3 جداول (notifications + post_recipients + requests)، لكن قائمة الإشعارات تعرض فقط من جدول `notifications`. فيظهر رقم "1" على تبويب "غير مقروءة" بينما القائمة فارغة — لأن الـ "1" هو منشور وليس إشعاراً.

**الحل**: فصل العدد — تبويب "غير مقروءة" يعرض فقط عدد إشعارات `notifications` غير المقروءة (يُحسب محلياً في NotificationPanel). أما عدد المنشورات فيظهر فقط على بانر المنشورات.

### 2. النقر على "لديك منشور غير مقروء" لا يفعل شيئاً
المستخدم موجود أصلاً في `/communication-hub`، فـ `navigate('/communication-hub')` لا يفعل شيئاً.

**الحل**: عند النقر، بدل التنقل:
- تعليم المنشورات كمقروءة مباشرة (`post_recipients.is_read = true`)
- تحديث الكاش وإغلاق اللوحة
- إذا لم يكن المستخدم في `/communication-hub`، يتم التوجيه إليها

## التعديلات في `src/components/NotificationPanel.tsx`

1. إضافة استعلام منفصل لعدد إشعارات `notifications` غير المقروءة (`notificationsUnreadCount`)
2. استخدام هذا العدد المحلي في badge تبويب "غير مقروءة" بدل `unreadCount`
3. تعديل `handleGoToPosts`:
   - تعليم كل `post_recipients` كمقروءة
   - invalidate caches + onRefetch
   - التوجيه فقط إذا لم نكن في `/communication-hub`
4. إضافة عدد المنشورات غير المقروءة على بانر المنشورات نفسه

## الملفات المتأثرة
- `src/components/NotificationPanel.tsx` فقط

