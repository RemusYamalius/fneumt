

# خطة: إصلاح زر التكبير + توحيد الشكل

## المشاكل
1. زر تكبير الخارطة يستخدم `start-2` — في RTL هذا يعني اليمين (نفس جهة زر الرجوع). المطلوب: `left-2` (يسار فعلي دائماً)
2. زر تكبير الحلقات بتصميم مختلف (رمادي صغير) عن زر الخارطة (أزرق داكن أنيق)
3. وضع Fullscreen للحلقات لا يغطي الشاشة بالكامل بشكل مشابه للخارطة

## التغييرات

### 1. `src/components/MoroccoMap.tsx` — سطر 222
- تغيير `start-2` → `left-2` لضمان ظهور الزر على اليسار الفعلي بغض النظر عن اتجاه الصفحة

### 2. `src/components/OrbitalFilter.tsx` — سطر 474-480
**a) توحيد شكل زر التكبير:**
- تغيير الكلاس من `bg-muted/60 hover:bg-muted border-border/40 text-muted-foreground` إلى `bg-[#001D39]/80 hover:bg-[#001D39] text-white border-[#49769F]/50 shadow-lg backdrop-blur-sm rounded-xl p-2`
- تكبير الأيقونة من `w-3.5 h-3.5` إلى `w-4 h-4`

**b) تحسين وضع ملء الشاشة (سطر 680-693):**
- جعل المحتوى يغطي الشاشة بالكامل مع تكبير العجلة (`max-w-[900px]` للعجلة)
- إضافة padding مناسب وتوسيط عمودي

## الملفات
```
src/components/MoroccoMap.tsx     (سطر واحد: start-2 → left-2)
src/components/OrbitalFilter.tsx  (زر التكبير + fullscreen layout)
```

