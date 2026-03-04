import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Globe, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import logoFne from '@/assets/logo-fne.png';

const Login = () => {
  const { t, toggleLang, dir } = useI18n();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col" dir={dir}>
      <div className="absolute top-4 left-4 right-4 flex justify-between z-20" style={{ direction: 'ltr' }}>
        <Link to="/" className="glass flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-foreground hover:bg-white/90 transition-all shadow-lg">
          <ArrowRight className="w-4 h-4" />
          {t.backToHome}
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 backdrop-blur-sm p-2 border border-white/20">
              <img src={logoFne} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-white">{t.loginTitle}</h1>
          </div>

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

            <div className="space-y-2">
              <Label htmlFor="password">{t.passwordLabel}</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required dir="ltr" className="ps-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 -translate-y-1/2 start-3 text-xs text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '...' : t.loginButton}
            </Button>

            <div className="flex flex-col items-center gap-2 text-sm">
              <Link to="/forgot-password" className="text-primary hover:underline">{t.forgotPassword}</Link>
              <span className="text-muted-foreground">
                {t.noAccount}{' '}
                <Link to="/signup" className="text-primary hover:underline">{t.createAccount}</Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
