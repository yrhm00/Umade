/**
 * Hooks pour le Feed Social
 * Partage d'événements réalisés par la communauté
 */

import { Config } from '@/constants/Config';
import { supabase } from '@/lib/supabase';
import {
  CommentWithUser,
  CreateCommentInput,
  CreateSocialPostInput,
  SocialFeedFilters,
  SocialFeedSortBy,
  SocialPostWithDetails,
} from '@/types/social';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuth } from './useAuth';

const PAGE_SIZE = 20;
const SOCIAL_CACHE_KEY = 'socialFeed';

// Helper: on force "any" pour eviter les SelectQueryError (relations, selects imbriques).
const fromTable = (table: string) => (supabase as any).from(table);

/**
 * Hook pour le feed social avec infinite scroll
 */
export function useSocialFeed(
  filters: SocialFeedFilters = {},
  sortBy: SocialFeedSortBy = 'recent'
) {
  const { userId } = useAuth();

  return useInfiniteQuery({
    queryKey: [SOCIAL_CACHE_KEY, 'feed', filters, sortBy],
    queryFn: async ({ pageParam = 0 }): Promise<SocialPostWithDetails[]> => {
      let query = fromTable('social_posts')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          ),
          providers:provider_id (
            id,
            business_name
          ),
          social_post_images (
            id,
            image_url,
            thumbnail_url,
            width,
            height,
            display_order
          )
        `)
        .eq('is_public', true)
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      // Filtres
      if (filters.event_type) {
        query = query.eq('event_type', filters.event_type);
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      // Tri
      switch (sortBy) {
        case 'popular':
          query = query.order('like_count', { ascending: false });
          break;
        case 'following':
          // Fetch following IDs and filter posts from followed users
          if (userId) {
            const { data: follows } = await fromTable('user_follows')
              .select('following_id')
              .eq('follower_id', userId);

            const followingIds = (follows || []).map((f: any) => f.following_id);
            if (followingIds.length > 0) {
              query = query.in('user_id', followingIds);
            } else {
              // No followings: return empty
              return [];
            }
          }
          query = query.order('created_at', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Trier les images par display_order
      return ((data as any[]) || []).map((post) => ({
        ...post,
        social_post_images: (post.social_post_images || []).sort(
          (a: { display_order: number }, b: { display_order: number }) =>
            a.display_order - b.display_order
        ),
      })) as SocialPostWithDetails[];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
  });
}

/**
 * Hook pour récupérer un post social spécifique
 */
export function useSocialPost(postId: string | undefined) {
  return useQuery({
    queryKey: [SOCIAL_CACHE_KEY, 'post', postId],
    queryFn: async (): Promise<SocialPostWithDetails | null> => {
      if (!postId) return null;

      const { data, error } = await fromTable('social_posts')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          ),
          providers:provider_id (
            id,
            business_name
          ),
          social_post_images (
            id,
            image_url,
            thumbnail_url,
            width,
            height,
            display_order
          )
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      return data as SocialPostWithDetails;
    },
    enabled: !!postId,
  });
}

/**
 * Hook pour créer un post social
 */
export function useCreateSocialPost() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateSocialPostInput): Promise<SocialPostWithDetails> => {
      if (!userId) throw new Error('Non authentifié');

      // 1. Créer le post
      const { data: post, error: postError } = await fromTable('social_posts')
        .insert({
          user_id: userId,
          content: input.content || null,
          event_type: input.event_type || null,
          event_date: input.event_date || null,
          location: input.location || null,
          event_id: input.event_id || null,
        })
        .select()
        .single();

      if (postError) throw postError;

      // 2. Upload et créer les images
      if (input.images && input.images.length > 0) {
        const imageInserts = input.images.map((img, index) => ({
          post_id: post.id,
          image_url: img.uri, // Déjà uploadée
          width: img.width || null,
          height: img.height || null,
          display_order: index,
        }));

        const { error: imagesError } = await fromTable('social_post_images')
          .insert(imageInserts);

        if (imagesError) {
          if (__DEV__) console.error('Error inserting images:', imagesError);
        }
      }

      return post as SocialPostWithDetails;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SOCIAL_CACHE_KEY] });
    },
  });
}

/**
 * Hook pour supprimer un post social
 */
export function useDeleteSocialPost() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (postId: string): Promise<void> => {
      if (!userId) throw new Error('Non authentifié');

      const { error } = await fromTable('social_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SOCIAL_CACHE_KEY] });
    },
  });
}

/**
 * Hook pour liker/unliker un post
 */
export function useSocialPostLike() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }): Promise<void> => {
      if (!userId) throw new Error('Non authentifié');

      if (isLiked) {
        // Unlike
        const { error: unlikeError } = await fromTable('social_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
        if (unlikeError) throw unlikeError;

        const { error: decrementError } = await supabase.rpc('decrement_social_post_likes' as any, { post_id: postId });
        if (decrementError) throw decrementError;
      } else {
        // Like
        const { error: likeError } = await fromTable('social_post_likes')
          .insert({
            post_id: postId,
            user_id: userId,
          });
        if (likeError) throw likeError;

        const { error: incrementError } = await supabase.rpc('increment_social_post_likes' as any, { post_id: postId });
        if (incrementError) throw incrementError;
      }
    },
    onMutate: async ({ postId, isLiked }) => {
      // Optimistic update — cibler TOUTES les variantes du feed (filtres/tri différents)
      await queryClient.cancelQueries({ queryKey: [SOCIAL_CACHE_KEY, 'feed'] });

      // Snapshot toutes les queries feed pour rollback
      const previousFeedQueries: [any, any][] = [];
      queryClient.getQueriesData({ queryKey: [SOCIAL_CACHE_KEY, 'feed'] }).forEach(([key, data]) => {
        previousFeedQueries.push([key, data]);
      });

      const previousPost = queryClient.getQueryData([SOCIAL_CACHE_KEY, 'post', postId]);

      // Mettre à jour toutes les variantes du feed
      queryClient.setQueriesData(
        { queryKey: [SOCIAL_CACHE_KEY, 'feed'] },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: SocialPostWithDetails[]) =>
              page.map((post) =>
                post.id === postId
                  ? { ...post, like_count: post.like_count + (isLiked ? -1 : 1) }
                  : post
              )
            ),
          };
        }
      );

      // Aussi mettre à jour le détail du post si en cache
      queryClient.setQueryData(
        [SOCIAL_CACHE_KEY, 'post', postId],
        (old: any) => {
          if (!old) return old;
          return { ...old, like_count: old.like_count + (isLiked ? -1 : 1) };
        }
      );

      return { previousFeedQueries, previousPost, postId };
    },
    onError: (err, variables, context) => {
      // Restaurer tous les snapshots feed
      if (context?.previousFeedQueries) {
        context.previousFeedQueries.forEach(([key, data]: [any, any]) => {
          queryClient.setQueryData(key, data);
        });
      }
      if (context?.previousPost !== undefined) {
        queryClient.setQueryData([SOCIAL_CACHE_KEY, 'post', context.postId], context.previousPost);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [SOCIAL_CACHE_KEY] });
    },
  });
}

/**
 * Hook pour vérifier si l'utilisateur a liké des posts
 */
export function useSocialPostLikeIds() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [SOCIAL_CACHE_KEY, 'likeIds', userId],
    queryFn: async (): Promise<Set<string>> => {
      if (!userId) return new Set();

      const { data, error } = await fromTable('social_post_likes')
        .select('post_id')
        .eq('user_id', userId);

      if (error) throw error;
      return new Set((data || []).map((like: any) => like.post_id));
    },
    enabled: !!userId,
  });
}

/**
 * Hook pour les commentaires d'un post (avec pagination)
 */
const COMMENTS_PAGE_SIZE = 30;

export function useSocialPostComments(postId: string | undefined) {
  return useInfiniteQuery({
    queryKey: [SOCIAL_CACHE_KEY, 'comments', postId],
    queryFn: async ({ pageParam = 0 }): Promise<CommentWithUser[]> => {
      if (!postId) return [];

      const { data, error } = await fromTable('social_post_comments')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .range(pageParam, pageParam + COMMENTS_PAGE_SIZE - 1);

      if (error) throw error;
      return (data || []) as CommentWithUser[];
    },
    getNextPageParam: (lastPage: CommentWithUser[], allPages: CommentWithUser[][]) => {
      if (lastPage.length < COMMENTS_PAGE_SIZE) return undefined;
      return allPages.length * COMMENTS_PAGE_SIZE;
    },
    initialPageParam: 0,
    enabled: !!postId,
  });
}

/**
 * Hook pour créer un commentaire
 */
export function useCreateComment() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateCommentInput): Promise<CommentWithUser> => {
      if (!userId) throw new Error('Non authentifié');

      const { data, error } = await fromTable('social_post_comments')
        .insert({
          post_id: input.post_id,
          user_id: userId,
          content: input.content,
          parent_id: input.parent_id || null,
        })
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Incrémenter le compteur de commentaires
      await supabase.rpc('increment_social_post_comments' as any, { post_id: input.post_id });

      return data as CommentWithUser;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [SOCIAL_CACHE_KEY, 'comments', variables.post_id] });
      queryClient.invalidateQueries({ queryKey: [SOCIAL_CACHE_KEY, 'feed'] });
    },
  });
}

/**
 * Hook pour supprimer un commentaire
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }): Promise<void> => {
      if (!userId) throw new Error('Non authentifié');

      const { error } = await fromTable('social_post_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) throw error;

      // Décrémenter le compteur de commentaires
      await supabase.rpc('decrement_social_post_comments' as any, { post_id: postId });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [SOCIAL_CACHE_KEY, 'comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: [SOCIAL_CACHE_KEY, 'feed'] });
    },
  });
}

/**
 * Hook pour les posts de l'utilisateur
 */
export function useMyPosts() {
  const { userId } = useAuth();

  return useInfiniteQuery({
    queryKey: [SOCIAL_CACHE_KEY, 'my', userId],
    queryFn: async ({ pageParam = 0 }): Promise<SocialPostWithDetails[]> => {
      if (!userId) return [];

      const { data, error } = await fromTable('social_posts')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          ),
          social_post_images (
            id,
            image_url,
            thumbnail_url,
            width,
            height,
            display_order
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (error) throw error;
      return (data || []) as SocialPostWithDetails[];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
    enabled: !!userId,
  });
}
