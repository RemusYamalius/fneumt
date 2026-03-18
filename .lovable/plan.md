

# إصلاح زر التفعيل (Switch) في RTL + فصل "منشورات القيادة" كبطاقة مستقلة

## المشكلة 1: Switch في RTL
في اتجاه RTL، الـ Thumb يتحرك دائماً لليمين عند التفعيل (`translate-x-5`) مما يجعله يبدو معطلاً بصرياً رغم أنه مفعّل. الحل: استخدام `ltr:translate-x-5 rtl:-translate-x-5` للحالة المفعّلة.

### `src/components/ui/switch.tsx`
تغيير كلاس Thumb من:
```
data-[state=checked]:translate-x-5
```
إلى:
```
data-[state=checked]:ltr:translate-x-5 data-[state=checked]:rtl:-translate-x-5
```

## المشكلة 2: "منشورات القيادة" كبطاقة مستقلة

المطلوب: بدل أن تكون "منشورات القيادة" تبويباً يُخفي المحتوى الآخر، تظهر كبطاقة (Card) منفصلة دائماً مرئية داخل صفحة ركن التواصل للحسابات السامية.

### `src/pages/CommunicationHub.tsx`
- إزالة `supreme_feed` من قائمة التبويبات
- إزالته من نوع `activeTab`
- إضافة بطاقة مستقلة بعد محتوى التبويبات (أسفل `motion.div`) تعرض `<PostFeed mode="supreme" />` بشكل دائم للحسابات السامية
- البطاقة تحمل عنوان "منشورات القيادة" مع أيقونة `Newspaper` وتصميم متناسق

