# Templates d'emails Supabase

Emails d'authentification aux couleurs d'Umade, en remplacement des templates
par défaut (anglais, sans mise en forme).

## Installation

Ces fichiers ne se déploient pas par CLI : ils se collent dans le dashboard.

**Supabase → Authentication → Emails → Templates**

| Fichier | Template Supabase |
|---|---|
| `confirm-signup.html` | Confirm signup |
| `reset-password.html` | Reset password |
| `change-email.html` | Change email address |

Pour chacun : ouvrir le fichier, tout copier, coller dans le champ **Message body**
(vue *Source*, pas l'éditeur visuel), puis **Save**.

Pensez aussi à traduire le champ **Subject** :

- Confirm signup → `Confirmez votre inscription sur Umade`
- Reset password → `Réinitialisez votre mot de passe Umade`
- Change email → `Confirmez votre nouvelle adresse email`

## Contraintes d'écriture

Le HTML d'email n'est pas du HTML web. Ce qui est appliqué ici :

- **Tables** pour la mise en page — Outlook ignore flexbox et grid.
- **Styles inline** — plusieurs clients suppriment les `<style>` du `<head>`.
- **Polices système uniquement** — les polices Google ne se chargent pas dans
  la plupart des clients mail.
- **Largeur max 520 px** — au-delà, l'affichage casse sur mobile.
- **Texte d'aperçu masqué** en haut du `<body>` : c'est la ligne affichée dans
  la liste des messages, à côté de l'objet.
- **`color-scheme: light only`** — sans cela, Outlook et Gmail inversent les
  couleurs en mode sombre et rendent le texte illisible sur les fonds clairs.

## Variables

Injectées par Supabase, à conserver telles quelles :

- `{{ .ConfirmationURL }}` — le lien d'action (présent dans les trois templates)
- `{{ .Email }}` / `{{ .NewEmail }}` — utilisées par `change-email.html`

Le lien est aussi affiché en texte brut sous le bouton : certains clients
bloquent les boutons, et sans cette solution de repli l'email devient inutile.

## Délivrabilité

Un template soigné réduit le risque de spam, mais ne le supprime pas. Voir
aussi, côté DNS :

- SPF du domaine racine incluant `amazonses.com` (Resend passe par SES)
- DKIM sur `resend._domainkey.umade.be`
- DMARC : passer de `p=none` à `p=quarantine` **une fois** SPF/DKIM validés
