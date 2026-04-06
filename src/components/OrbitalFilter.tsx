import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useAnimationFrame } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useClickSound } from '@/hooks/useClickSound';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, RotateCcw, Users, Building2, X, School, Phone, Hash, Calendar, Maximize2, Minimize2 } from 'lucide-react';
import { ACADEMIES } from '@/lib/academies-data';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import AnimatedLogo from '@/components/AnimatedLogo';

// ─── Types ──────────────────────────────────────────────
export interface OrbitalFilterValues {
  mode: 'users' | 'offices';
  academy: string | null;
  directorate: string | null;
  institution: string;
  gender: 'male' | 'female' | 'all';
  mission: string | null;
  ageMin: string;
  ageMax: string;
  membership: 'member' | 'non_member' | 'pending' | 'all';
  ppr: string;
  phone: string;
}

interface OrbitalFilterProps {
  selectedAcademy: string | null;
  selectedDirectorate: string | null;
  onSearch: (filters: OrbitalFilterValues) => void;
}

// ─── Constants ──────────────────────────────────────────
const MISSIONS = [
  'أستاذ(ة) التعليم الابتدائي',
  'أستاذ(ة) التعليم الثانوي الإعدادي',
  'أستاذ(ة) التعليم الثانوي التأهيلي',
  'أستاذ(ة) مبرز(ة)',
  'ملحق(ة) تربوي',
  'ملحق(ة) إداري',
  'مدير(ة)',
  'حارس(ة) عام(ة)',
  'مفتش(ة)',
  'تقني',
  'مساعد(ة) تقني',
];

const GENDER_OPTIONS = [
  { val: 'all' as const, ar: 'الكل', fr: 'Tous' },
  { val: 'male' as const, ar: 'ذكر', fr: 'Homme' },
  { val: 'female' as const, ar: 'أنثى', fr: 'Femme' },
];

const MEMBERSHIP_OPTIONS = [
  { val: 'all' as const, ar: 'الكل', fr: 'Tous' },
  { val: 'member' as const, ar: 'منخرط', fr: 'Membre' },
  { val: 'non_member' as const, ar: 'غير منخرط', fr: 'Non-membre' },
  { val: 'pending' as const, ar: 'قيد التحقق', fr: 'En attente' },
];

const GENDER_COLORS = ['#C77EB5', '#8E6BAF', '#E8A0BF'];
const MEMBERSHIP_COLORS = ['#4A6FA5', '#6B9BC3', '#2C4A7C', '#89B4D4'];
const MISSION_COLORS = [
  '#2D8B6F', '#3A9E7E', '#48B08D', '#56C29C', '#64D4AB',
  '#4ABFAD', '#3DADAA', '#2F9BA7', '#2189A4', '#1477A1',
  '#07659E',
];
const ACADEMY_COLORS = [
  '#E74C3C', '#E67E22', '#F1C40F', '#F39C12', '#D4AC0D',
  '#E8B739', '#C0392B', '#D35400', '#E57E22', '#F4A62A',
  '#E88B30', '#D97538',
];

// ─── SVG Arc Helpers ────────────────────────────────────
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number, cy: number,
  innerR: number, outerR: number,
  startAngle: number, endAngle: number
): string {
  const gap = 1.8;
  const s = startAngle + gap / 2;
  const e = endAngle - gap / 2;
  if (e <= s) return '';

  const outerStart = polarToCartesian(cx, cy, outerR, s);
  const outerEnd = polarToCartesian(cx, cy, outerR, e);
  const innerStart = polarToCartesian(cx, cy, innerR, e);
  const innerEnd = polarToCartesian(cx, cy, innerR, s);

  const largeArc = e - s > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ');
}

function labelPosition(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const mid = (startAngle + endAngle) / 2;
  return polarToCartesian(cx, cy, r, mid);
}

// ─── Arc Segment Component ──────────────────────────────
interface ArcSegmentProps {
  cx: number; cy: number;
  innerR: number; outerR: number;
  startAngle: number; endAngle: number;
  color: string;
  selected: boolean;
  hovered: boolean;
  label: string;
  ringRotation: number;
  onClick: () => void;
  onHover: (h: boolean) => void;
}

