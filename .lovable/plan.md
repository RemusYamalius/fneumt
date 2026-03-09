

## المشكلة

تقسيم النص العربي إلى أحرف فردية (`split('')`) يكسر الروابط الطبيعية بين الحروف (ligatures). الخط العربي يعتمد على اتصال الحروف ببعضها، وعندما يوضع كل حرف في `<span>` منفصل مع `inline-block`، يُعامل كل حرف كعنصر مستقل فتنقطع الاتصالات وتبدو الحروف مبعثرة.

## الحل

بدلاً من تقسيم النص حرفاً حرفاً، نستخدم تقسيماً بالكلمات (`split(' ')`) ونُبقي كل كلمة كوحدة واحدة داخل `<motion.span>`. هذا يحافظ على اتصال الحروف العربية داخل كل كلمة مع الإبقاء على تأثير النبض المتتابع.

### التغييرات في `src/pages/Dashboard.tsx` (سطور 32-60):

```typescript
const words = roleLabel.split(' ').filter(Boolean);

// ثم في JSX:
{words.map((word, i) => (
  <motion.span
    key={i}
    animate={pulse ? {
      scale: [1, 1.18, 1],
      color: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,1)', 'rgba(255,255,255,0.9)'],
    } : {}}
    transition={pulse ? {
      duration: 0.4,
      delay: (dir === 'rtl' ? words.length - 1 - i : i) * (1.2 / words.length),
      ease: 'easeInOut',
    } : {}}
    className="inline-block mx-0.5"
  >
    {word}
  </motion.span>
))}
```

- إزالة `inline-block` من الأحرف الفردية
- التقسيم بالكلمات يحافظ على شكل الخط العربي
- النبض يبقى متتابعاً لكن على مستوى الكلمات

