

# إصلاح محاذاة أعمدة بطائق الانخراط + إضافة عمودي النوع والمؤسسة + فلتر

## التغييرات في `src/pages/LocalOffice.tsx`

### 1. توسيع واجهة MembershipCard
إضافة حقلي `gender` و `institution` للواجهة:
```typescript
interface MembershipCard {
  // ... existing
  gender?: string;
  institution?: string;
}
```

### 2. تحديث استعلامات جلب البيانات
في `loadOfficeData` وقسم جلب `dirMembers`، إضافة `gender, institution` إلى `select`:
```typescript
.select('user_id, full_name, employee_number, gender, institution')
```

### 3. إضافة حالة الفلتر
```typescript
const [cardFilter, setCardFilter] = useState('');
```
فلترة `cards` حسب الاسم أو رقم التأجير أو المؤسسة.

### 4. تحديث جدول بطائق الانخراط
- إضافة عمودي "النوع" و"المؤسسة" بين "N°PPR" و"رقم البطاقة"
- إضافة حقل بحث/فلتر فوق الجدول
- إصلاح محاذاة الأعمدة بإضافة `text-center` أو `text-start` بشكل متسق على `TableHead` و `TableCell`

### 5. الترجمات
المفاتيح `genderLabel`, `institutionLabel`, `genderMale`, `genderFemale` موجودة فعلا في `i18n.tsx`. سأضيف مفتاح فلتر إن لم يكن موجودا (مثل `filterMembers`).

