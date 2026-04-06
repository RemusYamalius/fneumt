import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Send, Users, UserCheck, UserX } from 'lucide-react';

export interface SearchResult {
  user_id: string;
  full_name: string | null;
  academy: string | null;
  directorate: string | null;
  mission: string | null;
  is_member: boolean | null;
  phone: string | null;
  email: string | null;
  employee_number: string | null;
}

interface SearchResultsTableProps {
  results: SearchResult[];
  onMessage: (selectedUserIds: string[]) => void;
  lang: string;
}

const SearchResultsTable = ({ results, onMessage, lang }: SearchResultsTableProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allSelected = results.length > 0 && selectedIds.size === results.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map(r => r.user_id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const stats = useMemo(() => {
    const members = results.filter(r => r.is_member).length;
    return { total: results.length, members, nonMembers: results.length - members };
  }, [results]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-3xl border border-[#49769F]/30 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-[#001D39] to-[#0A4174] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">
              {lang === 'ar' ? 'نتائج البحث' : 'Résultats de recherche'}
            </h3>
            <p className="text-[#7BBDE8] text-xs">
              {lang === 'ar' ? `${stats.total} نتيجة` : `${stats.total} résultats`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#2ECC71]/20 text-[#2ECC71] border-[#2ECC71]/30 text-[10px]">
            <UserCheck className="w-3 h-3 me-1" />
            {stats.members}
          </Badge>
          <Badge className="bg-[#E74C3C]/20 text-[#E74C3C] border-[#E74C3C]/30 text-[10px]">
            <UserX className="w-3 h-3 me-1" />
            {stats.nonMembers}
          </Badge>
        </div>
      </div>

      {/* Table */}
      <div className="max-h-[500px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  // @ts-ignore
                  indeterminate={someSelected}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="text-xs font-bold">{lang === 'ar' ? 'الاسم الكامل' : 'Nom complet'}</TableHead>
              <TableHead className="text-xs font-bold">{lang === 'ar' ? 'الأكاديمية' : 'Académie'}</TableHead>
              <TableHead className="text-xs font-bold">{lang === 'ar' ? 'المديرية' : 'Direction'}</TableHead>
              <TableHead className="text-xs font-bold">{lang === 'ar' ? 'المهمة' : 'Mission'}</TableHead>
              <TableHead className="text-xs font-bold">{lang === 'ar' ? 'الانخراط' : 'Adhésion'}</TableHead>
              <TableHead className="text-xs font-bold">{lang === 'ar' ? 'الهاتف' : 'Téléphone'}</TableHead>
              <TableHead className="text-xs font-bold">PPR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((r, i) => (
              <motion.tr
                key={r.user_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.5) }}
                className={`border-b transition-colors cursor-pointer ${
                  selectedIds.has(r.user_id) ? 'bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => toggleOne(r.user_id)}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(r.user_id)}
                    onCheckedChange={() => toggleOne(r.user_id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                <TableCell className="text-xs font-medium">{r.full_name || '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                  {r.academy?.replace('الأكاديمية الجهوية للتربية والتكوين لجهة ', '') || '—'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{r.directorate || '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[100px] truncate">{r.mission || '—'}</TableCell>
                <TableCell>
                  {r.is_member ? (
                    <Badge className="bg-[#2ECC71]/15 text-[#2ECC71] border-[#2ECC71]/30 text-[10px]">
                      {lang === 'ar' ? 'منخرط' : 'Membre'}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-[10px]">
                      {lang === 'ar' ? 'غير منخرط' : 'Non'}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.phone || '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.employee_number || '—'}</TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer with message button */}
      <div className="px-6 py-4 bg-muted/20 border-t flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-muted-foreground">
          {selectedIds.size > 0
            ? (lang === 'ar' ? `${selectedIds.size} محدد` : `${selectedIds.size} sélectionné(s)`)
            : (lang === 'ar' ? 'حدد أشخاصاً للمراسلة' : 'Sélectionnez pour envoyer un message')
          }
        </p>
        <Button
          size="sm"
          disabled={selectedIds.size === 0}
          onClick={() => onMessage(Array.from(selectedIds))}
          className="gap-1.5 text-xs h-9 px-6 rounded-xl bg-gradient-to-r from-[#0A4174] to-[#001D39] hover:from-[#001D39] hover:to-[#0A4174] shadow-lg hover:shadow-xl transition-all text-white disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          {lang === 'ar' ? 'مراسلة' : 'Envoyer un message'}
        </Button>
      </div>
    </motion.div>
  );
};

export default SearchResultsTable;
