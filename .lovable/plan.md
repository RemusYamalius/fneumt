

# تدوير جميع زوايا أزرار التبويب (الجانب الأزرق)

## المشكلة
حالياً الأزرار لها حواف مدورة من جهة واحدة فقط (الخارجية) ومسطحة من الجهة الداخلية (جهة النموذج الأبيض). المطلوب تدوير **جميع** الزوايا كما في الصورة المرجعية الثانية (الوردية).

## التغييرات — `src/index.css`

- سطر 750: `.login-left-tab-active` → `border-radius: 1rem;` (بدل `1rem 0 0 1rem`)
- سطر 758: `[dir="rtl"] .login-left-tab-active` → `border-radius: 1rem;`
- سطر 764: `.login-left-tab-inactive` → `border-radius: 1rem;` (بدل `1rem 0 0 1rem`)
- سطر 768: `[dir="rtl"] .login-left-tab-inactive` → `border-radius: 1rem;`

هذا يجعل كل زوايا الأزرار مدورة بالتساوي مع الحفاظ على تأثير الاندماج مع النموذج الأبيض عبر `margin-inline-end: -1px`.

