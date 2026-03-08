

# إصلاح عدم إمكانية تمرير قائمة الاختيار لإظهار جميع الخيارات

## المشكلة
رغم التعديل السابق، القائمة المنبثقة ما زالت لا تسمح بالتمرير لرؤية جميع الخيارات. السبب هو أن Radix Select بوضع `position="popper"` الافتراضي يستخدم نظام تموضع يحد من ارتفاع القائمة، والمشكلة الرئيسية أن `overflow-hidden` على Content يمنع التمرير حتى مع `overflow-y-auto` على Viewport.

## الحل
تعديل `src/components/ui/select.tsx`:

1. تقليل `max-h` إلى `50vh` لضمان مساحة كافية للتموضع
2. إضافة `sideOffset={4}` لإعطاء مسافة بين الزر والقائمة
3. تغيير `overflow-hidden` إلى `overflow-auto` على Content لضمان التمرير

### التغييرات (سطر 66-89):

```tsx
<SelectPrimitive.Content
  ref={ref}
  className={cn(
    "relative z-50 max-h-[50vh] min-w-[8rem] overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
    position === "popper" &&
      "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
    className,
  )}
  position={position}
  avoidCollisions={true}
  collisionPadding={16}
  sideOffset={4}
  {...props}
>
  <SelectScrollUpButton />
  <SelectPrimitive.Viewport
    className={cn(
      "p-1",
      position === "popper" &&
        "w-full min-w-[var(--radix-select-trigger-width)]",
    )}
  >
    {children}
  </SelectPrimitive.Viewport>
  <SelectScrollDownButton />
</SelectPrimitive.Content>
```

التغييرات الجوهرية:
- `overflow-hidden` → `overflow-auto` على Content
- `collisionPadding` من 8 إلى 16 لمسافة أكبر من حواف الشاشة
- إضافة `sideOffset={4}`
- إزالة `max-h` و `overflow-y-auto` المكرر من Viewport (التمرير يُدار من Content)

ملف واحد: `src/components/ui/select.tsx`

