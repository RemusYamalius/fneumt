import logoFne from '@/assets/logo-fne.png';

interface AnimatedLogoProps {
  size?: string;
  className?: string;
}

const AnimatedLogo = ({ size = 'w-10 h-10', className = '' }: AnimatedLogoProps) => {
  return (
    <div
      className={`relative rounded-full ${size} ${className}`}
      style={{ isolation: 'isolate', transform: 'translateZ(0)', willChange: 'transform' }}
    >
      {/* Border shine layer - visible during 0-3s of 6s cycle */}
      <div
        className="absolute inset-[-2px] rounded-full hidden sm:block motion-reduce:hidden sm:motion-reduce:hidden animate-logo-border-shine"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0%, transparent 60%, hsl(190 100% 60%) 75%, hsl(210 100% 70%) 85%, transparent 100%)',
        }}
      />

      {/* Background circle to mask the conic gradient center */}
      <div className="absolute inset-[2px] rounded-full bg-white/15" />

      {/* Logo image */}
      <img
        src={logoFne}
        alt="FNE-UMT Logo"
        className="relative z-10 w-full h-full object-contain rounded-full p-1"
      />

      {/* Internal sparkle layer - diagonal swipe during 3-6s of 6s cycle */}
      <div
        className="absolute inset-0 rounded-full z-20 pointer-events-none hidden sm:block motion-reduce:hidden sm:motion-reduce:hidden animate-logo-sparkle"
        style={{
          background: 'linear-gradient(135deg, transparent 30%, hsl(190 100% 80% / 0.6) 45%, hsl(210 100% 90% / 0.4) 55%, transparent 70%)',
          backgroundSize: '300% 300%',
        }}
      />
    </div>
  );
};

export default AnimatedLogo;
