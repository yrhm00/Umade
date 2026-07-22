#!/usr/bin/env node
/**
 * Vérifie les réglages iOS que `expo prebuild` a tendance à écraser.
 *
 * Chacun de ces points a déjà cassé un build ou une soumission :
 * lancer ce script juste après un prebuild évite de les redécouvrir
 * au pire moment.
 *
 *   npm run check-ios
 *
 * Sort en code 1 si un contrôle bloquant échoue (utilisable en CI).
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const ENTITLEMENTS = join(ROOT, 'ios/umade/umade.entitlements');
const INFO_PLIST = join(ROOT, 'ios/umade/Info.plist');
const APP_JSON = join(ROOT, 'app.json');

const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

let failures = 0;
let warnings = 0;

function pass(label) {
  console.log(`${c.green('✓')} ${label}`);
}
function fail(label, fix) {
  failures++;
  console.log(`${c.red('✗')} ${label}`);
  console.log(`  ${c.dim('→ ' + fix)}`);
}
function warn(label, fix) {
  warnings++;
  console.log(`${c.yellow('!')} ${label}`);
  console.log(`  ${c.dim('→ ' + fix)}`);
}

function read(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
}

console.log(c.bold('\nVérification des réglages iOS\n'));

// ─────────────────────────────────────────────────────────────
// 1. Entitlements : aps-environment casse la signature en compte
//    Apple gratuit (Personal Team ne supporte pas les push).
// ─────────────────────────────────────────────────────────────
const entitlements = read(ENTITLEMENTS);
if (entitlements === null) {
  warn(
    'umade.entitlements introuvable',
    'Normal si le dossier ios/ n\'a pas encore été généré (npx expo prebuild -p ios).'
  );
} else if (entitlements.includes('aps-environment')) {
  fail(
    'aps-environment présent dans umade.entitlements',
    'Le prebuild l\'a réintroduit. Videz le <dict> de ios/umade/umade.entitlements, ' +
      'sinon la signature échoue avec un compte Apple gratuit.'
  );
} else {
  pass('Entitlements sans aps-environment (signature compte gratuit OK)');
}

// ─────────────────────────────────────────────────────────────
// 2. Info.plist : conformité export + descriptions de permissions
// ─────────────────────────────────────────────────────────────
const plist = read(INFO_PLIST);
if (plist === null) {
  warn('Info.plist introuvable', 'Générez le dossier natif : npx expo prebuild -p ios');
} else {
  if (plist.includes('ITSAppUsesNonExemptEncryption')) {
    pass('ITSAppUsesNonExemptEncryption présent (pas de question export à chaque envoi)');
  } else {
    fail(
      'ITSAppUsesNonExemptEncryption absent de Info.plist',
      'Ajoutez <key>ITSAppUsesNonExemptEncryption</key><false/> dans le <dict>.'
    );
  }

  // Apple rejette les textes génériques type "Allow $(PRODUCT_NAME) to..."
  const placeholders = plist.match(/<string>Allow \$\(PRODUCT_NAME\)[^<]*<\/string>/g);
  if (placeholders) {
    fail(
      `${placeholders.length} description(s) de permission encore générique(s)`,
      'Le prebuild a remis les textes par défaut. Réécrivez les NS*UsageDescription ' +
        'en expliquant POURQUOI la permission est demandée — Apple rejette sinon.'
    );
  } else {
    pass('Descriptions de permissions personnalisées');
  }

  if (plist.includes('<string>Umade</string>')) {
    pass('CFBundleDisplayName = Umade');
  } else {
    warn(
      'CFBundleDisplayName ne vaut pas "Umade"',
      'Le nom sous l\'icône iPhone repartirait en minuscules.'
    );
  }
}

// ─────────────────────────────────────────────────────────────
// 3. app.json : l'URL des updates OTA doit viser le bon projet EAS.
//    Une coquille ici est silencieuse — les updates partent dans le vide.
// ─────────────────────────────────────────────────────────────
const appJsonRaw = read(APP_JSON);
if (appJsonRaw === null) {
  fail('app.json introuvable', 'Lancez le script depuis la racine du projet.');
} else {
  const { expo } = JSON.parse(appJsonRaw);
  const projectId = expo?.extra?.eas?.projectId ?? null;
  const updatesUrl = expo?.updates?.url ?? null;

  if (!projectId) {
    warn('Aucun projectId EAS dans app.json', 'Lancez : npx eas-cli init');
  } else if (!updatesUrl) {
    warn('Aucune URL updates dans app.json', 'Les mises à jour OTA sont désactivées.');
  } else if (updatesUrl.includes(projectId)) {
    pass('URL des updates OTA alignée sur le projectId EAS');
  } else {
    fail(
      'updates.url ne correspond PAS au projectId EAS',
      `Les updates partiraient vers un projet inexistant.\n     projectId : ${projectId}\n     updates   : ${updatesUrl}`
    );
  }
}

// ─────────────────────────────────────────────────────────────
console.log('');
if (failures > 0) {
  console.log(c.red(c.bold(`${failures} problème(s) bloquant(s)`)) + (warnings ? c.dim(` · ${warnings} avertissement(s)`) : ''));
  console.log(c.dim('Corrigez avant de builder ou de soumettre.\n'));
  process.exit(1);
}
console.log(
  c.green(c.bold('Tout est bon')) + (warnings ? c.dim(` · ${warnings} avertissement(s)`) : '')
);
console.log('');
