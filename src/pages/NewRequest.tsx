import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Upload, X, Check, Copy, FileText, Award, Star, Clock, Building2, Coins, MapPin, Wrench, AlertTriangle, ClipboardList, Search, MoreHorizontal, Landmark, GraduationCap, Building, School } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

type RequestCategory = 'rank_promotion' | 'grade_promotion' | 'schedules' | 'infrastructure' | 'financial_compensation' | 'zone_compensation' | 'equipment' | 'grievances' | 'assignments' | 'inspection_score' | 'other';
type ResolutionLevel = 'ministry' | 'academy' | 'directorate' | 'institution';

const CATEGORIES: { key: RequestCategory; icon: typeof FileText; gradient: string; iconBg: string }[] = [
  { key: 'rank_promotion', icon: Award, gradient: 'from-blue-500/20 to-indigo-500/20', iconBg: 'bg-blue-500' },
  { key: 'grade_promotion', icon: Star, gradient: 'from-violet-500/20 to-purple-500/20', iconBg: 'bg-violet-500' },
  { key: 'schedules', icon: Clock, gradient: 'from-emerald-500/20 to-teal-500/20', iconBg: 'bg-emerald-500' },
  { key: 'infrastructure', icon: Building2, gradient: 'from-amber-500/20 to-orange-500/20', iconBg: 'bg-amber-500' },
  { key: 'financial_compensation', icon: Coins, gradient: 'from-yellow-500/20 to-amber-500/20', iconBg: 'bg-yellow-600' },
  { key: 'zone_compensation', icon: MapPin, gradient: 'from-rose-500/20 to-pink-500/20', iconBg: 'bg-rose-500' },
  { key: 'equipment', icon: Wrench, gradient: 'from-cyan-500/20 to-blue-500/20', iconBg: 'bg-cyan-600' },
  { key: 'grievances', icon: AlertTriangle, gradient: 'from-red-500/20 to-rose-500/20', iconBg: 'bg-red-500' },
  { key: 'assignments', icon: ClipboardList, gradient: 'from-sky-500/20 to-indigo-500/20', iconBg: 'bg-sky-500' },
  { key: 'inspection_score', icon: Search, gradient: 'from-fuchsia-500/20 to-purple-500/20', iconBg: 'bg-fuchsia-500' },
  { key: 'other', icon: MoreHorizontal, gradient: 'from-slate-500/20 to-gray-500/20', iconBg: 'bg-slate-500' },
];

