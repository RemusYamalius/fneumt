

## التعديل المطلوب

لون التمرير (hover) على خيارات القائمة المنسدلة يأتي من class `focus:bg-accent` في مكون `SelectItem`. الحل هو تمرير className مخصص لكل `SelectItem` داخل كل فلتر لتجاوز لون الـ accent:

### الملف: `src/pages/MembershipVerification.tsx`

- **فلتر الاسم (أزرق):** إضافة `className="focus:bg-blue-100 focus:text-blue-900"` لكل `SelectItem`
- **فلتر رقم التأجير (كهرماني):** إضافة `className="focus:bg-amber-100 focus:text-amber-900"` لكل `SelectItem`
- **فلتر المؤسسة (أخضر زمردي):** إضافة `className="focus:bg-emerald-100 focus:text-emerald-900"` لكل `SelectItem`

تعديل بسيط على 6 أماكن (عنصرين في كل فلتر: "الكل" + العناصر المُولَّدة).

