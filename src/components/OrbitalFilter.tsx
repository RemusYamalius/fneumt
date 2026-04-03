import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useClickSound } from '@/hooks/useClickSound';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RotateCcw, Users, Building2 } from 'lucide-react';
import { ACADEMIES } from '@/lib/academies-data';

// Ring colors from palette
const RING_COLORS = [
  '#0A4174', // 1 - Academy
  '#49769F', // 2 - Directorate
  '#4E8EA2', // 3 - Institution
  '#6EA2B3', // 4 - Gender
  '#7BBDE8', // 5 - Mission
  '#001D39', // 6 - Age
  '#0A4174', // 7 - Membership
  '#49769F', // 8 - PPR
  '#4E8EA2', // 9 - Phone
];

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

interface FilterRing {
  id: string;
  labelAr: string;
  labelFr: string;
  index: number;
}

const FILTER_RINGS: FilterRing[] = [
  { id: 'academy', labelAr: 'الأكاديمية', labelFr: 'Académie', index: 0 },
  { id: 'directorate', labelAr: 'المديرية', labelFr: 'Direction', index: 1 },
  { id: 'institution', labelAr: 'المؤسسة', labelFr: 'Établissement', index: 2 },
  { id: 'gender', labelAr: 'النوع', labelFr: 'Genre', index: 3 },
  { id: 'mission', labelAr: 'الإطار', labelFr: 'Mission', index: 4 },
  { id: 'age', labelAr: 'العمر', labelFr: 'Âge', index: 5 },
  { id: 'membership', labelAr: 'الانخراط', labelFr: 'Adhésion', index: 6 },
  { id: 'ppr', labelAr: 'ر.التأجير', labelFr: 'N°PPR', index: 7 },
  { id: 'phone', labelAr: 'الهاتف', labelFr: 'Téléphone', index: 8 },
];

