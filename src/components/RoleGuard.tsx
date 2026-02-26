import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import type { AppRole } from '@/lib/role-hierarchy';

interface RoleGuardProps {
  allowedRoles: AppRole[];
  children: React.ReactNode;
}

const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !role || !allowedRoles.includes(role))) {
      navigate('/dashboard');
    }
  }, [loading, user, role, allowedRoles, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !role || !allowedRoles.includes(role)) return null;

  return <>{children}</>;
};

export default RoleGuard;
