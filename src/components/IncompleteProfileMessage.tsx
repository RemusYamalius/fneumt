import { useNavigate } from 'react-router-dom';
import { AlertTriangle, UserCog } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

const IncompleteProfileMessage = () => {
  const navigate = useNavigate();
  const { t, lang } = useI18n();

  const title = lang === 'ar'
    ? 'يرجى استكمال ملفك الشخصي'
    : 'Veuillez compléter votre profil';

  const desc = lang === 'ar'
    ? 'لتقديم طلب، يجب تعبئة جميع بيانات ملفك الشخصي أولاً: الاسم الكامل، النوع، تاريخ الازدياد، رقم التأجير، الإطار/المهمة، الأكاديمية، المديرية، المؤسسة، والهاتف.'
    : 'Pour soumettre une demande, vous devez d\'abord remplir toutes les données de votre profil.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto mt-12 p-8 rounded-2xl text-center"
      style={{
        background: 'linear-gradient(135deg, hsl(35 100% 95%), hsl(45 100% 92%))',
        border: '2px solid hsl(35 80% 70%)',
        boxShadow: '0 8px 30px hsla(35 80% 50% / 0.15)',
      }}
    >
      <div
        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
        style={{ background: 'hsl(35 90% 55%)', boxShadow: '0 4px 15px hsla(35 90% 55% / 0.3)' }}
      >
        <AlertTriangle className="w-8 h-8" style={{ color: 'hsl(0 0% 100%)' }} />
      </div>
      <h3 className="text-xl font-black mb-3" style={{ color: 'hsl(25 70% 25%)' }}>
        {title}
      </h3>
      <p className="text-sm mb-6 leading-relaxed" style={{ color: 'hsl(25 40% 35%)' }}>
        {desc}
      </p>
      <Button
        onClick={() => navigate('/profile')}
        className="gap-2 font-bold"
        style={{
          background: 'linear-gradient(135deg, hsl(35 90% 50%), hsl(25 85% 45%))',
          color: 'white',
          boxShadow: '0 4px 15px hsla(30 90% 45% / 0.4)',
        }}
      >
        <UserCog className="w-4 h-4" />
        {t.completeProfile || (lang === 'ar' ? 'إكمال الملف الشخصي' : 'Compléter le profil')}
      </Button>
    </motion.div>
  );
};

export default IncompleteProfileMessage;
