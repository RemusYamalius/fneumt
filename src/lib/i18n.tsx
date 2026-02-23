import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type Lang = 'ar' | 'fr';

const translations: Record<Lang, Record<string, string>> = {
  ar: {
    platformName: 'منصة FNE-UMT سيدي بنور',
    platformSubtitle: 'الفيدرالية الوطنية للتعليم - الاتحاد المغربي للشغل',
    heroTitle: 'منصتك الرقمية لتتبع ملفاتك النقابية',
    heroDescription: 'نسهّل عليك تقديم طلباتك وتتبع ملفاتك بكل شفافية وسرعة',
    newRequest: 'طلب جديد',
    newRequestDesc: 'قدّم طلبك النقابي بسهولة وسرعة',
    trackFiles: 'تتبع الملفات',
    trackFilesDesc: 'تابع حالة ملفك في أي وقت',
    login: 'تسجيل الدخول',
    loginDesc: 'ادخل إلى حسابك الشخصي',
    footer: 'المديرية الإقليمية سيدي بنور — الأكاديمية الجهوية الدار البيضاء-سطات',
    copyright: '© 2025 FNE-UMT سيدي بنور. جميع الحقوق محفوظة.',
    langSwitch: 'FR',
    contact: 'تواصل معنا',
    phone: 'الهاتف',
    email: 'البريد الإلكتروني',
  },
  fr: {
    platformName: 'Plateforme FNE-UMT Sidi Bennour',
    platformSubtitle: "Fédération Nationale de l'Enseignement - Union Marocaine du Travail",
    heroTitle: 'Votre plateforme numérique pour le suivi de vos dossiers syndicaux',
    heroDescription: 'Nous facilitons la soumission et le suivi de vos dossiers en toute transparence',
    newRequest: 'Nouvelle demande',
    newRequestDesc: 'Soumettez votre demande facilement et rapidement',
    trackFiles: 'Suivi des dossiers',
    trackFilesDesc: "Suivez l'état de votre dossier à tout moment",
    login: 'Connexion',
    loginDesc: 'Accédez à votre espace personnel',
    footer: 'Direction Provinciale Sidi Bennour — Académie Régionale Casablanca-Settat',
    copyright: '© 2025 FNE-UMT Sidi Bennour. Tous droits réservés.',
    langSwitch: 'عربية',
    contact: 'Contactez-nous',
    phone: 'Téléphone',
    email: 'Email',
  },
};

type Translations = Record<string, string>;

interface I18nContextType {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  t: Translations;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>('ar');

  const toggleLang = useCallback(() => {
    setLang(prev => prev === 'ar' ? 'fr' : 'ar');
  }, []);

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
  }, [dir, lang]);

  return (
    <I18nContext.Provider value={{ lang, dir, t: translations[lang], toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};
