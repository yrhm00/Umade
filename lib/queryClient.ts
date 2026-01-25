import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Données considérées fraîches pendant 5 minutes
      staleTime: 1000 * 60 * 5,
      // Garder en cache 30 minutes
      gcTime: 1000 * 60 * 30,
      // Retry 2 fois en cas d'erreur
      retry: 2,
      // Refetch quand l'app revient au premier plan
      refetchOnWindowFocus: true,
    },
    mutations: {
      // Retry 1 fois pour les mutations
      retry: 1,
    },
  },
});