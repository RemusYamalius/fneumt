import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Globe, ArrowLeft, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnimatedLogo from '@/components/AnimatedLogo';
import authReference from '@/assets/auth-reference.png';

const Login = () => {
  const { t, toggleLang, dir } = useI18n();
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  const showcaseTitle = dir === 'rtl' ? 'أقـــرب / أســـرع / أنجـــع' : 'Closer / Faster / Better';
  const showcaseCopy = dir === 'rtl'
    ? 'تجربة مصادقة جديدة بلمسة فاخرة، واضحة وسريعة، وتليق بمنصة FNE-UMT.'
    : 'A polished authentication experience with a premium, clear, and modern feel for FNE-UMT.';
  const showcaseKicker = dir === 'rtl' ? 'منصة FNE-UMT' : 'FNE-UMT Platform';
  const authSubtitle = dir === 'rtl'
    ? 'ولوج موحد بتصميم عصري يضع السرعة والوضوح في الواجهة.'
    : 'A unified access point designed for speed, clarity, and confidence.';

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'login' | 'signup');
    setLoginError('');
    setSignupError('');
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      setLoginError(error.message);
      setLoginLoading(false);
      return;
    }

    navigate('/dashboard');
  };

  const handleSignupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess(false);

    if (signupPassword.length < 6) {
      setSignupError(t.passwordMinLength);
      return;
    }

    setSignupLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, fullName);

    if (error) {
      setSignupError(error.message);
      setSignupSuccess(false);
    } else {
      setSignupSuccess(true);
    }

    setSignupLoading(false);
  };

  return (
    <div className="auth-shell relative min-h-screen overflow-hidden" dir={dir}>
      <div className="pointer-events-none absolute inset-0">
        <div className="auth-orb auth-orb-primary" />
        <div className="auth-orb auth-orb-accent" />
      </div>

      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between gap-3" style={{ direction: 'ltr' }}>
        <Link to="/" className="auth-top-link">
          {dir === 'rtl' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          {t.backToHome}
        </Link>

        <button type="button" onClick={toggleLang} className="auth-top-link">
          <Globe className="h-4 w-4" />
          {t.langSwitch}
        </button>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-24 lg:px-8">
        <div className="auth-frame grid w-full max-w-6xl overflow-hidden lg:grid-cols-[1.08fr_0.92fr]">
          <aside className="auth-showcase min-h-[320px]">
            <img
              src={authReference}
              alt="واجهة توضيحية مؤقتة لبطاقة المصادقة"
              className="auth-showcase-image"
              loading="eager"
            />

            <div className="auth-showcase-content">
              <div className="flex items-start justify-between gap-4">
                <div className="auth-showcase-badge">
                  <Sparkles className="h-4 w-4" />
                  {showcaseKicker}
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-md">
                  <AnimatedLogo size="w-12 h-12" />
                </div>
              </div>

              <div className="max-w-xl space-y-4">
                <p className="auth-showcase-label">{dir === 'rtl' ? 'تجربة دخول متجددة' : 'Reimagined access experience'}</p>
                <h1 className="auth-showcase-headline">{showcaseTitle}</h1>
                <p className="auth-showcase-copy">{showcaseCopy}</p>
              </div>
            </div>
          </aside>

          <section className="auth-panel">
            <div className="auth-panel-inner">
              <div className="space-y-6">
                <div className="space-y-4 text-center lg:text-start">
                  <div className="auth-mini-badge">
                    <span className="auth-mini-badge-dot" />
                    {showcaseKicker}
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tight text-foreground">
                      {dir === 'rtl' ? 'مرحبا بك(ِ)' : 'Welcome back'}
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {authSubtitle}
                    </p>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="auth-tabs">
                    <TabsTrigger value="login" className="auth-tab-trigger">
                      {t.loginTitle}
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="auth-tab-trigger">
                      {t.createAccount}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="mt-6">
                    <form onSubmit={handleLoginSubmit} className="space-y-5">
                      {loginError && <div className="auth-message auth-message-error">{loginError}</div>}

                      <div className="space-y-2">
                        <Label htmlFor="login-email">{t.emailLabel}</Label>
                        <Input
                          id="login-email"
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                          dir="ltr"
                          className="auth-input"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <Label htmlFor="login-password">{t.passwordLabel}</Label>
                          <Link to="/forgot-password" className="text-sm font-medium text-primary transition-colors hover:text-accent">
                            {t.forgotPassword}
                          </Link>
                        </div>

                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showLoginPassword ? 'text' : 'password'}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                            dir="ltr"
                            className="auth-input pe-11"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="auth-eye-toggle"
                            aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                          >
                            {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <Button type="submit" className="auth-submit w-full" disabled={loginLoading}>
                        {loginLoading ? '...' : t.loginButton}
                      </Button>

                      <div className="text-center text-sm text-muted-foreground">
                        {t.noAccount}{' '}
                        <button
                          type="button"
                          onClick={() => handleTabChange('signup')}
                          className="font-bold text-primary transition-colors hover:text-accent"
                        >
                          {t.createAccount}
                        </button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="mt-6">
                    {signupSuccess ? (
                      <div className="auth-message auth-message-success flex flex-col items-center gap-4 py-8 text-center">
                        <CheckCircle className="h-14 w-14 text-accent" />
                        <p className="max-w-sm text-sm leading-6 text-foreground">{t.signupSuccess}</p>
                        <Button type="button" className="auth-submit" onClick={() => handleTabChange('login')}>
                          {t.backToLogin}
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleSignupSubmit} className="space-y-5">
                        {signupError && <div className="auth-message auth-message-error">{signupError}</div>}

                        <div className="space-y-2">
                          <Label htmlFor="signup-name">{t.fullNameLabel}</Label>
                          <Input
                            id="signup-name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            className="auth-input"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-email">{t.emailLabel}</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            required
                            dir="ltr"
                            className="auth-input"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-password">{t.passwordLabel}</Label>
                          <div className="relative">
                            <Input
                              id="signup-password"
                              type={showSignupPassword ? 'text' : 'password'}
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              required
                              dir="ltr"
                              className="auth-input pe-11"
                            />
                            <button
                              type="button"
                              onClick={() => setShowSignupPassword(!showSignupPassword)}
                              className="auth-eye-toggle"
                              aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                            >
                              {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <Button type="submit" className="auth-submit w-full" disabled={signupLoading}>
                          {signupLoading ? '...' : t.signupButton}
                        </Button>

                        <div className="text-center text-sm text-muted-foreground">
                          {t.hasAccount}{' '}
                          <button
                            type="button"
                            onClick={() => handleTabChange('login')}
                            className="font-bold text-primary transition-colors hover:text-accent"
                          >
                            {t.loginTitle}
                          </button>
                        </div>
                      </form>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Login;
