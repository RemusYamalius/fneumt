

# تأثير توهج سماوي للبطاقة النشطة + تدوير يدوي للعجلة المدارية

## التعديلات

### 1. `src/index.css` — توهج سماوي على البطاقة النشطة
إضافة `box-shadow` مع توهج سماوي (`cyan glow`) على `.profile-card-glass.active`:
```css
.profile-card-glass.active {
  box-shadow: 
    inset 0 1px 0 rgba(255 255 255 / 0.12),
    0 8px 32px rgba(0 0 0 / 0.3),
    0 0 20px rgba(0 200 220 / 0.2),
    0 0 40px rgba(0 200 220 / 0.1),
    0 0 60px rgba(0 200 220 / 0.05);
  border-color: rgba(0 220 240 / 0.5);
}
```
مع إضافة `animation` نابض خفيف (`pulse glow`) لجعل التوهج يتنفس.

### 2. `src/pages/NewRequest.tsx` — تدوير يدوي للعجلة
إضافة دعم السحب (drag) للعجلة المدارية:
- تتبع أحداث `mousedown` / `mousemove` / `mouseup` (+ touch events للموبايل)
- حساب زاوية الدوران بناءً على حركة الماوس حول مركز العجلة باستخدام `Math.atan2`
- عند السحب: إيقاف الدوران التلقائي وتطبيق الدوران اليدوي
- عند الإفلات: استئناف الدوران التلقائي من الزاوية الحالية
- إضافة `cursor: grab` / `grabbing` للإشارة البصرية

المنطق:
```
onMouseDown → حفظ الزاوية الأولية + تفعيل isDragging
onMouseMove → حساب فرق الزاوية وتحديث rotation
onMouseUp → إلغاء isDragging → يستأنف الدوران التلقائي
```

