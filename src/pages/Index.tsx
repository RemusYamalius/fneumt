import { FilePlus, Search, LogIn, Globe, Phone, Mail, MapPin } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import logoFne from '@/assets/logo-fne.png';

const Index = () => {
  const { t, toggleLang, dir } = useI18n();

  const actions = [
    {
      icon: FilePlus,
      title: t.newRequest,
      desc: t.newRequestDesc,
      to: '/new-request',
      gradient: 'from-primary to-accent',
    },
    {
      icon: Search,
      title: t.trackFiles,
      desc: t.trackFilesDesc,
      to: '/track',
      gradient: 'from-accent to-primary',
    },
    {
      icon: LogIn,
      title: t.login,
      desc: t.loginDesc,
      to: '/login',
      gradient: 'from-secondary to-primary',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col" dir={dir}>
      {/* Language Toggle */}
      <div className="absolute top-4 left-4 right-4 flex justify-end z-20" style={{ direction: 'ltr' }}>
        <button
          onClick={toggleLang}
          className="glass flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-foreground hover:bg-white/90 transition-all shadow-lg"
        >
          <Globe className="w-4 h-4" />
          {t.langSwitch}
        </button>
      </div>

      {/* Hero Section */}
      <header className="gradient-hero relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm p-2 shadow-2xl border border-white/20">
              <img src={logoFne} alt="FNE-UMT Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">
            منصة<br />FNE-UMT<br />سيدي بنور
          </h1>
          <p className="text-base md:text-lg text-white/70 mb-2 font-light">
            {t.platformSubtitle}
          </p>
          <div className="w-16 h-1 bg-accent mx-auto rounded-full my-6" />
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            {t.heroTitle}
          </p>
          <p className="text-sm md:text-base text-white/60 mt-3 max-w-xl mx-auto">
            {t.heroDescription}
          </p>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V80H0V40Z" fill="hsl(210 20% 98%)" />
          </svg>
        </div>
      </header>

      {/* Action Cards */}
      <main className="flex-1 -mt-4 relative z-10">
        <div className="max-w-5xl mx-auto px-6 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ direction: 'ltr' }}>
          {actions.map((action, index) => (
              <motion.div
                key={action.to}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15, ease: 'easeOut' }}
              >
              <Link
                to={action.to}
                className="card-premium group relative p-8 text-center transition-all duration-300 block"
              >
                <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-accent/20 transition-colors duration-300">
                    <action.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">{action.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{action.desc}</p>
                </div>

                {/* Arrow indicator */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <div className="w-8 h-1 bg-primary rounded-full" />
                </div>
              </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-secondary text-secondary-foreground">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logoFne} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
              <div>
                <p className="font-bold text-sm">{t.platformName}</p>
                <p className="text-xs text-white/60">{t.footer}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-white/60">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> سيدي بنور
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> 0600000000
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" /> contact@fne-umt-sidibennour.ma
              </span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-white/40">
            {t.copyright}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
