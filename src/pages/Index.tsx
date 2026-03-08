import { FilePlus, Search, LogIn, Globe, Phone, Mail, MapPin } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedLogo from '@/components/AnimatedLogo';


const Index = () => {
  const { t, toggleLang, dir } = useI18n();

  const actions = [
  {
    icon: FilePlus,
    title: t.newRequest,
    desc: t.newRequestDesc,
    to: '/new-request',
    color: '#C0392B'
  },
  {
    icon: Search,
    title: t.trackFiles,
    desc: t.trackFilesDesc,
    to: '/track',
    color: '#F39C12'
  },
  {
    icon: LogIn,
    title: t.login,
    desc: t.loginDesc,
    to: '/login',
    color: '#2C3E50'
  }];


  return (
    <div className="min-h-screen flex flex-col" dir={dir}>
      {/* Language Toggle */}
      <div className="absolute top-4 left-4 right-4 flex justify-end z-20" dir={dir}>
        <button
          onClick={toggleLang}
          className="glass flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-foreground hover:bg-white/90 transition-all shadow-lg">

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
            <AnimatedLogo size="w-48 h-48" className="shadow-2xl" />
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">
            منصة<br />FNE-UMT
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
        <div className="absolute -bottom-px left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
            <path d="M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V80H0V40Z" fill="hsl(210 20% 98%)" />
          </svg>
        </div>
      </header>

      {/* Action Cards - Infographic Style */}
      <main className="flex-1 -mt-4 relative z-10">
        <div className="max-w-4xl mx-auto px-6 pt-16 pb-16">
          <div className="relative flex flex-col md:flex-row items-center md:items-start justify-center gap-8 md:gap-0" style={{ direction: dir === 'rtl' ? 'rtl' : 'ltr' }}>
            

            {actions.map((action, index) => (
              <motion.div
                key={action.to}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15, ease: 'easeOut' }}
                className="flex-1 flex flex-col items-center relative"
              >
                <Link to={action.to} className="flex flex-col items-center text-center group">
                  {/* Semi-circular arc */}
                  <div
                    className="w-28 h-14 border-4 border-b-0 rounded-t-full"
                    style={{ borderColor: action.color }}
                  />

                  {/* Icon circle overlapping arc bottom */}
                  <div
                    className="w-14 h-14 bg-white rounded-full shadow-xl -mt-7 z-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                    style={{ border: `3px solid ${action.color}` }}
                  >
                    <action.icon className="w-6 h-6" style={{ color: action.color }} />
                  </div>

                  {/* Vertical connector */}
                  <div className="w-0.5 h-8 bg-gray-300 my-1" />

                  {/* Timeline dot */}
                  <div
                    className="w-3 h-3 rounded-full mb-4 z-10"
                    style={{ backgroundColor: action.color }}
                  />

                  {/* Text content */}
                  <h2 className="text-lg font-bold text-foreground mb-1 group-hover:opacity-80 transition-opacity">{action.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px]">{action.desc}</p>
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
              <AnimatedLogo size="w-20 h-20" />
              <div>
                <p className="font-bold text-sm">{t.platformName}</p>
                <p className="text-xs text-white/60 whitespace-pre-line">{t.footer}</p>
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
    </div>);

};

export default Index;