# Structure du dépôt Umade

Ce dépôt contient trois projets distincts.

## 📱 Application mobile — la racine

React Native / Expo. Client et prestataire dans la même app.

| Dossier | Contenu |
|---|---|
| `app/` | Écrans (Expo Router) |
| `components/` | Composants partagés |
| `hooks/` | Accès aux données (React Query) |
| `stores/` | État global (Zustand) |
| `lib/` | Utilitaires, client Supabase |
| `supabase/` | Migrations SQL, Edge Functions, templates d'emails |
| `ios/` | Projet natif généré — **ne pas éditer à la main** (`expo prebuild` l'écrase) |
| `scripts/` | Outillage (`check-ios`) |
| `plugins/` | Plugins de config Expo |

```bash
npm run ios          # vérifie les réglages puis build
npm run check-ios    # vérifie seuls les réglages iOS
```

## 🌐 Site vitrine — `marketing-site/`

Page publique de présentation. HTML statique autonome, aucun build.

Déployé sur Vercel, projet **marketing-site**.

```bash
cd marketing-site && npx vercel --prod
```

## 🔧 Console Ops — `admin-dashboard/`

Tableau de bord technique interne : liens vers les services, identifiants
copiables, commandes fréquentes et chiffres d'activité.

Déployé sur Vercel, projet **admin-dashboard**, **protégé par
l'authentification Vercel** — il ne doit jamais devenir public.

Les chiffres viennent de l'Edge Function `admin-stats`, protégée par le
secret `ADMIN_STATS_TOKEN`. Ce jeton n'est pas dans le code : la console le
demande une fois puis le garde dans le navigateur.

```bash
cd admin-dashboard && npx vercel --prod
```

## Hors dépôt

- `component_Website/` — ancien projet de site, non suivi
- `.env.local` — clés Supabase, Sentry, Mapbox. **Jamais commité.**
