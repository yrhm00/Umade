/**
 * Hauteur du visuel principal d'une inspiration.
 *
 * Partage entre l'ecran de detail et l'animation d'agrandissement : les deux
 * doivent viser exactement le meme cadre, sinon le visuel se decale d'un cran
 * a la fin de la transition.
 */

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Bornes calees sur le rendu Pinterest : une photo tres haute ne doit pas
// condamner tout l'ecran, une photo tres large ne doit pas se reduire a un
// bandeau.
const MAX_HERO_HEIGHT = SCREEN_HEIGHT * 0.72;
const MIN_HERO_HEIGHT = SCREEN_HEIGHT * 0.34;
const DEFAULT_ASPECT_RATIO = 3 / 4;

export const HERO_WIDTH = SCREEN_WIDTH;

/** `aspectRatio` = largeur / hauteur de la photo. */
export function getHeroHeight(aspectRatio: number | null | undefined): number {
  const ratio = aspectRatio && aspectRatio > 0 ? aspectRatio : DEFAULT_ASPECT_RATIO;
  const natural = SCREEN_WIDTH / ratio;
  return Math.round(Math.max(MIN_HERO_HEIGHT, Math.min(natural, MAX_HERO_HEIGHT)));
}
