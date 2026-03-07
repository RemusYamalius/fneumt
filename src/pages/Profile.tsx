import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AnimatedLogo from '@/components/AnimatedLogo';
import { ACADEMIES } from '@/lib/academies-data';

const Profile = () => {
  const { t, dir } = useI18n();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    employee_number: '',
    corps: '',
    institution: '',
    zone: '',
    directorate: '',
    academy: '',
    mission: '',
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
      });
    }
  }, [profile]);

  const handleChange = (field: string, value: string) => {
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
      } as any)
      .eq('user_id', user.id);

    setSaving(false);
    if (error) {
      toast({ title: t.submitError, variant: 'destructive' });
    } else {
      toast({ title: t.profileUpdated });
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

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="gradient-primary text-white shadow-lg">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <AnimatedLogo size="w-10 h-10" />
          <p className="font-bold text-sm">{t.platformName}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-primary hover:underline mb-6">
          <BackArrow className="w-4 h-4" />
          {t.backToDashboard}
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-8">{t.profile}</h1>

        <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-6">
          {/* 1. Email (read-only) */}
          <div className="space-y-2">
            <Label>{t.emailLabel}</Label>
            <Input value={user.email || ''} disabled className="bg-muted" />
          </div>

          {/* 2. Full Name */}
          <div className="space-y-2">
            <Label>{t.fullNameLabel}</Label>
            <Input value={form.full_name} onChange={e => handleChange('full_name', e.target.value)} />
          </div>

          {/* 3. Phone */}
          <div className="space-y-2">
            <Label>{t.phoneLabel}</Label>
            <Input value={form.phone} onChange={e => handleChange('phone', e.target.value)} dir="ltr" />
          </div>

          {/* 4. Employee Number */}
          <div className="space-y-2">
            <Label>{t.employeeNumberLabel}</Label>
            <Input value={form.employee_number} onChange={e => handleChange('employee_number', e.target.value)} dir="ltr" />
          </div>

          {/* 5. Academy */}
          <div className="space-y-2">
            <Label>{t.academyLabel}</Label>
            <Select value={form.academy} onValueChange={handleAcademyChange}>
              <SelectTrigger>
                <SelectValue placeholder={t.academyLabel} />
              </SelectTrigger>
              <SelectContent>
                {ACADEMIES.map(a => (
                  <SelectItem key={a.label} value={a.label}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 6. Directorate */}
          <div className="space-y-2">
            <Label>{t.directorateLabel}</Label>
            <Select value={form.directorate} onValueChange={v => handleChange('directorate', v)} disabled={!form.academy}>
              <SelectTrigger>
                <SelectValue placeholder={t.directorateLabel} />
              </SelectTrigger>
              <SelectContent>
                {directorates.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 7. Mission */}
          <div className="space-y-2">
            <Label>{t.missionLabel}</Label>
            <Select value={form.mission} onValueChange={v => handleChange('mission', v)}>
              <SelectTrigger>
                <SelectValue placeholder={t.missionLabel} />
              </SelectTrigger>
              <SelectContent>
                {missionOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 8. Corps */}
          <div className="space-y-2">
            <Label>{t.corpsLabel}</Label>
            <Select value={form.corps} onValueChange={v => handleChange('corps', v)}>
              <SelectTrigger>
                <SelectValue placeholder={t.corpsLabel} />
              </SelectTrigger>
              <SelectContent>
                {corpsOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 8. Institution */}
          <div className="space-y-2">
            <Label>{t.institutionLabel}</Label>
            <Input value={form.institution} onChange={e => handleChange('institution', e.target.value)} />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {t.saveProfile}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Profile;
