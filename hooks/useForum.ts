/**
 * Hooks pour le Forum/Q&A
 * Questions et réponses communautaires
 */

import { supabase } from '@/lib/supabase';
import {
  CreateAnswerInput,
  CreateQuestionInput,
  ForumAnswerWithUser,
  ForumCategory,
  ForumFilters,
  ForumQuestionWithDetails,
  ForumSortBy,
  VoteType,
} from '@/types/forum';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuth } from './useAuth';

const PAGE_SIZE = 20;
const FORUM_CACHE_KEY = 'forum';

// Helper: on force "any" pour eviter les SelectQueryError (relations, selects imbriques).
const fromTable = (table: string) => (supabase as any).from(table);

/**
 * Hook pour récupérer les catégories du forum
 */
export function useForumCategories() {
  return useQuery({
    queryKey: [FORUM_CACHE_KEY, 'categories'],
    queryFn: async (): Promise<ForumCategory[]> => {
      const { data, error } = await fromTable('forum_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data || []) as ForumCategory[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook pour le feed de questions avec infinite scroll
 */
export function useForumQuestions(
  filters: ForumFilters = {},
  sortBy: ForumSortBy = 'recent'
) {
  const { userId } = useAuth();

  return useInfiniteQuery({
    queryKey: [FORUM_CACHE_KEY, 'questions', filters, sortBy],
    queryFn: async ({ pageParam = 0 }): Promise<ForumQuestionWithDetails[]> => {
      let query = fromTable('forum_questions')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          ),
          forum_categories:category_id (
            id,
            name,
            slug,
            icon,
            color
          )
        `)
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      // Filtres
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters.is_solved !== undefined) {
        query = query.eq('is_solved', filters.is_solved);
      }
      if (filters.search_query) {
        query = query.or(
          `title.ilike.%${filters.search_query}%,content.ilike.%${filters.search_query}%`
        );
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      // Tri
      switch (sortBy) {
        case 'popular':
          query = query.order('upvote_count', { ascending: false });
          break;
        case 'unanswered':
          query = query
            .eq('is_solved', false)
            .eq('answer_count', 0)
            .order('created_at', { ascending: false });
          break;
        case 'solved':
          query = query
            .eq('is_solved', true)
            .order('created_at', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get user votes if logged in
      let userVotes: Record<string, VoteType> = {};
      if (userId && data && data.length > 0) {
        const questionIds = data.map((q: any) => q.id);
        const { data: votes } = await fromTable('forum_question_votes')
          .select('question_id, vote_type')
          .eq('user_id', userId)
          .in('question_id', questionIds);

        if (votes) {
          userVotes = votes.reduce((acc: Record<string, VoteType>, v: any) => {
            acc[v.question_id] = v.vote_type;
            return acc;
          }, {});
        }
      }

      return ((data || []) as any[]).map((q) => ({
        ...q,
        user_vote: userVotes[q.id] || null,
      })) as ForumQuestionWithDetails[];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
  });
}

/**
 * Hook pour une question spécifique
 */
export function useForumQuestion(questionId: string | undefined) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [FORUM_CACHE_KEY, 'question', questionId],
    queryFn: async (): Promise<ForumQuestionWithDetails | null> => {
      if (!questionId) return null;

      // Increment view count
      await supabase.rpc('increment_forum_question_views' as any, { question_id: questionId });

      const { data, error } = await fromTable('forum_questions')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          ),
          forum_categories:category_id (
            id,
            name,
            slug,
            icon,
            color
          )
        `)
        .eq('id', questionId)
        .single();

      if (error) throw error;

      // Get user vote
      let userVote: VoteType | null = null;
      if (userId) {
        const { data: vote } = await fromTable('forum_question_votes')
          .select('vote_type')
          .eq('user_id', userId)
          .eq('question_id', questionId)
          .single();

        if (vote) {
          userVote = vote.vote_type as VoteType;
        }
      }

      return { ...data, user_vote: userVote } as ForumQuestionWithDetails;
    },
    enabled: !!questionId,
  });
}

/**
 * Hook pour les réponses d'une question
 */
export function useForumAnswers(questionId: string | undefined) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [FORUM_CACHE_KEY, 'answers', questionId],
    queryFn: async (): Promise<ForumAnswerWithUser[]> => {
      if (!questionId) return [];

      const { data, error } = await fromTable('forum_answers')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('question_id', questionId)
        .order('is_accepted', { ascending: false })
        .order('upvote_count', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get user votes
      let userVotes: Record<string, VoteType> = {};
      if (userId && data && data.length > 0) {
        const answerIds = data.map((a: any) => a.id);
        const { data: votes } = await fromTable('forum_answer_votes')
          .select('answer_id, vote_type')
          .eq('user_id', userId)
          .in('answer_id', answerIds);

        if (votes) {
          userVotes = votes.reduce((acc: Record<string, VoteType>, v: any) => {
            acc[v.answer_id] = v.vote_type;
            return acc;
          }, {});
        }
      }

      return ((data || []) as any[]).map((a) => ({
        ...a,
        user_vote: userVotes[a.id] || null,
      })) as ForumAnswerWithUser[];
    },
    enabled: !!questionId,
  });
}

/**
 * Hook pour créer une question
 */
export function useCreateQuestion() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateQuestionInput): Promise<ForumQuestionWithDetails> => {
      if (!userId) throw new Error('Non authentifié');

      const { data, error } = await fromTable('forum_questions')
        .insert({
          user_id: userId,
          category_id: input.category_id,
          title: input.title,
          content: input.content,
          tags: input.tags || [],
        })
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          ),
          forum_categories:category_id (
            id,
            name,
            slug,
            icon,
            color
          )
        `)
        .single();

      if (error) throw error;

      // Update category post count
      const { error: rpcError } = await supabase.rpc('increment_post_count' as any, { cat_id: input.category_id });
      if (rpcError) {
        // Non-bloquant: le post a ete cree, mais le compteur peut etre desynchronise.
        console.warn('[Forum] increment_post_count failed:', rpcError);
      }

      return data as ForumQuestionWithDetails;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FORUM_CACHE_KEY] });
    },
  });
}

/**
 * Hook pour créer une réponse
 */
export function useCreateAnswer() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateAnswerInput): Promise<ForumAnswerWithUser> => {
      if (!userId) throw new Error('Non authentifié');

      const { data, error } = await fromTable('forum_answers')
        .insert({
          question_id: input.question_id,
          user_id: userId,
          content: input.content,
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

      // Update question answer count
      const { error: rpcError } = await supabase.rpc('increment_forum_question_answer_count' as any, {
        question_id: input.question_id,
      });
      if (rpcError) {
        console.warn('[Forum] increment_forum_question_answer_count failed:', rpcError);
      }

      return data as ForumAnswerWithUser;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [FORUM_CACHE_KEY, 'answers', variables.question_id] });
      queryClient.invalidateQueries({ queryKey: [FORUM_CACHE_KEY, 'questions'] });
    },
  });
}

/**
 * Hook pour voter sur une question
 */
export function useVoteQuestion() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({
      questionId,
      voteType,
      currentVote,
    }: {
      questionId: string;
      voteType: VoteType;
      currentVote: VoteType | null;
    }): Promise<void> => {
      if (!userId) throw new Error('Non authentifié');

      if (currentVote === voteType) {
        await fromTable('forum_question_votes')
          .delete()
          .eq('question_id', questionId)
          .eq('user_id', userId);

        const countChange = voteType === 'up' ? -1 : 1;
        const { error: rpcError } = await supabase.rpc('adjust_forum_question_upvote_count' as any, {
          question_id: questionId,
          delta: countChange,
        });
        if (rpcError) throw rpcError;
      } else {
        await fromTable('forum_question_votes')
          .upsert({
            question_id: questionId,
            user_id: userId,
            vote_type: voteType,
          });

        let countChange = voteType === 'up' ? 1 : -1;
        if (currentVote) {
          countChange *= 2;
        }
        const { error: rpcError } = await supabase.rpc('adjust_forum_question_upvote_count' as any, {
          question_id: questionId,
          delta: countChange,
        });
        if (rpcError) throw rpcError;
      }
    },
    onMutate: async ({ questionId, voteType, currentVote }) => {
      await queryClient.cancelQueries({ queryKey: [FORUM_CACHE_KEY] });

      const previousQuestions = queryClient.getQueryData([FORUM_CACHE_KEY, 'questions']);
      const previousQuestion = queryClient.getQueryData([FORUM_CACHE_KEY, 'question', questionId]);

      const isRemoving = currentVote === voteType;
      const newVote = isRemoving ? null : voteType;
      let countDelta = 0;
      if (isRemoving) {
        countDelta = voteType === 'up' ? -1 : 1;
      } else {
        countDelta = voteType === 'up' ? 1 : -1;
        if (currentVote) countDelta *= 2;
      }

      // Update infinite query pages
      queryClient.setQueryData(
        [FORUM_CACHE_KEY, 'questions'],
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: ForumQuestionWithDetails[]) =>
              page.map((q) =>
                q.id === questionId
                  ? { ...q, user_vote: newVote, upvote_count: (q.upvote_count || 0) + countDelta }
                  : q
              )
            ),
          };
        }
      );

      // Update single question query
      queryClient.setQueryData(
        [FORUM_CACHE_KEY, 'question', questionId],
        (old: any) => {
          if (!old) return old;
          return { ...old, user_vote: newVote, upvote_count: (old.upvote_count || 0) + countDelta };
        }
      );

      return { previousQuestions, previousQuestion };
    },
    onError: (_err, { questionId }, context) => {
      if (context?.previousQuestions) {
        queryClient.setQueryData([FORUM_CACHE_KEY, 'questions'], context.previousQuestions);
      }
      if (context?.previousQuestion) {
        queryClient.setQueryData([FORUM_CACHE_KEY, 'question', questionId], context.previousQuestion);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [FORUM_CACHE_KEY] });
    },
  });
}

/**
 * Hook pour voter sur une réponse
 */
export function useVoteAnswer() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({
      answerId,
      questionId,
      voteType,
      currentVote,
    }: {
      answerId: string;
      questionId: string;
      voteType: VoteType;
      currentVote: VoteType | null;
    }): Promise<void> => {
      if (!userId) throw new Error('Non authentifié');

      if (currentVote === voteType) {
        await fromTable('forum_answer_votes')
          .delete()
          .eq('answer_id', answerId)
          .eq('user_id', userId);

        const countChange = voteType === 'up' ? -1 : 1;
        const { error: rpcError } = await supabase.rpc('adjust_forum_answer_upvote_count' as any, {
          answer_id: answerId,
          delta: countChange,
        });
        if (rpcError) throw rpcError;
      } else {
        await fromTable('forum_answer_votes')
          .upsert({
            answer_id: answerId,
            user_id: userId,
            vote_type: voteType,
          });

        let countChange = voteType === 'up' ? 1 : -1;
        if (currentVote) countChange *= 2;
        const { error: rpcError } = await supabase.rpc('adjust_forum_answer_upvote_count' as any, {
          answer_id: answerId,
          delta: countChange,
        });
        if (rpcError) throw rpcError;
      }
    },
    onMutate: async ({ answerId, questionId, voteType, currentVote }) => {
      await queryClient.cancelQueries({ queryKey: [FORUM_CACHE_KEY, 'answers', questionId] });

      const previousAnswers = queryClient.getQueryData([FORUM_CACHE_KEY, 'answers', questionId]);

      const isRemoving = currentVote === voteType;
      const newVote = isRemoving ? null : voteType;
      let countDelta = 0;
      if (isRemoving) {
        countDelta = voteType === 'up' ? -1 : 1;
      } else {
        countDelta = voteType === 'up' ? 1 : -1;
        if (currentVote) countDelta *= 2;
      }

      queryClient.setQueryData(
        [FORUM_CACHE_KEY, 'answers', questionId],
        (old: ForumAnswerWithUser[] | undefined) => {
          if (!old) return old;
          return old.map((a) =>
            a.id === answerId
              ? { ...a, user_vote: newVote, upvote_count: (a.upvote_count || 0) + countDelta }
              : a
          );
        }
      );

      return { previousAnswers };
    },
    onError: (_err, { questionId }, context) => {
      if (context?.previousAnswers) {
        queryClient.setQueryData([FORUM_CACHE_KEY, 'answers', questionId], context.previousAnswers);
      }
    },
    onSettled: (_, __, { questionId }) => {
      queryClient.invalidateQueries({ queryKey: [FORUM_CACHE_KEY, 'answers', questionId] });
    },
  });
}

/**
 * Hook pour accepter une réponse (auteur de la question uniquement)
 */
export function useAcceptAnswer() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({
      answerId,
      questionId,
    }: {
      answerId: string;
      questionId: string;
    }): Promise<void> => {
      if (!userId) throw new Error('Non authentifié');

      // Verify user is question author
      const { data: question } = await fromTable('forum_questions')
        .select('user_id')
        .eq('id', questionId)
        .single();

      if (question?.user_id !== userId) {
        throw new Error("Vous n'êtes pas l'auteur de cette question");
      }

      // Unaccept any previous answer
      await fromTable('forum_answers')
        .update({ is_accepted: false })
        .eq('question_id', questionId);

      // Accept this answer
      await fromTable('forum_answers')
        .update({ is_accepted: true })
        .eq('id', answerId);

      // Mark question as solved
      await fromTable('forum_questions')
        .update({ is_solved: true, accepted_answer_id: answerId })
        .eq('id', questionId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [FORUM_CACHE_KEY, 'question', variables.questionId] });
      queryClient.invalidateQueries({ queryKey: [FORUM_CACHE_KEY, 'answers', variables.questionId] });
      queryClient.invalidateQueries({ queryKey: [FORUM_CACHE_KEY, 'questions'] });
    },
  });
}

/**
 * Hook pour les tags populaires
 */
export function usePopularTags() {
  return useQuery({
    queryKey: [FORUM_CACHE_KEY, 'popularTags'],
    queryFn: async (): Promise<{ tag: string; count: number }[]> => {
      // Agrégation côté DB via RPC (couvre toutes les questions, pas seulement 500)
      const { data, error } = await supabase.rpc('get_popular_tags' as any, { tag_limit: 20 });
      if (error) throw error;
      return (data || []) as { tag: string; count: number }[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
