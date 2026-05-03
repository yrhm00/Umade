# Installer Umade sur un iPhone depuis un Mac

Ce guide est ecrit pour une personne qui part d'un Mac vide et qui ne connait pas le developpement.

Objectif: recuperer le projet depuis GitHub, installer ce qu'il faut sur le Mac, puis lancer l'app Umade sur un iPhone avec Xcode.

## A lire avant de commencer

Il faut obligatoirement:

- un Mac
- un iPhone
- un cable pour brancher l'iPhone au Mac
- un compte Apple ID
- une connexion internet
- les identifiants Supabase du projet

Sur Windows ou Linux, on peut telecharger le code, mais on ne peut pas installer directement l'app iPhone avec Xcode. Xcode existe seulement sur Mac.

Le premier lancement peut prendre longtemps. Xcode est lourd, les dependances aussi. Prevois facilement 1 a 2 heures si le Mac n'a rien d'installe.

## 1. Ouvrir le Terminal

Le Terminal est l'application ou tu vas copier/coller les commandes.

Pour l'ouvrir:

1. Appuie sur `Cmd + Espace`.
2. Tape `Terminal`.
3. Appuie sur `Entree`.

Quand tu vois une fenetre avec du texte et un curseur, tu es au bon endroit.

## 2. Installer Xcode

Xcode sert a compiler et installer l'app sur iPhone.

1. Ouvre l'App Store sur le Mac.
2. Cherche `Xcode`.
3. Clique sur `Obtenir` ou `Installer`.
4. Attends la fin de l'installation.
5. Ouvre Xcode une premiere fois.
6. Accepte les conditions.
7. Installe les composants que Xcode propose.

Ensuite, dans le Terminal, colle:

```bash
xcode-select --install
```

Si une fenetre s'ouvre, accepte l'installation.

Puis colle:

```bash
sudo xcodebuild -license accept
```

Le Mac peut demander ton mot de passe. C'est normal. Quand tu tapes ton mot de passe dans le Terminal, rien ne s'affiche. Tape le mot de passe puis appuie sur `Entree`.

Verifie que Xcode fonctionne:

```bash
xcodebuild -version
```

Tu dois voir une version de Xcode s'afficher.

## 3. Installer Homebrew

Homebrew sert a installer facilement les outils de developpement.

Dans le Terminal, colle cette commande:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Pendant l'installation:

- appuie sur `Entree` si Homebrew le demande
- tape ton mot de passe Mac si demande
- attends la fin

A la fin, Homebrew peut afficher une ou deux lignes a copier/coller dans le Terminal. Si c'est le cas, copie-les et lance-les.

Verifie Homebrew:

```bash
brew --version
```

## 4. Installer Node.js, Git et CocoaPods

Ces outils servent a installer le projet et ses dependances.

Dans le Terminal:

```bash
brew install node git cocoapods
```

Verifie que tout est installe:

```bash
node -v
npm -v
git --version
pod --version
```

Si ces commandes affichent des versions, c'est bon.

## 5. Telecharger le projet depuis GitHub

Dans le Terminal:

```bash
cd ~/Desktop
git clone https://github.com/yrhm00/Umade.git
cd Umade
```

Tu viens de telecharger le projet sur le Bureau du Mac.

Verifie que tu es bien dans le dossier:

```bash
pwd
```

Tu dois voir un chemin qui finit par:

```text
Desktop/Umade
```

## 6. Installer les dependances du projet

Toujours dans le Terminal, dans le dossier `Umade`:

```bash
npm ci
```

Cette commande peut prendre plusieurs minutes.

Ensuite, verifie le projet:

```bash
npx expo-doctor
```

Le resultat ideal est:

```text
17/17 checks passed. No issues detected!
```

Si ce n'est pas exactement ca, lis la section `Problemes courants` plus bas.

## 7. Configurer la base de donnees Supabase

L'app a besoin de Supabase pour le login, les messages, les favoris, les reservations et les donnees.

Dans le Terminal:

```bash
cp .env.example .env.local
open -a TextEdit .env.local
```

TextEdit va ouvrir un fichier avec deux lignes a remplir:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Demande ces deux valeurs au proprietaire du projet Supabase.

Exemple de format:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

Sauvegarde le fichier:

1. Dans TextEdit, fais `Cmd + S`.
2. Ferme TextEdit.

Ne mets jamais `.env.local` sur GitHub. Ce fichier est local au Mac.

## 8. Installer les dependances iOS

Dans le Terminal:

```bash
cd ios
pod install
cd ..
```

Cette commande installe les dependances natives iOS.

Si `pod install` echoue, lis la section `Problemes courants`.

## 9. Preparer l'iPhone

Branche l'iPhone au Mac avec un cable.

Sur l'iPhone:

1. Si un message apparait, appuie sur `Faire confiance a cet ordinateur`.
2. Entre le code de l'iPhone si demande.
3. Ouvre `Reglages`.
4. Va dans `Confidentialite et securite`.
5. Active `Mode developpeur`.
6. Redemarre l'iPhone si iOS le demande.

Si tu ne vois pas `Mode developpeur`, continue quand meme. Il peut apparaitre apres une premiere tentative de lancement depuis Xcode.

Garde le Mac et l'iPhone sur le meme Wi-Fi.

## 10. Configurer Xcode

Dans le Terminal:

```bash
open ios/umade.xcworkspace
```

