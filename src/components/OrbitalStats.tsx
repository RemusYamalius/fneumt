import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Users, UserCheck, FileText, Clock, CheckCircle2, XCircle, Building2 } from 'lucide-react';

export interface StatItem {
  id: string;
  labelAr: string;
  labelFr: string;
  value: number;
  icon: typeof Users;
  color: string;
}

interface OrbitalStatsProps {
  stats: StatItem[];
  title?: string;
  subtitle?: string;
}

/* ─── Animated Counter ─── */
const AnimatedCounter = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 800;
    const start = display;
    const diff = value - start;
    if (diff === 0) return;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);

  return <>{display.toLocaleString()}</>;
};

/* ─── Main Component ─── */
const OrbitalStats = ({ stats, title, subtitle }: OrbitalStatsProps) => {
  const { lang } = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const ringRotation = useMotionValue(0);
  const smoothRotation = useSpring(ringRotation, { stiffness: 30, damping: 20 });

  // Auto-rotate
  useEffect(() => {
    if (isDragging || stats.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % stats.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isDragging, stats.length]);

  // Spin decorative ring
  useEffect(() => {
    let frame: number;
    const spin = () => {
      ringRotation.set(ringRotation.get() + 0.15);
      frame = requestAnimationFrame(spin);
    };
    frame = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(frame);
  }, [ringRotation]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    dragStartX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(false);
    const endX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const diff = endX - dragStartX.current;
    if (Math.abs(diff) > 40) {
      setActiveIndex(prev =>
        diff > 0
          ? (prev - 1 + stats.length) % stats.length
          : (prev + 1) % stats.length
      );
    }
  };

  if (stats.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        {lang === 'ar' ? 'اختر جهة لعرض الإحصائيات' : 'Sélectionnez une région'}
      </div>
    );
  }

  const activeItem = stats[activeIndex];

  const getOrbitalPosition = (index: number, total: number) => {
    const normalizedIndex = ((index - activeIndex + total) % total) / total;
    const angle = normalizedIndex * Math.PI * 2 - Math.PI / 2;
    const radiusX = 130;
    const radiusY = 90;
    return {
      x: Math.cos(angle) * radiusX,
      y: Math.sin(angle) * radiusY,
      scale: 1 - Math.abs(normalizedIndex - 0.5) * 0.4,
      opacity: 1 - Math.abs(normalizedIndex > 0.5 ? normalizedIndex - 1 : normalizedIndex) * 0.6,
    };
  };

  return (
    <div className="flex flex-col items-center h-full">
      {title && (
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          key={title}
        >
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </motion.div>
      )}

      {/* Center Active Item + Orbital Ring */}
      <div className="flex-1 flex items-center justify-center w-full relative">
        {/* Decorative rotating ring */}
        <motion.div
          className="absolute w-64 h-64 rounded-full border border-dashed pointer-events-none"
          style={{
            borderColor: `${activeItem.color}20`,
            rotate: smoothRotation,
          }}
        />
        <motion.div
          className="absolute w-72 h-72 rounded-full border pointer-events-none"
          style={{
            borderColor: `${activeItem.color}10`,
            rotate: smoothRotation,
          }}
        />

        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
          {stats.map((item, i) => {
            if (i === activeIndex) return null;
            const pos = getOrbitalPosition(i, stats.length);
            const cx = 50; // percent center
            const cy = 50;
            return (
              <motion.line
                key={item.id}
                x1="50%"
                y1="50%"
                x2={`calc(50% + ${pos.x}px)`}
                y2={`calc(50% + ${pos.y}px)`}
                stroke={item.color}
                strokeOpacity={0.08}
                strokeWidth={1}
                strokeDasharray="4 4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6 }}
              />
            );
          })}
        </svg>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 250, damping: 22 }}
            className="flex flex-col items-center z-10"
          >
            {/* Pulse glow */}
            <motion.div
              className="absolute w-28 h-28 rounded-full"
              style={{ background: `radial-gradient(circle, ${activeItem.color}25 0%, transparent 70%)` }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-3 shadow-2xl border-2 relative"
              style={{
                background: `linear-gradient(135deg, ${activeItem.color}, ${activeItem.color}dd)`,
                borderColor: `${activeItem.color}80`,
                boxShadow: `0 0 40px ${activeItem.color}40, 0 0 80px ${activeItem.color}15`,
              }}
            >
              <activeItem.icon className="w-10 h-10 text-white" />
            </div>
            <motion.span
              className="text-4xl font-black text-foreground tabular-nums"
              key={activeItem.value}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <AnimatedCounter value={activeItem.value} />
            </motion.span>
            <span className="text-sm font-medium text-muted-foreground mt-1">
              {lang === 'ar' ? activeItem.labelAr : activeItem.labelFr}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Orbital ring items */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          ref={containerRef}
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchEnd={handleDragEnd}
          style={{ cursor: 'grab' }}
        >
          {stats.map((item, i) => {
            if (i === activeIndex) return null;
            const pos = getOrbitalPosition(i, stats.length);
            return (
              <motion.div
                key={item.id}
                className="absolute cursor-pointer"
                animate={{
                  x: pos.x,
                  y: pos.y,
                  scale: pos.scale,
                  opacity: pos.opacity,
                }}
                transition={{ type: 'spring', stiffness: 150, damping: 18 }}
                onClick={() => setActiveIndex(i)}
                whileHover={{ scale: pos.scale * 1.15 }}
              >
                <div
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl backdrop-blur-sm border"
                  style={{
                    background: `${item.color}15`,
                    borderColor: `${item.color}30`,
                  }}
                >
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  <span className="text-xs font-bold text-foreground tabular-nums">
                    <AnimatedCounter value={item.value} />
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap max-w-[80px] truncate">
                    {lang === 'ar' ? item.labelAr : item.labelFr}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Navigation dots */}
      <div className="flex items-center gap-2 mt-4">
        {stats.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeIndex
                ? 'w-6 bg-primary'
                : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default OrbitalStats;

// Helper to build stats from data
export function buildRegionStats(data: {
  totalUsers: number;
  members: number;
  nonMembers: number;
  totalRequests: number;
  submittedRequests: number;
  acceptedRequests: number;
  cancelledRequests: number;
  totalOffices: number;
}): StatItem[] {
  return [
    { id: 'total', labelAr: 'المسجلون', labelFr: 'Inscrits', value: data.totalUsers, icon: Users, color: 'hsl(225, 70%, 50%)' },
    { id: 'members', labelAr: 'المنخرطون', labelFr: 'Adhérents', value: data.members, icon: UserCheck, color: 'hsl(160, 60%, 45%)' },
    { id: 'requests', labelAr: 'الطلبات', labelFr: 'Demandes', value: data.totalRequests, icon: FileText, color: 'hsl(30, 80%, 50%)' },
    { id: 'submitted', labelAr: 'مقدّمة', labelFr: 'Soumises', value: data.submittedRequests, icon: Clock, color: 'hsl(45, 80%, 50%)' },
    { id: 'accepted', labelAr: 'مقبولة', labelFr: 'Acceptées', value: data.acceptedRequests, icon: CheckCircle2, color: 'hsl(140, 60%, 45%)' },
    { id: 'cancelled', labelAr: 'ملغاة', labelFr: 'Annulées', value: data.cancelledRequests, icon: XCircle, color: 'hsl(0, 65%, 50%)' },
    { id: 'offices', labelAr: 'المكاتب المحلية', labelFr: 'Bureaux locaux', value: data.totalOffices, icon: Building2, color: 'hsl(270, 60%, 50%)' },
  ];
}
