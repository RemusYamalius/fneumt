import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import logoFne from '@/assets/logo-fne.png';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, Upload, X, Check, Copy, FileText, Award, Star, Clock,
  Building2, Coins, MapPin, Wrench, AlertTriangle, ClipboardList, Search,
  MoreHorizontal, Landmark, GraduationCap, Building, School, Download, Send, Zap
} from 'lucide-react';
import { motion, AnimatePresence, useAnimationFrame } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import CountdownOverlay from '@/components/CountdownOverlay';
import IncompleteProfileMessage from '@/components/IncompleteProfileMessage';

type RequestCategory = 'rank_promotion' | 'grade_promotion' | 'schedules' | 'infrastructure' | 'financial_compensation' | 'zone_compensation' | 'equipment' | 'grievances' | 'assignments' | 'inspection_score' | 'other';
type ResolutionLevel = 'ministry' | 'academy' | 'directorate' | 'institution';

const CATEGORIES: { key: RequestCategory; icon: typeof FileText; color: string }[] = [
  { key: 'rank_promotion', icon: Award, color: 'hsl(220 80% 60%)' },
  { key: 'grade_promotion', icon: Star, color: 'hsl(270 70% 60%)' },
  { key: 'schedules', icon: Clock, color: 'hsl(160 70% 45%)' },
  { key: 'infrastructure', icon: Building2, color: 'hsl(35 90% 55%)' },
  { key: 'financial_compensation', icon: Coins, color: 'hsl(45 90% 50%)' },
  { key: 'zone_compensation', icon: MapPin, color: 'hsl(340 70% 55%)' },
  { key: 'equipment', icon: Wrench, color: 'hsl(190 80% 45%)' },
  { key: 'grievances', icon: AlertTriangle, color: 'hsl(0 70% 55%)' },
  { key: 'assignments', icon: ClipboardList, color: 'hsl(200 75% 50%)' },
  { key: 'inspection_score', icon: Search, color: 'hsl(290 65% 55%)' },
  { key: 'other', icon: MoreHorizontal, color: 'hsl(210 15% 55%)' },
];

