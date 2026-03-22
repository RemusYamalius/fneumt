

# خطة: جعل الإشعارات قابلة للنقر

## التحليل
جدول `notifications` يحتوي على حقل `link` (نص اختياري). عند إنشاء إشعار، يُخزَّن رابط الوجهة في هذا الحقل (مثل `/track?q=REQ-123` أو `/communication-hub`).

## التعديل في `src/components/NotificationPanel.tsx`

### 1. إضافة `useNavigate` من React Router
- استيراد `useNavigate` + أيقونة `ChevronLeft` أو `ExternalLink` للإشارة البصرية

### 2. تعديل `onClick` لكل إشعار
- عند النقر على أي إشعار:
  1. تعليمه كمقروء (`handleMarkOne`)
  2. إغلاق اللوحة المنبثقة (`setOpen(false)`)
  3. إذا `n.link` موجود → `navigate(n.link)`
  4. إذا لا رابط → فقط تعليمه كمقروء

### 3. إضافة مؤشر بصري
- إضافة أيقونة سهم صغيرة (`ChevronRight` / `ChevronLeft` حسب RTL) على الإشعارات التي تحتوي رابط
- تأثير hover: انزلاق خفيف للسهم لإيحاء بالنقر

### 4. تغيير cursor
- `cursor-pointer` للإشعارات التي تحتوي رابط

## الملفات المتأثرة
- `src/components/NotificationPanel.tsx` فقط

