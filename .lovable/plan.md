

# خطة: إصلاح موضع اللوغو والبطاقة نهائياً

## المشكلة 1: اللوغو ليس في الوسط
في وضع RTL، كلاس `-translate-x-1/2` قد ينعكس اتجاهه. الحل: استخدام `style` مباشر بدل كلاسات Tailwind للتوسيط.

## المشكلة 2: اللوغو يتداخل مع الشريط العلوي
اللوغو يبرز فوق البطاقة بـ 80px (`-top-20`)، والبطاقة تبدأ عند 140px، أي أعلى اللوغو عند 60px — داخل منطقة الشريط العلوي.

## التعديلات في `src/components/CountdownOverlay.tsx`

### 1. توسيط اللوغو بـ inline style
- استبدال `className="absolute left-1/2 -translate-x-1/2 -top-20"` بـ:
  `style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '-80px' }}`
- هذا يتجاوز أي تأثير RTL على الترجمة

### 2. زيادة المسافة العلوية
- تغيير `paddingTop: '140px'` إلى `paddingTop: '180px'` ليصبح أعلى اللوغو عند 100px تقريباً — أسفل الشريط العلوي بوضوح

## الملفات المتأثرة
- `src/components/CountdownOverlay.tsx` فقط