const ArcSegment = ({ cx, cy, innerR, outerR, startAngle, endAngle, color, selected, hovered, label, ringRotation, onClick, onHover }: ArcSegmentProps) => {
  const d = describeArc(cx, cy, innerR, outerR, startAngle, endAngle);
  const midR = (innerR + outerR) / 2;
  const pos = labelPosition(cx, cy, midR, startAngle, endAngle);
  const angleDeg = endAngle - startAngle;
  const showLabel = angleDeg > 15;

  const segWidth = outerR - innerR;
  const arcLen = (angleDeg / 360) * 2 * Math.PI * midR;
  const maxChars = Math.floor(arcLen / 5.5);
  const displayLabel = label.length > maxChars ? label.slice(0, maxChars - 1) + '…' : label;

  const baseFontSize = Math.max(5.5, Math.min(10, segWidth * 0.28));
  const fontSize = hovered ? Math.min(baseFontSize * 1.6, 14) : baseFontSize;

  // Counter-rotate text so it stays horizontal (readable)
  const counterRotation = -ringRotation;

  const scale = hovered ? 1.08 : 1;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <g
            className="cursor-pointer"
            onClick={onClick}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
            style={{ transformOrigin: `${cx}px ${cy}px`, transform: `scale(${scale})`, transition: 'transform 0.2s ease' }}
          >
            <path
              d={d}
              fill={selected ? color : hovered ? `${color}CC` : `${color}88`}
              stroke={selected ? '#fff' : hovered ? '#fff' : `${color}BB`}
              strokeWidth={selected ? 2.5 : hovered ? 1.5 : 0.5}
              className="transition-all duration-200"
              style={{
                filter: selected
                  ? `brightness(1.2) drop-shadow(0 0 10px ${color}) drop-shadow(0 0 20px ${color}66)`
                  : hovered
                    ? `brightness(1.1) drop-shadow(0 0 4px ${color}66)`
                    : 'none',
              }}
            />
            {showLabel && (
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={selected ? '#fff' : hovered ? '#fff' : '#222'}
                fontSize={fontSize}
                fontWeight={selected ? 700 : hovered ? 600 : 500}
                className="pointer-events-none select-none"
                transform={`rotate(${counterRotation}, ${pos.x}, ${pos.y})`}
                style={{
                  textShadow: selected || hovered
                    ? '0 1px 4px rgba(0,0,0,0.5), 0 0 8px rgba(0,0,0,0.3)'
                    : '0 0 3px rgba(255,255,255,0.8)',
                  transition: 'font-size 0.2s ease',
                }}
              >
                {displayLabel}
              </text>
            )}
          </g>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs z-50 max-w-[220px] font-medium">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// ─── Ring Component with Manual Rotation ────────────────
interface RingData {
  items: { label: string; value: string }[];
  colors: string[];
  innerR: number;
  outerR: number;
  selected: string | null;
  onSelect: (val: string | null) => void;
  rotationDir: 1 | -1;
  speed: number;
}

const FilterRing = ({ items, colors, innerR, outerR, selected, onSelect, rotationDir, speed, cx, cy }: RingData & { cx: number; cy: number }) => {
  const [ringHovered, setRingHovered] = useState(false);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const anglePerItem = 360 / items.length;
  const playClick = useClickSound();
  const rotationRef = useRef(0);
  const [currentRotation, setCurrentRotation] = useState(0);

  // Manual drag state
  const isDragging = useRef(false);
  const dragStartAngle = useRef(0);
  const dragStartRotation = useRef(0);

  const shouldRotate = !ringHovered && selected === null && !isDragging.current;

  useAnimationFrame((_, delta) => {
    if (shouldRotate) {
      rotationRef.current += (rotationDir * 360 * delta) / (speed * 1000);
      rotationRef.current = rotationRef.current % 360;
      setCurrentRotation(rotationRef.current);
    }
  });

  const getAngleFromMouse = useCallback((e: React.MouseEvent) => {
    const svg = (e.target as Element).closest('svg');
    if (!svg) return 0;
    const rect = svg.getBoundingClientRect();
    const svgX = (e.clientX - rect.left) / rect.width * 600;
    const svgY = (e.clientY - rect.top) / rect.height * 600;
    return Math.atan2(svgY - cy, svgX - cx) * (180 / Math.PI);
  }, [cx, cy]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartAngle.current = getAngleFromMouse(e);
    dragStartRotation.current = rotationRef.current;
  }, [getAngleFromMouse]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const angle = getAngleFromMouse(e);
    const delta = angle - dragStartAngle.current;
    rotationRef.current = dragStartRotation.current + delta;
    setCurrentRotation(rotationRef.current);
  }, [getAngleFromMouse]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    rotationRef.current += e.deltaY > 0 ? 8 : -8;
    setCurrentRotation(rotationRef.current);
  }, []);

  return (
    <g
      onMouseEnter={() => setRingHovered(true)}
      onMouseLeave={() => { setRingHovered(false); setHoveredSegment(null); handleMouseUp(); }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{ transform: `rotate(${currentRotation}deg)`, transformOrigin: `${cx}px ${cy}px` }}
    >
      {items.map((item, i) => {
        const startAngle = i * anglePerItem;
        const endAngle = startAngle + anglePerItem;
        const isSelected = selected === item.value;
        const isHovered = hoveredSegment === item.value;
        const color = colors[i % colors.length];

        return (
          <ArcSegment
            key={item.value}
            cx={cx} cy={cy}
            innerR={innerR} outerR={outerR}
            startAngle={startAngle} endAngle={endAngle}
            color={color}
            selected={isSelected}
            hovered={isHovered}
            label={item.label}
            ringRotation={currentRotation}
            onHover={(h) => setHoveredSegment(h ? item.value : null)}
            onClick={() => {
              playClick();
              onSelect(isSelected ? null : item.value);
            }}
          />
        );
      })}
    </g>
  );
};

