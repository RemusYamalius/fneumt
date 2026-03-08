

# تصحيح النصوص الإنجليزية المتبقية في الموقع

## المشكل
في `Login.tsx` توجد نصوص مكتوبة بالإنجليزية بدل استخدام الترجمة:
- "Login" / "Sign Up" (عنوان النموذج)
- "Enter your credentials to continue" / "Create your new account" (وصف النموذج)
- "Hide password" / "Show password" (aria-label)

## التغييرات

### 1. إضافة مفاتيح ترجمة جديدة — `src/lib/i18n.tsx`
إضافة المفاتيح التالية:

| المفتاح | العربية | الفرنسية |
|---|---|---|
| `loginSubtitle` | أدخل بياناتك للمتابعة | Entrez vos identifiants pour continuer |
| `signupSubtitle` | أنشئ حسابك الجديد | Créez votre nouveau compte |

### 2. استبدال النصوص المكتوبة يدوياً — `src/pages/Login.tsx`

- السطر 128-132: استبدال العنوان المكتوب يدوياً بـ `{isLogin ? t.loginTitle : t.signupTitle}`
- السطر 133-137: استبدال الوصف بـ `{isLogin ? t.loginSubtitle : t.signupSubtitle}`
- السطر 211: استبدال `'Hide password' : 'Show password'` بـ `t.hidePassword : t.showPassword`
- السطر 303: نفس التصحيح لـ aria-label في نموذج إنشاء الحساب

