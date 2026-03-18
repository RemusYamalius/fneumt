

# تلوين عناوين الفلاتر + تلوين زر حساب العدد + صيغة الجمع

## التعديلات في `src/components/PostComposer.tsx`

### 1. عناوين الفلاتر (Label)
تغيير كل `Label` في منطقة الفلاتر (سطور 430، 442، 454، 466، 477، 491، 504، 517، 528، 539) من:
```
className="text-xs mb-1 block"
```
إلى:
```
className="text-xs mb-1 block font-bold text-[hsl(225,70%,45%)]"
```

### 2. زر "حساب العدد" (سطر 564-573)
إضافة تدرج لوني للزر بدل `variant="outline"`:
```
className="text-xs text-white border-0 shadow-md"
style={{ background: 'linear-gradient(135deg, hsl(225,70%,45%), hsl(225,80%,35%))' }}
```

### 3. صيغة الجمع (سطر 580)
تغيير النص من `مستلم` الثابتة إلى:
- إذا `recipientCount === 1` → "مستلم"
- إذا `recipientCount > 1` → "مستلمين"
- بالفرنسية: `destinataire` / `destinataires`