const RESOLUTION_LEVELS: { key: ResolutionLevel; icon: typeof Landmark; gradient: string; iconBg: string }[] = [
  { key: 'ministry', icon: Landmark, gradient: 'from-indigo-500/20 to-blue-600/20', iconBg: 'bg-indigo-600' },
  { key: 'academy', icon: GraduationCap, gradient: 'from-emerald-500/20 to-green-600/20', iconBg: 'bg-emerald-600' },
  { key: 'directorate', icon: Building, gradient: 'from-amber-500/20 to-orange-600/20', iconBg: 'bg-amber-600' },
  { key: 'institution', icon: School, gradient: 'from-rose-500/20 to-pink-600/20', iconBg: 'bg-rose-600' },
];

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const NewRequest = () => {
  const { t, dir } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<RequestCategory | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [resolutionLevel, setResolutionLevel] = useState<ResolutionLevel | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('academy, directorate, corps')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setProfileComplete(!!(data?.academy && data?.directorate && data?.corps));
      });
  }, [user]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Steps: 1=Category, 2=Resolution Level, 3=Attachments, 4=Review, 5=Success
  const stepLabels = [t.stepCategory, t.stepResolutionLevel, t.stepAttachments, t.stepReview];

  const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const arr = Array.from(newFiles);
    const valid = arr.filter(f => {
      if (!ACCEPTED_TYPES.includes(f.type) && !f.type.startsWith('image/')) {
        toast({ title: t.invalidFileType || 'نوع الملف غير مقبول', description: f.name, variant: 'destructive' });
        return false;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast({ title: t.fileTooLarge, description: f.name, variant: 'destructive' });
        return false;
      }
      return true;
    });
    setFiles(prev => [...prev, ...valid].slice(0, MAX_FILES));
  };

  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!category || !user) return;
    // For non-other categories, use category label as subject
    const finalSubject = category === 'other' ? subject.trim() : (t[`cat_${category}`] || category);
    const finalDescription = category === 'other' ? (description.trim() || null) : null;

    if (!finalSubject) return;
    setSubmitting(true);
    try {
      const { data: request, error: reqError } = await supabase
        .from('requests')
        .insert({
          category,
          subject: finalSubject,
          description: finalDescription,
          user_id: user.id,
          resolution_level: resolutionLevel || null,
        } as any)
        .select('id, tracking_number')
        .single();

      if (reqError || !request) throw reqError;

      for (const file of files) {
        const filePath = `${user.id}/${request.id}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file);
        if (uploadError) { console.error('Upload error:', uploadError); continue; }
        await supabase.from('attachments').insert({
          request_id: request.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type || null,
          uploaded_by: user.id,
        });
      }

      setTrackingNumber(request.tracking_number);
      setStep(5);
    } catch (err: any) {
      toast({ title: t.submitError, description: err?.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const copyTracking = () => {
    if (trackingNumber) {
      navigator.clipboard.writeText(trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canNext = () => {
    if (step === 1) {
      if (!category) return false;
      if (category === 'other') return subject.trim().length > 0;
      return true;
    }
    if (step === 2) return !!resolutionLevel;
    return true;
  };

  // Calculate max reachable step based on completed data
  const step1Valid = category ? (category === 'other' ? subject.trim().length > 0 : true) : false;
  const step2Valid = !!resolutionLevel;
  const maxReachableStep = !step1Valid ? 1 : !step2Valid ? 2 : 4;

  const categoryLabel = (key: RequestCategory) => t[`cat_${key}`] || key;
  const levelLabel = (key: ResolutionLevel) => t[`level_${key}`] || key;

  // Success screen
  if (step === 5) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6" dir={dir}>
        <div className="max-w-md w-full bg-card rounded-2xl border border-border p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
            <Check className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{t.requestSubmitted}</h2>
          <p className="text-muted-foreground mb-6">{t.trackingNumberLabel}</p>
          <div className="flex items-center justify-center gap-2 bg-muted rounded-xl p-4 mb-6">
            <span className="text-xl font-mono font-bold text-primary">{trackingNumber}</span>
            <button onClick={copyTracking} className="p-2 rounded-lg hover:bg-primary/10 transition-colors">
              {copied ? <Check className="w-5 h-5 text-accent" /> : <Copy className="w-5 h-5 text-muted-foreground" />}
            </button>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="flex-1">{t.backToDashboard}</Button>
            <Button onClick={() => navigate('/track')} className="flex-1">{t.trackFiles}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header */}
      <header className="gradient-primary text-white shadow-lg">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <AnimatedLogo size="w-20 h-20" />
          <div>
            <p className="font-bold text-sm">{t.newRequest}</p>
            <p className="text-xs text-white/70">{t.platformName}</p>
          </div>
        </div>
      </header>

      {/* Steps indicator */}
      <div className="max-w-3xl mx-auto px-6 py-6">
        {step >= 2 && step <= 4 && (
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[hsl(207,75%,17%)] to-[hsl(207,62%,40%)] text-white font-medium text-sm shadow-lg hover:shadow-xl hover:opacity-90 transition-all duration-300"
            >
              {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {t.backToDashboard}
            </button>
          </div>
        )}
        <div className="flex items-center justify-between mb-8">
          {stepLabels.map((label, i) => {
            const stepNum = i + 1;
            const isCompleted = stepNum < step;
            const isCurrent = stepNum === step;
            // Can click if: step is completed, OR step is reachable (all prior steps valid)
            const canNavigate = stepNum !== step && (
              isCompleted || 
              (stepNum <= maxReachableStep)
            );
            return (
            <div key={i} className="flex items-center gap-2 flex-1">
              <button
                type="button"
                onClick={() => canNavigate && setStep(stepNum)}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-sm ${
                  isCompleted
                    ? 'bg-primary text-primary-foreground shadow-md cursor-pointer hover:ring-4 hover:ring-primary/20'
                    : isCurrent
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-lg'
                      : canNavigate
                        ? 'bg-card border-2 border-border text-muted-foreground cursor-pointer hover:border-primary/50'
                        : 'bg-card border-2 border-border text-muted-foreground opacity-50 cursor-not-allowed'
                }`}
                disabled={!canNavigate}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
              </button>
              <button
                type="button"
                onClick={() => canNavigate && setStep(stepNum)}
                disabled={!canNavigate}
                className={`text-xs hidden sm:block font-medium transition-colors ${
                  stepNum <= step ? 'text-primary' : canNavigate ? 'text-muted-foreground hover:text-primary cursor-pointer' : 'text-muted-foreground opacity-50 cursor-not-allowed'
                }`}
              >{label}</button>
              {i < 3 && <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${isCompleted ? 'bg-primary' : 'bg-border'}`} />}
            </div>);
          })}

        </div>

        {/* Step 1: Category */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-6">{t.selectCategory}</h2>
            {profileComplete === false && (
              <div className="mb-6 p-6 rounded-2xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-center">
                <p className="text-lg font-semibold text-foreground mb-2">{t.profileIncomplete}</p>
                <p className="text-sm text-muted-foreground mb-4">{t.profileIncompleteDesc}</p>
                <Button onClick={() => navigate('/profile')}>{t.completeProfile}</Button>
              </div>
            )}
            <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 ${profileComplete === false ? 'opacity-50 pointer-events-none' : ''}`}>
              {CATEGORIES.map(({ key, icon: Icon, gradient, iconBg }, index) => (
                <motion.button
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  whileHover={{ scale: 1.04, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setCategory(key)}
                  className={`relative p-5 rounded-2xl border-2 text-center transition-all duration-200 overflow-hidden ${category === key ? 'border-primary shadow-xl ring-2 ring-primary/20' : 'border-border bg-card hover:border-primary/30 hover:shadow-lg'}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60`} />
                  <div className="relative z-10">
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${category === key ? 'bg-primary' : iconBg} shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className={`text-sm font-semibold ${category === key ? 'text-primary' : 'text-foreground'}`}>{categoryLabel(key)}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* "Other" category inline fields */}
            <AnimatePresence>
              {category === 'other' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 p-6 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/40 dark:to-gray-900/40 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t.subjectLabel} *</label>
                    <Input
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder={t.subjectPlaceholder}
                      className="border-slate-300 dark:border-slate-600 focus-visible:ring-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t.descriptionLabel}</label>
                    <Textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder={t.descriptionPlaceholder}
                      rows={4}
                      className="border-slate-300 dark:border-slate-600 focus-visible:ring-slate-400"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Step 2: Resolution Level */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-6">{t.selectResolutionLevel}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {RESOLUTION_LEVELS.map(({ key, icon: Icon, gradient, iconBg }, index) => (
                <motion.button
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.3 }}
                  whileHover={{ scale: 1.03, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setResolutionLevel(key)}
                  className={`relative p-6 rounded-2xl border-2 text-center transition-all duration-200 overflow-hidden ${resolutionLevel === key ? 'border-primary shadow-xl ring-2 ring-primary/20' : 'border-border bg-card hover:border-primary/30 hover:shadow-lg'}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60`} />
                  <div className="relative z-10 flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${resolutionLevel === key ? 'bg-primary' : iconBg} shadow-lg shrink-0`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <p className={`text-base font-semibold ${resolutionLevel === key ? 'text-primary' : 'text-foreground'}`}>{levelLabel(key)}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Attachments */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h2 className="text-xl font-bold text-foreground mb-6">{t.stepAttachments}</h2>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              className="relative overflow-hidden border-2 border-dashed border-primary/30 rounded-2xl p-12 text-center cursor-pointer hover:border-primary/60 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-primary/5 to-accent/5"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <p className="text-foreground font-medium mb-1">{t.dropFiles}</p>
              <p className="text-xs text-muted-foreground">{t.maxFiles} — {t.onlyPdfImages || 'PDF / صور فقط'}</p>
              <input ref={fileInputRef} type="file" multiple accept="application/pdf,image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
            </div>
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between bg-card border border-border rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button onClick={() => removeFile(i)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-destructive/10 transition-colors">
                      <X className="w-4 h-4 text-destructive" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h2 className="text-xl font-bold text-foreground mb-6">{t.stepReview}</h2>
            <div className="bg-card rounded-2xl border-2 border-border p-6 space-y-1 shadow-sm">
              {/* Category */}
              {(() => {
                const catData = CATEGORIES.find(c => c.key === category);
                const CatIcon = catData?.icon || FileText;
                const catIconBg = catData?.iconBg || 'bg-primary';
                return (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
                    <div className={`w-10 h-10 rounded-xl ${catIconBg} flex items-center justify-center shrink-0 mt-0.5 shadow-md`}>
                      <CatIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">{t.selectCategory}</span>
                      <p className="font-semibold text-foreground">{category ? categoryLabel(category) : ''}</p>
                    </div>
                  </motion.div>
                );
              })()}

              {category === 'other' && (
                <>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex items-start gap-4 p-4 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">{t.subjectLabel}</span>
                      <p className="font-medium text-foreground">{subject}</p>
                    </div>
                  </motion.div>
                  {description && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-start gap-4 p-4 rounded-xl">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">{t.descriptionLabel}</span>
                        <p className="text-foreground">{description}</p>
                      </div>
                    </motion.div>
                  )}
                </>
              )}

              {resolutionLevel && (() => {
                const lvlData = RESOLUTION_LEVELS.find(l => l.key === resolutionLevel);
                const LvlIcon = lvlData?.icon || Landmark;
                const lvlIconBg = lvlData?.iconBg || 'bg-accent';
                return (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-accent/5 to-transparent">
                    <div className={`w-10 h-10 rounded-xl ${lvlIconBg} flex items-center justify-center shrink-0 mt-0.5 shadow-md`}>
                      <LvlIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">{t.selectResolutionLevel}</span>
                      <p className="font-semibold text-foreground">{levelLabel(resolutionLevel)}</p>
                    </div>
                  </motion.div>
                );
              })()}

              {files.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{t.stepAttachments} ({files.length})</span>
                  </div>
                  <ul className="space-y-2 ps-13">
                    {files.map((f, i) => (
                      <li key={i} className="text-sm text-foreground flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                        <FileText className="w-4 h-4 text-primary shrink-0" /> {f.name}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={() => step === 1 ? navigate('/dashboard') : setStep(s => s - 1)}>
            {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {step === 1 ? t.backToDashboard : t.previous}
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
              {t.next}
              {dir === 'rtl' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting || !step1Valid || !step2Valid}>
              {submitting ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : t.submitRequest}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewRequest;
