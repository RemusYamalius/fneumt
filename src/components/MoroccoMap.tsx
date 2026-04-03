import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { geoMercator, geoPath, geoCentroid } from 'd3-geo';
import { REGION_COLORS, getRegionMapping, type RegionMapping } from '@/lib/morocco-regions';
import { useI18n } from '@/lib/i18n';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

interface MoroccoMapProps {
  onRegionSelect: (region: RegionMapping | null) => void;
  selectedRegion: RegionMapping | null;
  regionStats?: Record<string, { total: number; members: number; requests: number }>;
  onProvinceSelect?: (provinceName: string | null) => void;
}

const WIDTH = 500;
const HEIGHT = 700;

const MoroccoMap = ({ onRegionSelect, selectedRegion, regionStats, onProvinceSelect }: MoroccoMapProps) => {
  const { lang, dir } = useI18n();
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [provincesData, setProvincesData] = useState<FeatureCollection | null>(null);
  const [view, setView] = useState<'country' | 'region'>('country');
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Load regions
  useEffect(() => {
    fetch('/geo/regions.geojson')
      .then(r => r.json())
      .then(setGeoData)
      .catch(console.error);
  }, []);

  // Lazy-load provinces on first region click
  useEffect(() => {
    if (view === 'region' && !provincesData) {
      fetch('/geo/provinces.geojson')
        .then(r => r.json())
        .then(setProvincesData)
        .catch(console.error);
    }
  }, [view, provincesData]);

  // Country-level projection
  const countryProjection = useMemo(() => {
    if (!geoData) return null;
    return geoMercator().fitSize([WIDTH, HEIGHT], geoData);
  }, [geoData]);

  const countryPath = useMemo(() => {
    if (!countryProjection) return null;
    return geoPath().projection(countryProjection);
  }, [countryProjection]);

  // Region-level projection (zoomed into selected region)
  const regionProjection = useMemo(() => {
    if (!selectedRegion || !geoData) return null;
    const feature = geoData.features.find(f => f.properties?.id === selectedRegion.geoId);
    if (!feature) return null;
    const fc: FeatureCollection = { type: 'FeatureCollection', features: [feature] };
    return geoMercator().fitSize([WIDTH, HEIGHT], fc);
  }, [selectedRegion, geoData]);

  const regionPath = useMemo(() => {
    if (!regionProjection) return null;
    return geoPath().projection(regionProjection);
  }, [regionProjection]);

  // Province features for selected region
  const provinceFeatures = useMemo(() => {
    if (!provincesData || !selectedRegion) return [];
    return provincesData.features.filter(
      f => f.properties?.region_id === selectedRegion.geoId
    );
  }, [provincesData, selectedRegion]);

  // Parse province name
  const parseProvinceName = useCallback((name: string) => {
    // Format: "Province de X إقليم ي" or "Préfecture de X عمالة ي"
    const parts = name.split(/\s{2,}|(?<=[\u0600-\u06FF])\s(?=[A-Z])|(?<=[a-zé])\s(?=[\u0600-\u06FF])/);
    if (parts.length >= 2) {
      return { fr: parts[0].trim(), ar: parts[1].trim() };
    }
    // Try splitting by known Arabic prefix
    const arMatch = name.match(/(عمالة|إقليم).+$/);
    const frMatch = name.match(/^(Province|Préfecture).+?(?=\s+(عمالة|إقليم))/);
    return {
      fr: frMatch ? frMatch[0].trim() : name,
      ar: arMatch ? arMatch[0].trim() : name,
    };
  }, []);

  const regionFeatures = useMemo(() => {
    if (!geoData) return [];
    return geoData.features.map((feature, i) => {
      const geoId = feature.properties?.id || '';
      const mapping = getRegionMapping(geoId);
      return { feature, mapping, index: i };
    });
  }, [geoData]);

  const handleRegionClick = useCallback((mapping: RegionMapping | undefined) => {
    if (!mapping) return;
    if (selectedRegion?.geoId === mapping.geoId) {
      // Already selected — drill down
      setView('region');
    } else {
      onRegionSelect(mapping);
      setView('region');
    }
  }, [selectedRegion, onRegionSelect]);

  const handleBack = useCallback(() => {
    setView('country');
    setHoveredProvince(null);
    onProvinceSelect?.(null);
  }, [onProvinceSelect]);

  const handleProvinceClick = useCallback((provinceName: string) => {
    onProvinceSelect?.(provinceName);
  }, [onProvinceSelect]);

  if (!geoData || !countryPath || !countryProjection) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <AnimatePresence mode="wait">
        {view === 'country' ? (
          /* ─── COUNTRY VIEW ─── */
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
              className="w-full h-full max-h-[600px]"
              style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.15))' }}
            >
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
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

                return (
                  <g key={geoId || index}>
                    <motion.path
                      d={d}
                      fill={isSelected ? '#0A4174' : isHovered ? '#49769F' : baseColor}
                      stroke={isSelected ? '#7BBDE8' : '#BDD8E9'}
                      strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 0.8}
                      className="cursor-pointer"
                      style={{ filter: isSelected ? 'url(#glow)' : 'none' }}
                      initial={false}
                      animate={{ opacity: selectedRegion && !isSelected ? 0.45 : 1 }}
                      transition={{ duration: 0.3 }}
                      onMouseEnter={() => setHoveredRegion(geoId)}
                      onMouseLeave={() => setHoveredRegion(null)}
                      onClick={() => handleRegionClick(mapping)}
                    />
                    {mapping && center && (!selectedRegion || isSelected) && (
                      <text
                        x={center[0]}
                        y={center[1]}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="pointer-events-none select-none"
                        fill="white"
                        fontSize={isSelected ? 11 : 8}
                        fontWeight={isSelected ? 700 : 500}
                        opacity={isHovered || isSelected ? 1 : 0.85}
                      >
                        {lang === 'ar'
                          ? mapping.nameAr.split(' – ')[0]
                          : mapping.nameFr.split('-')[0]}
                      </text>
                    )}
                    {isHovered && stats && !isSelected && center && (
                      <g>
                        <rect
                          x={center[0] - 50} y={center[1] + 14}
                          width={100} height={36} rx={8}
                          fill="hsl(225, 50%, 12%)" fillOpacity={0.92}
                          stroke="hsl(225, 60%, 45%)" strokeWidth={0.5}
                        />
                        <text x={center[0]} y={center[1] + 28} textAnchor="middle" fill="hsl(225, 80%, 80%)" fontSize={8}>
                          {lang === 'ar' ? `${stats.total} مسجل` : `${stats.total} inscrits`}
                        </text>
                        <text x={center[0]} y={center[1] + 42} textAnchor="middle" fill="hsl(140, 60%, 65%)" fontSize={7.5}>
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
          /* ─── REGION DRILL-DOWN VIEW ─── */
          <motion.div
            key="region"
            className="w-full h-full flex flex-col"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Back button + Region name */}
            <div className="flex items-center gap-2 mb-2 px-1">
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A4174] hover:bg-[#001D39] text-white transition-all text-xs font-medium shadow-md"
              >
                <BackIcon className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'رجوع' : 'Retour'}
              </button>
              <span className="text-sm font-bold text-[#001D39]">
                {selectedRegion && (lang === 'ar' ? selectedRegion.nameAr : selectedRegion.nameFr)}
              </span>
            </div>

            {/* Zoomed region SVG with provinces */}
            <div className="flex-1 relative">
              {(!provincesData || !regionProjection || !regionPath) ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <svg
                  viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                  className="w-full h-full max-h-[540px]"
                  style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.15))' }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                  }}
                >
                  <defs>
                    <filter id="province-glow">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Region outline (background) */}
                  {geoData.features
                    .filter(f => f.properties?.id === selectedRegion?.geoId)
                    .map(f => (
                      <path
                        key="region-bg"
                        d={regionPath(f as Feature<Geometry>) || ''}
                        fill="hsl(225, 40%, 15%)"
                        stroke="hsl(225, 60%, 40%)"
                        strokeWidth={2}
                      />
                    ))
                  }

                  {/* Province boundaries */}
                  {provinceFeatures.map((feature, i) => {
                    const name = feature.properties?.name || '';
                    const isHovered = hoveredProvince === name;
                    const provinceColor = REGION_COLORS[i % REGION_COLORS.length];
                    const d = regionPath(feature as Feature<Geometry>) || '';
                    const centroid = geoCentroid(feature as Feature<Geometry>);
                    const center = regionProjection(centroid);

                    return (
                      <g key={name || i}>
                        <motion.path
                          d={d}
                          fill={isHovered ? 'hsl(225, 75%, 55%)' : provinceColor}
                          stroke="hsl(225, 50%, 75%)"
                          strokeWidth={isHovered ? 2 : 0.8}
                          className="cursor-pointer"
                          style={{ filter: isHovered ? 'url(#province-glow)' : 'none' }}
                          initial={{ opacity: 0, pathLength: 0 }}
                          animate={{ opacity: 1, pathLength: 1 }}
                          transition={{ duration: 0.5, delay: i * 0.03 }}
                          onMouseEnter={() => setHoveredProvince(name)}
                          onMouseLeave={() => setHoveredProvince(null)}
                          onClick={() => {
                            const parsed = parseProvinceName(name);
                            handleProvinceClick(parsed.fr);
                          }}
                        />
                        {/* Province label */}
                        {center && (
                          <text
                            x={center[0]}
                            y={center[1]}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="pointer-events-none select-none"
                            fill="white"
                            fontSize={isHovered ? 10 : 7}
                            fontWeight={isHovered ? 700 : 400}
                            opacity={isHovered ? 1 : 0.7}
                          >
                            {(() => {
                              const parsed = parseProvinceName(name);
                              const label = lang === 'ar' ? parsed.ar : parsed.fr;
                              return label.length > 18 ? label.slice(0, 16) + '…' : label;
                            })()}
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
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute pointer-events-none z-20 px-3 py-2 rounded-xl bg-popover/95 backdrop-blur-md border border-border shadow-xl"
                    style={{
                      left: Math.min(tooltipPos.x + 12, WIDTH - 180),
                      top: tooltipPos.y - 40,
                    }}
                  >
                    <p className="text-xs font-bold text-foreground">
                      {(() => {
                        const parsed = parseProvinceName(hoveredProvince);
                        return lang === 'ar' ? parsed.ar : parsed.fr;
                      })()}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {lang === 'ar' ? 'انقر لعرض الإحصائيات' : 'Cliquez pour voir les stats'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected region info overlay (country view only) */}
      <AnimatePresence>
        {view === 'country' && selectedRegion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
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
};

export default MoroccoMap;
