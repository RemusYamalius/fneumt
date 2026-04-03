import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { geoMercator, geoPath, geoCentroid } from 'd3-geo';
import { REGION_MAPPINGS, REGION_COLORS, getRegionMapping, type RegionMapping } from '@/lib/morocco-regions';
import { useI18n } from '@/lib/i18n';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

interface MoroccoMapProps {
  onRegionSelect: (region: RegionMapping | null) => void;
  selectedRegion: RegionMapping | null;
  regionStats?: Record<string, { total: number; members: number; requests: number }>;
}

const MoroccoMap = ({ onRegionSelect, selectedRegion, regionStats }: MoroccoMapProps) => {
  const { lang } = useI18n();
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    fetch('/geo/regions.geojson')
      .then(r => r.json())
      .then(data => setGeoData(data))
      .catch(console.error);
  }, []);

  const width = 500;
  const height = 700;

  const projection = useMemo(() => {
    if (!geoData) return null;
    return geoMercator().fitSize([width, height], geoData);
  }, [geoData]);

  const pathGenerator = useMemo(() => {
    if (!projection) return null;
    return geoPath().projection(projection);
  }, [projection]);

  const regionFeatures = useMemo(() => {
    if (!geoData) return [];
    return geoData.features.map((feature, i) => {
      const geoId = feature.properties?.id || '';
      const mapping = getRegionMapping(geoId);
      return { feature, mapping, index: i };
    });
  }, [geoData]);

  const handleClick = useCallback((mapping: RegionMapping | undefined) => {
    if (!mapping) return;
    onRegionSelect(selectedRegion?.geoId === mapping.geoId ? null : mapping);
  }, [selectedRegion, onRegionSelect]);

  if (!geoData || !pathGenerator || !projection) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox={`0 0 ${width} ${height}`}
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
          const d = pathGenerator(feature as Feature<Geometry>) || '';
          const centroid = projection ? geoCentroid(feature as Feature<Geometry>) : null;
          const center = centroid ? projection(centroid) : null;

          return (
            <g key={geoId || index}>
              <motion.path
                d={d}
                fill={isSelected ? 'hsl(225, 80%, 55%)' : isHovered ? 'hsl(225, 70%, 50%)' : baseColor}
                stroke={isSelected ? 'hsl(225, 90%, 70%)' : 'hsl(225, 30%, 85%)'}
                strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 0.8}
                className="cursor-pointer"
                style={{ filter: isSelected ? 'url(#glow)' : 'none' }}
                initial={false}
                animate={{
                  opacity: selectedRegion && !isSelected ? 0.45 : 1,
                }}
                transition={{ duration: 0.3 }}
                onMouseEnter={() => setHoveredRegion(geoId)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => handleClick(mapping)}
              />
              {/* Region label */}
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
              {/* Stats bubble on hover */}
              {isHovered && stats && !isSelected && center && (
                <g>
                  <rect
                    x={center[0] - 50}
                    y={center[1] + 14}
                    width={100}
                    height={36}
                    rx={8}
                    fill="hsl(225, 50%, 12%)"
                    fillOpacity={0.92}
                    stroke="hsl(225, 60%, 45%)"
                    strokeWidth={0.5}
                  />
                  <text
                    x={center[0]}
                    y={center[1] + 28}
                    textAnchor="middle"
                    fill="hsl(225, 80%, 80%)"
                    fontSize={8}
                  >
                    {lang === 'ar' ? `${stats.total} مسجل` : `${stats.total} inscrits`}
                  </text>
                  <text
                    x={center[0]}
                    y={center[1] + 42}
                    textAnchor="middle"
                    fill="hsl(140, 60%, 65%)"
                    fontSize={7.5}
                  >
                    {lang === 'ar' ? `${stats.members} منخرط` : `${stats.members} adhérents`}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Selected region info overlay */}
      <AnimatePresence>
        {selectedRegion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-4 right-4 bg-card/90 backdrop-blur-xl border border-primary/20 rounded-2xl p-4 shadow-2xl"
          >
            <h3 className="text-sm font-bold text-primary mb-1">
              {lang === 'ar' ? selectedRegion.nameAr : selectedRegion.nameFr}
            </h3>
            {regionStats?.[selectedRegion.academyLabel] && (
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{regionStats[selectedRegion.academyLabel].total} {lang === 'ar' ? 'مسجل' : 'inscrits'}</span>
                <span>{regionStats[selectedRegion.academyLabel].members} {lang === 'ar' ? 'منخرط' : 'adhérents'}</span>
                <span>{regionStats[selectedRegion.academyLabel].requests} {lang === 'ar' ? 'طلب' : 'demandes'}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoroccoMap;
