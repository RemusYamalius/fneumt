import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, User, Calendar, Tag, Eye, Inbox, Loader2, XCircle, Search, Download, Image as ImageIcon, FileIcon, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

type RequestStatus = 'submitted' | 'viewed' | 'in_progress' | 'accepted' | 'cancelled';

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
}

interface IncomingRequest {
  id: string;
  tracking_number: string;
  category: string;
  subject: string;
  description: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  user_id: string;
  sender_name: string | null;
  sender_email: string | null;
  sender_institution: string | null;
}

const STATUS_FILTERS: { key: RequestStatus | 'all' }[] = [
  { key: 'all' },
  { key: 'submitted' },
  { key: 'viewed' },
  { key: 'in_progress' },
  { key: 'accepted' },
  { key: 'cancelled' },
];

const STATUS_THEME_CLASS: Record<RequestStatus | 'all', string> = {
  all: 'request-theme-all',
  submitted: 'request-theme-submitted',
  viewed: 'request-theme-viewed',
  in_progress: 'request-theme-in-progress',
  accepted: 'request-theme-accepted',
  cancelled: 'request-theme-cancelled',
};

const IncomingRequests = () => {
  const { t, dir, lang } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refetch: refetchBadge } = useRealtimeNotifications(user?.id);
  const [requests, setRequests] = useState<IncomingRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<IncomingRequest | null>(null);
  const [changingStatus, setChangingStatus] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<RequestStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;
    setLoadingData(true);
    const { data, error } = await supabase
      .from('requests')
      .select('id, tracking_number, category, subject, description, status, created_at, updated_at, user_id, resolution_level')
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setLoadingData(false);
      return;
    }

    const userIds = [...new Set((data || []).map(r => r.user_id))];
    let profilesMap: Record<string, { full_name: string | null; email: string | null; institution: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, institution')
        .in('user_id', userIds);
      (profiles || []).forEach(p => {
        profilesMap[p.user_id] = { full_name: p.full_name, email: p.email, institution: p.institution };
      });
    }

    setRequests((data || []).map(r => ({
      ...r,
      status: r.status as RequestStatus,
      sender_name: profilesMap[r.user_id]?.full_name || null,
      sender_email: profilesMap[r.user_id]?.email || null,
      sender_institution: profilesMap[r.user_id]?.institution || null,
    })));
    setLoadingData(false);
  };

  const fetchAttachments = async (requestId: string) => {
    setLoadingAttachments(true);
    const { data } = await supabase
      .from('attachments')
      .select('id, file_name, file_path, file_size, mime_type')
      .eq('request_id', requestId);
    setAttachments(data || []);
    setLoadingAttachments(false);
  };

  const handleSelectRequest = async (request: IncomingRequest) => {
    if (selectedRequest?.id === request.id) {
      setSelectedRequest(null);
      setAttachments([]);
      return;
    }
    setSelectedRequest(request);
    fetchAttachments(request.id);

    // Auto-mark as viewed if submitted
    if (request.status === 'submitted' && user) {
      try {
        await supabase.from('requests').update({ status: 'viewed' as any }).eq('id', request.id);
        await supabase.from('request_status_history').insert({
          request_id: request.id,
          old_status: 'submitted' as any,
          new_status: 'viewed' as any,
          changed_by: user.id,
          note: lang === 'ar' ? 'تم الاطلاع على الملف' : 'Dossier consulté',
        } as any);

        await supabase.from('notifications').insert({
          user_id: request.user_id,
          title: lang === 'ar' ? 'تم الاطلاع على ملفك' : 'Dossier consulté',
          message: lang === 'ar'
            ? `تم الاطلاع على ملفك رقم ${request.tracking_number}`
            : `Votre dossier n° ${request.tracking_number} a été consulté`,
          link: '/track',
        });

        const updated = { ...request, status: 'viewed' as RequestStatus };
        setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'viewed' as RequestStatus } : r));
        setSelectedRequest(updated);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleStatusChange = async (request: IncomingRequest, newStatus: RequestStatus) => {
    if (!user) return;
    setChangingStatus(`${request.id}:${newStatus}`);
    try {
      await supabase.from('requests').update({ status: newStatus as any }).eq('id', request.id);
      await supabase.from('request_status_history').insert({
        request_id: request.id,
        old_status: request.status as any,
        new_status: newStatus as any,
        changed_by: user.id,
      } as any);

      const statusLabels: Record<string, { ar: string; fr: string }> = {
        viewed: { ar: 'مطلع عليه', fr: 'Consulté' },
        in_progress: { ar: 'قيد الإجراء', fr: 'En cours' },
        accepted: { ar: 'مقبول', fr: 'Accepté' },
        cancelled: { ar: 'ملغى', fr: 'Annulé' },
      };
      const label = statusLabels[newStatus];
      if (label) {
        await supabase.from('notifications').insert({
          user_id: request.user_id,
          title: lang === 'ar' ? 'تحديث حالة ملفك' : 'Mise à jour de votre dossier',
          message: lang === 'ar'
            ? `تم تغيير حالة ملفك رقم ${request.tracking_number} إلى: ${label.ar}`
            : `Le statut de votre dossier n° ${request.tracking_number} a été changé à : ${label.fr}`,
          link: '/track',
        });
      }

      setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: newStatus } : r));
      setSelectedRequest(prev => prev ? { ...prev, status: newStatus } : null);
      toast({ title: t.statusChangedSuccess });
    } catch (err: any) {
      toast({ title: lang === 'ar' ? 'خطأ' : 'Erreur', description: err?.message, variant: 'destructive' });
    } finally {
      setChangingStatus(null);
    }
  };

  const downloadAttachment = async (att: Attachment) => {
    try {
      const { data, error } = await supabase.storage.from('attachments').download(att.file_path);
      if (error || !data) throw error || new Error(lang === 'ar' ? 'تعذر الوصول إلى الملف' : 'Fichier inaccessible');

      const objectUrl = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = att.file_name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1500);
    } catch (err: any) {
      toast({
        title: lang === 'ar' ? 'تعذر تحميل المرفق' : 'Téléchargement impossible',
        description: err?.message || (lang === 'ar' ? 'تحقق من الصلاحيات ثم أعد المحاولة.' : 'Vérifiez les autorisations puis réessayez.'),
        variant: 'destructive',
      });
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(lang === 'ar' ? 'ar-MA' : 'fr-FR', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const categoryLabel = (key: string) => t[`cat_${key}`] || key;
  const statusLabel = (key: string) => t[`status_${key}`] || key;
  const filterLabel = (key: string) => {
    if (key === 'all') return t.filterAll;
    const map: Record<string, string> = {
      submitted: t.status_submitted || 'مقدّم',
      viewed: t.filterViewed,
      in_progress: t.filterInProgress,
      accepted: t.filterAccepted,
      cancelled: t.filterCancelled,
    };
    return map[key] || key;
  };

  const statusThemeClass = (status: RequestStatus | 'all') => {
    return STATUS_THEME_CLASS[status] || STATUS_THEME_CLASS.all;
  };

  const filteredRequests = requests.filter(r => {
    if (activeFilter !== 'all' && r.status !== activeFilter) return false;
    if (searchQuery.trim() && !r.tracking_number.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
    return true;
  });

  const isFileImage = (mime: string | null) => mime?.startsWith('image/');
  const isFilePdf = (mime: string | null) => mime === 'application/pdf';

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <AuthenticatedLayout>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Top bar: back + search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground">{t.incomingRequests}</h1>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground start-3" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t.searchByTracking}
                className="ps-9"
              />
            </div>
            <button onClick={() => navigate('/dashboard')} className="futuristic-back-btn">
              {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {t.backToDashboard}
            </button>
          </div>
        </div>

        {/* Status filter chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STATUS_FILTERS.map(f => (
            <motion.button
              key={f.key}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveFilter(f.key)}
              className={`request-filter-chip ${statusThemeClass(f.key)} px-4 py-2 rounded-full text-sm font-semibold ${
                activeFilter === f.key
                  ? 'request-filter-chip-active'
                  : 'request-filter-chip-inactive'
              }`}
            >
              {filterLabel(f.key)}
              {f.key !== 'all' && (
                <span className="ms-1.5 text-xs opacity-80">
                  ({requests.filter(r => r.status === f.key).length})
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {loadingData ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-premium p-12 text-center">
            <Inbox className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg text-muted-foreground">{lang === 'ar' ? 'لا توجد طلبات' : 'Aucune demande'}</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((req, index) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05, ease: 'easeOut' }}
              >
                <div
                  onClick={() => handleSelectRequest(req)}
                  className={`request-card-shell ${statusThemeClass(req.status)} rounded-2xl p-5 cursor-pointer ${
                    req.status === 'submitted' ? 'request-card-fresh' : ''
                  } ${selectedRequest?.id === req.id ? 'request-card-open ring-2 ring-primary/30' : 'hover:-translate-y-0.5 hover:shadow-lg'}`}
                >
                  {/* Request row */}
                  <div className="grid gap-4 md:grid-cols-[auto,minmax(0,1fr),auto] md:items-start">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-primary">{req.tracking_number}</span>
                      <span className={`request-status-badge ${statusThemeClass(req.status)} px-2.5 py-0.5 rounded-full text-xs font-semibold`}>
                        {statusLabel(req.status)}
                      </span>
                      {req.status === 'submitted' && (
                        <span className="request-status-pill-new flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          {lang === 'ar' ? 'جديد' : 'Nouveau'}
                        </span>
                      )}
                    </div>

                    <div className="request-owner-chip min-w-0 md:mx-auto">
                      <div className="flex items-start gap-2">
                        <div className="request-owner-icon mt-0.5">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="request-owner-name truncate">{req.sender_name || req.sender_email || '—'}</p>
                          <div className="request-owner-org-wrap">
                            <Building2 className="w-3.5 h-3.5 shrink-0" />
                            <p className="request-owner-org truncate">{req.sender_institution || (lang === 'ar' ? 'المؤسسة غير محددة' : 'Établissement non renseigné')}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="request-view-icon md:justify-self-end">
                      <Eye className="w-5 h-5 shrink-0 text-[color:var(--request-strong)]" />
                    </div>
                  </div>

                  <div className="mt-3">
                    <h3 className="text-base font-semibold text-foreground mb-1 truncate">{(req as any).resolution_level ? (t[`level_${(req as any).resolution_level}`] || (req as any).resolution_level) : req.subject}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        {categoryLabel(req.category)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDateTime(req.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {selectedRequest?.id === req.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-border space-y-4">
                          {/* Description */}
                          {req.description && (
                            <div className="bg-muted/50 rounded-xl p-4">
                              <span className="text-xs font-medium text-muted-foreground">{t.descriptionLabel}</span>
                              <p className="text-foreground mt-1">{req.description}</p>
                            </div>
                          )}

                          {/* Attachments */}
                          <div className="bg-muted/50 rounded-xl p-4">
                            <span className="text-xs font-medium text-muted-foreground mb-2 block">{t.attachments}</span>
                            {loadingAttachments ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                              </div>
                            ) : attachments.length === 0 ? (
                              <p className="text-sm text-muted-foreground">{t.noAttachments}</p>
                            ) : (
                              <div className="space-y-2">
                                {attachments.map(att => (
                                  <div key={att.id} className={`request-attachment-tile ${statusThemeClass(req.status)} flex items-center justify-between rounded-lg px-3 py-2`}>
                                    <div className="flex items-center gap-2 min-w-0">
                                      {isFileImage(att.mime_type) ? <ImageIcon className="w-4 h-4 text-primary shrink-0" /> : <FileIcon className="w-4 h-4 text-primary shrink-0" />}
                                      <span className="text-sm text-foreground truncate">{att.file_name}</span>
                                      {att.file_size && <span className="text-xs text-muted-foreground shrink-0">({(att.file_size / 1024 / 1024).toFixed(1)} MB)</span>}
                                    </div>
                                    <Button size="sm" variant="ghost" className="request-download-btn" onClick={e => { e.stopPropagation(); downloadAttachment(att); }}>
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Status change buttons — always show all 4 statuses */}
                          <div className="flex flex-wrap gap-2 pt-2" onClick={e => e.stopPropagation()}>
                            <span className="text-sm font-medium text-muted-foreground self-center me-1">{t.changeStatus}:</span>
                            {(['viewed', 'in_progress', 'accepted', 'cancelled'] as RequestStatus[]).map(s => {
                              const isActive = req.status === s;
                              const icons: Record<string, typeof Eye> = {
                                viewed: Eye,
                                in_progress: Clock,
                                accepted: CheckCircle2,
                                cancelled: XCircle,
                              };
                              const labels: Record<string, string> = {
                                viewed: t.markViewed,
                                in_progress: t.markInProgress,
                                accepted: t.markAccepted,
                                cancelled: t.markCancelled,
                              };
                              const Icon = icons[s];
                              return (
                                <Button
                                  key={s}
                                  size="sm"
                                  variant={isActive ? 'default' : 'outline'}
                                  className={isActive ? '' : `request-action-button ${statusThemeClass(s)}`}
                                  disabled={isActive || !!changingStatus}
                                  onClick={() => handleStatusChange(req, s)}
                                >
                                  {changingStatus === `${req.id}:${s}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                                  {labels[s]}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
};

export default IncomingRequests;
