import { useState, useMemo, useRef, useCallback } from 'react';
import { sanitizeSearchInput } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Map, RotateCcw, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import MoroccoMap from '@/components/MoroccoMap';
import OrbitalFilter, { type OrbitalFilterValues } from '@/components/OrbitalFilter';
import SearchResultsTable, { type SearchResult } from '@/components/SearchResultsTable';
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
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [isOrbitalFullscreen, setIsOrbitalFullscreen] = useState(false);
  const [messageRecipients, setMessageRecipients] = useState<string[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

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
    const stats: Record<string, { total: number; members: number; requests: number; directorates: Record<string, { total: number; members: number; requests: number }> }> = {};

    ACADEMIES.forEach(a => {
      stats[a.label] = { total: 0, members: 0, requests: 0, directorates: {} };
      a.directorates.forEach(d => {
        stats[a.label].directorates[d] = { total: 0, members: 0, requests: 0 };
      });
    });

    profiles.forEach(p => {
      if (p.academy && stats[p.academy]) {
        stats[p.academy].total++;
        if (p.is_member) stats[p.academy].members++;
        // Directorate level
        if (p.directorate && stats[p.academy].directorates[p.directorate]) {
          stats[p.academy].directorates[p.directorate].total++;
          if (p.is_member) stats[p.academy].directorates[p.directorate].members++;
        }
      }
    });

    requests.forEach(r => {
      const profile = userProfileMap[r.user_id];
      if (profile?.academy && stats[profile.academy]) {
        stats[profile.academy].requests++;
        if (profile.directorate && stats[profile.academy].directorates[profile.directorate]) {
          stats[profile.academy].directorates[profile.directorate].requests++;
        }
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

  const handleSearch = useCallback(async (filters: OrbitalFilterValues) => {
    // Check if at least one filter is set
    const hasFilter = filters.academy || filters.directorate || filters.institution ||
      filters.gender !== 'all' || filters.mission || filters.ageMin || filters.ageMax ||
      filters.membership !== 'all' || filters.ppr || filters.phone;

    if (!hasFilter) {
      toast.info(lang === 'ar' ? 'اختر فلتراً واحداً على الأقل' : 'Sélectionnez au moins un filtre');
      return;
    }

    setIsSearching(true);
    try {
      // When mode is 'offices', restrict to local_office_members only
      let officeMemberIds: string[] | null = null;
      if (filters.mode === 'offices') {
        // Step 1: fetch offices matching academy/directorate
        let officeQuery = supabase.from('local_offices').select('id');
        if (filters.academy) officeQuery = officeQuery.eq('academy', filters.academy);
        if (filters.directorate) officeQuery = officeQuery.eq('directorate', filters.directorate);
        const { data: offices } = await officeQuery;
        const officeIds = offices?.map(o => o.id) || [];

        if (officeIds.length === 0) {
          setSearchResults([]);
          setTimeout(() => { resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200);
          return;
        }

        // Step 2: fetch member user_ids from those offices
        const { data: members } = await supabase
          .from('local_office_members')
          .select('user_id')
          .in('office_id', officeIds);
        officeMemberIds = members?.map(m => m.user_id) || [];

        if (officeMemberIds.length === 0) {
          setSearchResults([]);
          setTimeout(() => { resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200);
          return;
        }
      }

      let query = supabase.from('profiles').select('user_id, full_name, academy, directorate, mission, is_member, phone, email, employee_number, date_of_birth, gender, membership_verified');

      // If offices mode, restrict to office members
      if (officeMemberIds) {
        query = query.in('user_id', officeMemberIds);
      }

      if (filters.academy) query = query.eq('academy', filters.academy);
      if (filters.directorate) query = query.eq('directorate', filters.directorate);
      if (filters.institution) query = query.ilike('institution', `%${sanitizeSearchInput(filters.institution)}%`);
      if (filters.gender !== 'all') query = query.eq('gender', filters.gender);
      if (filters.mission) query = query.eq('mission', filters.mission);
      if (filters.ppr) query = query.eq('employee_number', filters.ppr);
      if (filters.phone) query = query.ilike('phone', `%${sanitizeSearchInput(filters.phone)}%`);
      if (filters.membership === 'member') query = query.eq('is_member', true);
      else if (filters.membership === 'non_member') query = query.eq('is_member', false);
      else if (filters.membership === 'pending') query = query.eq('membership_verified', false).eq('is_member', true);

      // Age filters
      if (filters.ageMin || filters.ageMax) {
        const now = new Date();
        if (filters.ageMax) {
          const minDate = new Date(now.getFullYear() - parseInt(filters.ageMax), now.getMonth(), now.getDate()).toISOString().split('T')[0];
          query = query.gte('date_of_birth', minDate);
        }
        if (filters.ageMin) {
          const maxDate = new Date(now.getFullYear() - parseInt(filters.ageMin), now.getMonth(), now.getDate()).toISOString().split('T')[0];
          query = query.lte('date_of_birth', maxDate);
        }
      }

      const { data, error } = await query.limit(500);

      if (error) {
        console.error('Search error:', error);
        toast.error(lang === 'ar' ? 'خطأ في البحث' : 'Erreur de recherche');
        return;
      }

      setSearchResults(data as SearchResult[]);

      // Auto-scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } finally {
      setIsSearching(false);
    }
  }, [lang]);

  const handleMessage = useCallback((selectedUserIds: string[]) => {
    setMessageRecipients(selectedUserIds);
    // Navigate to communication hub with pre-selected recipients
    navigate('/communication', { state: { recipientIds: selectedUserIds } });
  }, [navigate]);

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <AuthenticatedLayout>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Orbital Fullscreen Overlay */}
        <AnimatePresence>
          {isOrbitalFullscreen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 z-50 bg-background overflow-y-auto flex flex-col items-center justify-center p-4"
            >
              {/* Fixed minimize button — always visible */}
              <button
                onClick={() => setIsOrbitalFullscreen(false)}
                className="fixed top-4 right-4 z-[60] p-3 rounded-xl bg-[#001D39] hover:bg-[#0A4174] text-white border border-[#49769F]/50 shadow-2xl transition-all backdrop-blur-sm"
                title={lang === 'ar' ? 'تصغير' : 'Réduire'}
              >
                <Minimize2 className="w-5 h-5" />
              </button>
              <div className="w-full max-w-[95vw] flex flex-col items-center">
                <OrbitalFilter
                  selectedAcademy={selectedRegion?.academyLabel || null}
                  selectedDirectorate={selectedDirectorate}
                  onSearch={(f) => { setIsOrbitalFullscreen(false); handleSearch(f); }}
                  isFullscreen={true}
                  onToggleFullscreen={() => setIsOrbitalFullscreen(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                {lang === 'ar' ? 'فلتر سريع' : 'Filtre rapide'}
                {selectedRegion && (
                  <span className="text-sm font-medium text-[#0A4174]">
                    — {lang === 'ar' ? selectedRegion.nameAr : selectedRegion.nameFr}
                    {selectedProvinceName && (
                      <span className="text-[#49769F]"> › {selectedProvinceName}</span>
                    )}
                  </span>
                )}
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
              onClick={() => { setSelectedRegion(null); setSelectedDirectorate(null); setSelectedProvinceName(null); }}
              className="ms-auto"
            >
              <RotateCcw className="w-4 h-4 me-1" />
              {lang === 'ar' ? 'إعادة ضبط' : 'Réinitialiser'}
            </Button>
          )}
        </motion.div>

        {/* Main Content - Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map Section */}
          <motion.div
            className="relative rounded-3xl overflow-hidden border border-[#49769F]/30 bg-[#BDD8E9] p-4 shadow-2xl min-h-[500px]"
            initial={{ opacity: 0, x: dir === 'rtl' ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#7BBDE8]/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#49769F]/10 rounded-full blur-2xl" />

            <MoroccoMap
              onRegionSelect={(r) => { setSelectedRegion(r); setSelectedDirectorate(null); setSelectedProvinceName(null); }}
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
              onProvinceNameChange={setSelectedProvinceName}
            />
          </motion.div>

          {/* Orbital Filter Section */}
          <motion.div
            className="rounded-3xl overflow-hidden border border-primary/10 bg-card shadow-2xl"
            initial={{ opacity: 0, x: dir === 'rtl' ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <OrbitalFilter
              selectedAcademy={selectedRegion?.academyLabel || null}
              selectedDirectorate={selectedDirectorate}
              onSearch={handleSearch}
              isFullscreen={false}
              onToggleFullscreen={() => setIsOrbitalFullscreen(true)}
            />
          </motion.div>
        </div>

        {/* Search Results */}
        {isSearching && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div ref={resultsRef}>
          {searchResults && !isSearching && (
            <div className="mt-8">
              {searchResults.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 0.95] }}
                  transition={{ duration: 3.5, times: [0, 0.12, 0.8, 1], ease: 'easeInOut' }}
                  onAnimationComplete={() => setSearchResults(null)}
                  className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
                >
                  <div className="bg-card/90 border border-border/50 rounded-3xl px-10 py-8 shadow-2xl text-center pointer-events-auto">
                    <p className="text-muted-foreground text-base font-medium">
                      {lang === 'ar' ? 'لا توجد نتائج مطابقة' : 'Aucun résultat trouvé'}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <SearchResultsTable
                  results={searchResults}
                  onMessage={handleMessage}
                  lang={lang}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </AuthenticatedLayout>
  );
};

export default QuickFilter;
