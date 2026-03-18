

# إضافة تبويب "المنشورات" للحسابات السامية + خيار مشاركة المنشور مع الحسابات السامية

## الفكرة
كل حساب سامي (admin, national_secretary, deputy_national_secretary) يرى تبويباً رابعاً "المنشورات" يعرض فيه منشورات الحسابين الساميين الآخرين. مع إضافة خيار (Switch) في فلاتر المستلمين يتيح للناشر اختيار ظهور منشوره للحسابين الآخرين أو لا.

## التعديلات

### 1. `src/pages/CommunicationHub.tsx`
- توسيع نوع `activeTab` ليشمل `'supreme_feed'`
- إضافة تبويب رابع "المنشورات" (بأيقونة `Newspaper` أو `BookOpen`) في قائمة الأزرار
- في منطقة المحتوى: عند `activeTab === 'supreme_feed'` يعرض `<PostFeed mode="supreme" />`

### 2. `src/components/PostComposer.tsx`
- إضافة state: `showToSupreme` (boolean, default: true)
- إضافة في `buildFilters`: `if (showToSupreme) filters.showToSupreme = 'true'`
- في `handlePublish`: بعد إدراج المستلمين العاديين، إذا `showToSupreme === true`:
  - جلب user_ids لكل حسابات `admin`, `national_secretary`, `deputy_national_secretary` من `user_roles`
  - استبعاد الناشر نفسه
  - إدراجهم كـ `post_recipients` إضافيين
- إضافة Switch في واجهة الفلاتر بعنوان "إظهار للحسابات السامية"

### 3. `src/components/PostFeed.tsx`
- إضافة prop `mode?: 'normal' | 'supreme'`
- عند `mode === 'supreme'`: تصفية المنشورات لعرض فقط تلك التي `author_id !== user.id` (منشورات الحسابين الآخرين)
- باقي المنطق (إعجاب، قراءة، مرفقات) يبقى كما هو

## ملاحظات تقنية
- لا حاجة لتعديل قاعدة البيانات: الحسابات السامية لديها RLS policy شاملة على `posts` و `post_recipients`
- المنشورات ستظهر تلقائياً بفضل إدراجها في `post_recipients`

