/**
 * Écran Partage Collaboratif
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Share,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import {
  UserPlus,
  Users,
  Mail,
  Link2,
  Copy,
  Crown,
  Edit3,
  Eye,
  Trash2,
  ChevronDown,
  Share2,
  Check,
} from 'lucide-react-native';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PressableScale } from '@/components/ui/PressableScale';
import {
  useCollaborators,
  useIsCollaborator,
  useInviteCollaborator,
  useUpdateCollaboratorRole,
  useRemoveCollaborator,
  useGenerateShareLink,
} from '@/hooks/useCollaborators';
import { Collaborator, CollaboratorRole, COLLABORATOR_ROLES } from '@/types/eventFeatures';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

const ROLE_ICONS: Record<CollaboratorRole, any> = {
  owner: Crown,
  editor: Edit3,
  viewer: Eye,
};

const ROLE_COLORS: Record<CollaboratorRole, string> = {
  owner: '#F59E0B',
  editor: '#10B981',
  viewer: '#6B7280',
};

export default function CollaboratorsScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();

  const { data: collaborators = [], isLoading, refetch, isRefetching } = useCollaborators(eventId);
  const { isOwner, canEdit } = useIsCollaborator(eventId);
  const { mutate: inviteCollab, isPending: isInviting } = useInviteCollaborator();
  const { mutate: updateRole } = useUpdateCollaboratorRole();
  const { mutate: removeCollab } = useRemoveCollaborator();
  const { mutate: generateLink, isPending: isGeneratingLink } = useGenerateShareLink();

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>('viewer');
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [showRoleSelector, setShowRoleSelector] = useState<string | null>(null);

  const handleInvite = useCallback(() => {
    if (!inviteEmail.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email.');
      return;
    }

    if (!inviteEmail.includes('@')) {
      Alert.alert('Erreur', 'Adresse email invalide.');
      return;
    }

    inviteCollab(
      {
        event_id: eventId!,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setInviteEmail('');
          setShowInviteForm(false);
          Alert.alert('Succès', 'Invitation envoyée !');
        },
        onError: (error: any) => {
          Alert.alert('Erreur', error.message || "Impossible d'envoyer l'invitation.");
        },
      }
    );
  }, [inviteEmail, inviteRole, eventId, inviteCollab]);

  const handleGenerateLink = useCallback(() => {
    generateLink(
      { eventId: eventId!, role: 'viewer' },
      {
        onSuccess: (result) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShareLink(result.shareLink);
        },
        onError: () => {
          Alert.alert('Erreur', 'Impossible de générer le lien.');
        },
      }
    );
  }, [eventId, generateLink]);

  const handleCopyLink = useCallback(async () => {
    if (shareLink) {
      await Clipboard.setStringAsync(shareLink);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Copié !', 'Le lien a été copié dans le presse-papiers.');
    }
  }, [shareLink]);

  const handleShareLink = useCallback(async () => {
    if (shareLink) {
      try {
        await Share.share({
          message: `Rejoignez mon événement sur Umade ! ${shareLink}`,
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    }
  }, [shareLink]);

  const handleUpdateRole = useCallback(
    (collab: Collaborator, newRole: CollaboratorRole) => {
      updateRole(
        { id: collab.id, eventId: eventId!, role: newRole },
        {
          onSuccess: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowRoleSelector(null);
          },
        }
      );
    },
    [eventId, updateRole]
  );

  const handleRemove = useCallback(
    (collab: Collaborator) => {
      const userName = (collab as any).user?.full_name || collab.invited_email || 'ce collaborateur';
      Alert.alert(
        'Retirer le collaborateur',
        `Retirer ${userName} de l'événement ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Retirer',
            style: 'destructive',
            onPress: () => {
              removeCollab({ id: collab.id, eventId: eventId! });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ]
      );
    },
    [eventId, removeCollab]
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Chargement..." />;
  }

  const owners = collaborators.filter((c) => c.role === 'owner');
  const editors = collaborators.filter((c) => c.role === 'editor');
  const viewers = collaborators.filter((c) => c.role === 'viewer');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Partage',
          headerStyle: { backgroundColor: colors.backgroundSecondary },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {/* Stats */}
        <Animated.View
          entering={FadeInDown}
          style={[styles.statsCard, { backgroundColor: colors.card }]}
        >
          <Users size={24} color={colors.primary} />
          <View style={styles.statsContent}>
            <Text style={[styles.statsValue, { color: colors.text }]}>
              {collaborators.length} collaborateur{collaborators.length > 1 ? 's' : ''}
            </Text>
            <Text style={[styles.statsSubtitle, { color: colors.textSecondary }]}>
              {owners.length} propriétaire • {editors.length} éditeur{editors.length > 1 ? 's' : ''} • {viewers.length} spectateur{viewers.length > 1 ? 's' : ''}
            </Text>
          </View>
        </Animated.View>

        {/* Actions */}
        {canEdit && (
          <View style={styles.actionsRow}>
            <PressableScale
              onPress={() => setShowInviteForm(!showInviteForm)}
              haptic="light"
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
            >
              <UserPlus size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Inviter</Text>
            </PressableScale>

            <PressableScale
              onPress={handleGenerateLink}
              haptic="light"
              style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            >
              <Link2 size={18} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Lien</Text>
            </PressableScale>
          </View>
        )}

        {/* Invite Form */}
        {showInviteForm && (
          <Animated.View
            entering={FadeInDown}
            style={[styles.inviteForm, { backgroundColor: colors.card }]}
          >
            <View style={styles.inputRow}>
              <Mail size={20} color={colors.textTertiary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email du collaborateur"
                placeholderTextColor={colors.textTertiary}
                value={inviteEmail}
                onChangeText={setInviteEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={[styles.formLabel, { color: colors.text }]}>Rôle</Text>
            <View style={styles.roleSelector}>
              {(['editor', 'viewer'] as CollaboratorRole[]).map((role) => {
                const Icon = ROLE_ICONS[role];
                const roleInfo = COLLABORATOR_ROLES[role];
                return (
                  <PressableScale
                    key={role}
                    onPress={() => setInviteRole(role)}
                    haptic="light"
                    style={[
                      styles.roleOption,
                      { borderColor: colors.border },
                      inviteRole === role && { backgroundColor: `${ROLE_COLORS[role]}20`, borderColor: ROLE_COLORS[role] },
                    ]}
                  >
                    <Icon size={18} color={inviteRole === role ? ROLE_COLORS[role] : colors.textSecondary} />
                    <View style={styles.roleInfo}>
                      <Text
                        style={[
                          styles.roleLabel,
                          { color: inviteRole === role ? ROLE_COLORS[role] : colors.text },
                        ]}
                      >
                        {roleInfo.label}
                      </Text>
                      <Text style={[styles.roleDescription, { color: colors.textSecondary }]}>
                        {roleInfo.description}
                      </Text>
                    </View>
                    {inviteRole === role && <Check size={18} color={ROLE_COLORS[role]} />}
                  </PressableScale>
                );
              })}
            </View>

            <AnimatedButton
              title="Envoyer l'invitation"
              onPress={handleInvite}
              loading={isInviting}
              fullWidth
            />
          </Animated.View>
        )}

        {/* Share Link */}
        {shareLink && (
          <Animated.View
            entering={FadeInDown}
            style={[styles.shareLinkCard, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.shareLinkLabel, { color: colors.text }]}>Lien de partage</Text>
            <View style={[styles.shareLinkBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.shareLinkText, { color: colors.textSecondary }]} numberOfLines={1}>
                {shareLink}
              </Text>
            </View>
            <View style={styles.shareLinkActions}>
              <PressableScale
                onPress={handleCopyLink}
                haptic="light"
                style={[styles.shareLinkBtn, { backgroundColor: `${colors.primary}20` }]}
              >
                <Copy size={16} color={colors.primary} />
                <Text style={[styles.shareLinkBtnText, { color: colors.primary }]}>Copier</Text>
              </PressableScale>
              <PressableScale
                onPress={handleShareLink}
                haptic="light"
                style={[styles.shareLinkBtn, { backgroundColor: `${colors.primary}20` }]}
              >
                <Share2 size={16} color={colors.primary} />
                <Text style={[styles.shareLinkBtnText, { color: colors.primary }]}>Partager</Text>
              </PressableScale>
            </View>
            <Text style={[styles.shareLinkHint, { color: colors.textTertiary }]}>
              Ce lien expire dans 7 jours • Max 10 utilisations
            </Text>
          </Animated.View>
        )}

        {/* Collaborators List */}
        <View style={styles.collaboratorsList}>
          {collaborators.map((collab, index) => {
            const Icon = ROLE_ICONS[collab.role];
            const roleInfo = COLLABORATOR_ROLES[collab.role];
            const user = (collab as any).user;
            const displayName = user?.full_name || collab.invited_email || 'Utilisateur';
            const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

            return (
              <Animated.View
                key={collab.id}
                entering={FadeInRight.delay(index * 50)}
                style={[styles.collaboratorCard, { backgroundColor: colors.card }]}
              >
                <View style={[styles.avatar, { backgroundColor: `${ROLE_COLORS[collab.role]}20` }]}>
                  <Text style={[styles.avatarText, { color: ROLE_COLORS[collab.role] }]}>
                    {initials}
                  </Text>
                </View>

                <View style={styles.collaboratorInfo}>
                  <Text style={[styles.collaboratorName, { color: colors.text }]}>
                    {displayName}
                  </Text>
                  <View style={styles.collaboratorMeta}>
                    <Icon size={14} color={ROLE_COLORS[collab.role]} />
                    <Text style={[styles.collaboratorRole, { color: ROLE_COLORS[collab.role] }]}>
                      {roleInfo.label}
                    </Text>
                    {collab.status === 'pending' && (
                      <View style={[styles.pendingBadge, { backgroundColor: '#F59E0B20' }]}>
                        <Text style={styles.pendingText}>En attente</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Actions */}
                {isOwner && collab.role !== 'owner' && (
                  <View style={styles.collaboratorActions}>
                    <PressableScale
                      onPress={() => setShowRoleSelector(showRoleSelector === collab.id ? null : collab.id)}
                      haptic="light"
                      style={[styles.roleBtn, { backgroundColor: colors.background }]}
                    >
                      <ChevronDown size={16} color={colors.textSecondary} />
                    </PressableScale>
                    <PressableScale
                      onPress={() => handleRemove(collab)}
                      haptic="light"
                      style={[styles.removeBtn, { backgroundColor: `${colors.error}20` }]}
                    >
                      <Trash2 size={16} color={colors.error} />
                    </PressableScale>
                  </View>
                )}

                {/* Role Selector Dropdown */}
                {showRoleSelector === collab.id && (
                  <View style={[styles.roleDropdown, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    {(['editor', 'viewer'] as CollaboratorRole[]).map((role) => {
                      const RoleIcon = ROLE_ICONS[role];
                      return (
                        <PressableScale
                          key={role}
                          onPress={() => handleUpdateRole(collab, role)}
                          haptic="light"
                          style={[
                            styles.roleDropdownItem,
                            collab.role === role && { backgroundColor: `${ROLE_COLORS[role]}10` },
                          ]}
                        >
                          <RoleIcon size={16} color={ROLE_COLORS[role]} />
                          <Text style={[styles.roleDropdownText, { color: colors.text }]}>
                            {COLLABORATOR_ROLES[role].label}
                          </Text>
                          {collab.role === role && <Check size={16} color={ROLE_COLORS[role]} />}
                        </PressableScale>
                      );
                    })}
                  </View>
                )}
              </Animated.View>
            );
          })}
        </View>

        {/* Empty State */}
        {collaborators.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>👥</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun collaborateur</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Invitez des personnes pour organiser ensemble
            </Text>
          </View>
        )}

        {/* Info Card */}
        <Animated.View
          entering={FadeInDown.delay(200)}
          style={[styles.infoCard, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}30` }]}
        >
          <Text style={[styles.infoTitle, { color: colors.primary }]}>💡 Collaboration</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • <Text style={{ fontWeight: '600' }}>Éditeur</Text> : peut modifier l'événement, gérer les invités et le budget{'\n'}
            • <Text style={{ fontWeight: '600' }}>Spectateur</Text> : peut voir l'événement mais pas le modifier
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: Layout.spacing.lg, paddingBottom: Layout.spacing.xxl },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.lg,
    borderRadius: Layout.radius.lg,
    marginBottom: Layout.spacing.lg,
    gap: Layout.spacing.md,
  },
  statsContent: { flex: 1 },
  statsValue: { fontSize: Layout.fontSize.lg, fontWeight: '700' },
  statsSubtitle: { fontSize: Layout.fontSize.sm, marginTop: 2 },
  actionsRow: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    gap: Layout.spacing.sm,
  },
  actionButtonText: { color: '#FFFFFF', fontSize: Layout.fontSize.sm, fontWeight: '600' },
  inviteForm: {
    padding: Layout.spacing.lg,
    borderRadius: Layout.radius.lg,
    marginBottom: Layout.spacing.lg,
    gap: Layout.spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  input: { flex: 1, fontSize: Layout.fontSize.md },
  formLabel: { fontSize: Layout.fontSize.sm, fontWeight: '600', marginTop: Layout.spacing.sm },
  roleSelector: { gap: Layout.spacing.sm },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.md,
    borderWidth: 1,
    gap: Layout.spacing.md,
  },
  roleInfo: { flex: 1 },
  roleLabel: { fontSize: Layout.fontSize.md, fontWeight: '600' },
  roleDescription: { fontSize: Layout.fontSize.sm, marginTop: 2 },
  shareLinkCard: {
    padding: Layout.spacing.lg,
    borderRadius: Layout.radius.lg,
    marginBottom: Layout.spacing.lg,
  },
  shareLinkLabel: { fontSize: Layout.fontSize.md, fontWeight: '600', marginBottom: Layout.spacing.sm },
  shareLinkBox: {
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.md,
    borderWidth: 1,
  },
  shareLinkText: { fontSize: Layout.fontSize.sm },
  shareLinkActions: { flexDirection: 'row', gap: Layout.spacing.sm, marginTop: Layout.spacing.md },
  shareLinkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.sm,
    borderRadius: Layout.radius.md,
    gap: Layout.spacing.xs,
  },
  shareLinkBtnText: { fontSize: Layout.fontSize.sm, fontWeight: '500' },
  shareLinkHint: { fontSize: Layout.fontSize.xs, marginTop: Layout.spacing.sm, textAlign: 'center' },
  collaboratorsList: { gap: Layout.spacing.md },
  collaboratorCard: {
    padding: Layout.spacing.lg,
    borderRadius: Layout.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: Layout.fontSize.md, fontWeight: '700' },
  collaboratorInfo: { flex: 1 },
  collaboratorName: { fontSize: Layout.fontSize.md, fontWeight: '600' },
  collaboratorMeta: { flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.xs, marginTop: 4 },
  collaboratorRole: { fontSize: Layout.fontSize.sm },
  pendingBadge: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 2,
    borderRadius: Layout.radius.full,
    marginLeft: Layout.spacing.sm,
  },
  pendingText: { fontSize: 10, color: '#F59E0B', fontWeight: '600' },
  collaboratorActions: { flexDirection: 'row', gap: Layout.spacing.xs },
  roleBtn: { padding: Layout.spacing.sm, borderRadius: Layout.radius.md },
  removeBtn: { padding: Layout.spacing.sm, borderRadius: Layout.radius.md },
  roleDropdown: {
    position: 'absolute',
    right: Layout.spacing.lg,
    top: 60,
    borderRadius: Layout.radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 10,
  },
  roleDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    padding: Layout.spacing.md,
  },
  roleDropdownText: { flex: 1, fontSize: Layout.fontSize.sm },
  emptyState: { alignItems: 'center', paddingVertical: Layout.spacing.xxl },
  emptyTitle: { fontSize: Layout.fontSize.lg, fontWeight: '600', marginTop: Layout.spacing.md },
  emptySubtitle: { fontSize: Layout.fontSize.md, marginTop: Layout.spacing.xs, textAlign: 'center' },
  infoCard: {
    padding: Layout.spacing.lg,
    borderRadius: Layout.radius.lg,
    marginTop: Layout.spacing.lg,
    borderWidth: 1,
  },
  infoTitle: { fontSize: Layout.fontSize.md, fontWeight: '600', marginBottom: Layout.spacing.sm },
  infoText: { fontSize: Layout.fontSize.sm, lineHeight: 22 },
});
