

# إضافة Tooltip للبادج عند تمرير الماوس

## التغييرات

### 1. `src/lib/i18n.tsx`
إضافة 4 مفاتيح ترجمة لمستويات التحقق:
- `badge_gray`: غير منخرط / Non-adhérent
- `badge_black`: منخرط / Adhérent
- `badge_blue`: منخرط مفعّل / Adhérent vérifié
- `badge_gold`: مسؤول نقابي / Responsable syndical

### 2. `src/pages/Dashboard.tsx`
- استيراد `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` من `@/components/ui/tooltip`
- لف `VerifiedBadge` داخل مكون Tooltip يعرض النص المناسب حسب `badgeStatus`
- ربط النص بـ `t[badge_${badgeStatus}]`

### ملفان: `src/lib/i18n.tsx`, `src/pages/Dashboard.tsx`

