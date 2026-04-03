import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useClickSound } from '@/hooks/useClickSound';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RotateCcw, Users, Building2 } from 'lucide-react';
import { ACADEMIES } from '@/lib/academies-data';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

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
  { val: 'male' as const, ar: 'ذكر', fr: 'M' },
  { val: 'female' as const, ar: 'أنثى', fr: 'F' },
];

const MEMBERSHIP_OPTIONS = [
  { val: 'all' as const, ar: 'الكل', fr: 'Tous' },
  { val: 'member' as const, ar: 'منخرط', fr: 'Membre' },
  { val: 'non_member' as const, ar: 'غير منخرط', fr: 'Non' },
  { val: 'pending' as const, ar: 'قيد التحقق', fr: 'Attente' },
];

// Color palettes per ring (inspired by color wheel)
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
  const gap = 1.5; // gap in degrees between segments
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
  label: string;
  onClick: () => void;
}

const ArcSegment = ({ cx, cy, innerR, outerR, startAngle, endAngle, color, selected, label, onClick }: ArcSegmentProps) => {
  const d = describeArc(cx, cy, innerR, outerR, startAngle, endAngle);
  const midR = (innerR + outerR) / 2;
  const pos = labelPosition(cx, cy, midR, startAngle, endAngle);
  const angleDeg = endAngle - startAngle;
  const showLabel = angleDeg > 18;

  // Truncate label for display
  const displayLabel = label.length > 8 ? label.slice(0, 7) + '…' : label;

  // Compute font size based on segment size
  const segWidth = outerR - innerR;
  const fontSize = Math.max(5, Math.min(8, segWidth * 0.22));

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <g className="cursor-pointer" onClick={onClick}>
            <path
              d={d}
              fill={selected ? color : `${color}99`}
              stroke={selected ? '#fff' : `${color}CC`}
              strokeWidth={selected ? 2 : 0.5}
              className="transition-all duration-200"
              style={{
                filter: selected ? 'brightness(1.1) drop-shadow(0 0 4px rgba(0,0,0,0.3))' : 'none',
              }}
            />
            <path
              d={d}
              fill="transparent"
              className="hover:fill-white/20 transition-colors duration-150"
            />
            {showLabel && (
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={selected ? '#fff' : '#1a1a1a'}
                fontSize={fontSize}
                fontWeight={selected ? 700 : 500}
                className="pointer-events-none select-none"
                style={{ textShadow: selected ? '0 1px 2px rgba(0,0,0,0.3)' : 'none' }}
              >
                {displayLabel}
              </text>
            )}
          </g>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs z-50 max-w-[200px]">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// ─── Ring Component ─────────────────────────────────────
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

const FilterRing = ({ items, colors, innerR, outerR, selected, onSelect, rotationDir, speed }: RingData & { cx: number; cy: number }) => {
  const [hovered, setHovered] = useState(false);
  const cx = 250;
  const cy = 250;
  const anglePerItem = 360 / items.length;
  const playClick = useClickSound();

  return (
    <motion.g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{ rotate: hovered ? 0 : rotationDir * 360 }}
      transition={{
        duration: speed,
        repeat: Infinity,
        ease: 'linear',
        ...(hovered ? { duration: 0.3 } : {}),
      }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      {items.map((item, i) => {
        const startAngle = i * anglePerItem;
        const endAngle = startAngle + anglePerItem;
        const isSelected = selected === item.value;
        const color = colors[i % colors.length];

        return (
          <ArcSegment
            key={item.value}
            cx={cx}
            cy={cy}
            innerR={innerR}
            outerR={outerR}
            startAngle={startAngle}
            endAngle={endAngle}
            color={color}
            selected={isSelected}
            label={item.label}
            onClick={() => {
              playClick();
              onSelect(isSelected ? null : item.value);
            }}
          />
        );
      })}
    </motion.g>
  );
};

// ─── Main Component ─────────────────────────────────────
const OrbitalFilter = ({ selectedAcademy, selectedDirectorate, onSearch }: OrbitalFilterProps) => {
  const { lang } = useI18n();
  const playClick = useClickSound();

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

  // Sync map selection
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

  // Build ring data
  const genderItems = GENDER_OPTIONS.map(o => ({
    label: lang === 'ar' ? o.ar : o.fr,
    value: o.val,
  }));

  const membershipItems = MEMBERSHIP_OPTIONS.map(o => ({
    label: lang === 'ar' ? o.ar : o.fr,
    value: o.val,
  }));

  const missionItems = MISSIONS.map(m => ({
    label: m,
    value: m,
  }));

  const academyItems = ACADEMIES.map(a => ({
    label: a.label.replace('الأكاديمية الجهوية للتربية والتكوين لجهة ', ''),
    value: a.label,
  }));

  const directorateItems = directorates.map(d => ({
    label: d,
    value: d,
  }));

  // Generate dynamic colors for directorates
  const dirColors = useMemo(() => {
    return directorates.map((_, i) => {
      const hue = 25 + (i * 15) % 50; // earthy browns/oranges
      const sat = 40 + (i * 5) % 30;
      const light = 40 + (i * 4) % 25;
      return `hsl(${hue}, ${sat}%, ${light}%)`;
    });
  }, [directorates]);

  const handleReset = () => {
    playClick();
    setFilters({
      mode: filters.mode,
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
  };

  const cx = 250;
  const cy = 250;
  const size = 500;

  // Ring radii (from inside out): gender, membership, mission, academy, directorate
  const rings = [
    { innerR: 52, outerR: 82 },   // gender (3)
    { innerR: 84, outerR: 114 },   // membership (4)
    { innerR: 116, outerR: 158 },  // mission (11)
    { innerR: 160, outerR: 205 },  // academy (12)
    { innerR: 207, outerR: 245 },  // directorate (dynamic)
  ];

  return (
    <div className="flex flex-col lg:flex-row items-start gap-4 p-4 h-full">
      {/* Color Wheel */}
      <div className="flex-1 flex items-center justify-center min-w-0">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full max-w-[420px] aspect-square"
        >
          {/* Ring labels (static, behind everything) */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Directorate ring (outermost) - only if academy selected */}
          {directorateItems.length > 0 && (
            <FilterRing
              cx={cx} cy={cy}
              innerR={rings[4].innerR}
              outerR={rings[4].outerR}
              items={directorateItems}
              colors={dirColors}
              selected={filters.directorate}
              onSelect={(val) => setFilters(prev => ({ ...prev, directorate: val }))}
              rotationDir={-1}
              speed={80}
            />
          )}

          {/* Academy ring */}
          <FilterRing
            cx={cx} cy={cy}
            innerR={rings[3].innerR}
            outerR={rings[3].outerR}
            items={academyItems}
            colors={ACADEMY_COLORS}
            selected={filters.academy}
            onSelect={(val) => setFilters(prev => ({ ...prev, academy: val, directorate: null }))}
            rotationDir={1}
            speed={90}
          />

          {/* Mission ring */}
          <FilterRing
            cx={cx} cy={cy}
            innerR={rings[2].innerR}
            outerR={rings[2].outerR}
            items={missionItems}
            colors={MISSION_COLORS}
            selected={filters.mission}
            onSelect={(val) => setFilters(prev => ({ ...prev, mission: val }))}
            rotationDir={-1}
            speed={60}
          />

          {/* Membership ring */}
          <FilterRing
            cx={cx} cy={cy}
            innerR={rings[1].innerR}
            outerR={rings[1].outerR}
            items={membershipItems}
            colors={MEMBERSHIP_COLORS}
            selected={filters.membership === 'all' ? null : filters.membership}
            onSelect={(val) => setFilters(prev => ({ ...prev, membership: (val || 'all') as OrbitalFilterValues['membership'] }))}
            rotationDir={1}
            speed={45}
          />

          {/* Gender ring (innermost) */}
          <FilterRing
            cx={cx} cy={cy}
            innerR={rings[0].innerR}
            outerR={rings[0].outerR}
            items={genderItems}
            colors={GENDER_COLORS}
            selected={filters.gender === 'all' ? null : filters.gender}
            onSelect={(val) => setFilters(prev => ({ ...prev, gender: (val || 'all') as OrbitalFilterValues['gender'] }))}
            rotationDir={-1}
            speed={35}
          />

          {/* Center hub */}
          <g
            className="cursor-pointer"
            onClick={() => {
              playClick();
              setFilters(prev => ({ ...prev, mode: prev.mode === 'users' ? 'offices' : 'users' }));
            }}
          >
            <circle cx={cx} cy={cy} r={48} fill="url(#centerGrad)" className="transition-all duration-300" />
            <defs>
              <radialGradient id="centerGrad" cx="40%" cy="40%">
                <stop offset="0%" stopColor="#0A4174" />
                <stop offset="100%" stopColor="#001D39" />
              </radialGradient>
            </defs>
            <AnimatePresence mode="wait">
              <motion.g
                key={filters.mode}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              >
                {filters.mode === 'users' ? (
                  <>
                    <foreignObject x={cx - 10} y={cy - 14} width={20} height={20}>
                      <Users className="w-5 h-5 text-white" />
                    </foreignObject>
                    <text x={cx} y={cy + 16} textAnchor="middle" fill="white" fontSize="7" opacity={0.9} fontWeight={600}>
                      {lang === 'ar' ? 'المسجلون' : 'Inscrits'}
                    </text>
                  </>
                ) : (
                  <>
                    <foreignObject x={cx - 10} y={cy - 14} width={20} height={20}>
                      <Building2 className="w-5 h-5 text-white" />
                    </foreignObject>
                    <text x={cx} y={cy + 16} textAnchor="middle" fill="white" fontSize="7" opacity={0.9} fontWeight={600}>
                      {lang === 'ar' ? 'المكاتب' : 'Bureaux'}
                    </text>
                  </>
                )}
              </motion.g>
            </AnimatePresence>
          </g>
        </svg>
      </div>

      {/* Side Input Panel */}
      <div className="w-full lg:w-52 flex flex-col gap-3 shrink-0">
        <h3 className="text-sm font-semibold text-foreground mb-1">
          {lang === 'ar' ? 'فلاتر إضافية' : 'Filtres supplémentaires'}
        </h3>

        {/* Institution */}
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">
            {lang === 'ar' ? 'المؤسسة' : 'Établissement'}
          </label>
          <Input
            placeholder={lang === 'ar' ? 'اسم المؤسسة...' : 'Nom...'}
            value={filters.institution}
            onChange={e => setFilters(prev => ({ ...prev, institution: e.target.value }))}
            className="h-8 text-xs"
          />
        </div>

        {/* Age */}
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">
            {lang === 'ar' ? 'الفئة العمرية' : 'Tranche d\'âge'}
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.ageMin}
              onChange={e => setFilters(prev => ({ ...prev, ageMin: e.target.value }))}
              className="h-8 text-xs"
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.ageMax}
              onChange={e => setFilters(prev => ({ ...prev, ageMax: e.target.value }))}
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* PPR */}
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">
            {lang === 'ar' ? 'رقم التأجير' : 'N° PPR'}
          </label>
          <Input
            placeholder={lang === 'ar' ? 'رقم التأجير...' : 'N° PPR...'}
            value={filters.ppr}
            onChange={e => setFilters(prev => ({ ...prev, ppr: e.target.value }))}
            className="h-8 text-xs"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">
            {lang === 'ar' ? 'رقم الهاتف' : 'Téléphone'}
          </label>
          <Input
            placeholder={lang === 'ar' ? '06xxxxxxxx' : '06xxxxxxxx'}
            value={filters.phone}
            onChange={e => setFilters(prev => ({ ...prev, phone: e.target.value }))}
            className="h-8 text-xs"
          />
        </div>

        {/* Active filters summary */}
        <div className="flex flex-wrap gap-1 mt-1">
          {filters.academy && (
            <span className="text-[9px] bg-orange-100 text-orange-800 rounded-full px-2 py-0.5 truncate max-w-full">
              {filters.academy.replace('الأكاديمية الجهوية للتربية والتكوين لجهة ', '')}
            </span>
          )}
          {filters.directorate && (
            <span className="text-[9px] bg-amber-100 text-amber-800 rounded-full px-2 py-0.5 truncate">
              {filters.directorate}
            </span>
          )}
          {filters.gender !== 'all' && (
            <span className="text-[9px] bg-pink-100 text-pink-800 rounded-full px-2 py-0.5">
              {lang === 'ar' ? (filters.gender === 'male' ? 'ذكر' : 'أنثى') : (filters.gender === 'male' ? 'M' : 'F')}
            </span>
          )}
          {filters.mission && (
            <span className="text-[9px] bg-teal-100 text-teal-800 rounded-full px-2 py-0.5 truncate max-w-[120px]">
              {filters.mission}
            </span>
          )}
          {filters.membership !== 'all' && (
            <span className="text-[9px] bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">
              {MEMBERSHIP_OPTIONS.find(o => o.val === filters.membership)?.[lang === 'ar' ? 'ar' : 'fr']}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex-1 gap-1 text-xs h-8"
          >
            <RotateCcw className="w-3 h-3" />
            {lang === 'ar' ? 'ضبط' : 'Reset'}
          </Button>
          <Button
            size="sm"
            onClick={() => { playClick(); onSearch(filters); }}
            className="flex-1 gap-1 text-xs h-8 bg-[#0A4174] hover:bg-[#001D39]"
          >
            <Search className="w-3 h-3" />
            {lang === 'ar' ? 'بحث' : 'Rechercher'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrbitalFilter;
