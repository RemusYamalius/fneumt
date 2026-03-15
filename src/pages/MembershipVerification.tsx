
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, User, Building2, CreditCard, Hash, Loader2, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import VerifiedBadge, { getBadgeStatus } from '@/components/VerifiedBadge';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  employee_number: string | null;
  institution: string | null;
  membership_card_number: string | null;
  is_member: boolean | null;
  membership_verified: boolean | null;
  email: string | null;
}

const MembershipVerification = () => {
  const { t, dir, lang } = useI18n();
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterInstitution, setFilterInstitution] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user || !profile?.academy || !profile?.directorate) return;
    fetchUsers();
  }, [user, profile]);

  const fetchUsers = async () => {
    if (!profile?.academy || !profile?.directorate) return;
    setLoadingData(true);
    const [{ data, error }, { data: promotedRoles }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, user_id, full_name, employee_number, institution, membership_card_number, is_member, membership_verified, email')
        .eq('academy', profile.academy)
        .eq('directorate', profile.directorate)
        .neq('user_id', user!.id)
        .order('full_name', { ascending: true }),
      supabase
        .from('user_roles')
        .select('user_id')
        .neq('role', 'teacher'),
    ]);
    if (error) console.error(error);
    else {
      const promotedUserIds = new Set((promotedRoles || []).map(r => r.user_id));
      setUsers((data || []).filter(u => !promotedUserIds.has(u.user_id)));
    }
    setLoadingData(false);
  };

  const uniqueNames = useMemo(() => [...new Set(users.map(u => u.full_name).filter(Boolean))] as string[], [users]);
  const uniqueEmployees = useMemo(() => [...new Set(users.map(u => u.employee_number).filter(Boolean))] as string[], [users]);
  const uniqueInstitutions = useMemo(() => [...new Set(users.map(u => u.institution).filter(Boolean))] as string[], [users]);

  const hasActiveFilter = filterName !== '' || filterEmployee !== '' || filterInstitution !== '';

  const resetFilters = () => { setFilterName(''); setFilterEmployee(''); setFilterInstitution(''); };

  const handleSetMembershipStatus = async (targetUser: UserProfile, status: 'not_member' | 'pending' | 'verified') => {
    setUpdatingId(targetUser.user_id);
    try {
      const updateData = { is_member: status !== 'not_member', membership_verified: status === 'verified' };
      const { error } = await supabase.from('profiles').update(updateData).eq('user_id', targetUser.user_id);
      if (error) throw error;

      const notifTitles = {
        not_member: lang === 'ar' ? 'تم تعطيل انخراطك' : 'Adhésion désactivée',
        pending: lang === 'ar' ? 'انخراطك قيد التحقق' : 'Adhésion en cours de vérification',
        verified: lang === 'ar' ? 'تم تفعيل انخراطك' : 'Adhésion activée',
      };
      const notifMessages = {
        not_member: lang === 'ar' ? 'تم تعطيل حالة انخراطك من طرف المسؤول المحلي' : 'Votre statut d\'adhésion a été désactivé par le responsable local',
        pending: lang === 'ar' ? 'انخراطك قيد التحقق من طرف المسؤول المحلي' : 'Votre adhésion est en cours de vérification par le responsable local',
        verified: lang === 'ar' ? 'تم التحقق من انخراطك بنجاح من طرف المسؤول المحلي' : 'Votre adhésion a été vérifiée par le responsable local',
      };

      await supabase.from('notifications').insert({
        user_id: targetUser.user_id,
        title: notifTitles[status],
        message: notifMessages[status],
        link: '/profile',
      });

      setUsers(prev => prev.map(u =>
        u.user_id === targetUser.user_id ? { ...u, ...updateData } : u
      ));
      toast({ title: lang === 'ar' ? 'تم التحديث بنجاح' : 'Mis à jour avec succès' });
    } catch (err: any) {
      toast({ title: lang === 'ar' ? 'خطأ' : 'Erreur', description: err?.message, variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const getMembershipStatus = (u: UserProfile): 'not_member' | 'pending' | 'verified' => {
    if (!u.is_member) return 'not_member';
    if (u.membership_verified) return 'verified';
    return 'pending';
  };

  const getCardClasses = (status: 'not_member' | 'pending' | 'verified') => {
    switch (status) {
      case 'verified': return 'border-blue-300 bg-blue-50/60 shadow-blue-100/50';
      case 'pending': return 'border-amber-300 bg-amber-50/60 shadow-amber-100/50';
      default: return 'border-gray-200 bg-gray-50/50 shadow-gray-100/50';
    }
  };

  const filteredUsers = users.filter(u => {
    if (filterName !== 'all' && u.full_name !== filterName) return false;
    if (filterEmployee !== 'all' && u.employee_number !== filterEmployee) return false;
    if (filterInstitution !== 'all' && u.institution !== filterInstitution) return false;
    return true;
  });

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <AuthenticatedLayout>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {t.membershipVerification || (lang === 'ar' ? 'التحقق من الانخراط' : "Vérification d'adhésion")}
          </h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[hsl(207,75%,17%)] to-[hsl(207,62%,40%)] text-white font-medium text-sm shadow-lg hover:shadow-xl hover:opacity-90 transition-all duration-300"
          >
            {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {t.backToDashboard}
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-blue-700">{lang === 'ar' ? 'الاسم' : 'Nom'}</label>
            <Select value={filterName} onValueChange={setFilterName}>
              <SelectTrigger className="focus:ring-blue-400 border-blue-200 text-blue-700">
                <SelectValue placeholder={lang === 'ar' ? 'الكل' : 'Tous'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="focus:bg-blue-100 focus:text-blue-900">{lang === 'ar' ? 'الكل' : 'Tous'}</SelectItem>
                {uniqueNames.map(n => <SelectItem key={n} value={n} className="focus:bg-blue-100 focus:text-blue-900">{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-amber-700">{lang === 'ar' ? 'رقم التأجير' : 'N° employé'}</label>
            <Select value={filterEmployee} onValueChange={setFilterEmployee}>
              <SelectTrigger className="focus:ring-amber-400 border-amber-200 text-amber-700">
                <SelectValue placeholder={lang === 'ar' ? 'الكل' : 'Tous'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="focus:bg-amber-100 focus:text-amber-900">{lang === 'ar' ? 'الكل' : 'Tous'}</SelectItem>
                {uniqueEmployees.map(n => <SelectItem key={n} value={n} className="focus:bg-amber-100 focus:text-amber-900">{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-emerald-700">{lang === 'ar' ? 'المؤسسة' : 'Établissement'}</label>
            <Select value={filterInstitution} onValueChange={setFilterInstitution}>
              <SelectTrigger className="focus:ring-emerald-400 border-emerald-200 text-emerald-700">
                <SelectValue placeholder={lang === 'ar' ? 'الكل' : 'Tous'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="focus:bg-emerald-100 focus:text-emerald-900">{lang === 'ar' ? 'الكل' : 'Tous'}</SelectItem>
                {uniqueInstitutions.map(n => <SelectItem key={n} value={n} className="focus:bg-emerald-100 focus:text-emerald-900">{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasActiveFilter && (
          <button onClick={resetFilters} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-4">
            <RotateCcw className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'إعادة تعيين الفلاتر' : 'Réinitialiser les filtres'}
          </button>
        )}

        {/* Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {lang === 'ar' ? `${filteredUsers.length} مسجل(ة)` : `${filteredUsers.length} inscrit(e)s`}
        </div>

        {loadingData ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-premium p-12 text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg text-muted-foreground">{t.noUsers}</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((u, index) => {
              const status = getMembershipStatus(u);
              return (
                <motion.div
                  key={u.user_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.5), ease: 'easeOut' }}
                  className={`rounded-2xl border-2 p-5 shadow-sm hover:shadow-md transition-all duration-200 ${getCardClasses(status)}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-foreground truncate">{u.full_name || '—'}</p>
                          <VerifiedBadge status={getBadgeStatus(null, u.is_member, u.membership_verified)} size={18} />
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" />{u.employee_number || '—'}</span>
                          <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{u.institution || '—'}</span>
                          {u.membership_card_number && (
                            <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" />{u.membership_card_number}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {updatingId === u.user_id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      ) : (
                        <>
                          {([
                            { key: 'verified' as const, label: lang === 'ar' ? 'منخرط مفعل' : 'Vérifié', color: 'text-blue-600' },
                            { key: 'pending' as const, label: lang === 'ar' ? 'قيد التحقق' : 'En attente', color: 'text-amber-600' },
                            { key: 'not_member' as const, label: lang === 'ar' ? 'غير منخرط' : 'Non adhérent', color: 'text-muted-foreground' },
                          ]).map(opt => (
                            <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={status === opt.key}
                                onCheckedChange={() => handleSetMembershipStatus(u, opt.key)}
                                disabled={status === opt.key}
                              />
                              <span className={`text-sm font-medium ${opt.color}`}>{opt.label}</span>
                            </label>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
};

export default MembershipVerification;
