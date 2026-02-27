import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Clock, CheckCircle2, User, Calendar, Tag, Eye, Inbox, Loader2, XCircle, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import logoFne from '@/assets/logo-fne.png';

interface IncomingRequest {
  id: string;
  tracking_number: string;
  category: string;
  subject: string;
  description: string | null;
  status: string;
  created_at: string;
  user_id: string;
  sender_name: string | null;
  sender_email: string | null;
}

const IncomingRequests = () => {
  const { t, dir, lang } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<IncomingRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<IncomingRequest | null>(null);
  const [processing, setProcessing] = useState(false);
  const [changingStatus, setChangingStatus] = useState<string | null>(null);

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
      .select('id, tracking_number, category, subject, description, status, created_at, user_id')
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setLoadingData(false);
      return;
    }

    const userIds = [...new Set((data || []).map(r => r.user_id))];
    let profilesMap: Record<string, { full_name: string | null; email: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);
      (profiles || []).forEach(p => {
        profilesMap[p.user_id] = { full_name: p.full_name, email: p.email };
      });
    }

    setRequests((data || []).map(r => ({
      ...r,
      sender_name: profilesMap[r.user_id]?.full_name || null,
      sender_email: profilesMap[r.user_id]?.email || null,
    })));
    setLoadingData(false);
  };

  const handleOpenRequest = async (request: IncomingRequest) => {
    setSelectedRequest(prev => prev?.id === request.id ? null : request);
    if (request.status === 'submitted' && user) {
      setProcessing(true);
      try {
        await supabase
          .from('requests')
          .update({ status: 'received' })
          .eq('id', request.id);

        await supabase
          .from('request_status_history')
          .insert({
            request_id: request.id,
            old_status: 'submitted',
            new_status: 'received',
            changed_by: user.id,
            note: lang === 'ar' ? 'تم فتح الملف ومراجعته' : 'Dossier ouvert et en cours de révision',
          });

        const notifTitle = lang === 'ar' ? 'تم التوصل بملفك' : 'Dossier reçu';
        const notifMessage = lang === 'ar'
          ? `تم التوصل بملفك رقم ${request.tracking_number} وهو قيد المراجعة`
          : `Votre dossier n° ${request.tracking_number} a été reçu et est en cours de révision`;

        await supabase.from('notifications').insert({
          user_id: request.user_id,
          title: notifTitle,
          message: notifMessage,
          link: '/track',
        });

        setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'received' } : r));
        setSelectedRequest(prev => prev ? { ...prev, status: 'received' } : null);
        toast({ title: lang === 'ar' ? 'تم تحديث الحالة' : 'Statut mis à jour' });
      } catch (err: any) {
        toast({ title: lang === 'ar' ? 'خطأ' : 'Erreur', description: err?.message, variant: 'destructive' });
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleStatusChange = async (request: IncomingRequest, newStatus: 'processing' | 'resolved' | 'rejected') => {
    if (!user) return;
    setChangingStatus(newStatus);
    try {
      await supabase
        .from('requests')
        .update({ status: newStatus })
        .eq('id', request.id);

      await supabase
        .from('request_status_history')
        .insert({
          request_id: request.id,
          old_status: request.status as any,
          new_status: newStatus,
          changed_by: user.id,
        });

      // Notify requester
      const statusLabels: Record<string, { ar: string; fr: string }> = {
        processing: { ar: 'قيد المعالجة', fr: 'En traitement' },
        resolved: { ar: 'تمت التسوية', fr: 'Résolu' },
        rejected: { ar: 'مرفوض', fr: 'Rejeté' },
      };
      const label = statusLabels[newStatus];
      await supabase.from('notifications').insert({
        user_id: request.user_id,
        title: lang === 'ar' ? 'تحديث حالة ملفك' : 'Mise à jour de votre dossier',
        message: lang === 'ar'
          ? `تم تغيير حالة ملفك رقم ${request.tracking_number} إلى: ${label.ar}`
          : `Le statut de votre dossier n° ${request.tracking_number} a été changé à : ${label.fr}`,
        link: '/track',
      });

      setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: newStatus } : r));
      setSelectedRequest(prev => prev ? { ...prev, status: newStatus } : null);
      toast({ title: t.statusChangedSuccess });
    } catch (err: any) {
      toast({ title: lang === 'ar' ? 'خطأ' : 'Erreur', description: err?.message, variant: 'destructive' });
    } finally {
      setChangingStatus(null);
    }
  };

  const categoryLabel = (key: string) => t[`cat_${key}`] || key;
  const statusLabel = (key: string) => t[`status_${key}`] || key;
  const statusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'received': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'resolved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Available next statuses based on current status
  const getAvailableStatuses = (currentStatus: string): ('processing' | 'resolved' | 'rejected')[] => {
    switch (currentStatus) {
      case 'received': return ['processing', 'rejected'];
      case 'processing': return ['resolved', 'rejected'];
      default: return [];
    }
  };

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="gradient-primary text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <img src={logoFne} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
          <div>
            <p className="font-bold text-sm">{t.incomingRequests}</p>
            <p className="text-xs text-white/70">{t.platformName}</p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-foreground">{t.incomingRequests}</h1>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            {t.backToDashboard}
          </Button>
        </div>

        {loadingData ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <Inbox className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg text-muted-foreground">{lang === 'ar' ? 'لا توجد طلبات واردة حالياً' : 'Aucune demande reçue pour le moment'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req, index) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <div
                  onClick={() => handleOpenRequest(req)}
                  className={`card-premium p-6 cursor-pointer transition-all duration-200 hover:shadow-xl ${
                    req.status === 'submitted' ? 'border-2 border-amber-300' : ''
                  } ${selectedRequest?.id === req.id ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm font-bold text-primary">{req.tracking_number}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColor(req.status)}`}>
                          {statusLabel(req.status)}
                        </span>
                        {req.status === 'submitted' && (
                          <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {lang === 'ar' ? 'جديد' : 'Nouveau'}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-1 truncate">{req.subject}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          {categoryLabel(req.category)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          {req.sender_name || req.sender_email || '—'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(req.created_at).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Eye className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedRequest?.id === req.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-border">
                          {req.description && (
                            <div className="mb-3">
                              <span className="text-sm font-medium text-muted-foreground">{t.descriptionLabel}:</span>
                              <p className="text-foreground mt-1">{req.description}</p>
                            </div>
                          )}
                          {processing && (
                            <div className="flex items-center gap-2 text-sm text-primary">
                              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              {lang === 'ar' ? 'جارٍ التحديث...' : 'Mise à jour...'}
                            </div>
                          )}

                          {/* Status change buttons */}
                          {getAvailableStatuses(req.status).length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-4" onClick={e => e.stopPropagation()}>
                              <span className="text-sm font-medium text-muted-foreground self-center">{t.changeStatus}:</span>
                              {getAvailableStatuses(req.status).includes('processing') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                  disabled={!!changingStatus}
                                  onClick={() => handleStatusChange(req, 'processing')}
                                >
                                  {changingStatus === 'processing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
                                  {t.markProcessing}
                                </Button>
                              )}
                              {getAvailableStatuses(req.status).includes('resolved') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                  disabled={!!changingStatus}
                                  onClick={() => handleStatusChange(req, 'resolved')}
                                >
                                  {changingStatus === 'resolved' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                  {t.markResolved}
                                </Button>
                              )}
                              {getAvailableStatuses(req.status).includes('rejected') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-300 text-red-700 hover:bg-red-50"
                                  disabled={!!changingStatus}
                                  onClick={() => handleStatusChange(req, 'rejected')}
                                >
                                  {changingStatus === 'rejected' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                  {t.markRejected}
                                </Button>
                              )}
                            </div>
                          )}

                          {req.status === 'resolved' && (
                            <div className="flex items-center gap-2 text-sm text-emerald-600 mt-2">
                              <CheckCircle2 className="w-4 h-4" />
                              {lang === 'ar' ? 'تمت تسوية هذا الطلب' : 'Cette demande a été traitée'}
                            </div>
                          )}
                          {req.status === 'rejected' && (
                            <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                              <XCircle className="w-4 h-4" />
                              {lang === 'ar' ? 'تم رفض هذا الطلب' : 'Cette demande a été rejetée'}
                            </div>
                          )}
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
    </div>
  );
};

export default IncomingRequests;