// ─── Main Component ─────────────────────────────────────
const OrbitalFilter = ({ selectedAcademy, selectedDirectorate, onSearch }: OrbitalFilterProps) => {
  const { lang } = useI18n();
  const playClick = useClickSound();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [filters, setFilters] = useState<OrbitalFilterValues>({
    mode: 'users',
    academy: null,
    directorate: null,
    institution: '',
    gender: 'all',
    mission: null,
    ageMin: '',
    ageMax: '',
    membership: 'all',
    ppr: '',
    phone: '',
  });

  useEffect(() => {
    if (selectedAcademy !== filters.academy) {
      setFilters(prev => ({ ...prev, academy: selectedAcademy, directorate: selectedDirectorate }));
    }
  }, [selectedAcademy]);

  useEffect(() => {
    if (selectedDirectorate !== filters.directorate) {
      setFilters(prev => ({ ...prev, directorate: selectedDirectorate }));
    }
  }, [selectedDirectorate]);

  const directorates = useMemo(() => {
    if (!filters.academy) return [];
    return ACADEMIES.find(a => a.label === filters.academy)?.directorates || [];
  }, [filters.academy]);

  const genderItems = GENDER_OPTIONS.map(o => ({ label: lang === 'ar' ? o.ar : o.fr, value: o.val }));
  const membershipItems = MEMBERSHIP_OPTIONS.map(o => ({ label: lang === 'ar' ? o.ar : o.fr, value: o.val }));
  const missionItems = MISSIONS.map(m => ({ label: m, value: m }));
  const academyItems = ACADEMIES.map(a => ({
    label: a.label.replace('الأكاديمية الجهوية للتربية والتكوين لجهة ', ''),
    value: a.label,
  }));
  const directorateItems = directorates.map(d => ({ label: d, value: d }));

  const dirColors = useMemo(() => {
    return directorates.map((_, i) => {
      const hue = 25 + (i * 15) % 50;
      const sat = 40 + (i * 5) % 30;
      const light = 40 + (i * 4) % 25;
      return `hsl(${hue}, ${sat}%, ${light}%)`;
    });
  }, [directorates]);

  const handleReset = () => {
    playClick();
    setFilters({
      mode: filters.mode,
      academy: null, directorate: null, institution: '',
      gender: 'all', mission: null, ageMin: '', ageMax: '',
      membership: 'all', ppr: '', phone: '',
    });
  };

  const activeSelections = useMemo(() => {
    const items: { key: string; label: string; color: string; onRemove: () => void }[] = [];
    if (filters.gender !== 'all') {
      const opt = GENDER_OPTIONS.find(o => o.val === filters.gender);
      items.push({
        key: 'gender',
        label: `${lang === 'ar' ? 'النوع' : 'Genre'}: ${opt ? (lang === 'ar' ? opt.ar : opt.fr) : ''}`,
        color: '#C77EB5',
        onRemove: () => setFilters(p => ({ ...p, gender: 'all' })),
      });
    }
    if (filters.membership !== 'all') {
      const opt = MEMBERSHIP_OPTIONS.find(o => o.val === filters.membership);
      items.push({
        key: 'membership',
        label: `${lang === 'ar' ? 'الانخراط' : 'Adhésion'}: ${opt ? (lang === 'ar' ? opt.ar : opt.fr) : ''}`,
        color: '#4A6FA5',
        onRemove: () => setFilters(p => ({ ...p, membership: 'all' })),
      });
    }
    if (filters.mission) {
      items.push({
        key: 'mission',
        label: `${lang === 'ar' ? 'المهمة' : 'Mission'}: ${filters.mission.length > 20 ? filters.mission.slice(0, 18) + '…' : filters.mission}`,
        color: '#2D8B6F',
        onRemove: () => setFilters(p => ({ ...p, mission: null })),
      });
    }
    if (filters.academy) {
      const short = filters.academy.replace('الأكاديمية الجهوية للتربية والتكوين لجهة ', '');
      items.push({
        key: 'academy',
        label: `${lang === 'ar' ? 'الأكاديمية' : 'Académie'}: ${short}`,
        color: '#E67E22',
        onRemove: () => setFilters(p => ({ ...p, academy: null, directorate: null })),
      });
    }
    if (filters.directorate) {
      items.push({
        key: 'directorate',
        label: `${lang === 'ar' ? 'المديرية' : 'Direction'}: ${filters.directorate}`,
        color: '#8B6914',
        onRemove: () => setFilters(p => ({ ...p, directorate: null })),
      });
    }
    return items;
  }, [filters, lang]);

  const CX = 300;
  const CY = 300;
  const SIZE = 600;

  const rings = [
    { innerR: 62, outerR: 98 },
    { innerR: 102, outerR: 142 },
    { innerR: 146, outerR: 198 },
    { innerR: 202, outerR: 258 },
    { innerR: 262, outerR: 295 },
  ];

  const filterContent = (
    <div className="flex flex-col items-center w-full h-full">
      {/* ─── Search Scope Toggle (above the wheel) ─── */}
      <div className="w-full px-4 pt-4 pb-2">
        <div className="flex flex-col items-center gap-2">
          <p className="text-[11px] font-semibold text-muted-foreground tracking-wide uppercase">
            {lang === 'ar' ? 'نطاق البحث' : 'Portée de recherche'}
          </p>
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted/60 border border-border/50 shadow-inner">
            <motion.button
              onClick={() => { playClick(); setFilters(prev => ({ ...prev, mode: 'users' })); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filters.mode === 'users'
                  ? 'bg-gradient-to-r from-[#0A4174] to-[#001D39] text-white shadow-lg'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <Users className="w-4 h-4" />
              {lang === 'ar' ? 'بحث عام — المسجلون' : 'Recherche générale — Inscrits'}
            </motion.button>
            <motion.button
              onClick={() => { playClick(); setFilters(prev => ({ ...prev, mode: 'offices' })); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filters.mode === 'offices'
                  ? 'bg-gradient-to-r from-[#0A4174] to-[#001D39] text-white shadow-lg'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <Building2 className="w-4 h-4" />
              {lang === 'ar' ? 'حسب المكاتب المحلية' : 'Par bureaux locaux'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* ─── Fullscreen toggle for orbital ─── */}
      <div className="w-full flex justify-end px-4">
        <button
          onClick={() => { playClick(); setIsFullscreen(prev => !prev); }}
          className="p-2 rounded-xl bg-[#001D39]/80 hover:bg-[#001D39] text-white border border-[#49769F]/50 shadow-lg transition-all backdrop-blur-sm"
          title={isFullscreen ? (lang === 'ar' ? 'تصغير' : 'Réduire') : (lang === 'ar' ? 'تكبير' : 'Agrandir')}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* ─── Color Wheel ─── */}
      <div className="w-full flex items-center justify-center px-2">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className={`w-full ${isFullscreen ? 'max-w-[700px]' : 'max-w-[560px]'} aspect-square`}
        >
          <defs>
            <filter id="ring-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="centerGrad" cx="35%" cy="35%">
              <stop offset="0%" stopColor="#0A4174" />
              <stop offset="100%" stopColor="#001D39" />
            </radialGradient>
          </defs>

          {/* Directorate ring (outermost) */}
          {directorateItems.length > 0 && (
            <FilterRing
              cx={CX} cy={CY}
              innerR={rings[4].innerR} outerR={rings[4].outerR}
              items={directorateItems} colors={dirColors}
              selected={filters.directorate}
              onSelect={(val) => setFilters(prev => ({ ...prev, directorate: val }))}
              rotationDir={-1} speed={80}
            />
          )}

          {/* Academy ring */}
          <FilterRing
            cx={CX} cy={CY}
            innerR={rings[3].innerR} outerR={rings[3].outerR}
            items={academyItems} colors={ACADEMY_COLORS}
            selected={filters.academy}
            onSelect={(val) => setFilters(prev => ({ ...prev, academy: val, directorate: null }))}
            rotationDir={1} speed={90}
          />

          {/* Mission ring */}
          <FilterRing
            cx={CX} cy={CY}
            innerR={rings[2].innerR} outerR={rings[2].outerR}
            items={missionItems} colors={MISSION_COLORS}
            selected={filters.mission}
            onSelect={(val) => setFilters(prev => ({ ...prev, mission: val }))}
            rotationDir={-1} speed={60}
          />

          {/* Membership ring */}
          <FilterRing
            cx={CX} cy={CY}
            innerR={rings[1].innerR} outerR={rings[1].outerR}
            items={membershipItems} colors={MEMBERSHIP_COLORS}
            selected={filters.membership === 'all' ? null : filters.membership}
            onSelect={(val) => setFilters(prev => ({ ...prev, membership: (val || 'all') as OrbitalFilterValues['membership'] }))}
            rotationDir={1} speed={45}
          />

          {/* Gender ring (innermost) */}
          <FilterRing
            cx={CX} cy={CY}
            innerR={rings[0].innerR} outerR={rings[0].outerR}
            items={genderItems} colors={GENDER_COLORS}
            selected={filters.gender === 'all' ? null : filters.gender}
            onSelect={(val) => setFilters(prev => ({ ...prev, gender: (val || 'all') as OrbitalFilterValues['gender'] }))}
            rotationDir={-1} speed={35}
          />

          {/* Center hub — Logo */}
          <circle cx={CX} cy={CY} r={58} fill="url(#centerGrad)" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,29,57,0.5))' }} />
          <foreignObject x={CX - 28} y={CY - 28} width={56} height={56}>
            <AnimatedLogo size="w-14 h-14" />
          </foreignObject>
        </svg>
      </div>

      {/* ─── Progressive Selection Badges ─── */}
      <AnimatePresence>
        {activeSelections.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full px-4 py-2 overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2 justify-center">
              {activeSelections.map((sel) => (
                <motion.div
                  key={sel.key}
                  initial={{ opacity: 0, scale: 0.7, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.7, y: -8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Badge
                    className="text-[11px] px-3 py-1.5 gap-1.5 font-medium text-white cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
                    style={{
                      backgroundColor: sel.color,
                      boxShadow: `0 2px 8px ${sel.color}44`,
                    }}
                    onClick={sel.onRemove}
                  >
                    {sel.label}
                    <X className="w-3 h-3 opacity-70 hover:opacity-100" />
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Extra Filters ─── */}
      <div className="w-full px-4 pb-4 pt-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative group">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200/40 shadow-[0_2px_12px_rgba(45,139,111,0.12)]" />
            <div className="relative p-3">
              <label className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 mb-1.5 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'المؤسسة' : 'Établissement'}
              </label>
              <Input
                placeholder={lang === 'ar' ? 'اسم المؤسسة...' : 'Nom...'}
                value={filters.institution}
                onChange={e => setFilters(prev => ({ ...prev, institution: e.target.value }))}
                className="h-9 text-xs bg-white/70 dark:bg-card/70 border-emerald-200/60 focus:border-emerald-400 shadow-sm"
              />
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-200/40 shadow-[0_2px_12px_rgba(142,107,175,0.12)]" />
            <div className="relative p-3">
              <label className="text-[11px] font-semibold text-violet-700 dark:text-violet-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'الفئة العمرية' : 'Tranche d\'âge'}
              </label>
              <div className="flex gap-2">
                <Input type="number" placeholder="Min" value={filters.ageMin}
                  onChange={e => setFilters(prev => ({ ...prev, ageMin: e.target.value }))}
                  className="h-9 text-xs bg-white/70 dark:bg-card/70 border-violet-200/60 focus:border-violet-400 shadow-sm" />
                <Input type="number" placeholder="Max" value={filters.ageMax}
                  onChange={e => setFilters(prev => ({ ...prev, ageMax: e.target.value }))}
                  className="h-9 text-xs bg-white/70 dark:bg-card/70 border-violet-200/60 focus:border-violet-400 shadow-sm" />
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200/40 shadow-[0_2px_12px_rgba(230,126,34,0.12)]" />
            <div className="relative p-3">
              <label className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'رقم التأجير' : 'N° PPR'}
              </label>
              <Input placeholder={lang === 'ar' ? 'رقم التأجير...' : 'N° PPR...'} value={filters.ppr}
                onChange={e => setFilters(prev => ({ ...prev, ppr: e.target.value }))}
                className="h-9 text-xs bg-white/70 dark:bg-card/70 border-amber-200/60 focus:border-amber-400 shadow-sm" />
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-500/10 to-blue-500/10 border border-sky-200/40 shadow-[0_2px_12px_rgba(74,111,165,0.12)]" />
            <div className="relative p-3">
              <label className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'رقم الهاتف' : 'Téléphone'}
              </label>
              <Input placeholder="06xxxxxxxx" value={filters.phone}
                onChange={e => setFilters(prev => ({ ...prev, phone: e.target.value }))}
                className="h-9 text-xs bg-white/70 dark:bg-card/70 border-sky-200/60 focus:border-sky-400 shadow-sm" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4 justify-center">
          <Button variant="outline" size="sm" onClick={handleReset}
            className="gap-1.5 text-xs h-9 px-5 rounded-xl shadow-md hover:shadow-lg transition-shadow border-muted-foreground/20">
            <RotateCcw className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'إعادة ضبط' : 'Réinitialiser'}
          </Button>
          <Button size="sm"
            onClick={() => { playClick(); onSearch(filters); }}
            className="gap-1.5 text-xs h-9 px-8 rounded-xl bg-gradient-to-r from-[#0A4174] to-[#001D39] hover:from-[#001D39] hover:to-[#0A4174] shadow-lg hover:shadow-xl transition-all text-white">
            <Search className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'بحث' : 'Rechercher'}
          </Button>
        </div>
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-y-auto flex items-center justify-center p-6"
      >
        <div className="w-full max-w-[900px] flex flex-col items-center">
          {filterContent}
        </div>
      </motion.div>
    );
  }

  return filterContent;
};

export default OrbitalFilter;
