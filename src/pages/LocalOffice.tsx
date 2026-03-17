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
import { Users, CreditCard, Upload, X, Search, Save, Loader2, Trash2 } from 'lucide-react';
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
  const [cardFilter, setCardFilter] = useState('');
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {t.officeFormation}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                        className="w-20 h-20 rounded-xl object-cover border-2 border-primary/20"
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
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t.fullNameLabel}</TableHead>
                            <TableHead>{t.employeeNumberLabel}</TableHead>
                            <TableHead>{t.institutionLabel}</TableHead>
                            <TableHead>{t.selectPosition}</TableHead>
                            <TableHead className="w-20"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {members.map(member => (
                            <TableRow key={member.user_id}>
                              <TableCell className="font-medium">{member.full_name}</TableCell>
                              <TableCell>{member.employee_number}</TableCell>
                              <TableCell>{member.institution}</TableCell>
                              <TableCell>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
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
                          ))}
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  {t.membershipCards}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {cards.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">{t.noMembers}</p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.fullNameLabel}</TableHead>
                          <TableHead>{t.employeeNumberLabel}</TableHead>
                          <TableHead>{t.cardNumber}</TableHead>
                          <TableHead>{t.paymentStatus}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cards.map((card, idx) => (
                          <TableRow key={card.member_user_id}>
                            <TableCell className="font-medium">{card.full_name}</TableCell>
                            <TableCell>{card.employee_number}</TableCell>
                            <TableCell>
                              <Input
                                value={card.card_number}
                                onChange={e => {
                                  const updated = [...cards];
                                  updated[idx] = { ...updated[idx], card_number: e.target.value };
                                  setCards(updated);
                                }}
                                className="h-8 w-32"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={card.is_paid}
                                  onCheckedChange={checked => {
                                    const updated = [...cards];
                                    updated[idx] = { ...updated[idx], is_paid: !!checked };
                                    setCards(updated);
                                  }}
                                />
                                <span className={`text-xs font-medium ${card.is_paid ? 'text-green-600' : 'text-muted-foreground'}`}>
                                  {card.is_paid ? t.paid : t.unpaid}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Financial summary */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">{t.financialSummary}</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">{t.totalCollected}</Label>
                      <Input
                        type="number"
                        value={totalCollected}
                        onChange={e => setTotalCollected(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t.remaining}</Label>
                      <Input
                        type="number"
                        value={remaining}
                        onChange={e => setRemaining(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t.paidToProvincial}</Label>
                      <Input
                        type="number"
                        value={paidToProvincial}
                        onChange={e => setPaidToProvincial(Number(e.target.value))}
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
