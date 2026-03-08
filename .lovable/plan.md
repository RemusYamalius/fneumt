

# تحسين زر العودة في صفحة تتبع الملفات

## التغيير

في `src/pages/TrackRequest.tsx` (سطر 160-165):

1. تغيير الرابط من `/` إلى `/dashboard` واستبدال `t.backToHome` بـ `t.backToDashboard`
2. تحويله من رابط نصي إلى زر بتصميم مشابه للصورة المرفقة: خلفية متدرجة زرقاء داكنة، نص أبيض، حواف مستديرة بالكامل، سهم يعكس اتجاهه حسب اللغة

### الكود الجديد (سطر 160-165):
```tsx
<div className="mt-8 text-center">
  <Link
    to="/dashboard"
    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[hsl(207,75%,17%)] to-[hsl(207,62%,40%)] text-white font-medium text-sm shadow-lg hover:shadow-xl hover:opacity-90 transition-all duration-300"
  >
    {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
    {t.backToDashboard}
  </Link>
</div>
```

ملف واحد يتأثر: `src/pages/TrackRequest.tsx`

