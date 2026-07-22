/**
 * Autocomplétion de lieux via la Search Box API de Mapbox.
 *
 * On utilise volontairement /search/searchbox/v1 et non l'API Geocoding v5 :
 * testée sur des cas réels, cette dernière ne trouvait aucun commerce belge
 * (« la ruche » ne renvoyait que « La Roche-en-Ardenne », « chateau » rien du
 * tout), alors que la Search Box remonte bien les restaurants, salles et
 * châteaux — ce que les utilisateurs cherchent pour un événement.
 *
 * Le jeton public `pk.` est conçu pour être embarqué dans une app cliente ;
 * la consommation se surveille depuis la console Mapbox.
 */

import { useEffect, useMemo, useState } from 'react';

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
const ENDPOINT = 'https://api.mapbox.com/search/searchbox/v1/suggest';

/** En dessous, les résultats sont trop vagues pour être utiles. */
const MIN_QUERY_LENGTH = 3;
/** Laisse l'utilisateur finir de taper avant d'appeler l'API. */
const DEBOUNCE_MS = 300;

export interface PlaceSuggestion {
  id: string;
  /** Nom de l'établissement, ex. « La Ruche Steak and Ribs ». */
  name: string;
  /** Localisation lisible, ex. « 1060 Saint-Gilles, Belgique ». */
  address: string;
}

export const isPlaceSearchEnabled = Boolean(TOKEN);

function newSessionToken(): string {
  const uuid = (globalThis as any)?.crypto?.randomUUID;
  if (typeof uuid === 'function') return uuid();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function usePlaceSearch(query: string) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mapbox facture par session, pas par frappe : un jeton stable pour toute
  // la durée de la saisie évite de payer chaque caractère tapé.
  const sessionToken = useMemo(newSessionToken, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (!TOKEN || trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    // AbortController : une frappe rapide annule la requête précédente, sinon
    // une réponse lente pourrait écraser une plus récente.
    const controller = new AbortController();
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const url =
          `${ENDPOINT}?q=${encodeURIComponent(trimmed)}` +
          `&access_token=${TOKEN}` +
          `&session_token=${sessionToken}` +
          `&country=be` +
          `&language=fr` +
          `&limit=6`;

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`Mapbox ${res.status}`);
        const data = await res.json();

        setSuggestions(
          (data.suggestions ?? []).map((s: any, i: number) => ({
            id: String(s.mapbox_id ?? `${i}-${s.name}`),
            name: String(s.name ?? ''),
            address: String(s.place_formatted ?? ''),
          }))
        );
      } catch (e) {
        // Une requête annulée n'est pas une erreur : on ne vide pas la liste.
        if ((e as Error)?.name !== 'AbortError') {
          if (__DEV__) console.warn('[usePlaceSearch]', e);
          setSuggestions([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, sessionToken]);

  return { suggestions, isLoading };
}
