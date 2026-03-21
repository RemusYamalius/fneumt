

# خطة: إصلاح عدم حفظ بيانات الملف الشخصي

## المشكلة
بعد حفظ البيانات في صفحة الملف الشخصي، لا يتم تحديث `profile` في `AuthContext`. عند مغادرة الصفحة والعودة إليها، يتم تحميل البيانات القديمة من السياق بدل البيانات المحدّثة.

## الحل

### 1. إضافة دالة `refreshProfile` في `useAuth.tsx`
- كشف `fetchProfileAndRole` كدالة عامة باسم `refreshProfile` في AuthContext
- إضافتها إلى `AuthContextType` interface وإلى القيمة المُمرّرة في Provider

### 2. استدعاء `refreshProfile` بعد الحفظ في `Profile.tsx`
- بعد نجاح `supabase.update` في `handleSave`، استدعاء `refreshProfile(user.id)` لتحديث بيانات السياق

## الملفات المتأثرة
- `src/hooks/useAuth.tsx`
- `src/pages/Profile.tsx`

