import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOROCCO_REGIONS, REGION_COLORS, type RegionData } from '@/lib/morocco-regions';
import { useI18n } from '@/lib/i18n';

interface MoroccoMapProps {
  onRegionSelect: (region: RegionData | null) => void;
  selectedRegion: RegionData | null;
  regionStats?: Record<string, { total: number; members: number; requests: number }>;
}

const MoroccoMap = ({ onRegionSelect, selectedRegion, regionStats }: MoroccoMapProps) => {
  const { lang } = useI18n();
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const viewBox = '0 0 450 720';

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox={viewBox}
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
          <linearGradient id="mapBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(225, 40%, 15%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(225, 60%, 10%)" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {MOROCCO_REGIONS.map((region, i) => {
          const isHovered = hoveredRegion === region.id;
          const isSelected = selectedRegion?.id === region.id;
          const baseColor = REGION_COLORS[i % REGION_COLORS.length];
          const stats = regionStats?.[region.academyLabel];

          return (
            <g key={region.id}>
              <motion.path
                d={region.path}
                fill={isSelected ? 'hsl(225, 80%, 55%)' : isHovered ? 'hsl(225, 70%, 50%)' : baseColor}
                stroke={isSelected ? 'hsl(225, 90%, 70%)' : 'hsl(225, 30%, 75%)'}
                strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
                className="cursor-pointer transition-colors duration-200"
                style={{
                  filter: isSelected ? 'url(#glow)' : 'none',
                }}
                initial={false}
                animate={{
                  scale: isSelected ? 1.02 : 1,
                  opacity: selectedRegion && !isSelected ? 0.5 : 1,
                }}
                transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
                onMouseEnter={() => setHoveredRegion(region.id)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => onRegionSelect(isSelected ? null : region)}
              />
              {/* Region label */}
              {(!selectedRegion || isSelected) && (
                <text
                  x={region.center[0]}
                  y={region.center[1]}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none select-none"
                  fill="white"
                  fontSize={isSelected ? 10 : 8}
                  fontWeight={isSelected ? 700 : 500}
                  opacity={isHovered || isSelected ? 1 : 0.8}
                >
                  {lang === 'ar' ? region.nameAr.split(' – ')[0].split(' ').slice(-1)[0] : region.nameFr.split('-')[0]}
                </text>
              )}
              {/* Stats bubble on hover */}
              {isHovered && stats && !isSelected && (
                <g>
                  <rect
                    x={region.center[0] - 45}
                    y={region.center[1] + 12}
                    width={90}
                    height={32}
                    rx={6}
                    fill="hsl(225, 50%, 15%)"
                    fillOpacity={0.9}
                    stroke="hsl(225, 60%, 45%)"
                    strokeWidth={0.5}
                  />
                  <text
                    x={region.center[0]}
                    y={region.center[1] + 24}
                    textAnchor="middle"
                    fill="hsl(225, 80%, 80%)"
                    fontSize={7}
                  >
                    {lang === 'ar' ? `${stats.total} مسجل` : `${stats.total} inscrits`}
                  </text>
                  <text
                    x={region.center[0]}
                    y={region.center[1] + 36}
                    textAnchor="middle"
                    fill="hsl(140, 60%, 65%)"
                    fontSize={6.5}
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
