import { motion } from 'framer-motion';
import { MapPin, Building2, Users, User, Hash, Phone, Mail, Briefcase, Landmark } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DeputyInfo, LocalOfficeInfo } from '@/hooks/useHierarchicalFilter';
import type { Academy } from '@/lib/academies-data';

interface HierarchicalFiltersProps {
  canSeeHierarchy: boolean;
  isNational: boolean;
  isRegional: boolean;
  isProvincial: boolean;
  isLocal: boolean;
  selectedAcademy: string;
  setSelectedAcademy: (v: string) => void;
  selectedDirectorate: string;
  setSelectedDirectorate: (v: string) => void;
  selectedOffice: string;
  setSelectedOffice: (v: string) => void;
  selectedDeputy: string;
  setSelectedDeputy: (v: string) => void;
  availableAcademies: Academy[];
  availableDirectorates: string[];
  offices: LocalOfficeInfo[];
  deputies: DeputyInfo[];
  selectedDeputyInfo: DeputyInfo | null;
}

const CORPS_LABELS: Record<string, Record<string, string>> = {
  ar: { primary: 'ابتدائي', middle_school: 'إعدادي', high_school: 'ثانوي', administrative: 'إداري' },
  fr: { primary: 'Primaire', middle_school: 'Collège', high_school: 'Lycée', administrative: 'Administratif' },
};

const HierarchicalFilters = ({
  canSeeHierarchy, isNational, isRegional, isProvincial, isLocal,
  selectedAcademy, setSelectedAcademy,
  selectedDirectorate, setSelectedDirectorate,
  selectedOffice, setSelectedOffice,
  selectedDeputy, setSelectedDeputy,
  availableAcademies, availableDirectorates,
  offices, deputies, selectedDeputyInfo,
}: HierarchicalFiltersProps) => {
  const { t, lang } = useI18n();

  if (!canSeeHierarchy) return null;

  const shortAcademy = (label: string) => label.replace('الأكاديمية الجهوية للتربية والتكوين لجهة ', '').replace("Académie régionale de l'éducation et de la formation de la région ", '');

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
      {/* Scope Filters Row */}
      <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Landmark className="w-3.5 h-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-foreground">{t.hierarchyScope}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Academy */}
          {(isNational || isRegional) && (
            <div>
              <label className="text-sm font-bold bg-blue-100/60 text-blue-700 px-2 py-0.5 rounded-md mb-1 inline-block">{t.academyLabel}</label>
              <Select value={selectedAcademy} onValueChange={v => setSelectedAcademy(v === '__all__' ? '' : v)} disabled={isRegional}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t.allAcademies} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{t.allAcademies}</SelectItem>
                  {availableAcademies.map(a => (
                    <SelectItem key={a.label} value={a.label}>{shortAcademy(a.label)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Directorate */}
          {(selectedAcademy || isProvincial) && (
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{t.directorateLabel}</label>
              <Select value={selectedDirectorate} onValueChange={v => setSelectedDirectorate(v === '__all__' ? '' : v)} disabled={isProvincial}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t.allDirectorates} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{t.allDirectorates}</SelectItem>
                  {availableDirectorates.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Local Office */}
          {(selectedDirectorate || isLocal) && offices.length > 0 && (
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{t.localOfficeLabel}</label>
              <Select value={selectedOffice} onValueChange={v => setSelectedOffice(v === '__all__' ? '' : v)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t.allOffices} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{t.allOffices}</SelectItem>
                  {offices.map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.office_name || o.id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Deputy */}
          {(selectedDirectorate || isLocal) && deputies.length > 0 && (
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{t.deputyLabel}</label>
              <Select value={selectedDeputy} onValueChange={v => setSelectedDeputy(v === '__all__' ? '' : v)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t.allDeputies} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{t.allDeputies}</SelectItem>
                  {deputies.map(d => (
                    <SelectItem key={d.user_id} value={d.user_id}>{d.full_name || d.user_id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Deputy Info Card */}
      {selectedDeputyInfo && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">{selectedDeputyInfo.full_name}</h4>
              <p className="text-[11px] text-muted-foreground">{t.deputyProfileLabel}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: Hash, label: 'N°PPR', value: selectedDeputyInfo.employee_number },
              { icon: Building2, label: t.institutionLabel, value: selectedDeputyInfo.institution },
              { icon: Briefcase, label: t.corpsLabel, value: selectedDeputyInfo.corps ? (CORPS_LABELS[lang]?.[selectedDeputyInfo.corps] || selectedDeputyInfo.corps) : null },
              { icon: Phone, label: t.phoneLabel, value: selectedDeputyInfo.phone },
              { icon: Mail, label: t.emailLabel, value: selectedDeputyInfo.email },
              { icon: Users, label: t.localOfficeLabel, value: selectedDeputyInfo.office_name },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="w-3 h-3 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight">{item.label}</p>
                  <p className={`text-[11px] font-medium truncate ${item.value ? 'text-foreground' : 'text-muted-foreground/50'}`}>{item.value || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default HierarchicalFilters;
