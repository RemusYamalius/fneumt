

# خطة: إظهار لوحة الإشعارات لجميع الأدوار

## المشكلة
في `AuthenticatedLayout.tsx` (سطر 113-126)، أصحاب أدوار `INBOX_ROLES` (`deputy_local_primary`, `deputy_local_middle`, `deputy_local_high`) يحصلون على زر جرس يوجههم مباشرة لـ `/incoming-requests` بدون إظهار لوحة الإشعارات المنبثقة.

## الحل
استبدال الشرط `isInboxRole` بحيث يظهر `NotificationPanel` لجميع المستخدمين بدون استثناء. يمكن إضافة رابط سريع داخل اللوحة المنبثقة لصفحة الطلبات الواردة لأصحاب أدوار Inbox.

### التعديل في `src/components/AuthenticatedLayout.tsx`
- إزالة الفرع الشرطي `isInboxRole` (سطور 113-126)
- عرض `NotificationPanel` لجميع المستخدمين المسجلين

### الملفات المتأثرة
- `src/components/AuthenticatedLayout.tsx` فقط

