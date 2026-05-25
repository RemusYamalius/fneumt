import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Shield, Users, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { getAllowedPromotions, getGeoConstraint } from '@/lib/role-hierarchy';
import type { AppRole } from '@/lib/role-hierarchy';
import { ACADEMIES } from '@/lib/academies-data';
import { logSecurityEvent } from '@/lib/security-audit';

interface UserWithRole {
  user_id: string;
  full_name: string | null;
  email: string | null;
  corps: string | null;
  institution: string | null;
  academy: string | null;
  directorate: string | null;
  role: AppRole;
  promoted_by: string | null;
}

const UserManagement = () => {
  const { t, dir } = useI18n();
  const { user, role: myRole, profile: myProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [occupiedNationalRoles, setOccupiedNationalRoles] = useState<Set<string>>(new Set());
  const [filterAcademy, setFilterAcademy] = useState<string>('all');
  const [filterDirectorate, setFilterDirectorate] = useState<string>('all');

  const fetchUsers = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, email, corps, institution, academy, directorate'),
      supabase.from('user_roles').select('user_id, role, promoted_by'),
    ]);

    if (profilesRes.data && rolesRes.data) {
      const roleMap = new Map(rolesRes.data.map(r => [r.user_id, { role: r.role as AppRole, promoted_by: (r as any).promoted_by as string | null }]));
      const merged: UserWithRole[] = profilesRes.data.map(p => ({
        ...p,
        role: roleMap.get(p.user_id)?.role || 'teacher',
        promoted_by: roleMap.get(p.user_id)?.promoted_by || null,
      }));
      setUsers(merged);

      // Track which national roles are already occupied
      const occupied = new Set<string>();
      for (const r of rolesRes.data) {
        if (r.role === 'national_secretary' || r.role === 'deputy_national_secretary') {
          occupied.add(r.role);
        }
      }
      setOccupiedNationalRoles(occupied);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const allowedPromotions = useMemo(() => {
    if (!myRole) return [];
    return getAllowedPromotions(myRole);
  }, [myRole]);

  // Filter: admin sees all, others see only users they promoted + teachers in their geo scope
  const filteredUsers = useMemo(() => {
    if (!myRole || !myProfile) return [];
    const geoConstraint = getGeoConstraint(myRole);

    return users.filter(u => {
      if (u.user_id === user?.id) return false;

      if (['admin', 'national_secretary', 'deputy_national_secretary'].includes(myRole)) {
        if (filterAcademy !== 'all' && u.academy !== filterAcademy) return false;
        if (filterDirectorate !== 'all' && u.directorate !== filterDirectorate) return false;
        return true;
      }

      // Non-admin: show users promoted by me, OR teachers in my geo scope (for new assignments)
      const isMyAppointee = u.promoted_by === user?.id;
      const isTeacherInScope = u.role === 'teacher' && (() => {
        if (!u.academy) return false;
        if (geoConstraint === 'academy' && u.academy !== myProfile.academy) return false;
        if (geoConstraint === 'directorate') {
          if (u.academy !== myProfile.academy || u.directorate !== myProfile.directorate) return false;
        }
        return true;
      })();

      if (!isMyAppointee && !isTeacherInScope) return false;

      // Apply UI filters
      if (filterAcademy !== 'all' && u.academy !== filterAcademy) return false;
      if (filterDirectorate !== 'all' && u.directorate !== filterDirectorate) return false;

      return true;
    });
  }, [users, myRole, myProfile, user, filterAcademy, filterDirectorate]);

  const directoratesForFilter = useMemo(() => {
    const academy = filterAcademy !== 'all' ? filterAcademy : myProfile?.academy;
    if (!academy) return [];
    const found = ACADEMIES.find(a => a.label === academy);
    return found?.directorates || [];
  }, [filterAcademy, myProfile]);

  const isNationalRole = (role: AppRole) => role === 'national_secretary' || role === 'deputy_national_secretary';

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    if (!user) return;

    // Check uniqueness for national roles
    if (isNationalRole(newRole)) {
      const currentHolder = users.find(u => u.role === newRole && u.user_id !== userId);
      if (currentHolder) {
        toast({
          title: t.error || 'خطأ',
          description: dir === 'rtl'
            ? `هذا المنصب مشغول بالفعل من طرف ${currentHolder.full_name || 'مستخدم آخر'}`
            : `Ce poste est déjà occupé par ${currentHolder.full_name || 'un autre utilisateur'}`,
          variant: 'destructive',
        });
        return;
      }
    }

    setSaving(userId);
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole, promoted_by: user.id } as any)
      .eq('user_id', userId);

    if (error) {
      toast({ title: t.error || 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      // Update occupied national roles tracking
      const oldRole = users.find(u => u.user_id === userId)?.role;
      setOccupiedNationalRoles(prev => {
        const next = new Set(prev);
        if (oldRole && isNationalRole(oldRole)) next.delete(oldRole);
        if (isNationalRole(newRole)) next.add(newRole);
        return next;
      });
      // Audit log: role change is a critical security event
      logSecurityEvent('role_changed', 'critical', {
        target_user_id: userId,
        old_role: oldRole,
        new_role: newRole,
      }, user.id);
      toast({ title: t.roleUpdated });
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role: newRole, promoted_by: user.id } : u));
    }
    setSaving(null);
  };

  const getRoleLabel = (role: AppRole): string => {
    return t[`role_${role}`] || role;
  };

  return (
    <AuthenticatedLayout>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="rounded-full bg-gradient-to-r from-[hsl(207,78%,28%)] to-[hsl(207,78%,38%)] text-white hover:from-[hsl(207,78%,24%)] hover:to-[hsl(207,78%,34%)] hover:text-white px-5 py-2 gap-2 shadow-md"
          >
            {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {dir === 'rtl' ? 'العودة للوحة التحكم' : 'Retour au tableau de bord'}
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-6 bg-gradient-to-br from-slate-50 to-blue-50/40 p-5 rounded-2xl border border-blue-100/40">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-blue-100/60 text-blue-800 px-3 py-1 rounded-lg inline-block">{t.userManagement}</h1>
            <p className="text-sm bg-emerald-100/60 text-emerald-700 px-2 py-0.5 rounded-md inline-block">{t.userManagementDesc}</p>
          </div>
        </div>

        {/* Filters */}
        {myRole && ['admin', 'national_secretary', 'deputy_national_secretary'].includes(myRole) && (
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gradient-to-br from-slate-100/80 to-blue-50/50 rounded-xl border border-white/60 shadow-sm">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-bold bg-blue-100/60 text-blue-700 px-2 py-0.5 rounded-md">{t.filterLabel || 'فلتر'}:</span>
            </div>
            <Select value={filterAcademy} onValueChange={(v) => { setFilterAcademy(v); setFilterDirectorate('all'); }}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder={t.academyLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allAcademies}</SelectItem>
                {ACADEMIES.map(a => (
                  <SelectItem key={a.label} value={a.label}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDirectorate} onValueChange={setFilterDirectorate} disabled={filterAcademy === 'all'}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder={t.directorateLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allDirectorates}</SelectItem>
                {directoratesForFilter.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border border-blue-100/40 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-[hsl(207,78%,28%)] to-[hsl(207,78%,38%)]">
                  <TableHead className="text-white font-bold text-right">{t.fullNameLabel}</TableHead>
                  <TableHead className="text-white font-bold text-right">{t.emailLabel}</TableHead>
                  <TableHead className="text-white font-bold text-right">{t.academyLabel}</TableHead>
                  <TableHead className="text-white font-bold text-right">{t.directorateLabel}</TableHead>
                  <TableHead className="text-white font-bold text-right">{t.roleLabel || 'الدور'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium text-right">{u.full_name || '—'}</TableCell>
                    <TableCell className="text-right">{u.email || '—'}</TableCell>
                    <TableCell className="text-xs text-right">{u.academy || '—'}</TableCell>
                    <TableCell className="text-xs text-right">{u.directorate || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={u.role}
                        onValueChange={(val) => handleRoleChange(u.user_id, val as AppRole)}
                        disabled={saving === u.user_id}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={u.role}>
                            {getRoleLabel(u.role)}
                          </SelectItem>
                          {allowedPromotions
                            .filter(r => r !== u.role)
                            .filter(r => !isNationalRole(r) || !occupiedNationalRoles.has(r))
                            .map(r => (
                              <SelectItem key={r} value={r}>
                                {getRoleLabel(r)}
                              </SelectItem>
                            ))}
                          {u.role !== 'teacher' && !allowedPromotions.includes('teacher') && myRole && ['admin', 'national_secretary', 'deputy_national_secretary'].includes(myRole) && (
                            <SelectItem value="teacher">{getRoleLabel('teacher')}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t.noUsers}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </AuthenticatedLayout>
  );
};

export default UserManagement;
