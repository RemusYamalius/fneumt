

# إعادة تصميم صفحة الملف الشخصي — تصميم مستقبلي تفاعلي

## الميزات المطلوبة
1. نجمة حمراء (*) بعد كل عنوان حقل للدلالة على الإجبارية
2. خاصية حذف الحساب
3. إعادة تصميم كامل: بطاقات على شكل سلايدر دوّار (Carousel) تفاعلي

## التصميم الجديد

### هيكل الواجهة
- **خلفية مستقبلية** مشابهة لصفحة "طلب جديد" (تدرج أزرق عميق + جسيمات عائمة)
- **سلايدر دوّار أفقي** (Embla Carousel) يحتوي على بطاقات بتصميم Glassmorphism
- كل بطاقة تمثل حقلاً واحداً: أيقونة + عنوان (مع نجمة حمراء) + حقل إدخال
- البطاقة النشطة تتقدم (scale أكبر + توهج) مع صوت نقرة عند الضغط
- أزرار "التالي" و"السابق" للتنقل بين البطاقات
- قابل للسحب بالماوس والأصبع (RTL/LTR)

### تسلسل البطاقات (10 بطاقات)
1. الاسم الكامل  2. الهاتف  3. رقم التأجير  4. الأكاديمية  5. المديرية  6. المهمة  7. السلك  8. المؤسسة  9. حالة الانخراط (+ رقم البطاقة)  10. البريد الإلكتروني (للقراءة فقط)

### وضع عرض المعلومات
- زر "عرض المعلومات" يُزيح السلايدر جانباً (animate) ويُظهر بطاقة ملخص شفافة (Glassmorphism) تعرض جميع المعطيات المعبأة

### عند اكتمال التعبئة
- بعد ملء جميع الحقول والضغط على "حفظ" في آخر بطاقة: رسالة نجاح مع تأثير بصري (particle burst)

### حذف الحساب
- زر أحمر أسفل بطاقة الملخص (أو أسفل السلايدر)
- مع تأكيد عبر Alert Dialog قبل التنفيذ
- يقوم بحذف بيانات المستخدم من `profiles` ثم `supabase.auth.admin.deleteUser` عبر Edge Function

## التعديلات التقنية

| الملف | التعديل |
|---|---|
| `src/pages/Profile.tsx` | إعادة كتابة كاملة: Carousel + Glassmorphism + صوت نقرة + وضع عرض/تحرير + حذف حساب |
| `src/index.css` | إضافة أنماط البطاقات الزجاجية والتوهج |
| `src/lib/i18n.tsx` | إضافة مفاتيح: `deleteAccount`, `deleteAccountConfirm`, `deleteAccountWarning`, `next`, `previous`, `viewInfo`, `profileComplete`, `requiredField` |
| `supabase/functions/delete-account/index.ts` | Edge Function لحذف المستخدم من auth.users |
| Migration SQL | إضافة سياسة حذف على جدول profiles |

### Edge Function: `delete-account`
```typescript
// يتحقق من هوية المستخدم عبر JWT
// يحذف من profiles ثم auth.admin.deleteUser()
```

### Migration
```sql
-- Allow users to delete own profile
CREATE POLICY "Users can delete own profile" ON public.profiles
FOR DELETE TO authenticated USING (user_id = auth.uid());
```

