
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, User, Building2, CreditCard, Hash, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import AnimatedLogo from '@/components/AnimatedLogo';
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
  const [searchQuery, setSearchQuery] = useState('');
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

    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, employee_number, institution, membership_card_number, is_member, membership_verified, email')
      .eq('academy', profile.academy)
      .eq('directorate', profile.directorate)
      .neq('user_id', user!.id)
      .order('full_name', { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setUsers(data || []);
    }
    setLoadingData(false);
  };

  const handleSetMembershipStatus = async (targetUser: UserProfile, status: 'not_member' | 'pending' | 'verified') => {
    setUpdatingId(targetUser.user_id);
    try {
      const updateData: Record<string, any> = {
        is_member: status !== 'not_member',
        membership_verified: status === 'verified',
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', targetUser.user_id);

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
        u.user_id === targetUser.user_id
          ? { ...u, is_member: updateData.is_member, membership_verified: updateData.membership_verified }
          : u
      ));

      toast({
        title: lang === 'ar' ? 'تم التحديث بنجاح' : 'Mis à jour avec succès',
      });
    } catch (err: any) {
      toast({
        title: lang === 'ar' ? 'خطأ' : 'Erreur',
        description: err?.message,
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getMembershipStatus = (u: UserProfile): 'not_member' | 'pending' | 'verified' => {
    if (!u.is_member) return 'not_member';
    if (u.membership_verified) return 'verified';
    return 'pending';
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.employee_number?.toLowerCase().includes(q) ||
      u.institution?.toLowerCase().includes(q) ||
      u.membership_card_number?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="gradient-primary text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <AnimatedLogo size="w-20 h-20" />
          <div>
            <p className="font-bold text-sm">{t.membershipVerification || (lang === 'ar' ? 'التحقق من الانخراط' : "Vérification d'adhésion")}</p>
            <p className="text-xs text-white/70">{t.platformName}</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {t.membershipVerification || (lang === 'ar' ? 'التحقق من الانخراط' : "Vérification d'adhésion")}
          </h1>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground start-3" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={lang === 'ar' ? 'بحث بالاسم أو رقم التأجير...' : 'Rechercher par nom ou numéro...'}
                className="ps-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {t.backToDashboard}
            </Button>
          </div>
        </div>

        {/* Users count */}
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
            {filteredUsers.map((u, index) => (
              <motion.div
                key={u.user_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.5), ease: 'easeOut' }}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* User info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground truncate">{u.full_name || '—'}</p>
                        <VerifiedBadge
                          status={getBadgeStatus(null, u.is_member, u.membership_verified)}
                          size={18}
                        />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5" />
                          {u.employee_number || '—'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" />
                          {u.institution || '—'}
                        </span>
                        {u.membership_card_number && (
                          <span className="flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5" />
                            {u.membership_card_number}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status options */}
                  <div className="flex items-center gap-4 shrink-0">
                    {updatingId === u.user_id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : (
                      <>
                        {([
                          { key: 'verified' as const, label: lang === 'ar' ? 'منخرط مفعل' : 'Vérifié', color: 'text-blue-600' },
                          { key: 'pending' as const, label: lang === 'ar' ? 'قيد التحقق' : 'En attente', color: 'text-foreground' },
                          { key: 'not_member' as const, label: lang === 'ar' ? 'غير منخرط' : 'Non adhérent', color: 'text-muted-foreground' },
                        ]).map(opt => {
                          const current = getMembershipStatus(u);
                          return (
                            <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={current === opt.key}
                                onCheckedChange={() => handleSetMembershipStatus(u, opt.key)}
                                disabled={current === opt.key}
                              />
                              <span className={`text-sm font-medium ${opt.color}`}>
                                {opt.label}
                              </span>
                            </label>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MembershipVerification;
