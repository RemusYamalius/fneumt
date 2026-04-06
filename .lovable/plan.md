

# خطة: إصلاح زر التصغير + ألوان الأقاليم + المراسلة + إحصائيات الأقاليم

## 4 مشاكل محددة

### 1) زر التصغير لا يظهر بعد التكبير
**السبب:** زر التكبير/التصغير داخل `OrbitalFilter` يُرسم ضمن محتوى الحلقات نفسه. عند التكبير، المحتوى أكبر من الشاشة ويتطلب التمرير — الزر يختفي أعلى المحتوى خارج المنطقة المرئية.

**الحل:** إضافة زر تصغير ثابت (`fixed`) مباشرة في overlay التكبير بـ `QuickFilter.tsx` (سطر 176)، بحيث يظل مرئياً دائماً بغض النظر عن التمرير. يُوضع في الزاوية العلوية (مثل `top-4 right-4 z-[60]`).

### 2) ألوان الأقاليم سوداء بعد اختيار الجهة
**السبب:** `dirColors` في `OrbitalFilter.tsx` يستخدم ألوان HSL ضيقة النطاق (hue 25-75، saturation 40-70، lightness 40-65) مما ينتج ألوان بنية/داكنة. مع 26 عنصراً الأسماء تكاد لا تُرى.

**الحل:** استبدال خوارزمية `dirColors` بباليت ألوان جذابة ومتناسقة مع بقية الحلقات:
- استخدام hue متنوع (0-360) مع saturation عالية (55-75%) وlightness متوسطة (45-60%)
- هذا ينتج ألوان ملونة ومتنوعة (أزرق، أخضر، برتقالي، بنفسجي...) بدل البني الداكن

### 3) المراسلة: المستلمون لا يظهرون في PostComposer
**السبب:** `QuickFilter` يُرسل `recipientIds` عبر `navigate('/communication', { state: { recipientIds } })` لكن `CommunicationHub` لا يقرأ `location.state` ولا يمررها إلى `PostComposer`.

**الحل:**
- في `CommunicationHub.tsx`: قراءة `location.state?.recipientIds` وتمريرها إلى `PostComposer` كـ prop
- عند وجود recipients من الـ state: التحويل تلقائياً لتبويب `compose`
- في `PostComposer.tsx`: إضافة prop `preSelectedRecipientIds` واستخدامها لجلب أسماء المستخدمين وإظهارهم كمستلمين مرفقين أسفل المنشور مع إمكانية إزالتهم

### 4) إحصائيات الأقاليم لا تتغير عند تحديد إقليم
**السبب:** `currentStats` في `MoroccoMap.tsx` (سطر 170) يعتمد فقط على `selectedRegion.academyLabel` من `regionStats` — وهي إحصائيات الجهة الكاملة. لا يوجد منطق لحساب إحصائيات كل إقليم على حدة.

**الحل:**
- توسيع `regionStats` في `QuickFilter.tsx` ليشمل بيانات على مستوى المديريات (directorates) أيضاً
- بنية جديدة: `Record<string, { total, members, requests, directorates: Record<string, { total, members, requests }> }>`
- في `MoroccoMap.tsx`: عند تحديد إقليم (`selectedProvince`):
  - مطابقة اسم الإقليم مع اسم المديرية
  - عرض إحصائيات المديرية المطابقة في `StatPanel` بدلاً من إحصائيات الجهة
  - إذا لم يُحدد إقليم: عرض إحصائيات الجهة (السلوك الحالي)

## الملفات المتأثرة
```text
src/pages/QuickFilter.tsx          — زر تصغير ثابت + توسيع regionStats
src/components/OrbitalFilter.tsx   — باليت ألوان المديريات
src/components/MoroccoMap.tsx      — إحصائيات ديناميكية حسب الإقليم
src/pages/CommunicationHub.tsx     — قراءة recipientIds من state
src/components/PostComposer.tsx    — عرض المستلمين المحددين مسبقاً
```

