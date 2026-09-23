/* LES PROPOSITIONS DE FOND DU TABLEAU DE BORD.
 *
 * Le fond actuel est un empilement de degrades et de quatre couches
 * d etoiles en CSS. Il tient, mais il ne dit rien du pacte : c est le
 * meme ciel pour tout le monde, et PRODUCT.md promet l inverse — « le
 * tableau de bord porte sa teinte ».
 *
 * Huit remplacants, chacun avec son idee, sa raison et son cout. Ils se
 * comparent sur le banc `/banc/fond`, derriere le vrai bandeau, dans
 * les six teintes du pacte.
 *
 * UNE CONTRAINTE LES TIENT TOUS : l accueil pose des panneaux OPAQUES
 * (`--nexus-bg`) sur une colonne de 1 024 px. Le fond ne se voit que
 * dans les marges et entre les sections. Chaque proposition vit donc
 * sur les bords et se tait au centre.
 */

export type IdDuFond =
  | "actuel" | "nebuleuse" | "horizon" | "constellation" | "derive"
  | "aurore" | "orbite" | "essaim" | "atlas";

export interface PropositionDeFond {
  id: IdDuFond;
  nom: string;
  /** Ce que l on voit, en une phrase. */
  idee: string;
  /** Pourquoi ce fond appartient a Overwrite plutot qu a n importe qui. */
  pourquoi: string;
  /** Ce qui le fait tourner. */
  technique: string;
  /** Images par seconde au plus. Un mouvement lent n a pas besoin de 60. */
  cadence: number;
  /** Tient-il aussi en theme clair ? */
  jour: boolean;
}

export const PROPOSITIONS: readonly PropositionDeFond[] = [
  {
    id: "actuel",
    nom: "Actuel",
    idee: "Le fond d’aujourd’hui : six dégradés, une bande galactique, quatre couches d’étoiles.",
    pourquoi: "La référence. Tout le reste se mesure à lui.",
    technique: "CSS · parallaxe au défilement · aucune image calculée",
    cadence: 0,
    jour: true,
  },
  {
    id: "nebuleuse",
    nom: "Nébuleuse",
    idee: "Un nuage de gaz qui se replie lentement sur lui-même, dans la teinte de ton pacte.",
    pourquoi: "Le fond actuel, mais vivant : la même promesse d’espace, sans les taches de dégradé.",
    technique: "Shader WebGL · bruit fractal à domaine déformé · plafonné à 30 images/s",
    cadence: 30,
    jour: false,
  },
  {
    id: "horizon",
    nom: "Horizon",
    idee: "Un trou noir sur la droite. La lumière des étoiles, et celle de son propre disque, se courbe autour de lui.",
    pourquoi: "Le vortex est l’un des neuf symboles du pacte. Ici, il existe vraiment.",
    technique: "Shader WebGL · lentille gravitationnelle par pixel · disque d’accrétion à effet Doppler, et son image courbée",
    cadence: 30,
    jour: false,
  },
  {
    id: "constellation",
    nom: "Constellation",
    idee: "Ton sceau tracé dans le ciel. Il s’allume trait par trait, à mesure que tes objectifs s’accomplissent.",
    pourquoi: "Le seul fond qui ne peut appartenir à personne d’autre : il se lit dans la géométrie de ton pacte.",
    technique: "Canvas 2D · géométrie de rosaceDuPacte · champ d’étoiles précalculé",
    cadence: 30,
    jour: false,
  },
  {
    id: "derive",
    nom: "Dérive",
    idee: "Des étoiles qui viennent vers toi, lentement. Défile vite : elles s’étirent.",
    pourquoi: "Le tableau de bord devient un vaisseau en route, et ta vitesse de lecture devient la sienne.",
    technique: "WebGL · 6 000 traits en perspective · vitesse couplée au défilement",
    cadence: 60,
    jour: false,
  },
  {
    id: "aurore",
    nom: "Aurore",
    idee: "Des rideaux de lumière qui ondulent au-dessus du contenu.",
    pourquoi: "Le plus calme des huit. Pour une personne qui se remet en ordre, pas pour un combat.",
    technique: "Shader WebGL · trois rideaux · rayons verticaux · lumière qui dérive le long des plis",
    cadence: 30,
    jour: false,
  },
  {
    id: "orbite",
    nom: "Orbite",
    idee: "La face nocturne d’une planète au bas de l’écran : villes allumées, atmosphère dans ta teinte.",
    pourquoi: "Le cyberpunk sans néon : des mégapoles vues de haut, et toi au-dessus.",
    technique: "Shader WebGL · sphère éclairée · continents et lumières procédurales",
    cadence: 30,
    jour: false,
  },
  {
    id: "essaim",
    nom: "Essaim",
    idee: "Une galaxie spirale de soixante mille étoiles. Le pointeur la creuse.",
    pourquoi: "La démonstration de force : la carte graphique calcule chaque étoile, le processeur aucune.",
    technique: "WebGL · 62 500 points · orbites dans le vertex shader · aucune donnée envoyée par image",
    cadence: 60,
    jour: false,
  },
  {
    id: "atlas",
    nom: "Atlas",
    idee: "Une carte du ciel gravée : coordonnées, écliptique, numéros de catalogue, et ton sceau.",
    pourquoi: "Le seul qui vit aussi de jour : encre sur papier en thème clair, lumière sur noir la nuit.",
    technique: "Canvas 2D · projection polaire · une seule gravure, tournée",
    cadence: 12,
    jour: true,
  },
];

/* Les six teintes du pacte, telles que le rite les propose
   (`onboarding/logique/gabarits.ts`, TEINTE). Recopiees ici : la porte
   de l onboarding ne les exporte pas, et six couleurs ne valent pas une
   dependance entre domaines. */
export const TEINTES_DU_PACTE: Readonly<Record<string, string>> = {
  amber: "#F59E0B",
  rose: "#F43F5E",
  emerald: "#10B981",
  sky: "#0EA5E9",
  violet: "#8B5CF6",
  cyan: "#06B6D4",
};

/** Une couleur hexadecimale en composantes de 0 a 1, pour un shader. */
export function composantes(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return [0.55, 0.36, 0.96];
  return [m[1], m[2], m[3]].map((c) => parseInt(c, 16) / 255) as [number, number, number];
}

/** La proposition suivante ou precedente, en boucle. */
export function voisine(id: IdDuFond, sens: 1 | -1): IdDuFond {
  const i = PROPOSITIONS.findIndex((p) => p.id === id);
  const n = PROPOSITIONS.length;
  return PROPOSITIONS[(((i < 0 ? 0 : i) + sens) % n + n) % n].id;
}
