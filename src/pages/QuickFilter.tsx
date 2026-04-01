import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Map, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import MoroccoMap from '@/components/MoroccoMap';
import OrbitalStats, { buildRegionStats } from '@/components/OrbitalStats';
import { MOROCCO_REGIONS, type RegionData } from '@/lib/morocco-regions';
import { ACADEMIES } from '@/lib/academies-data';
import { Button } from '@/components/ui/button';

const QuickFilter = () => {
  const { t, dir, lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const [selectedDirectorate, setSelectedDirectorate] = useState<string | null>(null);

  // Fetch all profiles for stats
  const { data: profiles } = useQuery({
    queryKey: ['quick-filter-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('academy, directorate, is_member, membership_verified, mission');
      return data || [];
    },
    staleTime: 60_000,
  });

  // Fetch all requests for stats
  const { data: requests } = useQuery({
    queryKey: ['quick-filter-requests'],
    queryFn: async () => {
      const { data } = await supabase.from('requests').select('id, status, user_id');
      return data || [];
    },
    staleTime: 60_000,
  });

  // Fetch user profiles with academies for request mapping
  const { data: userProfileMap } = useQuery({
    queryKey: ['quick-filter-user-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, academy, directorate');
      const map: Record<string, { academy: string | null; directorate: string | null }> = {};
      data?.forEach(p => { map[p.user_id] = { academy: p.academy, directorate: p.directorate }; });
      return map;
    },
    staleTime: 60_000,
  });

  // Fetch local offices
  const { data: offices } = useQuery({
    queryKey: ['quick-filter-offices'],
    queryFn: async () => {
      const { data } = await supabase.from('local_offices').select('id, academy, directorate');
      return data || [];
    },
    staleTime: 60_000,
  });

  // Build per-academy stats for map
  const regionStats = useMemo(() => {
    if (!profiles || !requests || !userProfileMap) return {};
    const stats: Record<string, { total: number; members: number; requests: number }> = {};

    ACADEMIES.forEach(a => {
      stats[a.label] = { total: 0, members: 0, requests: 0 };
    });

    profiles.forEach(p => {
      if (p.academy && stats[p.academy]) {
        stats[p.academy].total++;
        if (p.is_member) stats[p.academy].members++;
      }
    });

    requests.forEach(r => {
      const profile = userProfileMap[r.user_id];
      if (profile?.academy && stats[profile.academy]) {
        stats[profile.academy].requests++;
      }
    });

    return stats;
  }, [profiles, requests, userProfileMap]);

  // Build stats for selected region or directorate
  const selectedStats = useMemo(() => {
    if (!profiles || !requests || !userProfileMap || !offices) return null;

    const academyLabel = selectedRegion?.academyLabel;
    if (!academyLabel) return null;

    const filterFn = selectedDirectorate
      ? (p: any) => p.academy === academyLabel && p.directorate === selectedDirectorate
      : (p: any) => p.academy === academyLabel;

    const filteredProfiles = profiles.filter(filterFn);
    const filteredUserIds = new Set(filteredProfiles.map(p => (p as any).user_id));

    // We don't have user_id on profiles list, use profile-level filtering
    const regionProfiles = profiles.filter(filterFn);

    const filteredRequests = requests.filter(r => {
      const profile = userProfileMap[r.user_id];
      if (!profile) return false;
      return selectedDirectorate
        ? profile.academy === academyLabel && profile.directorate === selectedDirectorate
        : profile.academy === academyLabel;
    });

    const filteredOffices = offices.filter(o =>
      selectedDirectorate
        ? o.academy === academyLabel && o.directorate === selectedDirectorate
        : o.academy === academyLabel
    );

    return buildRegionStats({
      totalUsers: regionProfiles.length,
      members: regionProfiles.filter(p => p.is_member).length,
      nonMembers: regionProfiles.filter(p => !p.is_member).length,
      totalRequests: filteredRequests.length,
      submittedRequests: filteredRequests.filter(r => r.status === 'submitted').length,
      acceptedRequests: filteredRequests.filter(r => r.status === 'accepted').length,
      cancelledRequests: filteredRequests.filter(r => r.status === 'cancelled').length,
      totalOffices: filteredOffices.length,
    });
  }, [profiles, requests, userProfileMap, offices, selectedRegion, selectedDirectorate]);

  // Get directorates for selected region
  const directorates = useMemo(() => {
    if (!selectedRegion) return [];
    const academy = ACADEMIES.find(a => a.label === selectedRegion.academyLabel);
    return academy?.directorates || [];
  }, [selectedRegion]);

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <AuthenticatedLayout>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          className="flex items-center gap-4 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-accent transition-colors">
            <BackIcon className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(225,70%,45%)] to-[hsl(225,80%,35%)] flex items-center justify-center shadow-md">
              <Map className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {lang === 'ar' ? 'فلتر سريع' : 'Filtre rapide'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {lang === 'ar' ? 'استعراض تفاعلي حسب الجهات والأقاليم' : 'Exploration interactive par régions et provinces'}
              </p>
            </div>
          </div>
          {selectedRegion && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSelectedRegion(null); setSelectedDirectorate(null); }}
              className="ms-auto"
            >
              <RotateCcw className="w-4 h-4 me-1" />
              {lang === 'ar' ? 'إعادة ضبط' : 'Réinitialiser'}
            </Button>
          )}
        </motion.div>

        {/* Main Content - Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
          {/* Map Section */}
          <motion.div
            className="relative rounded-3xl overflow-hidden border border-primary/10 bg-gradient-to-br from-[hsl(225,40%,8%)] to-[hsl(225,50%,12%)] p-4 shadow-2xl"
            initial={{ opacity: 0, x: dir === 'rtl' ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Decorative glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />

            <MoroccoMap
              onRegionSelect={(r) => { setSelectedRegion(r); setSelectedDirectorate(null); }}
              selectedRegion={selectedRegion}
              regionStats={regionStats}
            />
          </motion.div>

          {/* Stats Section */}
          <motion.div
            className="rounded-3xl overflow-hidden border border-primary/10 bg-card/50 backdrop-blur-xl shadow-2xl flex flex-col"
            initial={{ opacity: 0, x: dir === 'rtl' ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Directorate selector when region is selected */}
            <AnimatePresence>
              {selectedRegion && directorates.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-border/50 overflow-hidden"
                >
                  <div className="p-4">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                      {lang === 'ar' ? 'الأقاليم' : 'Provinces'}
                    </h4>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-hide">
                      <button
                        onClick={() => setSelectedDirectorate(null)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          !selectedDirectorate
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-accent/50 text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        {lang === 'ar' ? 'الكل' : 'Toutes'}
                      </button>
                      {directorates.map(d => (
                        <button
                          key={d}
                          onClick={() => setSelectedDirectorate(selectedDirectorate === d ? null : d)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            selectedDirectorate === d
                              ? 'bg-primary text-primary-foreground shadow-md'
                              : 'bg-accent/50 text-muted-foreground hover:bg-accent'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Orbital Stats */}
            <div className="flex-1 p-6 min-h-[400px]">
              <OrbitalStats
                stats={selectedStats || []}
                title={
                  selectedRegion
                    ? selectedDirectorate || (lang === 'ar' ? selectedRegion.nameAr : selectedRegion.nameFr)
                    : lang === 'ar' ? 'اختر جهة من الخارطة' : 'Sélectionnez une région'
                }
                subtitle={
                  selectedRegion && selectedDirectorate
                    ? lang === 'ar' ? selectedRegion.nameAr : selectedRegion.nameFr
                    : undefined
                }
              />
            </div>
          </motion.div>
        </div>
      </main>
    </AuthenticatedLayout>
  );
};

export default QuickFilter;
