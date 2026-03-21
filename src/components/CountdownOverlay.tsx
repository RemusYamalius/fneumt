import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import logoFne from '@/assets/logo-fne.png';
import { useI18n } from '@/lib/i18n';

interface CountdownOverlayProps {
  targetDate: Date;
  onComplete: () => void;
}

const CountdownOverlay = ({ targetDate, onComplete }: CountdownOverlayProps) => {
  const { t, lang } = useI18n();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calc = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const diff = target - now;
      if (diff <= 0) { onComplete(); return; }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  const pad = (n: number) => String(n).padStart(2, '0');

  const labels = lang === 'ar'
    ? { days: 'يوم', hours: 'ساعة', minutes: 'دقيقة', seconds: 'ثانية' }
    : { days: 'Jours', hours: 'Heures', minutes: 'Minutes', seconds: 'Secondes' };

  const welcome = lang === 'ar'
    ? 'مرحباً بك في منصة الجامعة الوطنية للتعليم'
    : "Bienvenue sur la plateforme de la FNE";

  const subtitle = lang === 'ar'
    ? 'نستعد لاستقبال طلباتكم ابتداءً من فاتح ماي، عيد الشغل'
    : "Nous nous préparons à recevoir vos demandes à partir du 1er Mai, Fête du Travail";

  const dateStr = lang === 'ar'
    ? '1 ماي 2026 - الساعة 10:00 صباحاً'
    : '1er Mai 2026 - 10h00';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'hsla(220 30% 8% / 0.85)', backdropFilter: 'blur(12px)' }}
    >
      {/* Large tilted clock digits in background */}
      <div
        className="absolute pointer-events-none select-none opacity-[0.04] font-black"
        style={{
          fontSize: 'clamp(120px, 25vw, 300px)',
          transform: 'rotate(-12deg)',
          right: '-2%',
          top: '10%',
          color: 'hsl(40 100% 60%)',
          lineHeight: 1,
          fontFamily: 'monospace',
        }}
      >
        {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}
      </div>

      <motion.div
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 20 }}
        className="relative max-w-lg w-full rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(45 100% 55%), hsl(30 100% 50%), hsl(20 95% 45%))',
          boxShadow: '0 25px 80px hsla(30 100% 40% / 0.4), 0 0 60px hsla(45 100% 60% / 0.15)',
        }}
      >
        {/* Inner card */}
        <div className="p-8 sm:p-10 text-center relative">
          {/* Decorative shimmer */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, hsla(0 0% 100% / 0.15) 45%, hsla(0 0% 100% / 0.05) 55%, transparent 60%)',
              backgroundSize: '300% 100%',
              animation: 'countdownShimmer 4s ease-in-out infinite',
            }}
          />

          {/* Logo */}
          <motion.div
            className="mx-auto mb-5 w-20 h-20 rounded-full overflow-hidden"
            style={{
              border: '3px solid hsla(0 0% 100% / 0.4)',
              boxShadow: '0 4px 20px hsla(0 0% 0% / 0.2)',
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img src={logoFne} alt="FNE Logo" className="w-full h-full object-contain" />
          </motion.div>

          {/* Welcome text */}
          <h2
            className="text-lg sm:text-xl font-black mb-2"
            style={{ color: 'hsl(20 80% 15%)', textShadow: '0 1px 2px hsla(0 0% 100% / 0.3)' }}
          >
            {welcome}
          </h2>
          <p
            className="text-sm sm:text-base font-semibold mb-1"
            style={{ color: 'hsl(25 60% 20%)' }}
          >
            {subtitle}
          </p>
          <p
            className="text-xs font-bold mb-6"
            style={{ color: 'hsl(25 50% 30%)' }}
          >
            🎉 {dateStr}
          </p>

          {/* Countdown digits */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {([
              { value: timeLeft.days, label: labels.days },
              { value: timeLeft.hours, label: labels.hours },
              { value: timeLeft.minutes, label: labels.minutes },
              { value: timeLeft.seconds, label: labels.seconds },
            ]).map((item, i) => (
              <motion.div
                key={i}
                className="rounded-2xl p-3 sm:p-4"
                style={{
                  background: 'hsla(20 80% 15% / 0.85)',
                  boxShadow: '0 8px 24px hsla(0 0% 0% / 0.3), inset 0 1px 0 hsla(0 0% 100% / 0.1)',
                }}
              >
                <motion.span
                  key={item.value}
                  initial={{ scale: 1.2, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="block text-3xl sm:text-4xl font-black font-mono"
                  style={{ color: 'hsl(45 100% 60%)', textShadow: '0 0 15px hsla(45 100% 60% / 0.5)' }}
                >
                  {pad(item.value)}
                </motion.span>
                <span
                  className="block text-[10px] sm:text-xs font-bold mt-1"
                  style={{ color: 'hsl(40 60% 70%)' }}
                >
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Motivational footer */}
          <p className="text-xs font-semibold" style={{ color: 'hsl(25 50% 25%)' }}>
            {lang === 'ar' ? '⏳ صبراً جميلاً... موعدنا قريب!' : '⏳ Patience... le rendez-vous approche !'}
          </p>
        </div>
      </motion.div>

      <style>{`
        @keyframes countdownShimmer {
          0%, 100% { background-position: 200% 0; }
          50% { background-position: -100% 0; }
        }
      `}</style>
    </motion.div>
  );
};

export default CountdownOverlay;
