import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Map, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import MoroccoMap from '@/components/MoroccoMap';
import OrbitalFilter, { type OrbitalFilterValues } from '@/components/OrbitalFilter';
import { type RegionMapping } from '@/lib/morocco-regions';
import { ACADEMIES } from '@/lib/academies-data';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const QuickFilter = () => {
  const { t, dir, lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState<RegionMapping | null>(null);
  const [selectedDirectorate, setSelectedDirectorate] = useState<string | null>(null);
  const [selectedProvinceName, setSelectedProvinceName] = useState<string | null>(null);

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

  // Get directorates for selected region
  const directorates = useMemo(() => {
    if (!selectedRegion) return [];
    const academy = ACADEMIES.find(a => a.label === selectedRegion.academyLabel);
    return academy?.directorates || [];
  }, [selectedRegion]);

  const handleSearch = (filters: OrbitalFilterValues) => {
    // Build query params and navigate to database dashboard
    const params = new URLSearchParams();
    if (filters.academy) params.set('academy', filters.academy);
    if (filters.directorate) params.set('directorate', filters.directorate);
    if (filters.institution) params.set('institution', filters.institution);
    if (filters.gender !== 'all') params.set('gender', filters.gender);
    if (filters.mission) params.set('mission', filters.mission);
    if (filters.ageMin) params.set('ageMin', filters.ageMin);
    if (filters.ageMax) params.set('ageMax', filters.ageMax);
    if (filters.membership !== 'all') params.set('membership', filters.membership);
    if (filters.ppr) params.set('ppr', filters.ppr);
    if (filters.phone) params.set('phone', filters.phone);
    params.set('mode', filters.mode);

    const queryStr = params.toString();
    if (!queryStr || queryStr === 'mode=users') {
      toast.info(lang === 'ar' ? 'اختر فلتراً واحداً على الأقل' : 'Sélectionnez au moins un filtre');
      return;
    }

    navigate(`/database?${queryStr}`);
  };

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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A4174] to-[#001D39] flex items-center justify-center shadow-md">
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
            className="relative rounded-3xl overflow-hidden border border-[#49769F]/30 bg-[#BDD8E9] p-4 shadow-2xl"
            initial={{ opacity: 0, x: dir === 'rtl' ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#7BBDE8]/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#49769F]/10 rounded-full blur-2xl" />

            <MoroccoMap
              onRegionSelect={(r) => { setSelectedRegion(r); setSelectedDirectorate(null); }}
              selectedRegion={selectedRegion}
              regionStats={regionStats}
              onProvinceSelect={(prov) => {
                if (prov) {
                  const match = directorates.find(d => prov.includes(d) || d.includes(prov));
                  setSelectedDirectorate(match || prov);
                } else {
                  setSelectedDirectorate(null);
                }
              }}
            />
          </motion.div>

          {/* Orbital Filter Section */}
          <motion.div
            className="rounded-3xl overflow-hidden border border-primary/10 bg-card/50 backdrop-blur-xl shadow-2xl flex flex-col"
            initial={{ opacity: 0, x: dir === 'rtl' ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <OrbitalFilter
              selectedAcademy={selectedRegion?.academyLabel || null}
              selectedDirectorate={selectedDirectorate}
              onSearch={handleSearch}
            />
          </motion.div>
        </div>
      </main>
    </AuthenticatedLayout>
  );
};

export default QuickFilter;
