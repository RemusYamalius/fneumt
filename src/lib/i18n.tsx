import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type Lang = 'ar' | 'fr';

const translations: Record<Lang, Record<string, string>> = {
  ar: {
    platformName: 'منصة FNE-UMT سيدي بنور',
    platformSubtitle: 'الجامعة الوطنية للتعليم - الاتحاد المغربي للشغل',
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
    // Auth
    loginTitle: 'تسجيل الدخول',
    signupTitle: 'إنشاء حساب جديد',
    forgotPasswordTitle: 'استعادة كلمة المرور',
    resetPasswordTitle: 'تعيين كلمة مرور جديدة',
    emailLabel: 'البريد الإلكتروني',
    passwordLabel: 'كلمة المرور',
    confirmPasswordLabel: 'تأكيد كلمة المرور',
    fullNameLabel: 'الاسم الكامل',
    loginButton: 'دخول',
    signupButton: 'إنشاء الحساب',
    sendResetLink: 'إرسال رابط الاستعادة',
    updatePassword: 'تحديث كلمة المرور',
    forgotPassword: 'نسيت كلمة المرور؟',
    noAccount: 'ليس لديك حساب؟',
    hasAccount: 'لديك حساب بالفعل؟',
    createAccount: 'إنشاء حساب',
    backToLogin: 'العودة لتسجيل الدخول',
    backToHome: 'العودة للرئيسية',
    signupSuccess: 'تم إنشاء حسابك بنجاح! يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب.',
    resetEmailSent: 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.',
    passwordUpdated: 'تم تحديث كلمة المرور بنجاح!',
    passwordMinLength: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    passwordsMismatch: 'كلمتا المرور غير متطابقتين',
    showPassword: 'إظهار',
    hidePassword: 'إخفاء',
    // Dashboard
    dashboard: 'لوحة التحكم',
    welcome: 'مرحباً',
    myRequests: 'طلباتي',
    noRequests: 'لا توجد طلبات حالياً',
    profile: 'الملف الشخصي',
    logout: 'تسجيل الخروج',
    notifications: 'الإشعارات',
    roleTeacher: 'أستاذ(ة)',
    roleOfficer: 'مسؤول نقابي',
    roleAdmin: 'مدير',
    // Admin
    userManagement: 'إدارة المستخدمين',
    userManagementDesc: 'عرض وتعديل أدوار المستخدمين',
    backToDashboard: 'العودة للوحة التحكم',
    roleUpdated: 'تم تحديث الدور بنجاح',
    roleLabel: 'الدور',
    corpsLabel: 'السلك',
    institutionLabel: 'المؤسسة',
    corpsPrimary: 'ابتدائي',
    corpsMiddle: 'إعدادي',
    corpsHigh: 'ثانوي',
    corpsAdmin: 'إداري',
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
    // Auth
    loginTitle: 'Connexion',
    signupTitle: 'Créer un compte',
    forgotPasswordTitle: 'Récupération du mot de passe',
    resetPasswordTitle: 'Nouveau mot de passe',
    emailLabel: 'Email',
    passwordLabel: 'Mot de passe',
    confirmPasswordLabel: 'Confirmer le mot de passe',
    fullNameLabel: 'Nom complet',
    loginButton: 'Se connecter',
    signupButton: 'Créer le compte',
    sendResetLink: 'Envoyer le lien',
    updatePassword: 'Mettre à jour',
    forgotPassword: 'Mot de passe oublié ?',
    noAccount: "Vous n'avez pas de compte ?",
    hasAccount: 'Vous avez déjà un compte ?',
    createAccount: 'Créer un compte',
    backToLogin: 'Retour à la connexion',
    backToHome: "Retour à l'accueil",
    signupSuccess: 'Compte créé avec succès ! Veuillez vérifier votre email pour confirmer votre compte.',
    resetEmailSent: 'Un lien de récupération a été envoyé à votre email.',
    passwordUpdated: 'Mot de passe mis à jour avec succès !',
    passwordMinLength: 'Le mot de passe doit contenir au moins 6 caractères',
    passwordsMismatch: 'Les mots de passe ne correspondent pas',
    showPassword: 'Afficher',
    hidePassword: 'Masquer',
    // Dashboard
    dashboard: 'Tableau de bord',
    welcome: 'Bienvenue',
    myRequests: 'Mes demandes',
    noRequests: 'Aucune demande pour le moment',
    profile: 'Profil',
    logout: 'Déconnexion',
    notifications: 'Notifications',
    roleTeacher: 'Enseignant(e)',
    roleOfficer: 'Responsable syndical',
    roleAdmin: 'Administrateur',
    // Admin
    userManagement: 'Gestion des utilisateurs',
    userManagementDesc: 'Afficher et modifier les rôles des utilisateurs',
    backToDashboard: 'Retour au tableau de bord',
    roleUpdated: 'Rôle mis à jour avec succès',
    roleLabel: 'Rôle',
    corpsLabel: 'Corps',
    institutionLabel: 'Établissement',
    corpsPrimary: 'Primaire',
    corpsMiddle: 'Collège',
    corpsHigh: 'Lycée',
    corpsAdmin: 'Administratif',
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
