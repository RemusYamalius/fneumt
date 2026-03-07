

# تحسينات اللوغو المتحرك

## التعديلات المطلوبة

### 1. تكبير اللوغو للضعف في كل الصفحات
| الصفحة | الحالي | الجديد |
|--------|--------|--------|
| Index (hero) | `w-24 h-24` | `w-48 h-48` |
| Index (footer) | `w-10 h-10` | `w-20 h-20` |
| Headers (Dashboard, NewRequest, etc.) | `w-10 h-10` | `w-20 h-20` |
| Login | `w-12 h-12` | `w-24 h-24` |
| TrackRequest | `w-14 h-14` | `w-28 h-28` |
| Signup/Forgot/Reset | `w-16 h-16` | `w-32 h-32` (+ تحديث الحاوية) |

### 2. إبقاء اللمعان الدائري بنفس الحجم
- تغيير `inset-[-3px]` إلى `inset-[-2px]` لتقليل سمك الحدود
- لن يتكبر مع اللوغو

### 3. تغيير البريق الداخلي من نبض إلى حركة مائلة
- استبدال `radial-gradient` بـ `linear-gradient` مائل (135deg) مع شريط ضوئي
- تغيير keyframe من تحكم بالـ opacity إلى تحرك `background-position` من اليسار لليمين
- النتيجة: شريط ضوء مائل يمر عبر اللوغو خلال الثواني 3-6

### التفاصيل التقنية

**AnimatedLogo.tsx:**
- إضافة prop `borderSize` اختياري لتحكم بسمك اللمعان الدائري
- البريق الداخلي: `linear-gradient(135deg, transparent 30%, hsl(190 100% 80% / 0.6) 50%, transparent 70%)` مع `background-size: 300%` و animation على `background-position`

**index.css:**
- keyframe جديد `logo-sparkle` يحرك `background-position` من `150% 0` إلى `-50% 0` خلال النصف الثاني من الدورة (3-6s)
- إبقاء `logo-border-shine` كما هو

**12 ملف صفحات:** تحديث قيم `size` للضعف + تحديث حاويات `w-16 h-16` إلى `w-32 h-32`

