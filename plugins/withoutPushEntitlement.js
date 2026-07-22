/**
 * Retire `aps-environment` des entitlements iOS.
 *
 * expo-notifications ajoute cette clé à chaque prebuild — et `expo run:ios`
 * déclenche un prebuild avant de compiler. Éditer le fichier généré à la main
 * ne tient donc jamais : il est réécrit juste après.
 *
 * Un compte Apple gratuit (Personal Team) ne supporte pas la capability
 * Push Notifications : la présence de cette clé fait échouer la création du
 * profil de provisioning, donc tout le build.
 *
 * À SUPPRIMER le jour où le compte Apple Developer payant (99 $/an) est actif
 * et où les push doivent réellement fonctionner.
 */

const { withEntitlementsPlist } = require('@expo/config-plugins');

module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (cfg) => {
    delete cfg.modResults['aps-environment'];
    return cfg;
  });
};
