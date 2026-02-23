import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import logoFne from '@/assets/logo-fne.png';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRole {
  user_id: string;
  full_name: string | null;
  email: string | null;
  corps: string | null;
  institution: string | null;
  role: AppRole;
}

const UserManagement = () => {
  const { t, dir } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, email, corps, institution'),
      supabase.from('user_roles').select('user_id, role'),
    ]);

    if (profilesRes.data && rolesRes.data) {
      const roleMap = new Map(rolesRes.data.map(r => [r.user_id, r.role]));
      const merged: UserWithRole[] = profilesRes.data.map(p => ({
        ...p,
        role: roleMap.get(p.user_id) || 'teacher',
      }));
      setUsers(merged);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    setSaving(userId);
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', userId);

    if (error) {
      toast({ title: t.error || 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t.roleUpdated });
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role: newRole } : u));
    }
    setSaving(null);
  };

  const roleLabels: Record<AppRole, string> = {
    teacher: t.roleTeacher,
    union_officer: t.roleOfficer,
    admin: t.roleAdmin,
  };

  const corpsLabels: Record<string, string> = {
    primary: t.corpsPrimary || 'ابتدائي',
    middle_school: t.corpsMiddle || 'إعدادي',
    high_school: t.corpsHigh || 'ثانوي',
    administrative: t.corpsAdmin || 'إداري',
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
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t.userManagement}</h1>
            <p className="text-sm text-muted-foreground">{t.userManagementDesc}</p>
          </div>
        </div>

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
                  <TableHead>{t.corpsLabel || 'السلك'}</TableHead>
                  <TableHead>{t.institutionLabel || 'المؤسسة'}</TableHead>
                  <TableHead>{t.roleLabel || 'الدور'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.full_name || '—'}</TableCell>
                    <TableCell>{u.email || '—'}</TableCell>
                    <TableCell>{u.corps ? corpsLabels[u.corps] || u.corps : '—'}</TableCell>
                    <TableCell>{u.institution || '—'}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(val) => handleRoleChange(u.user_id, val as AppRole)}
                        disabled={saving === u.user_id || u.user_id === user?.id}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="teacher">
                            {roleLabels.teacher}
                          </SelectItem>
                          <SelectItem value="union_officer">
                            {roleLabels.union_officer}
                          </SelectItem>
                          <SelectItem value="admin">
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              {roleLabels.admin}
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
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
