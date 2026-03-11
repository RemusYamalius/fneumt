

# إصلاح عداد الإشعارات — تفريغ عند النقر على الطلب فقط

## المشكلة
حالياً يتم تصفير جميع الإشعارات بمجرد دخول صاحب الطلب للوحة التحكم، مما يمنع ظهور الإشعار والصوت من الأساس.

## الحل
1. **حذف** التصفير التلقائي عند تحميل Dashboard (سطر 42-51)
2. **عند النقر** على طلب في قسم "طلباتي"، يتم تحديث إشعارات هذا الطلب فقط كـ `is_read: true` ثم التنقل لصفحة التتبع
3. العداد ينقص بعدد الإشعارات الخاصة بالطلب المُطّلع عليه فقط

## التعديلات التقنية

### `src/pages/Dashboard.tsx`

| التعديل | التفاصيل |
|---|---|
| **حذف** `useEffect` (سطر 42-51) | إزالة التصفير التلقائي عند تحميل الصفحة |
| **تعديل** `RequestsSection` | إضافة prop لدالة تصفير إشعارات طلب معين |
| **تعديل** `Link` في قائمة الطلبات (سطر 412) | تحويله لـ `button`/`div` مع `onClick` يقوم أولاً بتحديث إشعارات الطلب (`tracking_number`) كمقروءة، ثم `navigate('/track?q=...')` |

المنطق عند النقر:
```typescript
// Mark notifications related to this request as read
await supabase
  .from('notifications')
  .update({ is_read: true })
  .eq('user_id', userId)
  .eq('is_read', false)
  .like('message', `%${req.tracking_number}%`);

// Navigate to tracking page
navigate(`/track?q=${req.tracking_number}`);
```

نستخدم `like('%tracking_number%')` لأن رسائل الإشعارات تحتوي على رقم التتبع، فنصفّر فقط إشعارات الطلب المحدد.

### لا تعديلات على `useRealtimeNotifications.ts`
المنطق صحيح — سيعيد حساب العداد تلقائياً بعد تحديث `is_read`.

