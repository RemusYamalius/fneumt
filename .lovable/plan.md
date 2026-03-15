

# خطة التعديلات الأربعة

## 1. التمرير لأعلى الصفحة عند التنقل (Scroll to Top)

**الملف:** `src/App.tsx`

إضافة مكون `ScrollToTop` يستخدم `useLocation` من React Router لتنفيذ `window.scrollTo(0, 0)` عند كل تغيير في المسار. يوضع داخل `<BrowserRouter>` قبل `<Routes>`.

## 2. صفحة تتبع الملف — عرض بطاقة تسجيل الدخول للمستخدم غير المسجل

**الملف:** `src/pages/TrackRequest.tsx`

حالياً الصفحة مغلفة بـ `AuthenticatedLayout` الذي يتطلب تسجيل الدخول. التعديل:
- استيراد `useAuth` والتحقق من حالة المستخدم
- إذا كان المستخدم **غير مسجل**: عرض الصفحة بدون `AuthenticatedLayout` مع إضافة بطاقة/رابط لتسجيل الدخول (مشابه لما في Index)
- إذا كان المستخدم **مسجلاً**: الإبقاء على التخطيط الحالي

## 3. استبدال تكرار الموضوع بـ "مستوى حل المشكل"

**الملفات:** `src/pages/Dashboard.tsx`, `src/pages/TrackRequest.tsx`, `src/pages/IncomingRequests.tsx`

المشكلة: حقل `subject` في قاعدة البيانات يحمل نفس قيمة `category` (لأن الموضوع يُختار من قائمة الفئات). لذلك يظهر مكرراً.

التعديل:
- **Dashboard** (بطاقات الطلبات): استبدال عرض `req.subject` بعرض `resolution_level` مع ترجمته (`t[level_${req.resolution_level}]`)
- **TrackRequest**: استبدال خانة "الموضوع" بخانة "مستوى حل المشكل" — يتطلب إضافة `resolution_level` لاستعلام Supabase وللـ interface
- **IncomingRequests**: استبدال `req.subject` بـ `resolution_level` — يتطلب إضافة `resolution_level` لاستعلام Supabase وللـ interface

## 4. البحث الكتابي في فلاتر التحقق من الانخراط

**الملف:** `src/pages/MembershipVerification.tsx`

حالياً الفلاتر الثلاثة (الاسم، رقم التأجير، المؤسسة) تستخدم `Select` dropdowns عادية. التعديل:
- استبدالها بمكون `Command` (Combobox) من shadcn/ui أو ببساطة استخدام `Popover` + `Command` للسماح بالبحث الكتابي داخل القوائم المنسدلة
- بديل أبسط: استخدام `Input` عادي للبحث الحر بدلاً من القوائم المنسدلة، مع تصفية النتائج مباشرة أثناء الكتابة

## ملخص الملفات المعدلة
- `src/App.tsx` — مكون ScrollToTop
- `src/pages/TrackRequest.tsx` — دعم المستخدم غير المسجل + resolution_level
- `src/pages/Dashboard.tsx` — resolution_level بدل subject
- `src/pages/IncomingRequests.tsx` — resolution_level بدل subject
- `src/pages/MembershipVerification.tsx` — بحث كتابي في الفلاتر

