/**
 * Écran Gestion des Invités par Famille/Groupe
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  RefreshControl,
  ScrollView,
  Modal,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as ExpoLinking from 'expo-linking';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import {
  Plus,
  Users,
  UserCheck,
  UserX,
  HelpCircle,
  Search,
  Trash2,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  User,
  Baby,
  X,
  Link2,
  Copy,
  Share2,
} from 'lucide-react-native';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PressableScale } from '@/components/ui/PressableScale';
import { Button } from '@/components/ui/Button';
import {
  useGuestGroups,
  useGuestGroupSummary,
  useCreateGuestGroup,
  useUpdateGuestGroupStatus,
  useDeleteGuestGroup,
  useAddGroupMember,
  useDeleteGroupMember,
} from '@/hooks/useGuestGroups';
import {
  GuestGroupWithMembers,
  GuestStatus,
  GuestCategory,
  GUEST_STATUS_LABELS,
  GUEST_CATEGORIES,
} from '@/types/eventFeatures';
import { toast } from '@/lib/toast';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import {
  useCreateGuestGroupInvite,
  useEventGuestGroupInvites,
} from '@/hooks/useGuestGroupInvites';

export default function GuestsScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();

  const { data: groups = [], isLoading, refetch, isRefetching } = useGuestGroups(eventId);
  const summary = useGuestGroupSummary(eventId);
  const { mutate: createGroup, isPending: isCreating } = useCreateGuestGroup();
  const { mutate: updateStatus } = useUpdateGuestGroupStatus();
  const { mutate: deleteGroup } = useDeleteGuestGroup();
  const { mutate: addMember } = useAddGroupMember();
  const { mutate: deleteMember } = useDeleteGroupMember();
  const { data: invites = [] } = useEventGuestGroupInvites(eventId);
  const { mutate: createGroupInvite, isPending: isCreatingInvite } = useCreateGuestGroupInvite();

  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<GuestStatus | 'all'>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showMemberModal, setShowMemberModal] = useState<string | null>(null);
  const [memberName, setMemberName] = useState('');
  const [isChild, setIsChild] = useState(false);

  // Form state
  const [newGroup, setNewGroup] = useState({
    name: '',
    member_count: 1,
    category: 'family' as GuestCategory,
    email: '',
    phone: '',
  });
  const [newMembers, setNewMembers] = useState<{ name: string; is_child: boolean }[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [bulkMembersText, setBulkMembersText] = useState('');

  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      const matchesSearch =
        searchQuery === '' ||
        group.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || group.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [groups, searchQuery, filterStatus]);

  const inviteByGroupId = useMemo(() => {
    const map = new Map<string, (typeof invites)[number]>();
    invites
      .filter((invite) => invite.is_active)
      .forEach((invite) => {
        if (!map.has(invite.group_id)) {
          map.set(invite.group_id, invite);
        }
      });
    return map;
  }, [invites]);

  const toggleGroupExpanded = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const handleAddGroup = useCallback(() => {
    if (!newGroup.name.trim()) {
      toast.error('Veuillez entrer un nom pour le groupe/famille.');
      return;
    }

    const effectiveCount = Math.max(newGroup.member_count, newMembers.length);

    if (effectiveCount < 1) {
      toast.error('Le groupe doit avoir au moins 1 personne.');
      return;
    }

    createGroup(
      {
        event_id: eventId!,
        name: newGroup.name.trim(),
        member_count: effectiveCount,
        category: newGroup.category,
        email: newGroup.email || undefined,
        phone: newGroup.phone || undefined,
        members: newMembers.map((m) => ({
          name: m.name,
          is_child: m.is_child,
        })),
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setNewGroup({ name: '', member_count: 1, category: 'family', email: '', phone: '' });
          setNewMembers([]);
          setBulkMembersText('');
          setShowAddForm(false);
        },
      }
    );
  }, [newGroup, newMembers, eventId, createGroup]);

  const handleStatusChange = useCallback((group: GuestGroupWithMembers, status: GuestStatus) => {
    updateStatus(
      { id: group.id, eventId: eventId!, status },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      }
    );
  }, [eventId, updateStatus]);

  const handleDelete = useCallback((group: GuestGroupWithMembers) => {
    Alert.alert(
      'Supprimer',
      `Supprimer "${group.name}" et ses ${group.member_count} membre(s) ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteGroup({ id: group.id, eventId: eventId! });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, [eventId, deleteGroup]);

  const getInviteLinks = useCallback((token: string) => {
    const webBase = (process.env.EXPO_PUBLIC_WEB_URL || 'https://umade.app').replace(/\/$/, '');
    const deepLink = ExpoLinking.createURL(`/rsvp/${token}`);
    const webLink = `${webBase}/rsvp/${token}`;
    return { deepLink, webLink };
  }, []);

  const handleCopyInviteLink = useCallback(async (token: string, preferWeb = true) => {
    const { deepLink, webLink } = getInviteLinks(token);
    await Clipboard.setStringAsync(preferWeb ? webLink : deepLink);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success('Lien copié');
  }, [getInviteLinks]);

  const handleShareInviteLink = useCallback(async (groupName: string, token: string) => {
    const { deepLink, webLink } = getInviteLinks(token);
    try {
      await Share.share({
        message: `Invitation RSVP pour ${groupName}\\nLien web: ${webLink}\\nLien app: ${deepLink}`,
      });
    } catch (error) {
      console.error('Share invite error:', error);
    }
  }, [getInviteLinks]);

  const handleGenerateInvite = useCallback((group: GuestGroupWithMembers) => {
    createGroupInvite(
      { groupId: group.id, validDays: 120 },
      {
        onSuccess: async (result) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          const token = result.token;
          const { webLink } = getInviteLinks(token);

          Alert.alert(
            'Lien RSVP généré',
            `${group.name}\\n${webLink}`,
            [
              { text: 'Fermer', style: 'cancel' },
              {
                text: 'Copier',
                onPress: () => handleCopyInviteLink(token, true),
              },
              {
                text: 'Partager',
                onPress: () => handleShareInviteLink(group.name, token),
              },
            ]
          );
        },
        onError: (error: any) => {
          toast.error(error?.message || 'Impossible de créer le lien RSVP.');
        },
      }
    );
  }, [createGroupInvite, getInviteLinks, handleCopyInviteLink, handleShareInviteLink]);

  const handleAddMemberToForm = useCallback(() => {
    if (!newMemberName.trim()) return;
    setNewMembers([...newMembers, { name: newMemberName.trim(), is_child: false }]);
    setNewMemberName('');
    // Ajuster le compte automatiquement
    if (newMembers.length + 1 > newGroup.member_count) {
      setNewGroup({ ...newGroup, member_count: newMembers.length + 1 });
    }
  }, [newMemberName, newMembers, newGroup]);

  const handleAddBulkMembers = useCallback(() => {
    const names = bulkMembersText
      .split(/[\n,;]+/g)
      .map((name) => name.trim())
      .filter(Boolean);

    if (names.length === 0) return;

    setNewMembers((prev) => [...prev, ...names.map((name) => ({ name, is_child: false }))]);
    setBulkMembersText('');
    if (newMembers.length + names.length > newGroup.member_count) {
      setNewGroup({ ...newGroup, member_count: newMembers.length + names.length });
    }
  }, [bulkMembersText, newMembers, newGroup]);

  const handleRemoveMemberFromForm = useCallback((index: number) => {
    const updated = [...newMembers];
    updated.splice(index, 1);
    setNewMembers(updated);
  }, [newMembers]);

  const handleToggleChildInForm = useCallback((index: number) => {
    const updated = [...newMembers];
    updated[index].is_child = !updated[index].is_child;
    setNewMembers(updated);
  }, [newMembers]);

  const renderGroup = useCallback(({ item: group, index }: { item: GuestGroupWithMembers; index: number }) => {
    const statusInfo = GUEST_STATUS_LABELS[group.status];
    const isExpanded = expandedGroups.has(group.id);
    const invite = inviteByGroupId.get(group.id);
    const confirmedAdults = group.confirmed_adults || 0;
    const confirmedChildren = group.confirmed_children || 0;
    const confirmedTotal = confirmedAdults + confirmedChildren;

    return (
      <Animated.View
        entering={FadeInRight.delay(index * 30)}
        style={[styles.groupCard, { backgroundColor: colors.card }]}
      >
        {/* Header */}
        <Pressable onPress={() => toggleGroupExpanded(group.id)} style={styles.groupHeader}>
          <View style={styles.groupInfo}>
            <View style={[styles.groupAvatar, { backgroundColor: `${colors.primary}20` }]}>
              <Users size={20} color={colors.primary} />
            </View>
            <View style={styles.groupDetails}>
              <Text style={[styles.groupName, { color: colors.text }]}>
                {group.name}
              </Text>
              <Text style={[styles.groupMeta, { color: colors.textSecondary }]}>
                {group.member_count} personne{group.member_count > 1 ? 's' : ''} · {GUEST_CATEGORIES[group.category]}
              </Text>
              {group.status === 'confirmed' && confirmedTotal > 0 && (
                <Text style={[styles.groupRsvpMeta, { color: colors.success }]}>
                  RSVP: {confirmedAdults} adulte{confirmedAdults > 1 ? 's' : ''}
                  {confirmedChildren > 0
                    ? `, ${confirmedChildren} enfant${confirmedChildren > 1 ? 's' : ''}`
                    : ''}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.groupHeaderRight}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
            {isExpanded ? (
              <ChevronUp size={20} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={20} color={colors.textSecondary} />
            )}
          </View>
        </Pressable>

        {/* Contact info */}
        {(group.email || group.phone) && (
          <View style={styles.contactInfo}>
            {group.email && (
              <View style={styles.contactRow}>
                <Mail size={14} color={colors.textTertiary} />
                <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                  {group.email}
                </Text>
              </View>
            )}
            {group.phone && (
              <View style={styles.contactRow}>
                <Phone size={14} color={colors.textTertiary} />
                <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                  {group.phone}
                </Text>
              </View>
            )}
          </View>
        )}

        {(group.contact_name || group.response_note) && (
          <View style={styles.contactInfo}>
            {group.contact_name ? (
              <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                Répondu par: {group.contact_name}
              </Text>
            ) : null}
            {group.response_note ? (
              <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                Note RSVP: {group.response_note}
              </Text>
            ) : null}
          </View>
        )}

        {/* Members (expanded) */}
        {isExpanded && (
          <View style={[styles.membersSection, { borderTopColor: colors.border }]}>
            <Text style={[styles.membersTitle, { color: colors.text }]}>
              Membres ({group.members.length}/{group.member_count})
            </Text>

            {group.members.map((member) => (
              <View key={member.id} style={styles.memberRow}>
                {member.is_child ? (
                  <Baby size={16} color={colors.textSecondary} />
                ) : (
                  <User size={16} color={colors.textSecondary} />
                )}
                <Text style={[styles.memberName, { color: colors.text }]}>
                  {member.name}
                </Text>
                {member.is_child && (
                  <Text style={[styles.childBadge, { color: colors.textTertiary }]}>
                    (enfant{member.age ? `, ${member.age} ans` : ''})
                  </Text>
                )}
                <Pressable
                  onPress={() => {
                    deleteMember({ memberId: member.id, groupId: group.id, eventId: eventId! });
                  }}
                  style={styles.deleteMemberBtn}
                >
                  <X size={14} color={colors.textTertiary} />
                </Pressable>
              </View>
            ))}

            {group.members.length < group.member_count && (
              <Text style={[styles.membersHint, { color: colors.textTertiary }]}>
                {group.member_count - group.members.length} membre(s) non nommé(s)
              </Text>
            )}

            <Pressable
              onPress={() => setShowMemberModal(group.id)}
              style={[styles.addMemberBtn, { borderColor: colors.border }]}
            >
              <Plus size={16} color={colors.primary} />
              <Text style={[styles.addMemberText, { color: colors.primary }]}>
                Ajouter un membre
              </Text>
            </Pressable>

            <View style={styles.inviteActionsRow}>
              <PressableScale
                onPress={() => handleGenerateInvite(group)}
                haptic="light"
                disabled={isCreatingInvite}
                style={[styles.actionBtn, { backgroundColor: `${colors.primary}14` }]}
              >
                <Link2 size={16} color={colors.primary} />
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                  {isCreatingInvite
                    ? 'Création...'
                    : invite
                      ? 'Régénérer lien RSVP'
                      : 'Créer lien RSVP'}
                </Text>
              </PressableScale>

              {invite && (
                <>
                  <PressableScale
                    onPress={() => handleCopyInviteLink(invite.token, true)}
                    haptic="light"
                    style={[styles.actionBtn, { backgroundColor: `${colors.success}14` }]}
                  >
                    <Copy size={16} color={colors.success} />
                    <Text style={[styles.actionBtnText, { color: colors.success }]}>Copier</Text>
                  </PressableScale>

                  <PressableScale
                    onPress={() => handleShareInviteLink(group.name, invite.token)}
                    haptic="light"
                    style={[styles.actionBtn, { backgroundColor: `${colors.warning}14` }]}
                  >
                    <Share2 size={16} color={colors.warning} />
                    <Text style={[styles.actionBtnText, { color: colors.warning }]}>Partager</Text>
                  </PressableScale>
                </>
              )}
            </View>

            {invite && (
              <Text style={[styles.inviteMetaText, { color: colors.textTertiary }]}>
                Expire le {new Date(invite.expires_at).toLocaleDateString('fr-FR')}
              </Text>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.groupActions}>
          {group.status !== 'confirmed' && (
            <PressableScale
              onPress={() => handleStatusChange(group, 'confirmed')}
              haptic="light"
              style={[styles.actionBtn, { backgroundColor: '#10B98120' }]}
            >
              <UserCheck size={16} color="#10B981" />
              <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Confirmer</Text>
            </PressableScale>
          )}
          {group.status !== 'declined' && (
            <PressableScale
              onPress={() => handleStatusChange(group, 'declined')}
              haptic="light"
              style={[styles.actionBtn, { backgroundColor: '#EF444420' }]}
            >
              <UserX size={16} color="#EF4444" />
              <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Refuser</Text>
            </PressableScale>
          )}
          <PressableScale
            onPress={() => handleDelete(group)}
            haptic="light"
            style={[styles.actionBtn, { backgroundColor: `${colors.error}20` }]}
          >
            <Trash2 size={16} color={colors.error} />
          </PressableScale>
        </View>
      </Animated.View>
    );
  }, [
    colors,
    expandedGroups,
    toggleGroupExpanded,
    handleStatusChange,
    handleDelete,
    deleteMember,
    eventId,
    inviteByGroupId,
    handleGenerateInvite,
    handleCopyInviteLink,
    handleShareInviteLink,
    isCreatingInvite,
  ]);

  const handleAddMember = useCallback(() => {
    if (!memberName.trim() || !showMemberModal) return;
    addMember({
      groupId: showMemberModal,
      eventId: eventId!,
      member: { name: memberName.trim(), is_child: isChild },
    });
    setMemberName('');
    setIsChild(false);
    setShowMemberModal(null);
  }, [memberName, isChild, showMemberModal, addMember, eventId]);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Chargement des invités..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Invités',
          headerStyle: { backgroundColor: colors.backgroundSecondary },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      {/* Summary */}
      <View style={[styles.summary, { backgroundColor: colors.card }]}>
        <View style={styles.summaryItem}>
          <Users size={20} color={colors.primary} />
          <Text style={[styles.summaryValue, { color: colors.text }]}>{summary.total_people}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>
        <View style={styles.summaryItem}>
          <UserCheck size={20} color="#10B981" />
          <Text style={[styles.summaryValue, { color: colors.text }]}>{summary.confirmed_people}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Confirmés</Text>
        </View>
        <View style={styles.summaryItem}>
          <HelpCircle size={20} color="#F59E0B" />
          <Text style={[styles.summaryValue, { color: colors.text }]}>{summary.pending_people}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>En attente</Text>
        </View>
        <View style={styles.summaryItem}>
          <UserX size={20} color="#EF4444" />
          <Text style={[styles.summaryValue, { color: colors.text }]}>{summary.declined_people}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Déclinés</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchText, { color: colors.text }]}
            placeholder="Rechercher une famille..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Status Filter */}
      <View style={styles.filterRow}>
        {(['all', 'confirmed', 'pending', 'declined'] as const).map((status) => (
          <Pressable
            key={status}
            onPress={() => setFilterStatus(status)}
            style={[
              styles.filterChip,
              { borderColor: colors.border },
              filterStatus === status && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: filterStatus === status ? '#FFFFFF' : colors.text },
              ]}
            >
              {status === 'all' ? 'Tous' : GUEST_STATUS_LABELS[status].label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Add Button */}
      <PressableScale
        onPress={() => setShowAddForm(!showAddForm)}
        haptic="light"
        style={[styles.addButton, { backgroundColor: colors.primary }]}
      >
        <Plus size={20} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Ajouter une famille / groupe</Text>
      </PressableScale>

      {/* Add Form */}
      {showAddForm && (
        <Animated.View
          entering={FadeInDown}
          style={[styles.addForm, { backgroundColor: colors.card }]}
        >
          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Nom du groupe (ex: Famille Dupont)"
              placeholderTextColor={colors.textTertiary}
              value={newGroup.name}
              onChangeText={(text) => setNewGroup({ ...newGroup, name: text })}
            />

            {/* Member count */}
            <View style={styles.countRow}>
              <Text style={[styles.countLabel, { color: colors.text }]}>Nombre de personnes</Text>
              <View style={styles.countControls}>
                <Pressable
                  onPress={() => setNewGroup({ ...newGroup, member_count: Math.max(1, newGroup.member_count - 1) })}
                  style={[styles.countBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                  <Text style={[styles.countBtnText, { color: colors.text }]}>−</Text>
                </Pressable>
                <Text style={[styles.countValue, { color: colors.text }]}>{newGroup.member_count}</Text>
                <Pressable
                  onPress={() => setNewGroup({ ...newGroup, member_count: newGroup.member_count + 1 })}
                  style={[styles.countBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                  <Text style={[styles.countBtnText, { color: colors.text }]}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* Category */}
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Catégorie</Text>
            <View style={styles.categoryRow}>
              {Object.entries(GUEST_CATEGORIES).map(([key, label]) => (
                <Pressable
                  key={key}
                  onPress={() => setNewGroup({ ...newGroup, category: key as GuestCategory })}
                  style={[
                    styles.categoryChip,
                    { borderColor: colors.border },
                    newGroup.category === key && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                >
                  <Text style={{ color: newGroup.category === key ? '#FFFFFF' : colors.text, fontSize: 13 }}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Contact info */}
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Email (optionnel)"
              placeholderTextColor={colors.textTertiary}
              value={newGroup.email}
              onChangeText={(text) => setNewGroup({ ...newGroup, email: text })}
              keyboardType="email-address"
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Téléphone (optionnel)"
              placeholderTextColor={colors.textTertiary}
              value={newGroup.phone}
              onChangeText={(text) => setNewGroup({ ...newGroup, phone: text })}
              keyboardType="phone-pad"
            />

            {/* Members names (optional) */}
            <Text style={[styles.fieldLabel, { color: colors.text, marginTop: Layout.spacing.md }]}>
              Noms des membres (optionnel)
            </Text>
            <Text style={[styles.fieldHint, { color: colors.textTertiary }]}>
              Vous pouvez ajouter les noms maintenant ou plus tard
            </Text>

            <TextInput
              style={[styles.input, styles.bulkInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Ajoutez plusieurs noms (ex: Alice, Bob, Clara)"
              placeholderTextColor={colors.textTertiary}
              value={bulkMembersText}
              onChangeText={setBulkMembersText}
              multiline
              textAlignVertical="top"
            />
            <Pressable
              onPress={handleAddBulkMembers}
              style={[styles.bulkAddButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.bulkAddText}>Ajouter la liste</Text>
            </Pressable>

            {newMembers.map((member, index) => (
              <View key={index} style={styles.memberFormRow}>
                <View style={[styles.memberFormInfo, { backgroundColor: colors.background }]}>
                  <Text style={[styles.memberFormName, { color: colors.text }]}>{member.name}</Text>
                  {member.is_child && (
                    <View style={[styles.childTag, { backgroundColor: colors.primary + '20' }]}>
                      <Baby size={12} color={colors.primary} />
                      <Text style={[styles.childTagText, { color: colors.primary }]}>Enfant</Text>
                    </View>
                  )}
                </View>
                <View style={styles.memberFormActions}>
                  <Pressable onPress={() => handleToggleChildInForm(index)}>
                    <Baby size={18} color={member.is_child ? colors.primary : colors.textTertiary} />
                  </Pressable>
                  <Pressable onPress={() => handleRemoveMemberFromForm(index)}>
                    <X size={18} color={colors.error} />
                  </Pressable>
                </View>
              </View>
            ))}

            <View style={styles.addMemberFormRow}>
              <TextInput
                style={[styles.input, styles.memberInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Nom du membre"
                placeholderTextColor={colors.textTertiary}
                value={newMemberName}
                onChangeText={setNewMemberName}
                onSubmitEditing={handleAddMemberToForm}
              />
              <Pressable
                onPress={handleAddMemberToForm}
                style={[styles.addMemberFormBtn, { backgroundColor: colors.primary }]}
              >
                <Plus size={20} color="#FFF" />
              </Pressable>
            </View>

            <AnimatedButton
              title="Créer le groupe"
              onPress={handleAddGroup}
              loading={isCreating}
              fullWidth
              style={{ marginTop: Layout.spacing.md }}
            />
          </ScrollView>
        </Animated.View>
      )}

      {/* Groups List */}
      <FlatList
        data={filteredGroups}
        keyExtractor={(item) => item.id}
        renderItem={renderGroup}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>👨‍👩‍👧‍👦</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune famille</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Ajoutez vos premières familles ou groupes d'invités
            </Text>
          </View>
        }
      />

      <Modal visible={!!showMemberModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Ajouter un membre
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Nom complet"
              placeholderTextColor={colors.textTertiary}
              value={memberName}
              onChangeText={setMemberName}
            />

            <Pressable
              onPress={() => setIsChild(!isChild)}
              style={styles.checkboxRow}
            >
              <View style={[
                styles.checkbox,
                { borderColor: colors.border },
                isChild && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}>
                {isChild && <Text style={{ color: '#FFF', fontSize: 12 }}>✓</Text>}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                C'est un enfant
              </Text>
            </Pressable>

            <View style={styles.modalActions}>
              <Button
                title="Annuler"
                variant="outline"
                onPress={() => {
                  setMemberName('');
                  setIsChild(false);
                  setShowMemberModal(null);
                }}
                style={{ flex: 1 }}
              />
              <Button
                title="Ajouter"
                variant="primary"
                onPress={handleAddMember}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: Layout.spacing.md,
    marginHorizontal: Layout.spacing.lg,
    marginTop: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
  },
  summaryItem: { alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: Layout.fontSize.xl, fontWeight: '700' },
  summaryLabel: { fontSize: Layout.fontSize.xs },
  searchContainer: { paddingHorizontal: Layout.spacing.lg, marginTop: Layout.spacing.md },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.lg,
    borderWidth: 1,
    gap: Layout.spacing.sm,
  },
  searchText: { flex: 1, fontSize: Layout.fontSize.md },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Layout.spacing.lg,
    marginTop: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.radius.full,
    borderWidth: 1,
  },
  filterText: { fontSize: Layout.fontSize.sm, fontWeight: '500' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.md,
    marginHorizontal: Layout.spacing.lg,
    marginTop: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    gap: Layout.spacing.sm,
  },
  addButtonText: { color: '#FFFFFF', fontSize: Layout.fontSize.md, fontWeight: '600' },
  addForm: {
    marginHorizontal: Layout.spacing.lg,
    marginTop: Layout.spacing.md,
    padding: Layout.spacing.lg,
    borderRadius: Layout.radius.lg,
    gap: Layout.spacing.md,
  },
  input: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.radius.md,
    borderWidth: 1,
    fontSize: Layout.fontSize.md,
    marginBottom: Layout.spacing.sm,
  },
  fieldLabel: { fontSize: Layout.fontSize.sm, fontWeight: '600', marginBottom: Layout.spacing.xs },
  fieldHint: { fontSize: Layout.fontSize.xs, marginBottom: Layout.spacing.sm },
  bulkInput: {
    minHeight: 72,
  },
  bulkAddButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.md,
    marginBottom: Layout.spacing.md,
  },
  bulkAddText: { color: '#FFF', fontSize: Layout.fontSize.sm, fontWeight: '600' },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.md,
  },
  countLabel: { fontSize: Layout.fontSize.md, fontWeight: '500' },
  countControls: { flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.md },
  countBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBtnText: { fontSize: 20, fontWeight: '600' },
  countValue: { fontSize: Layout.fontSize.xl, fontWeight: '700', minWidth: 30, textAlign: 'center' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Layout.spacing.sm, marginBottom: Layout.spacing.md },
  categoryChip: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.full,
    borderWidth: 1,
  },
  memberFormRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
    gap: Layout.spacing.sm,
  },
  memberFormInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.sm,
    borderRadius: Layout.radius.md,
    gap: Layout.spacing.sm,
  },
  memberFormName: { fontSize: Layout.fontSize.md },
  childTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Layout.radius.sm,
  },
  childTagText: { fontSize: 11, fontWeight: '500' },
  memberFormActions: { flexDirection: 'row', gap: Layout.spacing.sm },
  addMemberFormRow: { flexDirection: 'row', gap: Layout.spacing.sm, alignItems: 'center' },
  memberInput: { flex: 1, marginBottom: 0 },
  addMemberFormBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { padding: Layout.spacing.lg, paddingBottom: Layout.spacing.xxl },
  groupCard: { borderRadius: Layout.radius.lg, marginBottom: Layout.spacing.md, overflow: 'hidden' },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.md,
  },
  groupInfo: { flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.md, flex: 1 },
  groupAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  groupDetails: { flex: 1 },
  groupName: { fontSize: Layout.fontSize.md, fontWeight: '600' },
  groupMeta: { fontSize: Layout.fontSize.sm },
  groupRsvpMeta: { fontSize: Layout.fontSize.xs, fontWeight: '600', marginTop: 2 },
  groupHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.sm },
  statusBadge: { paddingHorizontal: Layout.spacing.sm, paddingVertical: 4, borderRadius: Layout.radius.full },
  statusText: { fontSize: Layout.fontSize.xs, fontWeight: '600' },
  contactInfo: { paddingHorizontal: Layout.spacing.md, paddingBottom: Layout.spacing.sm, gap: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.sm },
  contactText: { fontSize: Layout.fontSize.sm },
  membersSection: { padding: Layout.spacing.md, borderTopWidth: 1 },
  membersTitle: { fontSize: Layout.fontSize.sm, fontWeight: '600', marginBottom: Layout.spacing.sm },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
  },
  memberName: { fontSize: Layout.fontSize.sm },
  childBadge: { fontSize: Layout.fontSize.xs },
  deleteMemberBtn: { marginLeft: 'auto', padding: 4 },
  membersHint: { fontSize: Layout.fontSize.xs, fontStyle: 'italic', marginTop: Layout.spacing.xs },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.sm,
    marginTop: Layout.spacing.sm,
    borderRadius: Layout.radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: Layout.spacing.xs,
  },
  addMemberText: { fontSize: Layout.fontSize.sm, fontWeight: '500' },
  inviteActionsRow: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.sm,
    flexWrap: 'wrap',
  },
  inviteMetaText: {
    fontSize: Layout.fontSize.xs,
    marginTop: Layout.spacing.xs,
  },
  groupActions: { flexDirection: 'row', gap: Layout.spacing.sm, padding: Layout.spacing.md, paddingTop: 0 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.sm,
    borderRadius: Layout.radius.md,
    gap: 4,
  },
  actionBtnText: { fontSize: Layout.fontSize.xs, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: Layout.spacing.xxl },
  emptyTitle: { fontSize: Layout.fontSize.lg, fontWeight: '600', marginTop: Layout.spacing.md },
  emptySubtitle: { fontSize: Layout.fontSize.md, marginTop: Layout.spacing.xs, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.lg,
  },
  modalContent: {
    width: '100%',
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
    gap: Layout.spacing.md,
  },
  modalTitle: { fontSize: Layout.fontSize.lg, fontWeight: '600', textAlign: 'center' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.sm },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: { fontSize: Layout.fontSize.md },
  modalActions: { flexDirection: 'row', gap: Layout.spacing.md },
});
