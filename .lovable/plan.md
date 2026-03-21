

# خطة تحسين الأداء للموقع

## 1. دمج قنوات Realtime (4 قنوات → 1)

**الملف**: `src/hooks/useRealtimeNotifications.ts`

حالياً كل مستخدم يفتح حتى 4 قنوات WebSocket منفصلة. سيتم دمجها في قناة واحدة `user-realtime-{userId}` مع عدة `.on()`:
- `notifications` table
- `requests` table  
- `join_requests` table
- `post_recipients` table

إضافة callback `onNewPost` يُمكن تمريره من `PostFeed` لتحديث المنشورات بدون قناة منفصلة.

**الملف**: `src/components/PostFeed.tsx` — إزالة قناة `post-feed-realtime` المكررة واستبدالها بـ prop/callback.

---

## 2. استخدام React Query مع Cache

React Query موجود أصلاً في المشروع (`@tanstack/react-query` + `QueryClientProvider` في `App.tsx`).

### PostFeed.tsx
- تحويل `fetchPosts` لاستخدام `useQuery` مع `queryKey: ['posts', mode]` و `staleTime: 15_000`
- عند التنقل بين الصفحات، البيانات تُعرض فوراً من الكاش

### Dashboard.tsx
- دمج 5 استعلامات `useEffect` المنفصلة في دالة واحدة `fetchDashboardData()` تُنفذ بـ `Promise.all`
- تحويلها لـ `useQuery` مع `queryKey: ['dashboard-counts', userId]` و `staleTime: 30_000`

---

## 3. تقليل الاستعلامات — Database View

إنشاء View في قاعدة البيانات يجمع المنشور مع اسم المؤلف:

```sql
CREATE VIEW public.post_with_author AS
SELECT p.id, p.author_id, p.content, p.created_at, p.filters,
       pr.full_name as author_name
FROM posts p
LEFT JOIN profiles pr ON pr.user_id = p.author_id;
```

هذا يلغي استعلام `profiles` المنفصل في `PostFeed`.

---

## 4. Pagination للمنشورات

**الملف**: `src/components/PostFeed.tsx`
- إضافة `.range(0, 19)` للتحميل الأولي (20 منشور)
- زر "تحميل المزيد" يجلب الدفعة التالية `.range(offset, offset+19)`
- النص بالعربية/الفرنسية

---

## ملخص التأثير

| المقياس | قبل | بعد |
|---------|------|------|
| قنوات Realtime/مستخدم | 3-4 | 1 |
| استعلامات Dashboard | 5 متسلسلة | 1 بالتوازي + كاش 30s |
| استعلامات PostFeed | 5-6 | 3 + كاش 15s |
| Pagination | لا | نعم (20 منشور) |

## الملفات المتأثرة
- `src/hooks/useRealtimeNotifications.ts`
- `src/components/PostFeed.tsx`
- `src/pages/Dashboard.tsx`
- `supabase/migrations/` (Database View)