const RESOLUTION_LEVELS: { key: ResolutionLevel; icon: typeof Landmark; color: string }[] = [
  { key: 'ministry', icon: Landmark, color: 'hsl(230 75% 55%)' },
  { key: 'academy', icon: GraduationCap, color: 'hsl(155 65% 42%)' },
  { key: 'directorate', icon: Building, color: 'hsl(30 85% 50%)' },
  { key: 'institution', icon: School, color: 'hsl(345 70% 50%)' },
];

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/* ── Orbital Hub component ── */
const OrbitalHub = ({
  items,
  selectedKey,
  onSelect,
  centerLabel,
  labelFn,
  isSmall,
}: {
  items: { key: string; icon: typeof FileText; color: string }[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  centerLabel: string;
  labelFn: (key: string) => string;
  isSmall?: boolean;
}) => {
  const [rotation, setRotation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartAngle = useRef(0);
  const rotationAtDragStart = useRef(0);

  // Responsive radius
  const baseRadius = isSmall ? 100 : (typeof window !== 'undefined' && window.innerWidth < 640 ? 130 : window.innerWidth < 1024 ? 160 : 220);
  const itemSize = isSmall ? 48 : (typeof window !== 'undefined' && window.innerWidth < 640 ? 56 : window.innerWidth < 1024 ? 68 : 76);

  useAnimationFrame((time, delta) => {
    if (!isHovered && !isDragging.current) {
      setRotation(prev => (prev + (delta * 0.012)) % 360);
    }
  });

  const getAngleFromCenter = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Don't drag if clicking an orbital item button
    if ((e.target as HTMLElement).closest('.orbital-item')) return;
    isDragging.current = true;
    dragStartAngle.current = getAngleFromCenter(e.clientX, e.clientY);
    rotationAtDragStart.current = rotation;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [getAngleFromCenter, rotation]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const currentAngle = getAngleFromCenter(e.clientX, e.clientY);
    const delta = currentAngle - dragStartAngle.current;
    setRotation((rotationAtDragStart.current + delta) % 360);
  }, [getAngleFromCenter]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const angleStep = (2 * Math.PI) / items.length;

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center touch-none"
      style={{
        width: (baseRadius * 2) + itemSize + 60,
        height: (baseRadius * 2) + itemSize + 60,
        overflow: 'visible',
        cursor: isDragging.current ? 'grabbing' : 'grab',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setHoveredItem(null); }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Orbit ring */}
      <div
        className="absolute rounded-full orbital-ring"
        style={{
          width: baseRadius * 2,
          height: baseRadius * 2,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Center hub */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 orbital-center ${isSmall ? 'w-20 h-20' : 'w-28 h-28 sm:w-32 sm:h-32'} rounded-full flex items-center justify-center`}>
        <div className="orbital-center-glow absolute inset-0 rounded-full" />
        <div className="relative z-10 w-full h-full rounded-full" style={{ isolation: 'isolate' }}>
          {/* Border shine */}
          <div
            className="absolute inset-[-2px] rounded-full animate-logo-border-shine"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, transparent 60%, hsl(190 100% 60%) 75%, hsl(210 100% 70%) 85%, transparent 100%)',
            }}
          />
          <div className="absolute inset-[2px] rounded-full bg-white/10 backdrop-blur-sm" />
          <img src={logoFne} alt="FNE Logo" className="relative z-10 w-full h-full object-contain rounded-full" />
          {/* Sparkle swipe */}
          <div
            className="absolute inset-0 rounded-full animate-logo-sparkle z-20 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, transparent 30%, hsl(190 100% 80% / 0.6) 45%, hsl(210 100% 90% / 0.4) 55%, transparent 70%)',
              backgroundSize: '300% 300%',
            }}
          />
        </div>
      </div>

      {/* Orbiting items */}
      {items.map((item, i) => {
        const angle = angleStep * i + (rotation * Math.PI) / 180;
        const x = Math.cos(angle) * baseRadius;
        const y = Math.sin(angle) * baseRadius;
        const Icon = item.icon;
        const isSelected = selectedKey === item.key;
        const isItemHovered = hoveredItem === item.key;

        return (
          <motion.button
            key={item.key}
            className="absolute orbital-item overflow-visible"
            style={{
              width: itemSize,
              height: itemSize,
              left: `calc(50% + ${x}px - ${itemSize / 2}px)`,
              top: `calc(50% + ${y}px - ${itemSize / 2}px)`,
              zIndex: isItemHovered || isSelected ? 30 : 5,
            }}
            animate={{
              scale: isItemHovered ? 1.35 : isSelected ? 1.2 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onMouseEnter={() => setHoveredItem(item.key)}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => onSelect(item.key)}
          >
            <div
              className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-300 ${isSelected ? 'orbital-item-selected' : 'orbital-item-default'}`}
              style={{
                borderColor: isSelected || isItemHovered ? item.color : 'hsl(210 20% 25%)',
                boxShadow: isSelected ? `0 0 20px ${item.color}, 0 0 40px ${item.color}40` : isItemHovered ? `0 0 15px ${item.color}80` : 'none',
              }}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: isSelected || isItemHovered ? item.color : 'hsl(210 15% 65%)' }} />
            </div>
            {/* Phase 1 label: always visible below icon, with bg on hover */}
            {!isSmall && (
              <div
                className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap orbital-label-persistent pointer-events-none px-1.5 py-0.5 rounded"
                style={{
                  color: isSelected || isItemHovered ? item.color : 'hsl(210 15% 50%)',
                  fontSize: isSelected || isItemHovered ? '0.65rem' : '0.55rem',
                  fontWeight: isSelected || isItemHovered ? 800 : 600,
                  textShadow: isSelected || isItemHovered ? `0 0 8px ${item.color}60` : 'none',
                  opacity: isSelected || isItemHovered ? 1 : 0.7,
                  background: isSelected || isItemHovered ? 'hsla(220 30% 10% / 0.85)' : 'transparent',
                }}
              >
                {labelFn(item.key)}
              </div>
            )}
          </motion.button>
        );
      })}

      {/* Phase 2: static label above the wheel for selected item */}
      {isSmall && selectedKey && (() => {
        const selectedItem = items.find(it => it.key === selectedKey);
        if (!selectedItem) return null;
        return (
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none text-center px-3 py-1 rounded-lg"
            style={{
              color: selectedItem.color,
              fontSize: '0.85rem',
              fontWeight: 800,
              textShadow: `0 0 12px ${selectedItem.color}60`,
              background: 'rgba(255 255 255 / 0.08)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${selectedItem.color}30`,
              zIndex: 40,
            }}
          >
            {labelFn(selectedItem.key)}
          </div>
        );
      })()}
    </div>
  );
};

