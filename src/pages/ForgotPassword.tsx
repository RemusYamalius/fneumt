import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AnimatedLogo from '@/components/AnimatedLogo';

const ForgotPassword = () => {
  const { t, toggleLang, dir } = useI18n();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await resetPassword(email);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col" dir={dir}>
      <div className="absolute top-4 left-4 right-4 flex justify-between z-20" style={{ direction: 'ltr' }}>
        <Link to="/login" className="glass flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-foreground hover:bg-white/90 transition-all shadow-lg">
          {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {t.backToLogin}
        </Link>
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
            <div className="w-16 h-16 mx-auto mb-4">
              <AnimatedLogo size="w-16 h-16" />
            </div>
            <h1 className="text-2xl font-bold text-white">{t.forgotPasswordTitle}</h1>
          </div>

          {sent ? (
            <div className="card-premium p-8 text-center space-y-4 shadow-2xl">
              <CheckCircle className="w-16 h-16 text-accent mx-auto" />
              <p className="text-foreground">{t.resetEmailSent}</p>
              <Link to="/login">
                <Button variant="outline" className="mt-4">{t.backToLogin}</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card-premium p-8 space-y-5 shadow-2xl">
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t.emailLabel}</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '...' : t.sendResetLink}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
