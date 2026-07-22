/**
 * Création / mise à jour de la fiche prestataire à la fin du tunnel d'inscription.
 *
 * Corrige un trou du parcours initial : aucun INSERT dans `providers` n'existait,
 * alors que business_name et category_id y sont NOT NULL — les comptes
 * prestataires se retrouvaient inutilisables (dashboard, services, portfolio...).
 */

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface ProviderSetupInput {
  categoryId: string;
  businessName: string;
  businessPhone?: string | null;
  city?: string | null;
  postalCode?: string | null;
  travelsNationwide?: boolean;
  description?: string | null;
}

/**
 * Indique si l'utilisateur courant possède déjà une fiche `providers`.
 * Sert de garde-fou pour les comptes créés avant ce correctif.
 */
export function useHasProviderProfile() {
  const { userId, isProvider } = useAuth();

  return useQuery({
    queryKey: ['provider-profile-exists', userId],
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!userId && isProvider,
    staleTime: 60_000,
  });
}

export function useCompleteProviderOnboarding() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (input: ProviderSetupInput) => {
      if (!userId) throw new Error('Utilisateur non authentifié');
      if (!input.categoryId) throw new Error('Catégorie manquante');
      if (!input.businessName.trim()) throw new Error("Nom d'entreprise manquant");

      const payload = {
        business_name: input.businessName.trim(),
        category_id: input.categoryId,
        business_phone: input.businessPhone?.trim() || null,
        city: input.city?.trim() || null,
        postal_code: input.postalCode?.trim() || null,
        description: input.description?.trim() || null,
        // 999 km => badge « Se déplace partout en Belgique »
        service_radius_km: input.travelsNationwide ? 999 : null,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      // Idempotent : si une fiche existe déjà (reprise de parcours), on la met à jour.
      const { data: existing, error: existingError } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      if (existingError) throw existingError;

      if (existing) {
        const { error } = await supabase
          .from('providers')
          .update(payload)
          .eq('id', (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('providers')
          .insert({ user_id: userId, ...payload });
        if (error) throw error;
      }

      // Le compte devient utilisable : on marque le profil comme onboardé.
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_onboarded: true })
        .eq('id', userId);
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-profile-exists', userId] });
      queryClient.invalidateQueries({ queryKey: ['provider-id', userId] });
      queryClient.invalidateQueries({ queryKey: ['provider'] });
    },
  });
}
