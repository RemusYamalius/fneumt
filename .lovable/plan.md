

# منع ظهور الشكل القديم للوحة التحكم

## السبب
عند تسجيل الدخول، `loading` يصبح `false` بسرعة لكن `role` لا يزال `null` (لأن `fetchProfileAndRole` يعمل بشكل غير متزامن). فيظهر تخطيط المعلم العادي (غير المشرف) للحظة، ثم عندما يصل الدور يتحول التخطيط إلى الشكل المجمّع بالمجموعات.

## الحل
إضافة حالة تحميل إضافية: إذا كان المستخدم موجوداً لكن `role` و `profile` لم يُحمّلا بعد، نعرض شاشة التحميل بدلاً من المحتوى.

## التغيير — `src/pages/Dashboard.tsx`

بعد التحقق من `loading` (سطر 40-46)، إضافة تحقق ثانٍ:

```tsx
if (loading) {
  return (/* spinner */);
}

if (!user) return null;

// إضافة هذا الشرط الجديد:
if (!role || !profile) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
```

هذا يضمن عدم عرض أي محتوى حتى يتم تحميل الدور والملف الشخصي بالكامل.

