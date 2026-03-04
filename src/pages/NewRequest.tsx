import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Upload, X, Check, Copy, FileText, Heart, TrendingUp, MapPin, Building, CreditCard, GraduationCap } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import logoFne from '@/assets/logo-fne.png';

type RequestCategory = 'medical_file' | 'mohammed_vi_foundation' | 'promotions' | 'transfer' | 'assets' | 'subscriptions' | 'scholarships';

const CATEGORIES: { key: RequestCategory; icon: typeof FileText }[] = [
  { key: 'medical_file', icon: Heart },
  { key: 'mohammed_vi_foundation', icon: Building },
  { key: 'promotions', icon: TrendingUp },
  { key: 'transfer', icon: MapPin },
  { key: 'assets', icon: CreditCard },
  { key: 'subscriptions', icon: CreditCard },
  { key: 'scholarships', icon: GraduationCap },
];

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

  const stepLabels = [t.stepCategory, t.stepDetails, t.stepAttachments, t.stepReview];

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
    if (!category || !subject.trim() || !user) return;
    setSubmitting(true);
    try {
      // 1. Create request
      const { data: request, error: reqError } = await supabase
        .from('requests')
        .insert({ category, subject: subject.trim(), description: description.trim() || null, user_id: user.id })
        .select('id, tracking_number')
        .single();

      if (reqError || !request) throw reqError;

      // 2. Upload files & create attachment records
      for (const file of files) {
        const filePath = `${user.id}/${request.id}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

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
      setStep(5); // success
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
    if (step === 1) return !!category;
    if (step === 2) return subject.trim().length > 0;
    return true;
  };

  const categoryLabel = (key: RequestCategory) => t[`cat_${key}`] || key;

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
          <img src={logoFne} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
          <div>
            <p className="font-bold text-sm">{t.newRequest}</p>
            <p className="text-xs text-white/70">{t.platformName}</p>
          </div>
        </div>
      </header>

      {/* Steps indicator */}
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-8">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${i + 1 <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {i + 1 < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i + 1 <= step ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{label}</span>
              {i < 3 && <div className={`flex-1 h-0.5 mx-2 ${i + 1 < step ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
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
            <div className={`grid grid-cols-2 sm:grid-cols-3 gap-4 ${profileComplete === false ? 'opacity-50 pointer-events-none' : ''}`} style={{ direction: 'ltr' }}>
              {CATEGORIES.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={`p-6 rounded-2xl border-2 text-center transition-all duration-200 ${category === key ? 'border-primary bg-primary/5 shadow-lg' : 'border-border bg-card hover:border-primary/30 hover:shadow-md'}`}
                >
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${category === key ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`w-6 h-6 ${category === key ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <p className={`text-sm font-medium ${category === key ? 'text-primary' : 'text-foreground'}`}>{categoryLabel(key)}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Subject & Description */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground mb-6">{t.stepDetails}</h2>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t.subjectLabel} *</label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder={t.subjectPlaceholder} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t.descriptionLabel}</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t.descriptionPlaceholder} rows={5} />
            </div>
          </div>
        )}

        {/* Step 3: Attachments */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-6">{t.stepAttachments}</h2>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              className="border-2 border-dashed border-border rounded-2xl p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">{t.dropFiles}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.maxFiles} — {t.onlyPdfImages || 'PDF / صور فقط'}</p>
              <input ref={fileInputRef} type="file" multiple accept="application/pdf,image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
            </div>
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button onClick={() => removeFile(i)} className="p-1 rounded-lg hover:bg-destructive/10 transition-colors">
                      <X className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-6">{t.stepReview}</h2>
            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">{t.selectCategory}</span>
                <p className="font-medium text-foreground">{category ? categoryLabel(category) : ''}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">{t.subjectLabel}</span>
                <p className="font-medium text-foreground">{subject}</p>
              </div>
              {description && (
                <div>
                  <span className="text-sm text-muted-foreground">{t.descriptionLabel}</span>
                  <p className="text-foreground">{description}</p>
                </div>
              )}
              {files.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">{t.stepAttachments} ({files.length})</span>
                  <ul className="mt-1 space-y-1">
                    {files.map((f, i) => (
                      <li key={i} className="text-sm text-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" /> {f.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={() => step === 1 ? navigate('/dashboard') : setStep(s => s - 1)}>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            {step === 1 ? t.backToDashboard : t.previous}
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
              {t.next}
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : t.submitRequest}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewRequest;
