

# خطة: إصلاح جرس الإشعارات + إضافة Tooltips للأيقونات

## المشكلة 1: الجرس يبقى يعرض عدداً رغم قراءة كل شيء

**السبب**: `useRealtimeNotifications` يحسب عدد الإشعارات غير المقروءة من جدول `notifications` (حيث `is_read = false`). لكن الإشعارات لا تُعلّم كمقروءة إلا عند النقر على طلب معين في لوحة التحكم (سطر 518-523 في Dashboard.tsx). لا توجد آلية لتصفير كل الإشعارات دفعة واحدة.

**الحل**: 
- إضافة وظيفة `markAllRead` في `useRealtimeNotifications` تُعلّم كل إشعارات المستخدم كمقروءة
- جعل أيقونة الجرس في `AuthenticatedLayout` قابلة للنقر: عند النقر تُصفّر الإشعارات (mark all as read) مع إظهار toast تأكيدي
- بالنسبة لأصحاب أدوار Inbox (deputy_local_*): النقر يوجههم مباشرة لصفحة الطلبات الواردة

## المشكلة 2: لا tooltips على أيقونات الشريط العلوي

**الحل**: إضافة `Tooltip` حول أيقونات Globe و Bell و LogOut في `AuthenticatedLayout.tsx`، مع نصوص مترجمة:
- Globe: "اللغة" / "Langue"  
- Bell: `t.notifications` (موجود أصلاً)
- LogOut: `t.logout` (موجود أصلاً)

## الملفات المتأثرة
- `src/hooks/useRealtimeNotifications.ts` — إضافة `markAllRead`
- `src/components/AuthenticatedLayout.tsx` — tooltips + نقر على الجرس
- `src/lib/i18n.tsx` — إضافة مفتاح `language` (ar/fr)

