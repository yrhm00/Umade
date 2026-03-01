/**
 * Hooks pour le Partage Collaboratif
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  Collaborator,
  CollaboratorRole,
  CreateCollaboratorInput,
} from '@/types/eventFeatures';
import { useAuth } from './useAuth';

const QUERY_KEY = 'collaborators';

// Helper: on force "any" pour eviter les SelectQueryError (relations, selects imbriques).
const fromTable = (table: string) => (supabase as any).from(table);

// ============================================
// Récupérer les collaborateurs
// ============================================

export function useCollaborators(eventId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, eventId],
    queryFn: async (): Promise<Collaborator[]> => {
      if (!eventId) return [];

      const { data, error } = await fromTable('event_collaborators')
        .select(`
          *,
          user:user_id (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as Collaborator[];
    },
    enabled: !!eventId,
  });
}

// ============================================
// Vérifier si l'utilisateur actuel est collaborateur
// ============================================

export function useIsCollaborator(eventId: string | undefined) {
  const { userId } = useAuth();
  const { data: collaborators = [] } = useCollaborators(eventId);

  const collaborator = collaborators.find((c) => c.user_id === userId);

  return {
    isCollaborator: !!collaborator,
    role: collaborator?.role,
    canEdit: collaborator?.role === 'owner' || collaborator?.role === 'editor',
    canView: !!collaborator,
    isOwner: collaborator?.role === 'owner',
  };
}

// ============================================
// Inviter un collaborateur
// ============================================

export function useInviteCollaborator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCollaboratorInput) => {
      // Chercher l'utilisateur par email
      const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', input.email)
        .single();

      if (userError || !users) {
        throw new Error('Utilisateur non trouvé avec cet email');
      }

      // Vérifier si déjà collaborateur
      const { data: existing } = await fromTable('event_collaborators')
        .select('id')
        .eq('event_id', input.event_id)
        .eq('user_id', users.id)
        .single();

      if (existing) {
        throw new Error('Cet utilisateur est déjà collaborateur');
      }

      // Créer l'invitation
      const { data, error } = await fromTable('event_collaborators')
        .insert({
          event_id: input.event_id,
          user_id: users.id,
          role: input.role || 'viewer',
          invited_email: input.email,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Collaborator;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.event_id],
      });
    },
  });
}

// ============================================
// Mettre à jour le rôle d'un collaborateur
// ============================================

export function useUpdateCollaboratorRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId, role }: {
      id: string;
      eventId: string;
      role: CollaboratorRole;
    }) => {
      const { data, error } = await fromTable('event_collaborators')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Collaborator;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.eventId],
      });
    },
  });
}

// ============================================
// Retirer un collaborateur
// ============================================

export function useRemoveCollaborator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await fromTable('event_collaborators')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.eventId],
      });
    },
  });
}

// ============================================
// Accepter/Refuser une invitation
// ============================================

export function useRespondToInvitation() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({ id, eventId, accept }: {
      id: string;
      eventId: string;
      accept: boolean;
    }) => {
      if (accept) {
        const { data, error } = await fromTable('event_collaborators')
          .update({
            status: 'accepted',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        return data as Collaborator;
      } else {
        const { error } = await fromTable('event_collaborators')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (error) throw error;
        return { declined: true };
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ['pendingInvitations'],
      });
    },
  });
}

// ============================================
// Récupérer les invitations en attente pour l'utilisateur
// ============================================

export function usePendingInvitations() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ['pendingInvitations', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await fromTable('event_collaborators')
        .select(`
          *,
          event:event_id (
            id,
            title,
            event_date,
            cover_image
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

// ============================================
// Générer un lien de partage
// ============================================

export function useGenerateShareLink() {
  return useMutation({
    mutationFn: async ({ eventId, role }: { eventId: string; role: CollaboratorRole }) => {
      // Générer un token unique
      const token = Math.random().toString(36).substring(2, 15) +
                    Math.random().toString(36).substring(2, 15);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expire dans 7 jours

      const { data, error } = await fromTable('event_share_links')
        .insert({
          event_id: eventId,
          token,
          role,
          expires_at: expiresAt.toISOString(),
          max_uses: 10,
          uses: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Construire le lien
      const shareLink = `umade://event/join/${token}`;

      return { ...data, shareLink };
    },
  });
}

// ============================================
// Rejoindre via un lien de partage
// ============================================

export function useJoinViaShareLink() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({ token }: { token: string }) => {
      if (!userId) throw new Error('Non connecté');

      // Récupérer le lien
      const { data: link, error: linkError } = await fromTable('event_share_links')
        .select('*')
        .eq('token', token)
        .single();

      if (linkError || !link) {
        throw new Error('Lien invalide ou expiré');
      }

      // Vérifier l'expiration
      if (new Date(link.expires_at) < new Date()) {
        throw new Error('Ce lien a expiré');
      }

      // Vérifier le nombre d'utilisations
      if (link.uses >= link.max_uses) {
        throw new Error('Ce lien a atteint son nombre maximum d\'utilisations');
      }

      // Vérifier si déjà collaborateur
      const { data: existing } = await fromTable('event_collaborators')
        .select('id')
        .eq('event_id', link.event_id)
        .eq('user_id', userId)
        .single();

      if (existing) {
        throw new Error('Vous êtes déjà collaborateur de cet événement');
      }

      // Ajouter comme collaborateur
      const { data: collab, error: collabError } = await fromTable('event_collaborators')
        .insert({
          event_id: link.event_id,
          user_id: userId,
          role: link.role,
          status: 'accepted',
        })
        .select()
        .single();

      if (collabError) throw collabError;

      // Incrémenter le compteur d'utilisations
      await fromTable('event_share_links')
        .update({ uses: link.uses + 1 })
        .eq('id', link.id);

      return { eventId: link.event_id, collaborator: collab };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, result.eventId],
      });
    },
  });
}
