# Installer Umade sur iPhone

Ce guide part de zero pour recuperer le projet depuis GitHub, l'installer sur une machine, puis lancer l'app sur un iPhone avec Xcode.

Important: pour installer une app iOS avec Xcode, il faut un Mac. Sur Windows ou Linux, tu peux cloner et lire le code, mais tu ne peux pas compiler/installler l'app iPhone avec Xcode. Pour installer depuis un PC Windows, il faut passer par un build cloud type EAS/TestFlight avec un compte Apple Developer.

## 1. Prerequis

Installe sur le Mac:

- Xcode depuis l'App Store
- Node.js 20 ou plus recent
- Git
- CocoaPods

Commandes utiles:

```bash
node -v
npm -v
git --version
xcodebuild -version
pod --version
```

Si `pod` n'existe pas:

```bash
sudo gem install cocoapods
```

Ouvre Xcode une premiere fois apres installation. Accepte la licence et installe les composants proposes.

## 2. Recuperer le projet

```bash
cd ~/Desktop
git clone https://github.com/yrhm00/Umade.git
cd Umade
```

Verifier que tu es sur la branche principale:

```bash
git branch --show-current
git status
```

## 3. Installer les dependances JavaScript

```bash
npm ci
```

Controle rapide du projet Expo:

```bash
npx expo-doctor
```

Le resultat attendu est:

```text
17/17 checks passed. No issues detected!
```

## 4. Configurer la DB Supabase

Le projet utilise Supabase via des variables Expo publiques.

Creer le fichier local:

```bash
cp .env.example .env.local
```

Ouvre `.env.local` et renseigne:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Ces valeurs ne sont pas dans GitHub. Il faut les recuperer depuis le projet Supabase ou demander au mainteneur.

Sans `.env.local` correct, l'app peut se lancer, mais login, data, messages, reservations et favoris ne fonctionneront pas correctement.

## 5. Installer les Pods iOS

Le dossier iOS natif est deja present dans le repo. Il faut seulement installer les Pods:

```bash
cd ios
pod install
cd ..
```

Ouvre toujours le workspace, pas le `.xcodeproj`:

```bash
open ios/umade.xcworkspace
```

## 6. Preparer l'iPhone

Sur l'iPhone:

1. Branche l'iPhone au Mac en USB.
2. Accepte `Faire confiance a cet ordinateur`.
3. Active le mode developpeur:
   `Reglages` -> `Confidentialite et securite` -> `Mode developpeur`.
4. Redemarre l'iPhone si iOS le demande.
5. Garde le Mac et l'iPhone sur le meme Wi-Fi.

## 7. Configurer Xcode

Dans Xcode:

1. Ouvre `ios/umade.xcworkspace`.
2. Clique sur le projet `umade`.
3. Selectionne la target `umade`.
4. Va dans `Signing & Capabilities`.
5. Coche `Automatically manage signing`.
6. Choisis ton Apple ID / ta Team.
7. Verifie le bundle identifier.

Bundle identifier actuel:

```text
com.yrhm.umade
```

Si Xcode dit que ce bundle identifier est deja utilise ou inaccessible, remplace-le par un identifiant unique, par exemple:

```text
com.tonnom.umade.dev
```

Avec un compte Apple gratuit, l'app installee sur iPhone expire generalement apres quelques jours. Pour TestFlight/App Store, il faut un compte Apple Developer payant.

## 8. Installer sur iPhone avec Expo CLI

La methode la plus simple:

```bash
npx expo run:ios --device
```
Choisis ton iPhone dans la liste.

Cette commande va:

- compiler l'app avec Xcode
- signer l'app avec ta Team Apple
- installer l'app sur l'iPhone
- demarrer Metro pour le JavaScript

Si iOS bloque l'app au premier lancement:

1. Ouvre `Reglages`.
2. Va dans `General` -> `VPN et gestion de l'appareil`.
3. Selectionne ton certificat developpeur.
4. Appuie sur `Faire confiance`.

## 9. Relancer l'app apres installation

Quand l'app est deja installee sur l'iPhone:

```bash
npx expo start --dev-client --lan
```

Puis ouvre l'app `umade` sur l'iPhone.

Si l'iPhone ne trouve pas Metro:

```bash
npx expo start --dev-client --tunnel
```

## 10. Methode Xcode manuelle

Si la commande Expo echoue mais que les Pods sont installes:

```bash
open ios/umade.xcworkspace
```

Dans Xcode:

1. Selectionne ton iPhone en haut.
2. Selectionne le scheme `umade`.
3. Clique sur `Run`.

Pour une version Release locale:

1. `Product` -> `Scheme` -> `Edit Scheme`.
2. `Run` -> `Build Configuration` -> `Release`.
3. Clique sur `Run`.

## 11. Problemes courants

### Xcode demande d'installer des composants

Ouvre Xcode et accepte l'installation. Si tu vois une erreur `CoreSimulator is out of date`, mets Xcode et les composants iOS a jour:

- `Xcode` -> `Settings` -> `Platforms`
- installe la plateforme iOS disponible
- redemarre Xcode

### Pods en erreur

```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Metro garde un cache casse

```bash
npx expo start --clear --dev-client
```

### L'app ne voit pas Supabase

Verifie `.env.local`:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Puis relance Metro:

```bash
npx expo start --clear --dev-client
```

### Xcode refuse le signing

- Verifie ton Apple ID dans `Xcode` -> `Settings` -> `Accounts`.
- Change le bundle identifier pour un identifiant unique.
- Recoche `Automatically manage signing`.
- Rebranche l'iPhone.

## 12. Commandes resumees

```bash
git clone https://github.com/yrhm00/Umade.git
cd Umade
npm ci
cp .env.example .env.local
npx expo-doctor
cd ios
pod install
cd ..
npx expo run:ios --device
```
