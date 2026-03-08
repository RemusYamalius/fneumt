import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Save, Loader2, User, Phone, Hash, Building2, MapPin, Briefcase, GraduationCap, CreditCard } from 'lucide-react';
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

interface ProfileFormFieldProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const ProfileFormField = ({ label, icon, children }: ProfileFormFieldProps) => (
  <div className="space-y-2">
    <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
      {icon}
      {label}
    </Label>
    {children}
  </div>
);

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
    is_member: false,
    membership_card_number: '',
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

  const inputClasses = "bg-muted/50 border-border/60 focus:border-primary focus:bg-background transition-colors";
  const selectTriggerClasses = "bg-muted/50 border-border/60 focus:border-primary focus:bg-background transition-colors";

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="gradient-primary text-white shadow-lg">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <AnimatedLogo size="w-20 h-20" />
          <p className="font-bold text-sm">{t.platformName}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-primary hover:underline mb-6">
          <BackArrow className="w-4 h-4" />
          {t.backToDashboard}
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-8">{t.profile}</h1>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8 space-y-6">
          {/* Email (read-only) */}
          <ProfileFormField label={t.emailLabel} icon={<User className="w-4 h-4 text-primary" />}>
            <Input value={user.email || ''} disabled className="bg-muted/70 text-muted-foreground" />
          </ProfileFormField>

          {/* Full Name */}
          <ProfileFormField label={t.fullNameLabel} icon={<User className="w-4 h-4 text-primary" />}>
            <Input value={form.full_name} onChange={e => handleChange('full_name', e.target.value)} className={inputClasses} />
          </ProfileFormField>

          {/* Phone */}
          <ProfileFormField label={t.phoneLabel} icon={<Phone className="w-4 h-4 text-primary" />}>
            <Input value={form.phone} onChange={e => handleChange('phone', e.target.value)} dir="ltr" className={inputClasses} />
          </ProfileFormField>

          {/* Employee Number */}
          <ProfileFormField label={t.employeeNumberLabel} icon={<Hash className="w-4 h-4 text-primary" />}>
            <Input value={form.employee_number} onChange={e => handleChange('employee_number', e.target.value)} dir="ltr" className={inputClasses} />
          </ProfileFormField>

          {/* Academy */}
          <ProfileFormField label={t.academyLabel} icon={<GraduationCap className="w-4 h-4 text-primary" />}>
            <Select value={form.academy} onValueChange={handleAcademyChange}>
              <SelectTrigger className={selectTriggerClasses}>
                <SelectValue placeholder={t.academyLabel} />
              </SelectTrigger>
              <SelectContent>
                {ACADEMIES.map(a => (
                  <SelectItem key={a.label} value={a.label}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ProfileFormField>

          {/* Directorate */}
          <ProfileFormField label={t.directorateLabel} icon={<MapPin className="w-4 h-4 text-primary" />}>
            <Select value={form.directorate} onValueChange={v => handleChange('directorate', v)} disabled={!form.academy}>
              <SelectTrigger className={selectTriggerClasses}>
                <SelectValue placeholder={t.directorateLabel} />
              </SelectTrigger>
              <SelectContent>
                {directorates.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ProfileFormField>

          {/* Mission */}
          <ProfileFormField label={t.missionLabel} icon={<Briefcase className="w-4 h-4 text-primary" />}>
            <Select value={form.mission} onValueChange={v => handleChange('mission', v)}>
              <SelectTrigger className={selectTriggerClasses}>
                <SelectValue placeholder={t.missionLabel} />
              </SelectTrigger>
              <SelectContent>
                {missionOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ProfileFormField>

          {/* Corps */}
          <ProfileFormField label={t.corpsLabel} icon={<GraduationCap className="w-4 h-4 text-primary" />}>
            <Select value={form.corps} onValueChange={v => handleChange('corps', v)}>
              <SelectTrigger className={selectTriggerClasses}>
                <SelectValue placeholder={t.corpsLabel} />
              </SelectTrigger>
              <SelectContent>
                {corpsOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ProfileFormField>

          {/* Institution */}
          <ProfileFormField label={t.institutionLabel} icon={<Building2 className="w-4 h-4 text-primary" />}>
            <Input value={form.institution} onChange={e => handleChange('institution', e.target.value)} className={inputClasses} />
          </ProfileFormField>

          {/* Membership Status */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CreditCard className="w-4 h-4 text-primary" />
              {t.membershipLabel}
            </Label>
            <div className="flex gap-4">
              {/* Member option */}
              <label
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all flex-1 ${
                  form.is_member
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border bg-muted/30 hover:border-border/80'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.is_member}
                  onChange={() => handleChange('is_member', true)}
                  className="w-4 h-4 rounded border-primary text-primary accent-[hsl(var(--primary))]"
                />
                <span className={`font-medium text-sm ${form.is_member ? 'text-primary' : 'text-muted-foreground'}`}>
                  {t.isMember}
                </span>
              </label>

              {/* Non-member option */}
              <label
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all flex-1 ${
                  !form.is_member
                    ? 'border-destructive bg-destructive/10 shadow-sm'
                    : 'border-border bg-muted/30 hover:border-border/80'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!form.is_member}
                  onChange={() => handleChange('is_member', false)}
                  className="w-4 h-4 rounded border-destructive text-destructive accent-[hsl(var(--destructive))]"
                />
                <span className={`font-medium text-sm ${!form.is_member ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {t.isNotMember}
                </span>
              </label>
            </div>

            {/* Membership card number - shown only when member */}
            {form.is_member && (
              <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                <Input
                  value={form.membership_card_number}
                  onChange={e => handleChange('membership_card_number', e.target.value)}
                  placeholder={t.membershipCardPlaceholder}
                  dir="ltr"
                  className={`${inputClasses} border-primary/30`}
                />
              </div>
            )}
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full mt-4">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {t.saveProfile}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Profile;