const OrbitalFilter = ({ selectedAcademy, selectedDirectorate, onSearch }: OrbitalFilterProps) => {
  const { lang } = useI18n();
  const playClick = useClickSound();
  const [openPopover, setOpenPopover] = useState<string | null>(null);

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

  const directorates = filters.academy
    ? ACADEMIES.find(a => a.label === filters.academy)?.directorates || []
    : [];

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

  const hasActiveFilter = (id: string): boolean => {
    switch (id) {
      case 'academy': return !!filters.academy;
      case 'directorate': return !!filters.directorate;
      case 'institution': return !!filters.institution;
      case 'gender': return filters.gender !== 'all';
      case 'mission': return !!filters.mission;
      case 'age': return !!filters.ageMin || !!filters.ageMax;
      case 'membership': return filters.membership !== 'all';
      case 'ppr': return !!filters.ppr;
      case 'phone': return !!filters.phone;
      default: return false;
    }
  };

  const getFilterSummary = (id: string): string => {
    switch (id) {
      case 'academy': return filters.academy ? (lang === 'ar' ? filters.academy.slice(0, 20) + '…' : filters.academy.slice(0, 20) + '…') : '';
      case 'directorate': return filters.directorate || '';
      case 'institution': return filters.institution;
      case 'gender':
        if (filters.gender === 'male') return lang === 'ar' ? 'ذكر' : 'M';
        if (filters.gender === 'female') return lang === 'ar' ? 'أنثى' : 'F';
        return '';
      case 'mission': return filters.mission ? (filters.mission.slice(0, 15) + '…') : '';
      case 'age':
        if (filters.ageMin && filters.ageMax) return `${filters.ageMin}-${filters.ageMax}`;
        if (filters.ageMin) return `>${filters.ageMin}`;
        if (filters.ageMax) return `<${filters.ageMax}`;
        return '';
      case 'membership':
        if (filters.membership === 'member') return lang === 'ar' ? 'منخرط' : 'Membre';
        if (filters.membership === 'non_member') return lang === 'ar' ? 'غير منخرط' : 'Non';
        if (filters.membership === 'pending') return lang === 'ar' ? 'قيد الانتظار' : 'En attente';
        return '';
      case 'ppr': return filters.ppr;
      case 'phone': return filters.phone;
      default: return '';
    }
  };

  // Container size
  const containerSize = 420;
  const center = containerSize / 2;
  const minRadius = 38;
  const ringSpacing = (center - minRadius - 10) / 9;

  const renderPopoverContent = (ring: FilterRing) => {
    switch (ring.id) {
      case 'academy':
        return (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {ACADEMIES.map(a => (
              <button
                key={a.label}
                onClick={() => { playClick(); setFilters(prev => ({ ...prev, academy: a.label, directorate: null })); setOpenPopover(null); }}
                className={`w-full text-start px-3 py-2 rounded-lg text-xs transition-colors ${filters.academy === a.label ? 'bg-[#0A4174] text-white' : 'hover:bg-accent'}`}
              >
                {a.label.replace('الأكاديمية الجهوية للتربية والتكوين لجهة ', '')}
              </button>
            ))}
          </div>
        );
      case 'directorate':
        return (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {directorates.length === 0 && <p className="text-xs text-muted-foreground p-2">{lang === 'ar' ? 'اختر أكاديمية أولاً' : 'Sélectionnez une académie'}</p>}
            {directorates.map(d => (
              <button
                key={d}
                onClick={() => { playClick(); setFilters(prev => ({ ...prev, directorate: d })); setOpenPopover(null); }}
                className={`w-full text-start px-3 py-2 rounded-lg text-xs transition-colors ${filters.directorate === d ? 'bg-[#0A4174] text-white' : 'hover:bg-accent'}`}
              >
                {d}
              </button>
            ))}
          </div>
        );
      case 'institution':
        return (
          <Input
            placeholder={lang === 'ar' ? 'اسم المؤسسة...' : 'Nom de l\'établissement...'}
            value={filters.institution}
            onChange={e => setFilters(prev => ({ ...prev, institution: e.target.value }))}
            className="text-xs"
          />
        );
      case 'gender':
        return (
          <div className="flex flex-col gap-1">
            {[
              { val: 'all' as const, ar: 'الكل', fr: 'Tous' },
              { val: 'male' as const, ar: 'ذكر', fr: 'Masculin' },
              { val: 'female' as const, ar: 'أنثى', fr: 'Féminin' },
            ].map(opt => (
              <button
                key={opt.val}
                onClick={() => { playClick(); setFilters(prev => ({ ...prev, gender: opt.val })); setOpenPopover(null); }}
                className={`px-3 py-2 rounded-lg text-xs transition-colors ${filters.gender === opt.val ? 'bg-[#0A4174] text-white' : 'hover:bg-accent'}`}
              >
                {lang === 'ar' ? opt.ar : opt.fr}
              </button>
            ))}
          </div>
        );
      case 'mission':
        return (
          <div className="max-h-48 overflow-y-auto space-y-1">
            <button
              onClick={() => { playClick(); setFilters(prev => ({ ...prev, mission: null })); setOpenPopover(null); }}
              className={`w-full text-start px-3 py-2 rounded-lg text-xs transition-colors ${!filters.mission ? 'bg-[#0A4174] text-white' : 'hover:bg-accent'}`}
            >
              {lang === 'ar' ? 'الكل' : 'Tous'}
            </button>
            {MISSIONS.map(m => (
              <button
                key={m}
                onClick={() => { playClick(); setFilters(prev => ({ ...prev, mission: m })); setOpenPopover(null); }}
                className={`w-full text-start px-3 py-2 rounded-lg text-xs transition-colors ${filters.mission === m ? 'bg-[#0A4174] text-white' : 'hover:bg-accent'}`}
              >
                {m}
              </button>
            ))}
          </div>
        );
      case 'age':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.ageMin}
              onChange={e => setFilters(prev => ({ ...prev, ageMin: e.target.value }))}
              className="text-xs w-20"
            />
            <span className="text-muted-foreground text-xs">—</span>
            <Input
              type="number"
              placeholder="Max"
              value={filters.ageMax}
              onChange={e => setFilters(prev => ({ ...prev, ageMax: e.target.value }))}
              className="text-xs w-20"
            />
          </div>
        );
      case 'membership':
        return (
          <div className="flex flex-col gap-1">
            {[
              { val: 'all' as const, ar: 'الكل', fr: 'Tous' },
              { val: 'member' as const, ar: 'منخرط', fr: 'Membre' },
              { val: 'non_member' as const, ar: 'غير منخرط', fr: 'Non membre' },
              { val: 'pending' as const, ar: 'قيد التحقق', fr: 'En attente' },
            ].map(opt => (
              <button
                key={opt.val}
                onClick={() => { playClick(); setFilters(prev => ({ ...prev, membership: opt.val })); setOpenPopover(null); }}
                className={`px-3 py-2 rounded-lg text-xs transition-colors ${filters.membership === opt.val ? 'bg-[#0A4174] text-white' : 'hover:bg-accent'}`}
              >
                {lang === 'ar' ? opt.ar : opt.fr}
              </button>
            ))}
          </div>
        );
      case 'ppr':
        return (
          <Input
            placeholder={lang === 'ar' ? 'رقم التأجير...' : 'N° PPR...'}
            value={filters.ppr}
            onChange={e => setFilters(prev => ({ ...prev, ppr: e.target.value }))}
            className="text-xs"
          />
        );
      case 'phone':
        return (
          <Input
            placeholder={lang === 'ar' ? 'رقم الهاتف...' : 'Téléphone...'}
            value={filters.phone}
            onChange={e => setFilters(prev => ({ ...prev, phone: e.target.value }))}
            className="text-xs"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 py-4">
      {/* Orbital rings */}
      <div className="relative" style={{ width: containerSize, height: containerSize }}>
        {/* Rings */}
        {FILTER_RINGS.map((ring, i) => {
          const radius = minRadius + (i + 1) * ringSpacing;
          const size = radius * 2;
          const active = hasActiveFilter(ring.id);
          const clockwise = i % 2 === 0;
          const duration = 30 + i * 8;

          return (
            <motion.div
              key={ring.id}
              className="absolute rounded-full"
              style={{
                width: size,
                height: size,
                top: center - radius,
                left: center - radius,
                border: `${active ? 2.5 : 1.5}px ${active ? 'solid' : 'dashed'} ${RING_COLORS[i]}`,
                opacity: active ? 1 : 0.5,
              }}
              animate={{ rotate: clockwise ? 360 : -360 }}
              transition={{ duration, repeat: Infinity, ease: 'linear' }}
            >
              {/* Filter node on the ring */}
              <Popover
                open={openPopover === ring.id}
                onOpenChange={(open) => {
                  if (open) playClick();
                  setOpenPopover(open ? ring.id : null);
                }}
              >
                <PopoverTrigger asChild>
                  <motion.button
                    className="absolute flex items-center justify-center rounded-full shadow-lg cursor-pointer z-10 select-none"
                    style={{
                      width: 36,
                      height: 36,
                      top: -18,
                      left: radius - 18,
                      backgroundColor: active ? RING_COLORS[i] : '#ffffff',
                      color: active ? '#ffffff' : RING_COLORS[i],
                      border: `2px solid ${RING_COLORS[i]}`,
                    }}
                    animate={{ rotate: clockwise ? -360 : 360 }}
                    transition={{ duration, repeat: Infinity, ease: 'linear' }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <span className="text-[8px] font-bold leading-none text-center whitespace-nowrap">
                      {lang === 'ar' ? ring.labelAr : ring.labelFr}
                    </span>
                  </motion.button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-64 p-3 z-50"
                  side="right"
                  align="center"
                  sideOffset={8}
                >
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-[#001D39]">
                      {lang === 'ar' ? ring.labelAr : ring.labelFr}
                    </h4>
                    {renderPopoverContent(ring)}
                    {active && (
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">
                        ✓ {getFilterSummary(ring.id)}
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </motion.div>
          );
        })}

        {/* Center hub */}
        <motion.div
          className="absolute rounded-full flex flex-col items-center justify-center shadow-xl cursor-pointer z-20"
          style={{
            width: minRadius * 2,
            height: minRadius * 2,
            top: center - minRadius,
            left: center - minRadius,
            background: 'linear-gradient(135deg, #0A4174, #001D39)',
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            playClick();
            setFilters(prev => ({ ...prev, mode: prev.mode === 'users' ? 'offices' : 'users' }));
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={filters.mode}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center"
            >
              {filters.mode === 'users' ? (
                <Users className="w-4 h-4 text-white mb-0.5" />
              ) : (
                <Building2 className="w-4 h-4 text-white mb-0.5" />
              )}
              <span className="text-[8px] text-white/90 font-medium">
                {filters.mode === 'users'
                  ? (lang === 'ar' ? 'المسجلون' : 'Inscrits')
                  : (lang === 'ar' ? 'المكاتب' : 'Bureaux')
                }
              </span>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="gap-1.5 text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {lang === 'ar' ? 'إعادة ضبط' : 'Réinitialiser'}
        </Button>
        <Button
          size="sm"
          onClick={() => { playClick(); onSearch(filters); }}
          className="gap-1.5 text-xs bg-[#0A4174] hover:bg-[#001D39]"
        >
          <Search className="w-3.5 h-3.5" />
          {lang === 'ar' ? 'بحث' : 'Rechercher'}
        </Button>
      </div>
    </div>
  );
};

export default OrbitalFilter;
