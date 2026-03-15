

# تحويل فلاتر التحقق من الانخراط إلى Combobox (بحث + قائمة خيارات)

## المشكلة
الفلاتر الحالية هي حقول `Input` نصية فقط — لا تعرض قائمة بالخيارات المتاحة. المطلوب: عرض كل الخيارات في قائمة منسدلة مع إمكانية الكتابة للتصفية التدريجية.

## الحل
استبدال كل فلتر `Input` بمكون **Combobox** باستخدام `Popover` + `Command` من shadcn/ui:
- عند النقر على الحقل: تظهر قائمة منسدلة بكل الخيارات الفريدة (الأسماء / أرقام التأجير / المؤسسات)
- عند الكتابة: تتقلص القائمة تدريجياً حسب ما يُكتب
- عند اختيار عنصر: يُملأ الحقل ويُطبّق الفلتر
- يمكن مسح الاختيار للعودة لعرض الكل

## الملف المعدّل
`src/pages/MembershipVerification.tsx`

## التفاصيل التقنية
- استيراد `Popover`, `PopoverTrigger`, `PopoverContent` + `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`
- إضافة 3 حالات `open` (`openName`, `openEmployee`, `openInstitution`) للتحكم بفتح/إغلاق كل Popover
- الاستفادة من `uniqueNames`, `uniqueEmployees`, `uniqueInstitutions` الموجودة مسبقاً كمصدر للخيارات
- الإبقاء على منطق التصفية الحالي (`filteredUsers`) كما هو — القيم المختارة تُخزّن في نفس states الحالية (`filterName`, `filterEmployee`, `filterInstitution`)
- عرض زر الحقل بنفس التنسيق الحالي (ألوان أزرق/عنبر/أخضر)

