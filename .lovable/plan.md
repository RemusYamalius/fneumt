

# إصلاح جرس الإشعارات — تحديث العداد عند الاطلاع على الطلب

## المشكلة
عند اطلاع النائب على طلب وارد، تتغير حالته من `submitted` إلى `viewed`، لكن جرس الإشعارات لا يُحدَّث لأن **Realtime غير مفعّل** على جدول `requests`. الاشتراك الحالي في الكود موجود لكنه لا يتلقى أي أحداث.

## الحل

### 1. تفعيل Realtime لجدول `requests` (Migration)
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;
```

### 2. لا تعديلات على الكود
المنطق في `useRealtimeNotifications.ts` صحيح بالفعل — يعد فقط الطلبات بحالة `submitted` ويشترك في `event: '*'`. بمجرد تفعيل Realtime، سيتلقى الاشتراك تحديث الحالة ويعيد حساب العداد تلقائياً.

| الملف | التعديل |
|---|---|
| Migration SQL | `ALTER PUBLICATION supabase_realtime ADD TABLE public.requests` |

