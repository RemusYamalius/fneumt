

# خطة التعديلات

## 1. بطاقة "منشورات القيادة" في لوحة التحكم (Dashboard)

المشكلة: بطاقة "منشورات القيادة" موجودة حالياً داخل صفحة ركن التواصل. المطلوب أن تكون بطاقة مستقلة في لوحة التحكم بجانب بطاقة "ركن التواصل".

### التعديلات:

**`src/pages/Dashboard.tsx`**:
- إضافة بطاقة جديدة في `communicationCards` للحسابات السامية فقط: `{ icon: Newspaper, title: 'منشورات القيادة', to: '/supreme-feed', color: 'from-[hsl(225,60%,55%)] to-[hsl(225,70%,40%)]' }`

**`src/pages/SupremeFeed.tsx`** (ملف جديد):
- صفحة مخصصة تعرض `<PostFeed mode="supreme" />` مع إحصائيات لكل منشور
- زر "العودة للوحة التحكم" بالتصميم الموحد
- عنوان مع أيقونة `Newspaper`

**`src/App.tsx`**:
- إضافة مسار `/supreme-feed` → `SupremeFeed`

**`src/pages/CommunicationHub.tsx`**:
- إزالة بطاقة "منشورات القيادة" المستقلة (السطور 113-131)

## 2. إصلاح القيم الافتراضية للأكاديمية والمديرية

**السبب**: في جدول `profiles`، الأعمدة `academy` و `directorate` لديها قيم افتراضية:
```sql
academy TEXT DEFAULT 'الدار البيضاء-سطات'
directorate TEXT DEFAULT 'سيدي بنور'
```

لذلك عند تسجيل مستخدم جديد يتم تعبئتها تلقائياً.

**الحل**: إنشاء migration لإزالة القيم الافتراضية:
```sql
ALTER TABLE public.profiles ALTER COLUMN academy DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN directorate DROP DEFAULT;
```

## ملخص الملفات المتأثرة
- `src/pages/Dashboard.tsx` — إضافة بطاقة منشورات القيادة
- `src/pages/SupremeFeed.tsx` — صفحة جديدة
- `src/App.tsx` — مسار جديد
- `src/pages/CommunicationHub.tsx` — إزالة البطاقة المدمجة
- Migration — إزالة DEFAULT من academy/directorate

