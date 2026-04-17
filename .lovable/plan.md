

# الخطوة التالية: Security Audit Log

سأقترح البدء بـ **Security Audit Log** لأنه:
- الأساس لاكتشاف أي محاولة قرصنة (يجب أن يكون موجوداً قبل 2FA)
- يعمل في الخلفية بدون تأثير على المستخدمين
- يوفر سجلاً قانونياً للأحداث الحساسة

## ما سيتم تسجيله

| الحدث | المصدر |
|-------|--------|
| محاولات تسجيل دخول فاشلة | useAuth (signIn) |
| تسجيل دخول ناجح | useAuth (signIn) |
| تسجيل خروج | useAuth (signOut) |
| طلب حذف حساب | delete-account edge function |
| تجاوز Rate Limit | delete-account, fetch-link-preview |
| تغيير دور مستخدم | UserManagement |
| الوصول المرفوض (RLS) | عبر متابعة الأخطاء في الواجهة |
| تغيير كلمة المرور | ResetPassword |

## التصميم التقني

### 1) جدول `security_audit_log`
```text
- id (uuid)
- user_id (uuid, nullable) — قد يكون null للمحاولات الفاشلة
- event_type (text) — 'login_failed', 'login_success', 'logout', 
                     'account_deletion_requested', 'rate_limit_exceeded',
                     'role_changed', 'password_changed'
- severity (text) — 'info', 'warning', 'critical'
- ip_address (text, nullable)
- user_agent (text, nullable)
- metadata (jsonb) — تفاصيل إضافية حسب نوع الحدث
- created_at (timestamptz)
```

### 2) سياسات RLS صارمة
- **INSERT**: مسموح للجميع (authenticated + anon) لتسجيل المحاولات الفاشلة
- **SELECT**: للأدمن فقط (`has_role(auth.uid(), 'admin')`)
- **UPDATE/DELETE**: ممنوع تماماً (سجل غير قابل للتعديل)

### 3) دالة RPC `log_security_event`
```text
log_security_event(
  _event_type text,
  _severity text,
  _metadata jsonb
) — SECURITY DEFINER, تستخرج user_id تلقائياً من auth.uid()
```

### 4) واجهة عرض السجل (للأدمن فقط)
- صفحة جديدة `/admin/security-log`
- جدول مع فلاتر: نوع الحدث، الخطورة، التاريخ، المستخدم
- تنبيه بصري للأحداث الحرجة (rate_limit_exceeded, login_failed > 5 مرات)
- مدخل في القائمة الجانبية تحت "إدارة" (يظهر للأدمن فقط)

### 5) نقاط التكامل
- `src/hooks/useAuth.tsx` — تسجيل login_failed/success/logout
- `supabase/functions/delete-account/index.ts` — تسجيل طلبات الحذف وتجاوز الحدود
- `supabase/functions/fetch-link-preview/index.ts` — تسجيل تجاوز الحدود
- `src/pages/admin/UserManagement.tsx` — تسجيل تغييرات الأدوار
- `src/pages/ResetPassword.tsx` — تسجيل تغيير كلمة المرور

## الملفات المتأثرة
```
supabase/migrations/  — migration جديدة (جدول + RLS + دالة RPC)
src/hooks/useAuth.tsx
src/pages/admin/UserManagement.tsx
src/pages/ResetPassword.tsx
src/pages/admin/SecurityLog.tsx  — صفحة جديدة
src/components/AuthenticatedLayout.tsx  — إضافة رابط في القائمة
src/App.tsx  — إضافة المسار
supabase/functions/delete-account/index.ts
supabase/functions/fetch-link-preview/index.ts
```

## السلوك للمستخدم النهائي
✅ **شفاف تماماً** — التسجيل يحدث في الخلفية، لا توجد تغييرات في تجربة المستخدم العادي. فقط الأدمن يرى صفحة جديدة لمراجعة السجل.

