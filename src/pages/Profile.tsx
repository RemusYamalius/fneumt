import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, Save, Loader2, User, Phone, Hash, Building2, MapPin,
  Briefcase, GraduationCap, CreditCard, Mail, ChevronLeft, ChevronRight, Eye,
  Trash2, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { ACADEMIES } from '@/lib/academies-data';

/* ── Floating Particles ── */
const FloatingParticles = () => {
  const particles = useMemo(() =>
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      color: i % 3 === 0 ? 'hsl(190 80% 80%)' : i % 3 === 1 ? 'hsl(220 70% 82%)' : 'hsl(270 60% 82%)',
      opacity: Math.random() * 0.25 + 0.05,
    })), []
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`,
            background: p.color, opacity: p.opacity, boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
          animate={{
            x: [0, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 60, 0],
            y: [0, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 60, 0],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity * 0.5, p.opacity],
          }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
};

/* ── Card field definitions ── */
interface CardField {
  key: string;
  label: string;
  icon: typeof User;
  type: 'text' | 'select' | 'membership';
  options?: { value: string; label: string }[];
  readOnly?: boolean;
  dir?: string;
}

const Profile = () => {
  const { t, dir } = useI18n();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const [form, setForm] = useState({
    full_name: '', phone: '', employee_number: '', corps: '',
    institution: '', zone: '', directorate: '', academy: '',
    mission: '', is_member: false, membership_card_number: '',
  });




  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        employee_number: profile.employee_number || '',
        corps: profile.corps || '',
        institution: profile.institution || '',
        zone: profile.zone || '',
        directorate: profile.directorate || '',
        academy: profile.academy || '',
        mission: (profile as any).mission || '',
        is_member: (profile as any).is_member || false,
        membership_card_number: (profile as any).membership_card_number || '',
      });
    }
  }, [profile]);

  const handleChange = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const directorates = useMemo(() => {
    if (!form.academy) return [];
    const found = ACADEMIES.find(a => a.label === form.academy);
    return found?.directorates || [];
  }, [form.academy]);

  const handleAcademyChange = (value: string) => {
    setForm(prev => ({ ...prev, academy: value, directorate: '' }));
  };

  const corpsOptions = [
    { value: 'primary', label: t.corpsPrimary },
    { value: 'middle_school', label: t.corpsMiddle },
    { value: 'high_school', label: t.corpsHigh },
  ];

  const missionOptions = [
    { value: 'teacher', label: t.missionTeacher },
    { value: 'support_staff', label: t.missionSupportStaff },
    { value: 'supplier', label: t.missionSupplier },
    { value: 'educational_advisor', label: t.missionEducationalAdvisor },
    { value: 'guard', label: t.missionGuard },
    { value: 'director', label: t.missionDirector },
    { value: 'administrator', label: t.missionAdministrator },
    { value: 'educational_inspector', label: t.missionEducationalInspector },
    { value: 'tech_assistant', label: t.missionTechAssistant },
    { value: 'economy_admin', label: t.missionEconomyAdmin },
    { value: 'treasurer', label: t.missionTreasurer },
    { value: 'other', label: t.missionOther },
  ];

  const cards: CardField[] = useMemo(() => [
    { key: 'full_name', label: t.fullNameLabel, icon: User, type: 'text' },
    { key: 'phone', label: t.phoneLabel, icon: Phone, type: 'text', dir: 'ltr' },
    { key: 'employee_number', label: t.employeeNumberLabel, icon: Hash, type: 'text', dir: 'ltr' },
    { key: 'academy', label: t.academyLabel, icon: GraduationCap, type: 'select', options: ACADEMIES.map(a => ({ value: a.label, label: a.label })) },
    { key: 'directorate', label: t.directorateLabel, icon: MapPin, type: 'select', options: directorates.map(d => ({ value: d, label: d })) },
    { key: 'mission', label: t.missionLabel, icon: Briefcase, type: 'select', options: missionOptions },
    { key: 'corps', label: t.corpsLabel, icon: GraduationCap, type: 'select', options: corpsOptions },
    { key: 'institution', label: t.institutionLabel, icon: Building2, type: 'text' },
    { key: 'membership', label: t.membershipLabel, icon: CreditCard, type: 'membership' },
    { key: 'email', label: t.emailLabel, icon: Mail, type: 'text', readOnly: true },
  ], [t, directorates, corpsOptions, missionOptions]);

  // Embla carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({
    direction: dir === 'rtl' ? 'rtl' : 'ltr',
    align: 'center',
    containScroll: 'trimSnaps',
    dragFree: true,
  });

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setActiveIndex(emblaApi.selectedScrollSnap());
    };
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) {
      playClick();
      emblaApi.scrollTo(index);
    }
  }, [emblaApi, playClick]);

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      playClick();
      emblaApi.scrollNext();
    }
  }, [emblaApi, playClick]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      playClick();
      emblaApi.scrollPrev();
    }
  }, [emblaApi, playClick]);

  const getFieldValue = (key: string): string => {
    if (key === 'email') return user?.email || '';
    if (key === 'membership') {
      return form.is_member ? `${t.isMember}${form.membership_card_number ? ` - ${form.membership_card_number}` : ''}` : t.isNotMember;
    }
    const val = (form as any)[key];
    if (!val) return '';
    // Translate select values
    if (key === 'corps') return corpsOptions.find(o => o.value === val)?.label || val;
    if (key === 'mission') return missionOptions.find(o => o.value === val)?.label || val;
    return val;
  };

  const isFieldFilled = (key: string): boolean => {
    if (key === 'email') return true;
    if (key === 'membership') return true;
    return !!(form as any)[key];
  };

  const filledCount = cards.filter(c => isFieldFilled(c.key)).length;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name.trim() || null,
        phone: form.phone.trim() || null,
        employee_number: form.employee_number.trim() || null,
        corps: (form.corps || null) as any,
        institution: form.institution.trim() || null,
        zone: form.zone.trim() || null,
        directorate: form.directorate || null,
        academy: form.academy || null,
        mission: form.mission || null,
        is_member: form.is_member,
        membership_card_number: form.is_member ? (form.membership_card_number.trim() || null) : null,
      } as any)
      .eq('user_id', user.id);

    setSaving(false);
    if (error) {
      toast({ title: t.submitError, variant: 'destructive' });
    } else {
      toast({ title: t.profileComplete || t.profileUpdated });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const res = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw res.error;

      await supabase.auth.signOut();
      toast({ title: t.accountDeleted || 'Account deleted' });
      navigate('/');
    } catch (err: any) {
      toast({ title: t.submitError, description: err?.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const NavPrev = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NavNext = dir === 'rtl' ? ChevronLeft : ChevronRight;

  const renderCardContent = (card: CardField, index: number) => {
    const isActive = index === activeIndex;

    if (card.readOnly) {
      return (
        <Input
          value={user.email || ''}
          disabled
          className="futuristic-input opacity-70"
        />
      );
    }

    if (card.type === 'membership') {
      return (
        <div className="space-y-3">
          <div className="flex gap-3">
            <button
              onClick={() => handleChange('is_member', true)}
              className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                form.is_member
                ? 'border-[hsl(190_80%_45%)] bg-[hsl(190_80%_45%/0.08)] text-[hsl(190_80%_30%)]'
                  : 'border-[hsl(210_15%_88%)] bg-[hsl(210_15%_97%)] text-[hsl(210_15%_45%)]'
              }`}
            >
              {t.isMember}
            </button>
            <button
              onClick={() => handleChange('is_member', false)}
              className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                !form.is_member
                ? 'border-[hsl(0_70%_45%)] bg-[hsl(0_70%_45%/0.08)] text-[hsl(0_70%_35%)]'
                  : 'border-[hsl(210_15%_88%)] bg-[hsl(210_15%_97%)] text-[hsl(210_15%_45%)]'
              }`}
            >
              {t.isNotMember}
            </button>
          </div>
          {form.is_member && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <Input
                value={form.membership_card_number}
                onChange={e => handleChange('membership_card_number', e.target.value)}
                placeholder={t.membershipCardPlaceholder}
                dir="ltr"
                className="futuristic-input"
              />
            </motion.div>
          )}
        </div>
      );
    }

    if (card.type === 'select') {
      const isAcademy = card.key === 'academy';
      return (
        <Select
          value={(form as any)[card.key] || ''}
          onValueChange={isAcademy ? handleAcademyChange : (v) => handleChange(card.key, v)}
          disabled={card.key === 'directorate' && !form.academy}
        >
          <SelectTrigger className="futuristic-input h-12">
            <SelectValue placeholder={card.label} />
          </SelectTrigger>
          <SelectContent>
            {(card.options || []).map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        value={(form as any)[card.key] || ''}
        onChange={e => handleChange(card.key, e.target.value)}
        dir={card.dir || undefined}
        className="futuristic-input h-12"
      />
    );
  };

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen profile-white-bg" dir={dir}>
        <FloatingParticles />

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-6">
          {/* Back button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="futuristic-back-btn mb-6"
          >
            <BackArrow className="w-4 h-4" />
            {t.backToDashboard}
          </button>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black" style={{ color: 'hsl(210 20% 15%)' }}>{t.profile}</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setViewMode(!viewMode)}
                className="futuristic-back-btn flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {viewMode ? t.editInfo : t.viewInfo}
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'hsl(210 15% 92%)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, hsl(190 80% 45%), hsl(160 70% 45%))' }}
                animate={{ width: `${(filledCount / cards.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-xs font-bold" style={{ color: 'hsl(190 80% 35%)' }}>
              {filledCount}/{cards.length}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {viewMode ? (
              /* ── Summary view ── */
              <motion.div
                key="summary"
                initial={{ opacity: 0, x: dir === 'rtl' ? -100 : 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir === 'rtl' ? -100 : 100 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="profile-summary-card p-6 space-y-1">
                  {cards.map((card) => {
                    const Icon = card.icon;
                    const value = getFieldValue(card.key);
                    return (
                      <div key={card.key} className="profile-summary-row">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center"
                          style={{ background: 'hsl(190 80% 45% / 0.08)', border: '1px solid hsl(190 80% 45% / 0.15)' }}>
                          <Icon className="w-4 h-4" style={{ color: 'hsl(190 80% 35%)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold" style={{ color: 'hsl(210 15% 40%)' }}>
                            {card.label} <span style={{ color: 'hsl(0 80% 55%)' }}>*</span>
                          </div>
                          <div className="text-sm font-semibold truncate" style={{ color: value ? 'hsl(210 20% 20%)' : 'hsl(0 80% 55% / 0.6)' }}>
                            {value || '—'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Delete account */}
                <div className="mt-8 text-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="profile-delete-btn flex items-center gap-2 mx-auto">
                        <Trash2 className="w-4 h-4" />
                        {t.deleteAccount}
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                          {t.deleteAccountConfirm}
                        </AlertDialogTitle>
                        <AlertDialogDescription>{t.deleteAccountWarning}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={deleting}
                        >
                          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : t.confirm}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </motion.div>
            ) : (
              /* ── Carousel edit view ── */
              <motion.div
                key="carousel"
                initial={{ opacity: 0, x: dir === 'rtl' ? 100 : -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir === 'rtl' ? 100 : -100 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {/* Card counter */}
                <div className="text-center mb-4">
                  <span className="text-sm font-bold" style={{ color: 'hsl(190 80% 35%)' }}>
                    {activeIndex + 1} {t.profileCardOf} {cards.length}
                  </span>
                </div>

                {/* Carousel */}
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex gap-4" style={{ direction: dir === 'rtl' ? 'rtl' : 'ltr' }}>
                    {cards.map((card, index) => {
                      const Icon = card.icon;
                      const isActive = index === activeIndex;
                      const filled = isFieldFilled(card.key);

                      return (
                        <div
                          key={card.key}
                          className="flex-shrink-0"
                          style={{ width: 'min(85vw, 340px)' }}
                          onClick={() => scrollTo(index)}
                        >
                          <div className={`profile-card-glass relative p-6 min-h-[220px] flex flex-col ${isActive ? 'active' : ''} ${filled && !isActive ? 'completed' : ''}`}>
                            {/* Icon */}
                            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                              style={{
                                background: isActive ? 'hsl(190 80% 45% / 0.1)' : 'hsl(210 15% 95%)',
                                border: `1.5px solid ${isActive ? 'hsl(190 80% 45% / 0.4)' : 'hsl(210 15% 88%)'}`,
                              }}>
                              <Icon className="w-6 h-6" style={{ color: isActive ? 'hsl(190 80% 35%)' : 'hsl(210 15% 55%)' }} />
                            </div>

                            {/* Label */}
                            <div className="text-center mb-4">
                              <span className="text-sm font-black" style={{ color: isActive ? 'hsl(210 20% 15%)' : 'hsl(210 15% 55%)' }}>
                                {card.label}
                              </span>
                              <span className="text-sm font-black" style={{ color: 'hsl(0 80% 55%)' }}> *</span>
                            </div>

                            {/* Input field */}
                            <div className="flex-1">
                              {renderCardContent(card, index)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={scrollPrev}
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: 'hsl(210 15% 97%)',
                      border: '1.5px solid hsl(210 15% 88%)',
                    }}
                  >
                    <NavPrev className="w-5 h-5" style={{ color: 'hsl(190 80% 35%)' }} />
                  </button>

                  {/* Dots */}
                  <div className="flex gap-1.5">
                    {cards.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => scrollTo(i)}
                        className="w-2.5 h-2.5 rounded-full transition-all"
                        style={{
                          background: i === activeIndex
                            ? 'hsl(190 80% 45%)'
                            : isFieldFilled(cards[i].key)
                              ? 'hsl(160 70% 45%)'
                              : 'hsl(210 15% 85%)',
                          boxShadow: i === activeIndex ? '0 0 8px hsl(190 80% 45% / 0.5)' : 'none',
                          transform: i === activeIndex ? 'scale(1.3)' : 'scale(1)',
                        }}
                      />
                    ))}
                  </div>

                  <button
                    onClick={scrollNext}
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: 'hsl(210 15% 97%)',
                      border: '1.5px solid hsl(210 15% 88%)',
                    }}
                  >
                    <NavNext className="w-5 h-5" style={{ color: 'hsl(190 80% 35%)' }} />
                  </button>
                </div>

                {/* Save button */}
                <div className="mt-8 text-center">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="futuristic-submit-btn"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {t.saveProfile}
                  </button>
                </div>

                {/* Delete account in carousel mode */}
                <div className="mt-10 text-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="profile-delete-btn flex items-center gap-2 mx-auto text-sm">
                        <Trash2 className="w-3.5 h-3.5" />
                        {t.deleteAccount}
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                          {t.deleteAccountConfirm}
                        </AlertDialogTitle>
                        <AlertDialogDescription>{t.deleteAccountWarning}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={deleting}
                        >
                          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : t.confirm}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Profile;
