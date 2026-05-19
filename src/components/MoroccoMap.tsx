import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { geoMercator, geoPath, geoCentroid } from 'd3-geo';
import { REGION_COLORS, getRegionMapping, type RegionMapping } from '@/lib/morocco-regions';
import { useI18n } from '@/lib/i18n';
import { useClickSound } from '@/hooks/useClickSound';
import { ArrowRight, ArrowLeft, Users, UserCheck, FileText, TrendingUp, Maximize2, Minimize2 } from 'lucide-react';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

interface RegionStatsData {
  total: number;
  members: number;
  requests: number;
  directorates?: Record<string, { total: number; members: number; requests: number }>;
}

interface MoroccoMapProps {
  onRegionSelect: (region: RegionMapping | null) => void;
  selectedRegion: RegionMapping | null;
  regionStats?: Record<string, RegionStatsData>;
  onProvinceSelect?: (provinceName: string | null) => void;
  onProvinceNameChange?: (name: string | null) => void;
}

const WIDTH = 500;
const HEIGHT = 700;

// ─── Luminance helper ───────────────────────────────────
function hexToLuminance(hex: string): number {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const srgb = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function getContrastColor(bgColor: string): string {
  try {
    return hexToLuminance(bgColor) > 0.35 ? '#0A1929' : '#FFFFFF';
  } catch {
    return '#FFFFFF';
  }
}

// ─── Stat Panel ─────────────────────────────────────────
const StatPanel = ({ title, items, position, large }: {
  title: string;
  items: { label: string; value: number | string; color: string; icon?: React.ReactNode }[];
  position: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  large?: boolean;
}) => {
  const posMap = {
    'left-top': 'top-3 left-3',
    'left-bottom': 'bottom-3 left-3',
    'right-top': 'top-3 right-3',
    'right-bottom': 'bottom-3 right-3',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`hidden md:block absolute ${posMap[position]} z-10 ${large ? 'min-w-[170px] max-w-[220px]' : 'min-w-[120px] max-w-[160px]'}`}
    >
      <div className={`rounded-xl bg-[#001D39]/90 backdrop-blur-md border border-[#49769F]/50 shadow-[0_4px_20px_rgba(0,29,57,0.4)] ${large ? 'p-4' : 'p-3'}`}>
        <h4 className={`${large ? 'text-xs' : 'text-[10px]'} font-bold text-[#7BBDE8] uppercase tracking-wider mb-2 border-b border-[#49769F]/30 pb-1.5`}>
          {title}
        </h4>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              {item.icon && (
                <div className={`${large ? 'w-6 h-6' : 'w-5 h-5'} rounded-md flex items-center justify-center`} style={{ backgroundColor: `${item.color}22` }}>
                  {item.icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`${large ? 'text-[10px]' : 'text-[9px]'} text-[#6EA2B3] truncate`}>{item.label}</p>
                <p className={`${large ? 'text-base' : 'text-sm'} font-bold`} style={{ color: item.color }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Progress Bar ───────────────────────────────────────
const MiniProgress = ({ value, max, color }: { value: number; max: number; color: string }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-full h-1.5 rounded-full bg-[#49769F]/20 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
};

const MoroccoMap = ({ onRegionSelect, selectedRegion, regionStats, onProvinceSelect, onProvinceNameChange }: MoroccoMapProps) => {
  const { lang, dir } = useI18n();
  const playClick = useClickSound();
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [provincesData, setProvincesData] = useState<FeatureCollection | null>(null);
  const [view, setView] = useState<'country' | 'region'>('country');
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetch('/geo/regions.geojson').then(r => r.json()).then(setGeoData).catch(console.error);
  }, []);

  useEffect(() => {
    if (view === 'region' && !provincesData) {
      fetch('/geo/provinces.geojson').then(r => r.json()).then(setProvincesData).catch(console.error);
    }
  }, [view, provincesData]);

  useEffect(() => {
    if (!selectedRegion) {
      setView('country');
      setSelectedProvince(null);
      setHoveredProvince(null);
    }
  }, [selectedRegion]);

  const countryProjection = useMemo(() => {
    if (!geoData) return null;
    return geoMercator().fitSize([WIDTH, HEIGHT], geoData);
  }, [geoData]);

  const countryPath = useMemo(() => countryProjection ? geoPath().projection(countryProjection) : null, [countryProjection]);

  const regionProjection = useMemo(() => {
    if (!selectedRegion || !geoData) return null;
    const feature = geoData.features.find(f => f.properties?.id === selectedRegion.geoId);
    if (!feature) return null;
    return geoMercator().fitSize([WIDTH, HEIGHT], { type: 'FeatureCollection', features: [feature] } as FeatureCollection);
  }, [selectedRegion, geoData]);

  const regionPath = useMemo(() => regionProjection ? geoPath().projection(regionProjection) : null, [regionProjection]);

  const provinceFeatures = useMemo(() => {
    if (!provincesData || !selectedRegion) return [];
    return provincesData.features.filter(f => f.properties?.region_id === selectedRegion.geoId);
  }, [provincesData, selectedRegion]);

  const parseProvinceName = useCallback((name: string) => {
    const arMatch = name.match(/(عمالة|إقليم).+$/);
    const frMatch = name.match(/^(Province|Préfecture).+?(?=\s+(عمالة|إقليم))/);
    return {
      fr: frMatch ? frMatch[0].trim() : name,
      ar: arMatch ? arMatch[0].trim() : name,
    };
  }, []);

  const regionFeatures = useMemo(() => {
    if (!geoData) return [];
    return geoData.features.map((feature, i) => ({
      feature,
      mapping: getRegionMapping(feature.properties?.id || ''),
      index: i,
    }));
  }, [geoData]);

  const currentStats = useMemo(() => {
    if (!selectedRegion || !regionStats) return null;
    const regionData = regionStats[selectedRegion.academyLabel];
    if (!regionData) return null;

    // If a province is selected, try to find its directorate-level stats
    if (selectedProvince && regionData.directorates) {
      // Match province display name against directorate names
      for (const [dirName, dirStats] of Object.entries(regionData.directorates)) {
        if (selectedProvince.includes(dirName) || dirName.includes(selectedProvince) ||
            selectedProvince.replace(/(عمالة|إقليم|Province|Préfecture)\s*/g, '').trim() === dirName ||
            dirName.includes(selectedProvince.replace(/(عمالة|إقليم|Province|Préfecture)\s*/g, '').trim())) {
          return dirStats;
        }
      }
    }
    return regionData;
  }, [selectedRegion, regionStats, selectedProvince]);

  const handleRegionClick = useCallback((mapping: RegionMapping | undefined) => {
    if (!mapping) return;
    onRegionSelect(mapping);
    setView('region');
    setSelectedProvince(null);
    onProvinceNameChange?.(null);
  }, [onRegionSelect, onProvinceNameChange]);

  const handleBack = useCallback(() => {
    setView('country');
    setHoveredProvince(null);
    setSelectedProvince(null);
    onRegionSelect(null);
    onProvinceSelect?.(null);
    onProvinceNameChange?.(null);
  }, [onRegionSelect, onProvinceSelect, onProvinceNameChange]);

  const handleProvinceClick = useCallback((rawName: string) => {
    const parsed = parseProvinceName(rawName);
    const displayName = lang === 'ar' ? parsed.ar : parsed.fr;
    setSelectedProvince(displayName);
    // Always pass FR name for data matching, but display name for UI
    onProvinceSelect?.(parsed.fr);
    onProvinceNameChange?.(displayName);
  }, [onProvinceSelect, onProvinceNameChange, parseProvinceName, lang]);

  const toggleFullscreen = useCallback(() => {
    playClick();
    setIsFullscreen(prev => !prev);
  }, [playClick]);

  if (!geoData || !countryPath || !countryProjection) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const isLarge = isFullscreen;

  const mapContent = (
    <div
      className="relative w-full h-full flex items-center justify-center"
      style={{
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
        isolation: 'isolate',
        position: 'relative',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* Fullscreen toggle button — top-left to avoid overlapping back button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-2 left-2 z-20 p-2 rounded-xl bg-[#001D39]/80 hover:bg-[#001D39] text-white border border-[#49769F]/50 shadow-lg transition-all backdrop-blur-sm"
        title={isFullscreen ? (lang === 'ar' ? 'تصغير' : 'Réduire') : (lang === 'ar' ? 'تكبير' : 'Agrandir')}
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      <AnimatePresence mode="wait">
        {view === 'country' ? (
          <motion.div
            key="country"
            className="w-full h-full flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className={`w-full h-full ${isFullscreen ? 'max-h-[90vh]' : 'max-h-[600px]'}`}
              style={{ display: 'block', overflow: 'hidden', filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.15))' }}
            >
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              {regionFeatures.map(({ feature, mapping, index }) => {
                const geoId = feature.properties?.id || '';
                const isHovered = hoveredRegion === geoId;
                const isSelected = selectedRegion?.geoId === geoId;
                const baseColor = REGION_COLORS[index % REGION_COLORS.length];
                const stats = mapping ? regionStats?.[mapping.academyLabel] : undefined;
                const d = countryPath(feature as Feature<Geometry>) || '';
                const centroid = geoCentroid(feature as Feature<Geometry>);
                const center = countryProjection(centroid);
                const fillColor = isSelected ? '#0A4174' : isHovered ? '#49769F' : baseColor;
                const textColor = getContrastColor(fillColor);

                return (
                  <g key={geoId || index}>
                    <motion.path
                      d={d}
                      fill={fillColor}
                      stroke={isSelected ? '#7BBDE8' : '#BDD8E9'}
                      strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 0.8}
                      className="cursor-pointer"
                      style={{ filter: isSelected ? 'url(#glow)' : 'none' }}
                      initial={false}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      onMouseEnter={() => setHoveredRegion(geoId)}
                      onMouseLeave={() => setHoveredRegion(null)}
                      onClick={() => handleRegionClick(mapping)}
                    />
                    {mapping && center && (
                      <text
                        x={center[0]} y={center[1]}
                        textAnchor="middle" dominantBaseline="middle"
                        className="pointer-events-none select-none"
                        fill={textColor}
                        fontSize={isSelected ? 11 : 8} fontWeight={isSelected ? 700 : 500}
                        opacity={isHovered || isSelected ? 1 : 0.9}
                        style={{
                          textShadow: `0 0 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)`,
                          paintOrder: 'stroke',
                          stroke: hexToLuminance(fillColor) > 0.35 ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
                          strokeWidth: 0.5,
                        }}
                      >
                        {lang === 'ar' ? mapping.nameAr.split(' – ')[0] : mapping.nameFr.split('-')[0]}
                      </text>
                    )}
                    {isHovered && stats && !isSelected && center && (
                      <g>
                        <rect x={center[0] - 50} y={center[1] + 14} width={100} height={36} rx={8}
                          fill="#001D39" fillOpacity={0.92} stroke="#49769F" strokeWidth={0.5} />
                        <text x={center[0]} y={center[1] + 28} textAnchor="middle" fill="#7BBDE8" fontSize={8}>
                          {lang === 'ar' ? `${stats.total} مسجل` : `${stats.total} inscrits`}
                        </text>
                        <text x={center[0]} y={center[1] + 42} textAnchor="middle" fill="#6EA2B3" fontSize={7.5}>
                          {lang === 'ar' ? `${stats.members} منخرط` : `${stats.members} adhérents`}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </motion.div>
        ) : (
          <motion.div
            key="region"
            className="w-full h-full flex flex-col"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Back + Region / Province name */}
            <div className="flex items-center gap-2 mb-2 px-1 flex-wrap">
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A4174] hover:bg-[#001D39] text-white transition-all text-xs font-medium shadow-md"
              >
                <BackIcon className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'رجوع' : 'Retour'}
              </button>
              <div className="flex items-center gap-1.5 text-sm">
                <span className="font-bold text-[#001D39]">
                  {selectedRegion && (lang === 'ar' ? selectedRegion.nameAr : selectedRegion.nameFr)}
                </span>
                <AnimatePresence>
                  {selectedProvince && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="flex items-center gap-1 text-[#0A4174] font-semibold"
                    >
                      <span className="text-[#49769F]">›</span>
                      {selectedProvince}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Zoomed region SVG */}
            <div className="flex-1 relative">
              {(!provincesData || !regionProjection || !regionPath) ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <svg
                  viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                  className={`w-full h-full ${isFullscreen ? 'max-h-[80vh]' : 'max-h-[540px]'}`}
                  style={{ display: 'block', overflow: 'hidden', filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.15))' }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                  }}
                >
                  <defs>
                    <filter id="province-glow">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>

                  {geoData.features
                    .filter(f => f.properties?.id === selectedRegion?.geoId)
                    .map(f => (
                      <path key="region-bg" d={regionPath(f as Feature<Geometry>) || ''} fill="#BDD8E9" stroke="#0A4174" strokeWidth={2} />
                    ))}

                  {provinceFeatures.map((feature, i) => {
                    const name = feature.properties?.name || '';
                    const isHovered = hoveredProvince === name;
                    const parsed = parseProvinceName(name);
                    const displayName = lang === 'ar' ? parsed.ar : parsed.fr;
                    const isSelected = selectedProvince === displayName;
                    const baseProvinceColor = REGION_COLORS[i % REGION_COLORS.length];
                    const provinceColor = isSelected ? '#0A4174' : baseProvinceColor;
                    const d = regionPath(feature as Feature<Geometry>) || '';
                    const centroid = geoCentroid(feature as Feature<Geometry>);
                    const center = regionProjection(centroid);
                    const fillColor = isHovered ? '#0A4174' : provinceColor;
                    const textColor = getContrastColor(fillColor);

                    return (
                      <g key={name || i}>
                        <motion.path
                          d={d}
                          fill={fillColor}
                          stroke={isSelected ? '#7BBDE8' : '#BDD8E9'}
                          strokeWidth={isHovered || isSelected ? 2 : 0.8}
                          className="cursor-pointer"
                          style={{ filter: isHovered || isSelected ? 'url(#province-glow)' : 'none' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5, delay: i * 0.03 }}
                          onMouseEnter={() => setHoveredProvince(name)}
                          onMouseLeave={() => setHoveredProvince(null)}
                          onClick={() => handleProvinceClick(name)}
                        />
                        {center && (
                          <text
                            x={center[0]} y={center[1]}
                            textAnchor="middle" dominantBaseline="middle"
                            className="pointer-events-none select-none"
                            fill={textColor}
                            fontSize={isHovered || isSelected ? 10 : 7}
                            fontWeight={isHovered || isSelected ? 700 : 400}
                            opacity={isHovered || isSelected ? 1 : 0.85}
                            style={{
                              textShadow: `0 0 3px rgba(0,0,0,0.3)`,
                              paintOrder: 'stroke',
                              stroke: hexToLuminance(fillColor) > 0.35 ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                              strokeWidth: 0.4,
                            }}
                          >
                            {displayName.length > 18 ? displayName.slice(0, 16) + '…' : displayName}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              )}

              {/* Floating tooltip */}
              <AnimatePresence>
                {hoveredProvince && tooltipPos && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                    className="absolute pointer-events-none z-20 px-3 py-2 rounded-xl bg-popover/95 backdrop-blur-md border border-border shadow-xl"
                    style={{ left: Math.min(tooltipPos.x + 12, WIDTH - 180), top: tooltipPos.y - 40 }}
                  >
                    <p className="text-xs font-bold text-foreground">
                      {(() => { const p = parseProvinceName(hoveredProvince); return lang === 'ar' ? p.ar : p.fr; })()}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {lang === 'ar' ? 'انقر للتحديد' : 'Cliquez pour sélectionner'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ─── Stat Side Panels ─── */}
              <AnimatePresence>
                {currentStats && view === 'region' && (
                  <>
                    <StatPanel
                      position="left-top"
                      large={isLarge}
                      title={lang === 'ar' ? 'ملخص' : 'Résumé'}
                      items={[
                        {
                          label: lang === 'ar' ? 'إجمالي المسجلين' : 'Total inscrits',
                          value: currentStats.total,
                          color: '#7BBDE8',
                          icon: <Users className={`${isLarge ? 'w-4 h-4' : 'w-3 h-3'} text-[#7BBDE8]`} />,
                        },
                        {
                          label: lang === 'ar' ? 'الطلبات' : 'Demandes',
                          value: currentStats.requests,
                          color: '#F39C12',
                          icon: <FileText className={`${isLarge ? 'w-4 h-4' : 'w-3 h-3'} text-[#F39C12]`} />,
                        },
                      ]}
                    />
                    <StatPanel
                      position="left-bottom"
                      large={isLarge}
                      title={lang === 'ar' ? 'الانخراط' : 'Adhésion'}
                      items={[
                        {
                          label: lang === 'ar' ? 'منخرطون' : 'Membres',
                          value: currentStats.members,
                          color: '#2ECC71',
                          icon: <UserCheck className={`${isLarge ? 'w-4 h-4' : 'w-3 h-3'} text-[#2ECC71]`} />,
                        },
                        {
                          label: lang === 'ar' ? 'غير منخرطين' : 'Non-membres',
                          value: currentStats.total - currentStats.members,
                          color: '#E74C3C',
                          icon: <Users className={`${isLarge ? 'w-4 h-4' : 'w-3 h-3'} text-[#E74C3C]`} />,
                        },
                      ]}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      className={`hidden md:block absolute top-3 right-3 z-10 ${isLarge ? 'min-w-[170px] max-w-[220px]' : 'min-w-[120px] max-w-[160px]'}`}
                    >
                      <div className={`rounded-xl bg-[#001D39]/90 backdrop-blur-md border border-[#49769F]/50 shadow-[0_4px_20px_rgba(0,29,57,0.4)] ${isLarge ? 'p-4' : 'p-3'}`}>
                        <h4 className={`${isLarge ? 'text-xs' : 'text-[10px]'} font-bold text-[#7BBDE8] uppercase tracking-wider mb-2 border-b border-[#49769F]/30 pb-1.5 flex items-center gap-1`}>
                          <TrendingUp className="w-3 h-3" />
                          {lang === 'ar' ? 'النسب' : 'Ratios'}
                        </h4>
                        <div className="space-y-2.5">
                          <div>
                            <div className={`flex justify-between ${isLarge ? 'text-[10px]' : 'text-[9px]'} mb-1`}>
                              <span className="text-[#6EA2B3]">{lang === 'ar' ? 'نسبة الانخراط' : 'Taux adhésion'}</span>
                              <span className="text-[#2ECC71] font-bold">
                                {currentStats.total > 0 ? Math.round((currentStats.members / currentStats.total) * 100) : 0}%
                              </span>
                            </div>
                            <MiniProgress value={currentStats.members} max={currentStats.total} color="#2ECC71" />
                          </div>
                          <div>
                            <div className={`flex justify-between ${isLarge ? 'text-[10px]' : 'text-[9px]'} mb-1`}>
                              <span className="text-[#6EA2B3]">{lang === 'ar' ? 'الطلبات/مسجل' : 'Dem./inscrit'}</span>
                              <span className="text-[#F39C12] font-bold">
                                {currentStats.total > 0 ? (currentStats.requests / currentStats.total).toFixed(1) : '0'}
                              </span>
                            </div>
                            <MiniProgress value={currentStats.requests} max={currentStats.total} color="#F39C12" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected region info overlay (country view) */}
      <AnimatePresence>
        {view === 'country' && selectedRegion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-4 right-4 bg-card/90 backdrop-blur-xl border border-primary/20 rounded-2xl p-4 shadow-2xl"
          >
            <p className="text-xs text-muted-foreground text-center">
              {lang === 'ar' ? 'انقر مرة أخرى للغوص في الجهة' : 'Cliquez à nouveau pour explorer la région'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Fullscreen mode — render BEFORE returning plain mapContent
  if (isFullscreen) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 bg-[#BDD8E9] flex items-center justify-center p-4"
        >
          <div className="w-full h-full max-w-[1400px] relative">
            {mapContent}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return mapContent;
};

export default MoroccoMap;
