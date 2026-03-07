import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Globe, ArrowLeft, ArrowRight, CheckCircle, Mail, Lock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AnimatedLogo from '@/components/AnimatedLogo';

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

  const handleTabChange = (value: 'login' | 'signup') => {
    setActiveTab(value);
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
    } else {
      setSignupSuccess(true);
    }
    setSignupLoading(false);
  };

  const isLogin = activeTab === 'login';

  return (
    <div className="relative min-h-screen overflow-hidden bg-secondary" dir={dir}>
      {/* Top bar */}
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

      {/* Main container */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-40 lg:py-24 lg:px-8">
        <div className="login-card grid w-full max-w-5xl lg:grid-cols-[0.45fr_0.55fr]">

          {/* Left decorative panel */}
          <aside className="login-left-panel relative hidden lg:flex flex-col items-center justify-center overflow-hidden rounded-s-3xl">
            {/* Chevron layers */}
            <div className="login-chevron login-chevron-1" />
            <div className="login-chevron login-chevron-2" />
            <div className="login-chevron login-chevron-3" />

            {/* Tab switchers on left panel — aligned to the right edge */}
            <div className="relative z-10 flex flex-col items-end gap-1.5 w-full" style={{ paddingInlineEnd: 0, paddingInlineStart: '40%' }}>
              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className={`login-left-tab ${isLogin ? 'login-left-tab-active' : 'login-left-tab-inactive'}`}
              >
                {t.loginTitle}
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('signup')}
                className={`login-left-tab ${!isLogin ? 'login-left-tab-active' : 'login-left-tab-inactive'}`}
              >
                {t.createAccount}
              </button>
            </div>
          </aside>

          {/* Right form panel */}
          <section className="login-form-panel flex flex-col items-center px-6 pt-0 pb-10 sm:px-10 lg:px-12 lg:pb-14 rounded-3xl lg:rounded-none">
            {/* Floating logo — half above the white panel edge */}
            <div className="relative z-30 -mt-20 animate-logo-float mb-6">
              <AnimatedLogo size="w-40 h-40" />
            </div>

            <h2 className="text-2xl font-black tracking-tight text-foreground mb-1">
              {isLogin
                ? (dir === 'rtl' ? 'تسجيل الدخول' : 'Login')
                : (dir === 'rtl' ? 'إنشاء حساب' : 'Sign Up')}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {isLogin
                ? (dir === 'rtl' ? 'أدخل بياناتك للمتابعة' : 'Enter your credentials to continue')
                : (dir === 'rtl' ? 'أنشئ حسابك الجديد' : 'Create your new account')}
            </p>

            {/* Mobile tab switcher */}
            <div className="auth-tabs mb-6 lg:hidden">
              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className={`auth-tab-trigger ${isLogin ? '' : ''}`}
                data-state={isLogin ? 'active' : 'inactive'}
              >
                {t.loginTitle}
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('signup')}
                className="auth-tab-trigger"
                data-state={!isLogin ? 'active' : 'inactive'}
              >
                {t.createAccount}
              </button>
            </div>

            <div className="w-full max-w-sm">
              <AnimatePresence mode="wait">
                {isLogin ? (
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    onSubmit={handleLoginSubmit}
                    className="space-y-5"
                  >
                    {loginError && <div className="auth-message auth-message-error">{loginError}</div>}

                    <div className="space-y-2">
                      <Label htmlFor="login-email">{t.emailLabel}</Label>
                      <div className="relative">
                        <Mail className="login-field-icon" />
                        <Input
                          id="login-email"
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                          dir="ltr"
                          className="auth-input ps-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="login-password">{t.passwordLabel}</Label>
                        <Link to="/forgot-password" className="text-sm font-medium text-primary transition-colors hover:text-accent">
                          {t.forgotPassword}
                        </Link>
                      </div>
                      <div className="relative">
                        <Lock className="login-field-icon" />
                        <Input
                          id="login-password"
                          type={showLoginPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          dir="ltr"
                          className="auth-input ps-11 pe-11"
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

                    <div className="text-center text-sm text-muted-foreground lg:hidden">
                      {t.noAccount}{' '}
                      <button type="button" onClick={() => handleTabChange('signup')} className="font-bold text-primary hover:text-accent">
                        {t.createAccount}
                      </button>
                    </div>
                  </motion.form>
                ) : signupSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="auth-message auth-message-success flex flex-col items-center gap-4 py-8 text-center"
                  >
                    <CheckCircle className="h-14 w-14 text-accent" />
                    <p className="max-w-sm text-sm leading-6 text-foreground">{t.signupSuccess}</p>
                    <Button type="button" className="auth-submit" onClick={() => handleTabChange('login')}>
                      {t.backToLogin}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="signup"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    onSubmit={handleSignupSubmit}
                    className="space-y-5"
                  >
                    {signupError && <div className="auth-message auth-message-error">{signupError}</div>}

                    <div className="space-y-2">
                      <Label htmlFor="signup-name">{t.fullNameLabel}</Label>
                      <div className="relative">
                        <User className="login-field-icon" />
                        <Input
                          id="signup-name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="auth-input ps-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">{t.emailLabel}</Label>
                      <div className="relative">
                        <Mail className="login-field-icon" />
                        <Input
                          id="signup-email"
                          type="email"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                          dir="ltr"
                          className="auth-input ps-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{t.passwordLabel}</Label>
                      <div className="relative">
                        <Lock className="login-field-icon" />
                        <Input
                          id="signup-password"
                          type={showSignupPassword ? 'text' : 'password'}
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                          dir="ltr"
                          className="auth-input ps-11 pe-11"
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

                    <div className="text-center text-sm text-muted-foreground lg:hidden">
                      {t.hasAccount}{' '}
                      <button type="button" onClick={() => handleTabChange('login')} className="font-bold text-primary hover:text-accent">
                        {t.loginTitle}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Login;
