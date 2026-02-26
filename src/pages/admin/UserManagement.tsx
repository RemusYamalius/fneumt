import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Users, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import logoFne from '@/assets/logo-fne.png';
import { getAllowedPromotions, getGeoConstraint } from '@/lib/role-hierarchy';
import type { AppRole } from '@/lib/role-hierarchy';
import { ACADEMIES } from '@/lib/academies-data';

interface UserWithRole {
  user_id: string;
  full_name: string | null;
  email: string | null;
  corps: string | null;
  institution: string | null;
  academy: string | null;
  directorate: string | null;
  role: AppRole;
}

const UserManagement = () => {
  const { t, dir } = useI18n();
  const { user, role: myRole, profile: myProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [filterAcademy, setFilterAcademy] = useState<string>('all');
  const [filterDirectorate, setFilterDirectorate] = useState<string>('all');

  const fetchUsers = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, email, corps, institution, academy, directorate'),
      supabase.from('user_roles').select('user_id, role'),
    ]);

    if (profilesRes.data && rolesRes.data) {
      const roleMap = new Map(rolesRes.data.map(r => [r.user_id, r.role as AppRole]));
      const merged: UserWithRole[] = profilesRes.data.map(p => ({
        ...p,
        role: roleMap.get(p.user_id) || 'teacher',
      }));
      setUsers(merged);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  // Get allowed promotions for the current user's role
  const allowedPromotions = useMemo(() => {
    if (!myRole) return [];
    return getAllowedPromotions(myRole);
  }, [myRole]);

  // Filter users based on geographic constraints and profile completeness
  const filteredUsers = useMemo(() => {
    if (!myRole || !myProfile) return [];
    const geoConstraint = getGeoConstraint(myRole);

    return users.filter(u => {
      // Don't show self
      if (u.user_id === user?.id) return false;

      // Admin sees all
      if (myRole === 'admin') {
        // Apply UI filters
        if (filterAcademy !== 'all' && u.academy !== filterAcademy) return false;
        if (filterDirectorate !== 'all' && u.directorate !== filterDirectorate) return false;
        return true;
      }

      // Must have profile filled (academy at least)
      if (!u.academy) return false;

      // Geographic constraints
      if (geoConstraint === 'academy' && u.academy !== myProfile.academy) return false;
      if (geoConstraint === 'directorate') {
        if (u.academy !== myProfile.academy || u.directorate !== myProfile.directorate) return false;
      }

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

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    setSaving(userId);
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole } as any)
      .eq('user_id', userId);

    if (error) {
      toast({ title: t.error || 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t.roleUpdated });
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role: newRole } : u));
    }
    setSaving(null);
  };

  const getRoleLabel = (role: AppRole): string => {
    return t[`role_${role}`] || role;
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="gradient-primary text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoFne} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
            <div>
              <p className="font-bold text-sm">{t.platformName}</p>
              <p className="text-xs text-white/70">{t.userManagement}</p>
            </div>
          </div>
          <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => navigate('/dashboard')}>
            <ArrowRight className="w-4 h-4" />
            {t.backToDashboard}
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t.userManagement}</h1>
            <p className="text-sm text-muted-foreground">{t.userManagementDesc}</p>
          </div>
        </div>

        {/* Filters */}
        {myRole === 'admin' && (
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">{t.filterLabel || 'فلتر'}:</span>
            </div>
            <Select value={filterAcademy} onValueChange={(v) => { setFilterAcademy(v); setFilterDirectorate('all'); }}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder={t.academyLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allAcademies || 'جميع الأكاديميات'}</SelectItem>
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
                <SelectItem value="all">{t.allDirectorates || 'جميع المديريات'}</SelectItem>
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
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.fullNameLabel}</TableHead>
                  <TableHead>{t.emailLabel}</TableHead>
                  <TableHead>{t.academyLabel}</TableHead>
                  <TableHead>{t.directorateLabel}</TableHead>
                  <TableHead>{t.roleLabel || 'الدور'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.full_name || '—'}</TableCell>
                    <TableCell>{u.email || '—'}</TableCell>
                    <TableCell className="text-xs">{u.academy || '—'}</TableCell>
                    <TableCell className="text-xs">{u.directorate || '—'}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(val) => handleRoleChange(u.user_id, val as AppRole)}
                        disabled={saving === u.user_id}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Current role always shown */}
                          <SelectItem value={u.role}>
                            {getRoleLabel(u.role)}
                          </SelectItem>
                          {/* Allowed promotions */}
                          {allowedPromotions
                            .filter(r => r !== u.role)
                            .map(r => (
                              <SelectItem key={r} value={r}>
                                {getRoleLabel(r)}
                              </SelectItem>
                            ))}
                          {/* Teacher option for demotion */}
                          {u.role !== 'teacher' && !allowedPromotions.includes('teacher') && myRole === 'admin' && (
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
                      {t.noUsers || 'لا يوجد مستخدمون'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserManagement;
