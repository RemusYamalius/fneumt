

# إصلاح فحص اكتمال الملف الشخصي

## المشكلة
في `src/pages/NewRequest.tsx` سطر 359، الفحص يتضمن `data?.corps` رغم أن حقل "السلك" تم إزالته من متطلبات الملف الشخصي. لذلك حتى لو عبأ المستخدم كل البيانات، تظهر رسالة "يرجى إكمال ملفك الشخصي".

## التعديلات

### 1. `src/pages/NewRequest.tsx` (سطر 358-359)
إزالة `data?.corps` من شرط الفحص:
```typescript
.then(({ data }) => setProfileComplete(!!(data?.academy && data?.directorate)));
```
وتعديل الـ select ليصبح `select('academy, directorate')`.

### 2. `src/lib/i18n.tsx`
تعديل نص الرسالة:
- **عربي** (سطر 216): `'لتقديم طلب، يجب تعبئة جميع بيانات ملفك الشخصي.'`
- **فرنسي** (سطر 658): `'Pour soumettre une demande, vous devez remplir toutes les informations de votre profil.'`

### 3. `src/pages/Dashboard.tsx` (سطر 62)
إزالة `profile.corps` من شرط `isNonMember` أيضاً للاتساق.

