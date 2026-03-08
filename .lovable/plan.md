

# إصلاح عدم تمرير الصفحة عند فتح قوائم الاختيار

## المشكلة
عند فتح قائمة اختيار (Select)، القائمة المنبثقة قد تظهر خارج نطاق الرؤية لأن Radix Select لا يقوم بتمرير الصفحة تلقائياً لإظهار جميع الخيارات.

## الحل
في `src/components/ui/select.tsx`، تعديل خاصيتين في `SelectContent`:

1. إضافة `avoidCollisions={true}` و `collisionPadding={8}` لضمان أن القائمة تبقى داخل نطاق الرؤية
2. إضافة `overflow-y-auto` على الـ Viewport للسماح بالتمرير داخل القائمة عندما تكون الخيارات كثيرة
3. تعيين `max-h-[60vh]` بدلاً من `max-h-96` لتتناسب مع حجم الشاشة

### التغيير في `SelectContent` (سطر 66-88):

```tsx
<SelectPrimitive.Content
  ref={ref}
  className={cn(
    "relative z-50 max-h-[60vh] min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md ...",
    ...
  )}
  position={position}
  avoidCollisions={true}
  collisionPadding={8}
  {...props}
>
```

وتعديل الـ Viewport لإزالة تقييد الارتفاع:
```tsx
<SelectPrimitive.Viewport
  className={cn(
    "p-1 max-h-[60vh] overflow-y-auto",
    position === "popper" &&
      "w-full min-w-[var(--radix-select-trigger-width)]",
  )}
>
```

ملف واحد: `src/components/ui/select.tsx`

