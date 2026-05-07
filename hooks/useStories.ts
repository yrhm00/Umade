/**
 * Hooks pour les Stories Prestataires
 * Contenu éphémère qui expire après 24h
 */

import { Config } from '@/constants/Config';
import { supabase } from '@/lib/supabase';
import {
  CreateStoryInput,
  ProviderStoriesGroup,
  ProviderStory,
  StoryWithProvider,
} from '@/types/story';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useMyProviderId } from './useMyProviderId';

// Helper: on force "any" pour eviter les SelectQueryError (relations, selects imbriques).
const fromTable = (table: string) => (supabase as any).from(table);

const STORY_CACHE_KEY = 'stories';

/**
 * Hook pour récupérer toutes les stories actives groupées par prestataire
 */
export function useStoriesFeed() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [STORY_CACHE_KEY, 'feed'],
    queryFn: async (): Promise<ProviderStoriesGroup[]> => {
      // Récupérer toutes les stories actives non expirées
      const { data: stories, error } = await fromTable('provider_stories')
        .select(`
          *,
          providers (
            id,
            business_name,
            profiles:user_id (
              avatar_url,
              full_name
            )
          )
        `)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!stories || stories.length === 0) return [];

      // Récupérer le progress de l'utilisateur pour savoir quelles stories sont vues
      let viewedStoryIds: Set<string> = new Set();
      if (userId) {
        const { data: views } = await fromTable('story_views')
          .select('story_id')
          .eq('user_id', userId);

        if (views) {
          viewedStoryIds = new Set(views.map((v: any) => v.story_id));
        }
      }

      // Grouper par prestataire
      const groupedMap = new Map<string, ProviderStoriesGroup>();

      for (const story of stories as StoryWithProvider[]) {
        const providerId = story.provider_id;
        const provider = story.providers;

        if (!provider) continue;

        if (!groupedMap.has(providerId)) {
          groupedMap.set(providerId, {
            provider: {
              id: providerId,
              business_name: provider.business_name,
              avatar_url: provider.profiles?.avatar_url || null,
            },
            stories: [],
            hasUnseenStories: false,
            lastStoryAt: story.created_at,
          });
        }

        const group = groupedMap.get(providerId)!;
        group.stories.push(story);

        // Vérifier si cette story n'a pas été vue
        if (!viewedStoryIds.has(story.id)) {
          group.hasUnseenStories = true;
        }
      }

      // Convertir en array et trier (non vus en premier, puis par date)
      return Array.from(groupedMap.values()).sort((a, b) => {
        // Prioriser les stories non vues
        if (a.hasUnseenStories && !b.hasUnseenStories) return -1;
        if (!a.hasUnseenStories && b.hasUnseenStories) return 1;
        // Puis par date de dernière story
        return new Date(b.lastStoryAt).getTime() - new Date(a.lastStoryAt).getTime();
      });
    },
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 5,
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook pour récupérer les stories d'un prestataire spécifique
 */
export function useProviderStories(providerId: string | undefined) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [STORY_CACHE_KEY, 'provider', providerId],
    queryFn: async (): Promise<StoryWithProvider[]> => {
      if (!providerId) return [];

      const { data, error } = await fromTable('provider_stories')
        .select(`
          *,
          providers (
            id,
            business_name,
            profiles:user_id (
              avatar_url,
              full_name
            )
          )
        `)
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as StoryWithProvider[];
    },
    enabled: !!providerId,
  });
}

/**
 * Hook pour créer une nouvelle story (prestataires uniquement)
 */
export function useCreateStory() {
  const queryClient = useQueryClient();
  const providerId = useMyProviderId();

  return useMutation({
    mutationFn: async (input: CreateStoryInput): Promise<ProviderStory> => {
      if (!providerId) throw new Error('Provider only');

      // Calculer la date d'expiration (24h)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { data, error } = await fromTable('provider_stories')
        .insert({
          provider_id: providerId,
          media_url: input.media_url,
          media_type: input.media_type,
          thumbnail_url: input.thumbnail_url || null,
          caption: input.caption || null,
          duration_seconds: input.duration_seconds || 5,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as ProviderStory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STORY_CACHE_KEY] });
    },
  });
}

/**
 * Hook pour marquer une story comme vue
 */
export function useMarkStoryViewed() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (storyId: string): Promise<void> => {
      if (!userId) return;

      // Insérer la vue (ignorer si déjà existante)
      await fromTable('story_views')
        .upsert(
          {
            story_id: storyId,
            user_id: userId,
            viewed_at: new Date().toISOString(),
          },
          { onConflict: 'story_id,user_id' }
        );

      // Incrémenter le compteur de vues
      await supabase.rpc('increment_story_views' as any, { story_id: storyId });
    },
    onSuccess: () => {
      // Mettre à jour le cache pour refléter la vue
      queryClient.invalidateQueries({ queryKey: [STORY_CACHE_KEY, 'feed'] });
    },
  });
}

/**
 * Hook pour supprimer une story (prestataire uniquement)
 */
export function useDeleteStory() {
  const queryClient = useQueryClient();
  const providerId = useMyProviderId();

  return useMutation({
    mutationFn: async (storyId: string): Promise<void> => {
      if (!providerId) throw new Error('Provider only');

      const { error } = await fromTable('provider_stories')
        .update({ is_active: false })
        .eq('id', storyId)
        .eq('provider_id', providerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STORY_CACHE_KEY] });
    },
  });
}

/**
 * Hook pour récupérer les stories du prestataire connecté
 */
export function useMyStories() {
  const providerId = useMyProviderId();

  return useQuery({
    queryKey: [STORY_CACHE_KEY, 'my', providerId],
    queryFn: async (): Promise<ProviderStory[]> => {
      if (!providerId) return [];

      const { data, error } = await fromTable('provider_stories')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ProviderStory[];
    },
    enabled: !!providerId,
  });
}