Attention: il faut ouvrir `umade.xcworkspace`, pas `umade.xcodeproj`.

Dans Xcode:

1. En haut a gauche, clique sur `umade`.
2. Dans la colonne de gauche, clique encore sur le projet `umade`.
3. Au centre, selectionne la target `umade`.
4. Va dans l'onglet `Signing & Capabilities`.
5. Coche `Automatically manage signing`.
6. Dans `Team`, choisis ton compte Apple.

Si ton compte Apple n'apparait pas:

1. Dans Xcode, va dans `Xcode` -> `Settings`.
2. Va dans `Accounts`.
3. Clique sur `+`.
4. Connecte ton Apple ID.
5. Reviens dans `Signing & Capabilities`.

Le bundle identifier actuel est:

```text
com.yrhm.umade
```

Si Xcode affiche une erreur disant que cet identifiant n'est pas disponible, remplace-le par un identifiant unique:

```text
com.tonprenom.umade.dev
```

Exemple:

```text
com.sophie.umade.dev
```

Avec un compte Apple gratuit, l'app installee sur l'iPhone peut expirer apres quelques jours. Pour distribuer proprement avec TestFlight ou App Store, il faut un compte Apple Developer payant.

## 11. Installer l'app sur l'iPhone

Ferme Xcode ou laisse-le ouvert, puis retourne dans le Terminal.

Dans le dossier `Umade`:

```bash
npx expo run:ios --device
```

Le Terminal va afficher une liste d'appareils. Choisis ton iPhone.

Cette commande va:

- compiler l'app
- signer l'app avec ton compte Apple
- installer l'app sur l'iPhone
- lancer le serveur Metro

Le premier build peut etre long. Ne ferme pas le Terminal.

## 12. Autoriser l'app sur l'iPhone

Si l'iPhone bloque l'ouverture de l'app:

1. Ouvre `Reglages`.
2. Va dans `General`.
3. Va dans `VPN et gestion de l'appareil`.
4. Selectionne le certificat developpeur.
5. Appuie sur `Faire confiance`.
6. Rouvre l'app Umade.

## 13. Relancer l'app les jours suivants

Une fois l'app deja installee, tu n'as pas besoin de tout refaire.

Dans le Terminal:

```bash
cd ~/Desktop/Umade
npx expo start --dev-client --lan
```

Ensuite, ouvre l'app Umade sur l'iPhone.

Si l'iPhone ne se connecte pas au Mac:

```bash
npx expo start --dev-client --tunnel
```

## 14. Mettre le projet a jour plus tard

Si quelqu'un a modifie le projet sur GitHub et que tu veux recuperer les changements:

```bash
cd ~/Desktop/Umade
git pull
npm ci
cd ios
pod install
cd ..
npx expo run:ios --device
```

## 15. Commandes resumees

Si tout est deja installe sur le Mac, les commandes principales sont:

```bash
cd ~/Desktop
git clone https://github.com/yrhm00/Umade.git
cd Umade
npm ci
cp .env.example .env.local
open -a TextEdit .env.local
npx expo-doctor
cd ios
pod install
cd ..
npx expo run:ios --device
```

## 16. Problemes courants

### `command not found: npm`

Node.js n'est pas installe.

Lance:

```bash
brew install node
```

Puis verifie:

```bash
node -v
npm -v
```

### `command not found: pod`

CocoaPods n'est pas installe.

Lance:

```bash
brew install cocoapods
```

Puis:

```bash
pod --version
```

### `pod install` echoue

Essaie:

```bash
cd ~/Desktop/Umade/ios
pod deintegrate
pod install
cd ..
```

### Xcode affiche `CoreSimulator is out of date`

Ouvre Xcode:

1. Va dans `Xcode` -> `Settings`.
2. Va dans `Platforms`.
3. Installe ou mets a jour la plateforme iOS.
4. Redemarre Xcode.

### L'iPhone n'apparait pas

Essaie dans cet ordre:

1. Debranche et rebranche l'iPhone.
2. Deverrouille l'iPhone.
3. Accepte `Faire confiance a cet ordinateur`.
4. Change de cable si possible.
5. Ouvre Xcode et regarde si l'iPhone apparait en haut.
6. Redemarre l'iPhone et le Mac.

### Xcode refuse le signing

Verifie:

- ton Apple ID est connecte dans Xcode
- `Automatically manage signing` est coche
- une `Team` est selectionnee
- le bundle identifier est unique

Si besoin, change:

```text
com.yrhm.umade
```

en:

```text
com.tonprenom.umade.dev
```

### L'app s'ouvre mais les donnees ne chargent pas

Le fichier `.env.local` est probablement absent ou incorrect.

Verifie:

```bash
cd ~/Desktop/Umade
open -a TextEdit .env.local
```

Il doit contenir:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Puis relance:

```bash
npx expo start --clear --dev-client
```

### L'app reste bloquee ou Metro garde une ancienne version

Lance:

```bash
cd ~/Desktop/Umade
npx expo start --clear --dev-client
```

### `expo-doctor` affiche une erreur de version

Lance:

```bash
npx expo install --check
```

Puis suis les instructions affichees.

## 17. Pour partager l'app a d'autres iPhones

Installer depuis Xcode est bien pour tester sur son propre iPhone.

Pour envoyer l'app a d'autres personnes, la solution propre est:

- TestFlight
- App Store Connect
- ou un build cloud EAS

Ces options demandent generalement un compte Apple Developer payant.
