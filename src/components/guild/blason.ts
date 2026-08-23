import {
  Anchor, Bird, Compass, Crown, Eye, Feather, Flame, Gem, Hexagon,
  Infinity as Infini, Leaf, Moon, Mountain, Orbit, Shield, Skull,
  Sparkles, Star, Sun, Swords, Target, Triangle, Users, Waves, Zap,
} from "lucide-react";

/* LE BLASON D UNE GUILDE : EMBLEME ET COULEUR.
 *
 * Cette liste existait EN DEUX EXEMPLAIRES — dans GuildCreateModal et
 * dans GuildSettingsPage — avec trois emblemes chacun : bouclier,
 * couronne, personnes. Deux copies d une liste de trois, c est deux
 * occasions de diverger pour trois choix.
 *
 * Une seule definition, deux consommateurs, et de quoi choisir.
 *
 * LA COULEUR ETAIT UN NOM, PAS UNE COULEUR. La base gardait
 * « violet », « emerald », « amber », « rose », « cyan », et la page
 * les injectait dans du CSS. Or trois de ces cinq mots ne sont pas des
 * couleurs CSS : le navigateur rejetait la declaration et le blason
 * heritait de la couleur du texte. Trois choix sur cinq ne faisaient
 * rien du tout. On garde des hexadecimaux. */

export const EMBLEMES = {
  shield: Shield, crown: Crown, swords: Swords, users: Users,
  flame: Flame, gem: Gem, star: Star, zap: Zap,
  skull: Skull, eye: Eye, moon: Moon, sun: Sun,
  mountain: Mountain, waves: Waves, leaf: Leaf, feather: Feather,
  bird: Bird, anchor: Anchor, compass: Compass, orbit: Orbit,
  hexagon: Hexagon, triangle: Triangle, target: Target,
  infinity: Infini, sparkles: Sparkles,
} as const;

export type CleEmbleme = keyof typeof EMBLEMES;

export const CLES_EMBLEMES = Object.keys(EMBLEMES) as CleEmbleme[];

/* Le repli est explicite, et il arrive AVANT l indexation : guilds.icon
   est nullable, et « EMBLEMES[guilde.icon] || Shield » indexait d abord
   par null. */
export function emblemeDe(cle: string | null | undefined) {
  return (cle && EMBLEMES[cle as CleEmbleme]) || Shield;
}

/** Les teintes proposees. Rien n empeche d en choisir une autre. */
export const TEINTES = [
  "#8B72FF", // violet — l accent du produit
  "#4CC9F0", // cyan
  "#35C98A", // vert
  "#E0A340", // ambre
  "#F0567E", // rose
  "#FF7A45", // orange
  "#E9EBEE", // clair
  "#7B848F", // gris
] as const;

export const TEINTE_PAR_DEFAUT = TEINTES[0];

const HEXADECIMAL = /^#[0-9A-Fa-f]{6}$/;

/** Une couleur utilisable, ou celle par defaut. La base impose la meme
 *  forme : mieux vaut ne pas lui envoyer ce qu elle refusera. */
export function teinteDe(valeur: string | null | undefined): string {
  return valeur && HEXADECIMAL.test(valeur) ? valeur : TEINTE_PAR_DEFAUT;
}

export function estUneTeinte(valeur: string): boolean {
  return HEXADECIMAL.test(valeur);
}
