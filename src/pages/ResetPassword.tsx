import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, CheckCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AnimatedLogo from '@/components/AnimatedLogo';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword = () => {
  const { t, toggleLang, dir } = useI18n();
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    // Check if we have a recovery hash
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setReady(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError(t.passwordMinLength);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.passwordsMismatch);
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(password);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col" dir={dir}>
      <div className="absolute top-4 right-4 z-20">
        <button onClick={toggleLang} className="glass flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-foreground hover:bg-white/90 transition-all shadow-lg">
          <Globe className="w-4 h-4" />
          {t.langSwitch}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center gradient-hero relative overflow-hidden px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-32 h-32 mx-auto mb-4">
              <AnimatedLogo size="w-32 h-32" />
            </div>
            <h1 className="text-2xl font-bold text-white">{t.resetPasswordTitle}</h1>
          </div>

          {success ? (
            <div className="glass rounded-2xl p-8 text-center space-y-4 shadow-2xl">
              <CheckCircle className="w-16 h-16 text-accent mx-auto" />
              <p className="text-foreground">{t.passwordUpdated}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-5 shadow-2xl">
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">{t.passwordLabel}</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t.confirmPasswordLabel}</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required dir="ltr" />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !ready}>
                {loading ? '...' : t.updatePassword}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
