import { useNavigate } from 'react-router-dom';
import { AlertTriangle, UserCog } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

interface Profile {
  full_name?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  employee_number?: string | null;
  mission?: string | null;
  academy?: string | null;
  directorate?: string | null;
  institution?: string | null;
  phone?: string | null;
}

const REQUIRED_FIELDS: { key: keyof Profile; ar: string; fr: string }[] = [
  { key: 'full_name', ar: 'الاسم الكامل', fr: 'Nom complet' },
  { key: 'gender', ar: 'النوع', fr: 'Genre' },
  { key: 'date_of_birth', ar: 'تاريخ الازدياد', fr: 'Date de naissance' },
  { key: 'employee_number', ar: 'رقم التأجير (PPR)', fr: 'N° PPR' },
  { key: 'mission', ar: 'الإطار / المهمة', fr: 'Cadre / Mission' },
  { key: 'academy', ar: 'الأكاديمية', fr: 'Académie' },
  { key: 'directorate', ar: 'المديرية', fr: 'Direction' },
  { key: 'institution', ar: 'المؤسسة', fr: 'Établissement' },
  { key: 'phone', ar: 'الهاتف', fr: 'Téléphone' },
];

interface Props {
  profile?: Profile | null;
}

const IncompleteProfileMessage = ({ profile }: Props) => {
  const navigate = useNavigate();
  const { t, lang } = useI18n();

  const missingFields = REQUIRED_FIELDS.filter(f => {
    const val = profile?.[f.key];
    return !val || (typeof val === 'string' && val.trim() === '');
  });

  const title = lang === 'ar'
    ? 'يرجى استكمال ملفك الشخصي'
    : 'Veuillez compléter votre profil';

  const desc = lang === 'ar'
    ? 'لتقديم طلب، يجب تعبئة جميع بيانات ملفك الشخصي أولاً.'
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
      <p className="text-sm mb-4 leading-relaxed" style={{ color: 'hsl(25 40% 35%)' }}>
        {desc}
      </p>
      {missingFields.length > 0 && (
        <div className="mb-6 text-start rounded-xl p-4" style={{ background: 'hsla(35 80% 50% / 0.1)' }}>
          <p className="text-xs font-bold mb-2" style={{ color: 'hsl(25 60% 30%)' }}>
            {lang === 'ar' ? 'الحقول الناقصة:' : 'Champs manquants :'}
          </p>
          <ul className="space-y-1">
            {missingFields.map(f => (
              <li key={f.key} className="text-sm flex items-center gap-2" style={{ color: 'hsl(0 65% 45%)' }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'hsl(0 65% 45%)' }} />
                {lang === 'ar' ? f.ar : f.fr}
              </li>
            ))}
          </ul>
        </div>
      )}
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
