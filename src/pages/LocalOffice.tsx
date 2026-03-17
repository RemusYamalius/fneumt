import { useEffect, useState, useCallback, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Users, CreditCard, Upload, X, Search, Save, Loader2, Trash2, Filter, ChevronDown, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const UNIQUE_POSITIONS = [
  'local_secretary',
  'deputy_secretary_primary',
  'deputy_secretary_middle',
  'deputy_secretary_high',
  'treasurer',
  'deputy_treasurer',
  'rapporteur',
  'deputy_rapporteur',
] as const;

const ALL_POSITIONS = [...UNIQUE_POSITIONS, 'advisor'] as const;
type OfficePosition = typeof ALL_POSITIONS[number];

interface OfficeMember {
  id?: string;
  user_id: string;
  position: OfficePosition;
  full_name?: string;
  employee_number?: string;
  institution?: string;
}

interface MembershipCard {
  id?: string;
  member_user_id: string;
  card_number: string;
  is_paid: boolean;
  full_name?: string;
  employee_number?: string;
  gender?: string;
  institution?: string;
}

const LocalOffice = () => {
  const { t, dir } = useI18n();
  const { user, profile } = useAuth();

  // Office state
  const [officeId, setOfficeId] = useState<string | null>(null);
  const [officeName, setOfficeName] = useState('');
  const [secretaryPhotoUrl, setSecretaryPhotoUrl] = useState('');
  const [members, setMembers] = useState<OfficeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedPosition, setSelectedPosition] = useState<OfficePosition | ''>('');

  // Membership cards state
  const [cards, setCards] = useState<MembershipCard[]>([]);
  const [savingCards, setSavingCards] = useState(false);
  const [columnFilters, setColumnFilters] = useState({
    full_name: '',
    employee_number: '',
    gender: '' as '' | 'male' | 'female',
    institution: '',
  });
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [totalCollected, setTotalCollected] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [paidToProvincial, setPaidToProvincial] = useState(0);

  // Photo upload
  const [uploading, setUploading] = useState(false);

  // Load office data
  useEffect(() => {
    if (!user) return;
    loadOfficeData();
  }, [user]);

  const loadOfficeData = async () => {
    if (!user) return;
    setLoading(true);

    // Get or create office
    const { data: office } = await supabase
      .from('local_offices')
      .select('*')
      .eq('coordinator_id', user.id)
      .maybeSingle();

    if (office) {
      setOfficeId(office.id);
      setOfficeName(office.office_name || '');
      setSecretaryPhotoUrl(office.secretary_photo_url || '');

      // Load members with profile info
      const { data: memberData } = await supabase
        .from('local_office_members')
        .select('*')
        .eq('office_id', office.id);

      if (memberData && memberData.length > 0) {
        const userIds = memberData.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, employee_number, institution')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        setMembers(memberData.map(m => ({
          id: m.id,
          user_id: m.user_id,
          position: m.position as OfficePosition,
          full_name: profileMap.get(m.user_id)?.full_name || '',
          employee_number: profileMap.get(m.user_id)?.employee_number || '',
          institution: profileMap.get(m.user_id)?.institution || '',
        })));
      }

      // Load membership cards
      const { data: cardData } = await supabase
        .from('membership_cards')
        .select('*')
        .eq('office_id', office.id);

      if (cardData && cardData.length > 0) {
        const cardUserIds = cardData.map(c => c.member_user_id);
        const { data: cardProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, employee_number, gender, institution')
          .in('user_id', cardUserIds);

        const cardProfileMap = new Map(cardProfiles?.map(p => [p.user_id, p]) || []);
        setCards(cardData.map(c => ({
          id: c.id,
          member_user_id: c.member_user_id,
          card_number: c.card_number || '',
          is_paid: c.is_paid,
          full_name: cardProfileMap.get(c.member_user_id)?.full_name || '',
          employee_number: cardProfileMap.get(c.member_user_id)?.employee_number || '',
          gender: cardProfileMap.get(c.member_user_id)?.gender || '',
          institution: cardProfileMap.get(c.member_user_id)?.institution || '',
        })));
      }

      // Load finances
      const { data: financeData } = await supabase
        .from('office_finances')
        .select('*')
        .eq('office_id', office.id)
        .maybeSingle();

      if (financeData) {
        setTotalCollected(Number(financeData.total_collected) || 0);
        setRemaining(Number(financeData.remaining) || 0);
        setPaidToProvincial(Number(financeData.paid_to_provincial) || 0);
      }
    }

    // Now load all directorate members (is_member or membership_verified) and merge with saved cards
    if (profile?.directorate) {
      const { data: dirMembers } = await supabase
        .from('profiles')
        .select('user_id, full_name, employee_number, gender, institution')
        .eq('directorate', profile.directorate)
        .or('is_member.eq.true,membership_verified.eq.true');

      if (dirMembers && dirMembers.length > 0) {
        setCards(prev => {
          const existingIds = new Set(prev.map(c => c.member_user_id));
          const newCards = dirMembers
            .filter(p => !existingIds.has(p.user_id))
            .map(p => ({
              member_user_id: p.user_id,
              card_number: '',
              is_paid: false,
              full_name: p.full_name || '',
              employee_number: p.employee_number || '',
              gender: p.gender || '',
              institution: p.institution || '',
            }));
          return [...prev, ...newCards];
        });
      }
    }

    setLoading(false);
  };

  // Search users in same directorate
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2 || !profile?.directorate) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, employee_number, institution')
      .eq('directorate', profile.directorate)
      .or(`full_name.ilike.%${query}%,employee_number.ilike.%${query}%,institution.ilike.%${query}%`)
      .limit(10);

    setSearchResults(data || []);
    setSearching(false);
  }, [profile?.directorate]);

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const debouncedSearch = useCallback((query: string) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchQuery(query);
    const timeout = setTimeout(() => handleSearch(query), 300);
    setSearchTimeout(timeout);
  }, [handleSearch, searchTimeout]);

  // Available positions (filter out taken unique positions)
  const availablePositions = useMemo(() => {
    const takenUnique = new Set(
      members
        .filter(m => UNIQUE_POSITIONS.includes(m.position as any))
        .map(m => m.position)
    );
    return ALL_POSITIONS.filter(p => p === 'advisor' || !takenUnique.has(p));
  }, [members]);

  const addMember = () => {
    if (!selectedUser || !selectedPosition) return;

    // Check if member already added
    if (members.some(m => m.user_id === selectedUser.user_id)) {
      toast({ title: t.memberAlreadyAdded, variant: 'destructive' });
      return;
    }

    // Check if unique position is taken
    if (selectedPosition !== 'advisor' && members.some(m => m.position === selectedPosition)) {
      toast({ title: t.positionTaken, variant: 'destructive' });
      return;
    }

    setMembers(prev => [...prev, {
      user_id: selectedUser.user_id,
      position: selectedPosition as OfficePosition,
      full_name: selectedUser.full_name,
      employee_number: selectedUser.employee_number,
      institution: selectedUser.institution,
    }]);

    setSelectedUser(null);
    setSelectedPosition('');
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeMember = (userId: string) => {
    setMembers(prev => prev.filter(m => m.user_id !== userId));
  };

  // Photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/secretary.${ext}`;

    const { error } = await supabase.storage
      .from('office-photos')
      .upload(filePath, file, { upsert: true });

    if (error) {
      toast({ title: t.submitError, variant: 'destructive' });
    } else {
      const { data: urlData } = supabase.storage
        .from('office-photos')
        .getPublicUrl(filePath);
      setSecretaryPhotoUrl(urlData.publicUrl);
    }
    setUploading(false);
  };

  // Save office formation
  const saveOffice = async () => {
    if (!user || !profile) return;
    setSaving(true);

    try {
      let currentOfficeId = officeId;

      if (!currentOfficeId) {
        const { data: newOffice, error } = await supabase
          .from('local_offices')
          .insert({
            coordinator_id: user.id,
            office_name: officeName,
            secretary_photo_url: secretaryPhotoUrl,
            academy: profile.academy,
            directorate: profile.directorate,
          })
          .select('id')
          .single();

        if (error) throw error;
        currentOfficeId = newOffice.id;
        setOfficeId(currentOfficeId);
      } else {
        await supabase
          .from('local_offices')
          .update({
            office_name: officeName,
            secretary_photo_url: secretaryPhotoUrl,
          })
          .eq('id', currentOfficeId);
      }

      // Delete existing members and re-insert
      await supabase
        .from('local_office_members')
        .delete()
        .eq('office_id', currentOfficeId);

      if (members.length > 0) {
        const { error: membersError } = await supabase
          .from('local_office_members')
          .insert(members.map(m => ({
            office_id: currentOfficeId!,
            user_id: m.user_id,
            position: m.position,
          })));
        if (membersError) throw membersError;
      }

      toast({ title: t.officeSaved });
      await loadOfficeData();
    } catch (err: any) {
      toast({ title: t.submitError, description: err.message, variant: 'destructive' });
    }

    setSaving(false);
  };

  // Save membership cards
  const saveCardsAndFinances = async () => {
    if (!officeId) {
      toast({ title: t.submitError, description: 'يجب حفظ معلومات المكتب أولاً', variant: 'destructive' });
      return;
    }
    setSavingCards(true);

    try {
      // Upsert cards
      for (const card of cards) {
        await supabase
          .from('membership_cards')
          .upsert({
            ...(card.id ? { id: card.id } : {}),
            office_id: officeId,
            member_user_id: card.member_user_id,
            card_number: card.card_number,
            is_paid: card.is_paid,
          }, { onConflict: 'office_id,member_user_id' });
      }

      // Upsert finances
      await supabase
        .from('office_finances')
        .upsert({
          office_id: officeId,
          total_collected: totalCollected,
          remaining: remaining,
          paid_to_provincial: paidToProvincial,
        }, { onConflict: 'office_id' });

      toast({ title: t.cardsSaved });
      await loadOfficeData();
    } catch (err: any) {
      toast({ title: t.submitError, description: err.message, variant: 'destructive' });
    }

    setSavingCards(false);
  };

  // Load members from same directorate for cards tab
  const loadDirectorateMembers = async () => {
    if (!profile?.directorate || !officeId) return;

    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, employee_number')
      .eq('directorate', profile.directorate)
      .or('is_member.eq.true,membership_verified.eq.true');

    if (data) {
      const existingCardUserIds = new Set(cards.map(c => c.member_user_id));
      const newCards = data
        .filter(p => !existingCardUserIds.has(p.user_id))
        .map(p => ({
          member_user_id: p.user_id,
          card_number: '',
          is_paid: false,
          full_name: p.full_name || '',
          employee_number: p.employee_number || '',
        }));

      if (newCards.length > 0) {
        setCards(prev => [...prev, ...newCards]);
      }
    }
  };

  const positionLabel = (pos: string) => t[`position_${pos}`] || pos;

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <motion.h1
          className="text-2xl font-bold text-foreground mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {t.localOffice}
        </motion.h1>

        <Tabs defaultValue="formation" dir={dir}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="formation" className="gap-2">
              <Users className="w-4 h-4" />
              {t.officeFormation}
            </TabsTrigger>
            <TabsTrigger value="cards" className="gap-2">
              <CreditCard className="w-4 h-4" />
              {t.membershipCards}
            </TabsTrigger>
          </TabsList>

          {/* === Formation Tab === */}
          <TabsContent value="formation">
            <Card className="border-blue-200">
              <CardHeader className="bg-blue-50/50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  {t.officeFormation}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Office name */}
                <div className="space-y-2">
                  <Label>{t.officeName}</Label>
                  <Input
                    value={officeName}
                    onChange={e => setOfficeName(e.target.value)}
                    placeholder={t.officeNamePlaceholder}
                  />
                </div>

                {/* Secretary photo */}
                <div className="space-y-2">
                  <Label>{t.secretaryPhoto}</Label>
                  <div className="flex items-center gap-4">
                    {secretaryPhotoUrl && (
                      <img
                        src={secretaryPhotoUrl}
                        alt="Secretary"
                        className="w-20 h-20 rounded-xl object-cover border-2 border-blue-200"
                      />
                    )}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={uploading}
                      />
                      <Button variant="outline" asChild disabled={uploading}>
                        <span className="gap-2">
                          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          {secretaryPhotoUrl ? t.changePhoto : t.uploadPhoto}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>

                {/* Search members */}
                <div className="space-y-2">
                  <Label>{t.searchMembers}</Label>
                  <div className="relative">
                    <Search className="absolute top-3 text-muted-foreground w-4 h-4" style={{ [dir === 'rtl' ? 'right' : 'left']: '12px' }} />
                    <Input
                      value={searchQuery}
                      onChange={e => debouncedSearch(e.target.value)}
                      placeholder={t.searchMembersPlaceholder}
                      className={dir === 'rtl' ? 'pr-10' : 'pl-10'}
                    />
                  </div>

                  {/* Search results */}
                  {searchResults.length > 0 && (
                    <div className="border rounded-lg max-h-48 overflow-auto bg-background shadow-lg">
                      {searchResults.map(result => (
                        <button
                          key={result.user_id}
                          onClick={() => {
                            setSelectedUser(result);
                            setSearchResults([]);
                            setSearchQuery(result.full_name || '');
                          }}
                          className={`w-full px-4 py-3 text-start hover:bg-accent/50 transition-colors border-b last:border-b-0 ${
                            selectedUser?.user_id === result.user_id ? 'bg-accent' : ''
                          }`}
                        >
                          <div className="font-medium text-sm">{result.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {result.employee_number} • {result.institution}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Position selector + add button */}
                  {selectedUser && (
                    <div className="flex gap-3 items-end mt-3">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">{t.selectPosition}</Label>
                        <Select value={selectedPosition} onValueChange={v => setSelectedPosition(v as OfficePosition)}>
                          <SelectTrigger>
                            <SelectValue placeholder={t.selectPosition} />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePositions.map(pos => (
                              <SelectItem key={pos} value={pos}>
                                {positionLabel(pos)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={addMember} disabled={!selectedPosition} className="gap-2">
                        {t.addMember}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Current members */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">{t.currentMembers}</Label>
                  {members.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">{t.noMembers}</p>
                  ) : (
                    <div className="border border-blue-200 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-blue-50/50">
                            <TableHead className="text-start">{t.fullNameLabel}</TableHead>
                            <TableHead className="text-start">{t.employeeNumberLabel}</TableHead>
                            <TableHead className="text-start">{t.institutionLabel}</TableHead>
                            <TableHead className="text-start">{t.selectPosition}</TableHead>
                            <TableHead className="w-20"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {members.map((member, idx) => {
                            const posColor = member.position.includes('secretary') ? 'bg-blue-100 text-blue-700' :
                              member.position.includes('treasurer') ? 'bg-amber-100 text-amber-700' :
                              member.position.includes('rapporteur') ? 'bg-purple-100 text-purple-700' :
                              'bg-muted text-muted-foreground';
                            return (
                              <TableRow key={member.user_id} className={idx % 2 === 0 ? '' : 'bg-blue-50/20'}>
                                <TableCell className="font-medium text-start">{member.full_name}</TableCell>
                                <TableCell className="text-start">{member.employee_number}</TableCell>
                                <TableCell className="text-start">{member.institution}</TableCell>
                                <TableCell className="text-start">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${posColor}`}>
                                    {positionLabel(member.position)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeMember(member.user_id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                <Button onClick={saveOffice} disabled={saving} className="w-full gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t.saveOffice}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === Membership Cards Tab === */}
          <TabsContent value="cards">
            <Card className="border-emerald-200">
              <CardHeader className="bg-emerald-50/50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  {t.membershipCards}
                  {(columnFilters.full_name || columnFilters.employee_number || columnFilters.gender || columnFilters.institution) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setColumnFilters({ full_name: '', employee_number: '', gender: '', institution: '' });
                        setActiveFilter(null);
                      }}
                      className="text-xs text-muted-foreground hover:text-destructive ms-auto gap-1"
                    >
                      <X className="w-3 h-3" />
                      {t.clearFilter}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">

                {(() => {
                  const filtered = cards.filter(c => {
                    if (columnFilters.full_name && !c.full_name?.toLowerCase().includes(columnFilters.full_name.toLowerCase())) return false;
                    if (columnFilters.employee_number && !c.employee_number?.includes(columnFilters.employee_number)) return false;
                    if (columnFilters.gender && c.gender !== columnFilters.gender) return false;
                    if (columnFilters.institution && !c.institution?.toLowerCase().includes(columnFilters.institution.toLowerCase())) return false;
                    return true;
                  });

                  // Get unique institutions for suggestions
                  const uniqueInstitutions = [...new Set(cards.map(c => c.institution).filter(Boolean))] as string[];

                  return filtered.length === 0 && (columnFilters.full_name || columnFilters.employee_number || columnFilters.gender || columnFilters.institution) ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">{t.noMembers}</p>
                  ) : (
                    <div className="border border-emerald-200 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-emerald-50/50">
                            {/* Name header */}
                            <TableHead className="text-start">
                              <button
                                onClick={() => setActiveFilter(activeFilter === 'name' ? null : 'name')}
                                className={`flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer ${
                                  columnFilters.full_name ? 'text-blue-600 font-bold' : ''
                                }`}
                              >
                                {t.fullNameLabel}
                                {columnFilters.full_name ? <Filter className="w-3 h-3 fill-current" /> : <Filter className="w-3 h-3 opacity-40" />}
                              </button>
                              {activeFilter === 'name' && (
                                <Input
                                  autoFocus
                                  value={columnFilters.full_name}
                                  onChange={e => setColumnFilters(f => ({ ...f, full_name: e.target.value }))}
                                  placeholder="..."
                                  className="h-7 mt-1 text-xs border-blue-300 focus-visible:ring-blue-400"
                                  onClick={e => e.stopPropagation()}
                                />
                              )}
                            </TableHead>
                            {/* PPR header */}
                            <TableHead className="text-start">
                              <button
                                onClick={() => setActiveFilter(activeFilter === 'ppr' ? null : 'ppr')}
                                className={`flex items-center gap-1 hover:text-amber-600 transition-colors cursor-pointer ${
                                  columnFilters.employee_number ? 'text-amber-600 font-bold' : ''
                                }`}
                              >
                                {t.employeeNumberLabel}
                                {columnFilters.employee_number ? <Filter className="w-3 h-3 fill-current" /> : <Filter className="w-3 h-3 opacity-40" />}
                              </button>
                              {activeFilter === 'ppr' && (
                                <Input
                                  autoFocus
                                  value={columnFilters.employee_number}
                                  onChange={e => setColumnFilters(f => ({ ...f, employee_number: e.target.value }))}
                                  placeholder="..."
                                  className="h-7 mt-1 text-xs border-amber-300 focus-visible:ring-amber-400"
                                  onClick={e => e.stopPropagation()}
                                />
                              )}
                            </TableHead>
                            {/* Gender header */}
                            <TableHead className="text-center">
                              <button
                                onClick={() => setActiveFilter(activeFilter === 'gender' ? null : 'gender')}
                                className={`flex items-center justify-center gap-1 mx-auto hover:text-purple-600 transition-colors cursor-pointer ${
                                  columnFilters.gender ? 'text-purple-600 font-bold' : ''
                                }`}
                              >
                                {t.genderLabel}
                                <ChevronDown className="w-3 h-3" />
                              </button>
                              {activeFilter === 'gender' && (
                                <div className="flex flex-col gap-0.5 mt-1" onClick={e => e.stopPropagation()}>
                                  {[
                                    { value: '' as const, label: t.allGenders },
                                    { value: 'male' as const, label: t.genderMale },
                                    { value: 'female' as const, label: t.genderFemale },
                                  ].map(opt => (
                                    <button
                                      key={opt.value}
                                      onClick={() => {
                                        setColumnFilters(f => ({ ...f, gender: opt.value }));
                                        setActiveFilter(null);
                                      }}
                                      className={`text-xs px-2 py-1 rounded transition-colors ${
                                        columnFilters.gender === opt.value
                                          ? 'bg-purple-100 text-purple-700 font-medium'
                                          : 'hover:bg-purple-50'
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </TableHead>
                            {/* Institution header */}
                            <TableHead className="text-start">
                              <button
                                onClick={() => setActiveFilter(activeFilter === 'institution' ? null : 'institution')}
                                className={`flex items-center gap-1 hover:text-emerald-600 transition-colors cursor-pointer ${
                                  columnFilters.institution ? 'text-emerald-600 font-bold' : ''
                                }`}
                              >
                                {t.institutionLabel}
                                {columnFilters.institution ? <Filter className="w-3 h-3 fill-current" /> : <Filter className="w-3 h-3 opacity-40" />}
                              </button>
                              {activeFilter === 'institution' && (
                                <div className="relative" onClick={e => e.stopPropagation()}>
                                  <Input
                                    autoFocus
                                    value={columnFilters.institution}
                                    onChange={e => setColumnFilters(f => ({ ...f, institution: e.target.value }))}
                                    placeholder="..."
                                    className="h-7 mt-1 text-xs border-emerald-300 focus-visible:ring-emerald-400"
                                  />
                                  {columnFilters.institution && uniqueInstitutions.filter(i => i.toLowerCase().includes(columnFilters.institution.toLowerCase())).length > 0 && (
                                    <div className="absolute z-10 top-full mt-1 w-full bg-background border border-emerald-200 rounded-md shadow-lg max-h-32 overflow-auto">
                                      {uniqueInstitutions
                                        .filter(i => i.toLowerCase().includes(columnFilters.institution.toLowerCase()))
                                        .slice(0, 5)
                                        .map(inst => (
                                          <button
                                            key={inst}
                                            onClick={() => {
                                              setColumnFilters(f => ({ ...f, institution: inst }));
                                              setActiveFilter(null);
                                            }}
                                            className="w-full text-start px-2 py-1.5 text-xs hover:bg-emerald-50 transition-colors"
                                          >
                                            {inst}
                                          </button>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </TableHead>
                            <TableHead className="text-start">{t.cardNumber}</TableHead>
                            <TableHead className="text-center">{t.paymentStatus}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map((card, idx) => {
                            const realIdx = cards.findIndex(c => c.member_user_id === card.member_user_id);
                            return (
                              <TableRow key={card.member_user_id} className={idx % 2 === 0 ? '' : 'bg-emerald-50/20'}>
                                <TableCell className="text-start font-medium">{card.full_name}</TableCell>
                                <TableCell className="text-start">{card.employee_number}</TableCell>
                                <TableCell className="text-center text-sm">
                                  {card.gender === 'male' ? t.genderMale : card.gender === 'female' ? t.genderFemale : '-'}
                                </TableCell>
                                <TableCell className="text-start text-sm">{card.institution || '-'}</TableCell>
                                <TableCell className="text-start">
                                  <Input
                                    value={card.card_number}
                                    onChange={e => {
                                      const updated = [...cards];
                                      updated[realIdx] = { ...updated[realIdx], card_number: e.target.value };
                                      setCards(updated);
                                    }}
                                    className="h-8 w-32"
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <Checkbox
                                      checked={card.is_paid}
                                      onCheckedChange={checked => {
                                        const updated = [...cards];
                                        updated[realIdx] = { ...updated[realIdx], is_paid: !!checked };
                                        setCards(updated);
                                      }}
                                    />
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                      card.is_paid ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'
                                    }`}>
                                      {card.is_paid ? t.paid : t.unpaid}
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })()}

                {/* Financial summary */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">{t.financialSummary}</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                      <Label className="text-xs text-emerald-700">{t.totalCollected}</Label>
                      <Input
                        type="number"
                        value={totalCollected}
                        onChange={e => setTotalCollected(Number(e.target.value))}
                        className="border-emerald-300"
                      />
                    </div>
                    <div className="space-y-1 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <Label className="text-xs text-amber-700">{t.remaining}</Label>
                      <Input
                        type="number"
                        value={remaining}
                        onChange={e => setRemaining(Number(e.target.value))}
                        className="border-amber-300"
                      />
                    </div>
                    <div className="space-y-1 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <Label className="text-xs text-blue-700">{t.paidToProvincial}</Label>
                      <Input
                        type="number"
                        value={paidToProvincial}
                        onChange={e => setPaidToProvincial(Number(e.target.value))}
                        className="border-blue-300"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={saveCardsAndFinances} disabled={savingCards} className="w-full gap-2">
                  {savingCards ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t.saveCards}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </AuthenticatedLayout>
  );
};

export default LocalOffice;
