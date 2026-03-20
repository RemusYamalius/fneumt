

# خطة: تطبيق تحسينات التلوين على 5 صفحات

## النمط المرجعي (من IncomingRequests)
- عنوان الصفحة: `bg-blue-100/60 text-blue-800 px-3 py-1 rounded-lg inline-block`
- الوصف: `bg-emerald-100/60 text-emerald-700 px-2 py-0.5 rounded-md inline-block`
- عناوين الفلاتر: `text-sm font-bold px-2 py-0.5 rounded-md bg-COLOR-100/60 text-COLOR-700 w-fit`

## التعديلات لكل صفحة

### 1. JoinRequests.tsx (طلبات الانضمام)
- **العنوان** (سطر 253): إضافة `bg-blue-100/60 text-blue-800 px-3 py-1 rounded-lg inline-block`
- **الوصف** (سطر 254): إضافة `bg-emerald-100/60 text-emerald-700 px-2 py-0.5 rounded-md inline-block`
- **عناوين الفلاتر** (سطور 340, 344, 354): تحويل من `text-xs font-medium text-muted-foreground` إلى `text-sm font-bold px-2 py-0.5 rounded-md bg-COLOR-100/60 text-COLOR-700 w-fit`
  - البحث بالاسم → أزرق
  - الحالة → كهرماني
  - المؤسسة → زمردي

### 2. MembershipVerification.tsx (التحقق من الانخراط)
- **العنوان** (سطر 259): نفس النمط الأزرق
- **الوصف** (سطر 260): نفس النمط الزمردي
- **عناوين الفلاتر** (سطور 335, 366, 397, 428): تحويل من `text-xs font-medium text-muted-foreground` إلى ألوان مميزة:
  - الاسم → أزرق
  - رقم التأجير → نيلي
  - المؤسسة → كهرماني
  - حالة الانخراط → بنفسجي

### 3. SupervisorDashboard.tsx (لوحة الإشراف)
- **العنوان** (سطر 517): إضافة النمط الأزرق
- **الوصف** (سطر 518): إضافة النمط الزمردي

### 4. UserManagement.tsx (إدارة المستخدمين)
- **العنوان** (سطر 185): إضافة النمط الأزرق
- **الوصف** (سطر 186): إضافة النمط الزمردي
- **عنوان الفلتر** (سطر 195): تحويل "فلتر" من `text-muted-foreground` إلى `text-sm font-bold bg-blue-100/60 text-blue-700 px-2 py-0.5 rounded-md`

### 5. DatabaseDashboard.tsx (قاعدة البيانات)
- **العنوان** (سطر 355): إضافة النمط الأزرق
- **الوصف** (سطر 356): إضافة النمط الزمردي

## الملفات المتأثرة
- `src/pages/JoinRequests.tsx`
- `src/pages/MembershipVerification.tsx`
- `src/pages/SupervisorDashboard.tsx`
- `src/pages/admin/UserManagement.tsx`
- `src/pages/DatabaseDashboard.tsx`