/* ── Floating Particles background ── */
const FloatingParticles = () => {
  const particles = useMemo(() =>
    Array.from({ length: 35 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      color: i % 3 === 0 ? 'hsl(190 80% 55%)' : i % 3 === 1 ? 'hsl(220 70% 60%)' : 'hsl(270 60% 55%)',
      opacity: Math.random() * 0.4 + 0.1,
    })), []
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: p.color,
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
          animate={{
            x: [0, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 60, 0],
            y: [0, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 60, 0],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity * 0.5, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
};

/* ── Particle Explosion on Success ── */
const ParticleExplosion = () => {
  const particles = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => {
      const angle = (i / 50) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const distance = Math.random() * 300 + 100;
      const colors = ['hsl(190 80% 55%)', 'hsl(160 70% 50%)', 'hsl(270 60% 55%)', 'hsl(45 90% 55%)', 'hsl(220 80% 60%)'];
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        size: Math.random() * 6 + 2,
        color: colors[i % colors.length],
        duration: Math.random() * 1.5 + 0.8,
        delay: Math.random() * 0.3,
      };
    }), []
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center" style={{ zIndex: 50 }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.2 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
};

const NewRequest = () => {
  const { t, dir } = useI18n();
  const { user, profile, role, loading } = useAuth();
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
  const [countdownDone, setCountdownDone] = useState(false);

  // May 1, 2026 at 10:00 AM (Morocco time ~ UTC+1)
  const TARGET_DATE = useMemo(() => new Date('2026-05-01T09:00:00Z'), []);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  // Check if profile is complete
  const isProfileComplete = useCallback(() => {
    if (!profile) return false;
    const requiredFields = ['full_name', 'gender', 'date_of_birth', 'employee_number', 'mission', 'academy', 'directorate', 'institution', 'phone'] as const;
    return requiredFields.every(field => {
      const val = profile[field as keyof typeof profile];
      return val !== null && val !== undefined && val !== '';
    });
  }, [profile]);

  // Roles that bypass the countdown (non-teacher roles = administrative/supervisory)
  const isPrivilegedRole = role && role !== 'teacher';

  // Determine what to show
  const now = new Date();
  const isBeforeTarget = now < TARGET_DATE && !countdownDone;
  const profileComplete = isProfileComplete();

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

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
    const finalSubject = category === 'other' ? subject.trim() : (t[`cat_${category}`] || category);
    const finalDescription = category === 'other' ? (description.trim() || null) : null;
    if (!finalSubject) return;
    setSubmitting(true);
    try {
      const { data: request, error: reqError } = await supabase.from('requests').insert({
        category, subject: finalSubject, description: finalDescription,
        user_id: user.id, resolution_level: resolutionLevel || null,
      } as any).select('id, tracking_number').single();
      if (reqError || !request) throw reqError;
      for (const file of files) {
        const filePath = `${user.id}/${request.id}/${file.name}`;
        const { error: uploadError } = await supabase.storage.from('attachments').upload(filePath, file);
        if (uploadError) { console.error('Upload error:', uploadError); continue; }
        await supabase.from('attachments').insert({
          request_id: request.id, file_name: file.name, file_path: filePath,
          file_size: file.size, mime_type: file.type || null, uploaded_by: user.id,
        });
      }
      setTrackingNumber(request.tracking_number);
      setStep(5);
    } catch (err: any) {
      toast({ title: t.submitError, description: err?.message, variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  const copyTracking = () => {
    if (trackingNumber) {
      navigator.clipboard.writeText(trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const categoryLabel = (key: string) => t[`cat_${key}`] || key;
  const levelLabel = (key: string) => t[`level_${key}`] || key;

  const slideDirection = dir === 'rtl' ? 1 : -1;

  // Step progress
  const stepLabels = [t.stepCategory, t.stepResolutionLevel, t.stepAttachments, t.stepReview];

  const handleCategorySelect = (key: string) => {
    setCategory(key as RequestCategory);
    if (key !== 'other') {
      setTimeout(() => setStep(2), 400);
    }
  };

  const handleResolutionSelect = (key: string) => {
    setResolutionLevel(key as ResolutionLevel);
    setTimeout(() => setStep(3), 400);
  };

  // Success screen
  if (step === 5) {
    return (
      <div className="min-h-screen futuristic-bg flex items-center justify-center px-6 relative overflow-hidden" dir={dir}>
        <FloatingParticles />
        <ParticleExplosion />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="max-w-md w-full futuristic-card p-8 text-center relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center success-orb"
          >
            <Check className="w-10 h-10" style={{ color: 'hsl(160 80% 55%)' }} />
          </motion.div>
          <h2 className="text-2xl font-black mb-2" style={{ color: 'hsl(0 0% 95%)' }}>{t.requestSubmitted}</h2>
          <p className="text-sm mb-6" style={{ color: 'hsl(210 15% 60%)' }}>{t.trackingNumberLabel}</p>
          <div className="flex items-center justify-center gap-2 rounded-xl p-4 mb-6" style={{ background: 'hsl(210 30% 12%)', border: '1px solid hsl(190 80% 40% / 0.3)' }}>
            <span className="text-xl font-mono font-black" style={{ color: 'hsl(190 100% 65%)' }}>{trackingNumber}</span>
            <button onClick={copyTracking} className="p-2 rounded-lg transition-colors hover:bg-white/5">
              {copied ? <Check className="w-5 h-5" style={{ color: 'hsl(160 80% 55%)' }} /> : <Copy className="w-5 h-5" style={{ color: 'hsl(210 15% 55%)' }} />}
            </button>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="flex-1 futuristic-btn-outline">{t.backToDashboard}</Button>
            <Button onClick={() => navigate('/track')} className="flex-1 futuristic-btn-primary">{t.trackFiles}</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Case 1: Profile incomplete → show message
  if (!profileComplete) {
    return (
      <AuthenticatedLayout>
        <IncompleteProfileMessage profile={profile} />
      </AuthenticatedLayout>
    );
  }

  // Show countdown overlay for teachers before target date
  const showCountdown = !isPrivilegedRole && isBeforeTarget;

  // Case 3: Normal page (with optional countdown overlay on top)
  return (
    <AuthenticatedLayout>
      <div className="futuristic-bg min-h-[calc(100vh-4rem)] relative overflow-hidden" dir={dir}>
        <FloatingParticles />
        {/* Top bar */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => step === 1 ? navigate('/dashboard') : setStep(s => s - 1)}
              className="futuristic-back-btn"
            >
              {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              <span>{step === 1 ? t.backToDashboard : t.previous}</span>
            </button>

            {/* Step indicator */}
            <div className="flex items-center gap-1 sm:gap-2">
              {stepLabels.map((label, i) => {
                const stepNum = i + 1;
                const isActive = stepNum === step;
                const isDone = stepNum < step;
                return (
                  <div key={i} className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={() => {
                        if (isDone) setStep(stepNum);
                      }}
                      className={`futuristic-step-dot ${isActive ? 'active' : isDone ? 'done' : ''}`}
                      disabled={!isDone && !isActive}
                    >
                      {isDone ? <Check className="w-3 h-3" /> : <span className="text-[0.65rem] font-bold">{stepNum}</span>}
                    </button>
                    <span className={`hidden sm:block text-[0.7rem] font-bold ${isActive ? 'futuristic-text-cyan' : isDone ? 'futuristic-text-cyan-dim' : 'futuristic-text-muted'}`}>{label}</span>
                    {i < 3 && <div className={`w-4 sm:w-8 h-px ${isDone ? 'bg-[hsl(190_80%_45%)]' : 'bg-[hsl(210_20%_20%)]'}`} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Countdown overlay — rendered in page flow, above wheel */}
        {showCountdown && (
          <div className="relative z-40 pointer-events-auto">
            <CountdownOverlay targetDate={TARGET_DATE} onComplete={() => setCountdownDone(true)} />
          </div>
        )}

        {/* Content area */}
        <div className={`max-w-6xl mx-auto px-4 sm:px-6 pb-12 ${showCountdown ? 'pointer-events-none' : ''}`}>
          <AnimatePresence mode="wait">
            {/* ──────── STEP 1: Category orbital ──────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: slideDirection * 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDirection * -100 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="flex flex-col items-center"
              >
                <div>
                  <OrbitalHub
                    items={CATEGORIES}
                    selectedKey={category}
                    onSelect={handleCategorySelect}
                    centerLabel={t.selectCategory}
                    labelFn={categoryLabel}
                  />
                </div>

                {/* "Other" fields */}
                <AnimatePresence>
                  {category === 'other' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="w-full max-w-lg mt-6 futuristic-card p-6 space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold mb-2 futuristic-text-cyan">{t.subjectLabel} *</label>
                        <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder={t.subjectPlaceholder} className="futuristic-input" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-2 futuristic-text-cyan">{t.descriptionLabel}</label>
                        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t.descriptionPlaceholder} rows={3} className="futuristic-input" />
                      </div>
                      <Button
                        onClick={() => { if (subject.trim()) setStep(2); }}
                        disabled={!subject.trim()}
                        className="w-full futuristic-btn-primary"
                      >
                        {t.next}
                        {dir === 'rtl' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ──────── STEP 2: Resolution Level ──────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: slideDirection * 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDirection * -100 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="flex flex-col items-center"
              >
                <OrbitalHub
                  items={RESOLUTION_LEVELS}
                  selectedKey={resolutionLevel}
                  onSelect={handleResolutionSelect}
                  centerLabel={t.selectLevel}
                  labelFn={levelLabel}
                  isSmall
                />
              </motion.div>
            )}

            {/* ──────── STEP 3: Attachments ──────── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: slideDirection * 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDirection * -100 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="max-w-lg mx-auto"
              >
                <div className="futuristic-card p-6 sm:p-8 space-y-6">
                  <h3 className="text-lg font-black futuristic-text-cyan text-center">{t.attachDocuments}</h3>

                  <div
                    className="futuristic-dropzone group"
                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={e => { e.preventDefault(); e.stopPropagation(); handleFiles(e.dataTransfer.files); }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input ref={fileInputRef} type="file" className="hidden" multiple accept={ACCEPTED_TYPES.join(',')} onChange={e => handleFiles(e.target.files)} />
                    <Upload className="w-10 h-10 mb-3 futuristic-text-cyan group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-bold futuristic-text-cyan mb-1">{t.dragOrClick}</p>
                    <p className="text-xs futuristic-text-muted">{t.maxFiles}</p>
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((file, idx) => (
                        <div key={idx} className="futuristic-file-item">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {file.type.startsWith('image/') ? (
                              <img src={URL.createObjectURL(file)} alt={file.name} className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <FileText className="w-6 h-6 futuristic-text-cyan flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold truncate" style={{ color: 'hsl(0 0% 90%)' }}>{file.name}</p>
                              <p className="text-xs futuristic-text-muted">{(file.size / 1024).toFixed(0)} KB</p>
                            </div>
                          </div>
                          <button onClick={() => removeFile(idx)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                            <X className="w-4 h-4" style={{ color: 'hsl(0 70% 55%)' }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button onClick={() => setStep(4)} className="flex-1 futuristic-btn-primary">
                      {files.length > 0 ? t.next : (t.skipAttachments || 'Continuer sans pièces jointes')}
                      {dir === 'rtl' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ──────── STEP 4: Review & Submit ──────── */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: slideDirection * 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDirection * -100 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="max-w-lg mx-auto"
              >
                <motion.div
                  className="futuristic-card p-6 sm:p-8 space-y-6"
                  initial={{ rotateX: 10, perspective: 800 }}
                  animate={{ rotateX: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                  <h3 className="text-lg font-black futuristic-text-cyan text-center">{t.reviewRequest}</h3>

                  <div className="space-y-4">
                    {/* Category */}
                    <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'hsl(210 30% 10%)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: CATEGORIES.find(c => c.key === category)?.color || 'hsl(210 15% 40%)' }}>
                        {(() => { const cat = CATEGORIES.find(c => c.key === category); return cat ? <cat.icon className="w-4 h-4 text-white" /> : null; })()}
                      </div>
                      <div>
                        <p className="text-xs futuristic-text-muted mb-0.5">{t.stepCategory}</p>
                        <p className="text-sm font-bold" style={{ color: 'hsl(0 0% 90%)' }}>{category === 'other' ? subject : categoryLabel(category!)}</p>
                        {category === 'other' && description && (
                          <p className="text-xs mt-1 futuristic-text-muted">{description}</p>
                        )}
                      </div>
                    </div>

                    {/* Resolution level */}
                    {resolutionLevel && (
                      <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'hsl(210 30% 10%)' }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: RESOLUTION_LEVELS.find(l => l.key === resolutionLevel)?.color || 'hsl(210 15% 40%)' }}>
                          {(() => { const lvl = RESOLUTION_LEVELS.find(l => l.key === resolutionLevel); return lvl ? <lvl.icon className="w-4 h-4 text-white" /> : null; })()}
                        </div>
                        <div>
                          <p className="text-xs futuristic-text-muted mb-0.5">{t.stepResolutionLevel}</p>
                          <p className="text-sm font-bold" style={{ color: 'hsl(0 0% 90%)' }}>{levelLabel(resolutionLevel!)}</p>
                        </div>
                      </div>
                    )}

                    {/* Attachments */}
                    <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'hsl(210 30% 10%)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(190 80% 40%)' }}>
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs futuristic-text-muted mb-0.5">{t.stepAttachments}</p>
                        <p className="text-sm font-bold" style={{ color: 'hsl(0 0% 90%)' }}>
                          {files.length > 0 ? `${files.length} ${t.filesAttached || 'fichier(s)'}` : (t.noAttachments || 'Aucune pièce jointe')}
                        </p>
                        {files.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {files.map((f, i) => (
                              <p key={i} className="text-xs futuristic-text-muted truncate">{f.name}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Generate PDF */}
                  <Button variant="outline" className="w-full futuristic-btn-outline" onClick={async () => {
                    const { jsPDF } = await import('jspdf');
                    const pdf = new jsPDF();
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(18);
                    pdf.text('FNE - Request Summary', 20, 30);
                    pdf.setFontSize(12);
                    pdf.setFont('helvetica', 'normal');
                    const info = [
                      `Category: ${categoryLabel(category!)}`,
                      `Subject: ${category === 'other' ? subject : categoryLabel(category!)}`,
                      ...(description ? [`Description: ${description}`] : []),
                      ...(resolutionLevel ? [`Resolution Level: ${levelLabel(resolutionLevel)}`] : []),
                      `Attachments: ${files.length}`,
                      ...(files.map(f => `  - ${f.name}`)),
                    ];
                    info.forEach((line, i) => pdf.text(line, 20, 50 + i * 10));
                    pdf.save('request-summary.pdf');
                  }}>
                    <Download className="w-4 h-4" />
                    {t.downloadSummary || 'Télécharger le résumé'}
                  </Button>

                  {/* Submit */}
                  <motion.button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full futuristic-submit-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'hsl(190 80% 55%)', borderTopColor: 'transparent' }} />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>{t.submitRequest}</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default NewRequest;
