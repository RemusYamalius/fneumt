import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft, ArrowRight, Check, Clock, FileSearch, XCircle, Inbox, Eye } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AnimatedLogo from '@/components/AnimatedLogo';

type RequestStatus = 'submitted' | 'viewed' | 'in_progress' | 'accepted' | 'cancelled';

interface RequestResult {
  tracking_number: string;
  category: string;
  subject: string;
  status: RequestStatus;
  created_at: string;
}

const STATUS_STEPS: { key: RequestStatus; icon: typeof Check }[] = [
  { key: 'submitted', icon: Inbox },
  { key: 'viewed', icon: Eye },
  { key: 'in_progress', icon: Clock },
  { key: 'accepted', icon: FileSearch },
];

const TrackRequest = () => {
  const { t, dir, lang } = useI18n();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<RequestResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setNotFound(false);
    setResult(null);

    const { data, error } = await supabase
      .from('requests')
      .select('tracking_number, category, subject, status, created_at')
      .eq('tracking_number', query.trim())
      .maybeSingle();

    if (error || !data) {
      setNotFound(true);
    } else {
      setResult(data as RequestResult);
    }
    setSearching(false);
  };

  const categoryLabel = (key: string) => t[`cat_${key}`] || key;
  const statusLabel = (key: string) => t[`status_${key}`] || key;

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(lang === 'ar' ? 'ar-MA' : 'fr-FR', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getStatusIndex = (status: RequestStatus): number => {
    if (status === 'cancelled') return -1;
    return STATUS_STEPS.findIndex(s => s.key === status);
  };

  const currentIndex = result ? getStatusIndex(result.status) : -1;
  const isCancelled = result?.status === 'cancelled';

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="gradient-primary text-white shadow-lg">
        <div className="max-w-3xl mx-auto px-6 py-6 text-center">
          <Link to="/" className="inline-block mb-4">
            <AnimatedLogo size="w-28 h-28" />
          </Link>
          <h1 className="text-2xl font-bold">{t.trackFiles}</h1>
          <p className="text-sm text-white/70 mt-1">{t.trackFilesDesc}</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex gap-3 mb-8">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t.trackingPlaceholder}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="text-base"
          />
          <Button onClick={handleSearch} disabled={searching || !query.trim()}>
            {searching ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
            {t.searchButton}
          </Button>
        </div>

        {notFound && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-8 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-3 text-destructive" />
            <p className="text-foreground font-medium">{t.trackingNotFound}</p>
            <p className="text-sm text-muted-foreground mt-1">{t.trackingNotFoundDesc}</p>
          </div>
        )}

        {result && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <span className="text-xs text-muted-foreground">{t.trackingNumberLabel}</span>
                <p className="font-mono font-bold text-primary">{result.tracking_number}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{t.selectCategory}</span>
                <p className="font-medium text-foreground">{categoryLabel(result.category)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{t.subjectLabel}</span>
                <p className="font-medium text-foreground">{result.subject}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{t.sentAt}</span>
                <p className="font-medium text-foreground">{formatDateTime(result.created_at)}</p>
              </div>
            </div>

            {isCancelled ? (
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-center">
                <XCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
                <p className="font-bold text-destructive">{statusLabel('cancelled')}</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-foreground mb-4">{t.currentStatus}</p>
                <div className="flex items-center justify-between">
                  {STATUS_STEPS.map((s, i) => {
                    const isActive = i <= currentIndex;
                    const isCurrent = i === currentIndex;
                    return (
                      <div key={s.key} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isCurrent ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            <s.icon className="w-5 h-5" />
                          </div>
                          <span className={`text-xs mt-2 text-center ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{statusLabel(s.key)}</span>
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`flex-1 h-1 mx-2 rounded-full ${i < currentIndex ? 'bg-primary' : 'bg-muted'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {t.backToHome}
          </Link>
        </div>
      </main>
    </div>
  );
};

export default TrackRequest;
