

# تحليل: جرس الإشعارات لا يعرض إشعارات المنشورات

## المشكلة
الجرس يحسب فقط من جدول `notifications` (حيث `is_read = false`)، بينما إشعارات المنشورات (ركن التواصل) تُخزَّن في جدول مختلف تماماً: `post_recipients` (حيث `is_read = false`). لذلك الجرس لا يعكس المنشورات غير المقروءة.

بطاقة "ركن التواصل" في Dashboard تحسب `post_recipients` مباشرة، لهذا تظهر الرقم 1 على البطاقة لكن الجرس فارغ.

## الحل المقترح
دمج عدد `post_recipients` غير المقروءة مع عدد `notifications` غير المقروءة في حساب الجرس.

### التعديل في `src/hooks/useRealtimeNotifications.ts`
في دالة `fetchUnreadCount` (السطر 29-36):
- إضافة استعلام ثانٍ لـ `post_recipients` حيث `is_read = false`
- جمع العددين: `notifications count + post_recipients count`

```text
قبل:  unreadCount = notifications(is_read=false).count
بعد:  unreadCount = notifications(is_read=false).count + post_recipients(is_read=false).count
```

### التعديل في `src/components/NotificationPanel.tsx`
- إضافة تبويب ثالث أو دمج المنشورات غير المقروءة في القائمة الحالية
- الخيار الأبسط: إضافة صف ملخص في أعلى القائمة يشير لوجود منشورات غير مقروءة مع رابط `/communication-hub`

### التعديل في `markAllRead`
- إضافة تحديث `post_recipients` أيضاً عند النقر على "تحديد الكل كمقروء"

## الملفات المتأثرة
- `src/hooks/useRealtimeNotifications.ts` — دمج عدد post_recipients في unreadCount + تحديث markAllRead
- `src/components/NotificationPanel.tsx` — عرض المنشورات غير المقروءة في اللوحة

