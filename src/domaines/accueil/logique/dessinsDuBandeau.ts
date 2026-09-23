/* CE QUE LES VARIANTES DU BANDEAU DESSINENT A PARTIR DU NOM.
 *
 * La couronne de l eclipse, la ligne d horizon du plan large, les
 * guillochis de la piece d identite, le numero du document : tout est
 * TIRE DU NOM, par un tirage reproductible. Meme pacte, meme dessin,
 * a chaque chargement et sur chaque appareil — la regle que le sceau a
 * posee pour ce produit. Un decor qui change a chaque visite serait du
 * bruit ; un decor qui ne depend que du nom est une signature. */

/** FNV-1a sur 32 bits : un nombre stable pour un texte. */
export function graineDuTexte(texte: string): number {
  let h = 0x811c9dc5;
  for (const c of texte) {
    h ^= c.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Un tirage reproductible (mulberry32), de 0 inclus a 1 exclu. */
export function tirage(graine: number): () => number {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Neuf signes, lettres et chiffres, tires du nom : le numero du
 *  document. Sans O ni I, qu une machine confond avec 0 et 1. */
export function numeroDuDocument(nom: string): string {
  const SIGNES = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const hasard = tirage(graineDuTexte("piece:" + nom.trim().toLowerCase()));
  let s = "";
  for (let i = 0; i < 9; i++) s += SIGNES[Math.floor(hasard() * SIGNES.length)];
  return s;
}

export interface RayonDeCouronne {
  /** En degres, de 0 a 360. */
  angle: number;
  /** Longueur au-dela du disque, en rayons du disque. */
  longueur: number;
  /** Epaisseur relative, de 0,4 a 1,6. */
  epaisseur: number;
  opacite: number;
}

/**
 * Les jets de la couronne solaire.
 *
 * Une vraie couronne n est pas un halo rond : elle porte des jets plus
 * longs pres de l equateur (les « casques ») et des aigrettes courtes
 * aux poles. Le biais en cosinus au cube reproduit cette forme ; le
 * tirage du nom decide du reste.
 */
export function rayonsDeLaCouronne(nom: string, nombre = 96): RayonDeCouronne[] {
  const hasard = tirage(graineDuTexte("couronne:" + nom));
  const rayons: RayonDeCouronne[] = [];
  for (let i = 0; i < nombre; i++) {
    const angle = (i / nombre) * 360 + (hasard() - 0.5) * (360 / nombre);
    const equateur = Math.abs(Math.cos((angle * Math.PI) / 180)) ** 3;
    rayons.push({
      angle,
      longueur: 0.18 + hasard() * 0.5 + equateur * 0.9 * hasard(),
      epaisseur: 0.4 + hasard() * 1.2,
      opacite: 0.25 + hasard() * 0.65,
    });
  }
  return rayons;
}

export interface Immeuble {
  x: number;
  largeur: number;
  /** De 0 a 1, en part de la hauteur de la bande. */
  hauteur: number;
  /** Une antenne, en part de la hauteur, ou zero. */
  antenne: number;
}

/** La ligne d horizon du pacte : des immeubles tires du nom, sur une
 *  bande de « largeur » unites. Quelques tours, beaucoup de bas. */
export function silhouetteDeVille(nom: string, largeur = 1000): Immeuble[] {
  const hasard = tirage(graineDuTexte("ville:" + nom));
  const immeubles: Immeuble[] = [];
  let x = 0;
  while (x < largeur) {
    const tour = hasard() < 0.14;
    const l = 14 + hasard() * (tour ? 22 : 38);
    const hauteur = tour ? 0.55 + hasard() * 0.33 : 0.14 + hasard() * 0.36;
    /* L antenne ne sort jamais de la bande : elle serait coupee net. */
    const antenne = tour && hasard() < 0.6 ? Math.min(1 - hauteur, 0.06 + hasard() * 0.12) : 0;
    immeubles.push({ x, largeur: Math.min(l, largeur - x), hauteur, antenne });
    x += l;
  }
  return immeubles;
}

/** Le chemin SVG de la silhouette, dans une boite « largeur × hauteur ». */
export function cheminDeLaVille(immeubles: readonly Immeuble[], largeur = 1000, hauteur = 100): string {
  const f = (n: number) => n.toFixed(1);
  const points = [`M0 ${hauteur}`];
  for (const im of immeubles) {
    const haut = hauteur - im.hauteur * hauteur;
    points.push(`L${f(im.x)} ${f(haut)}`);
    if (im.antenne) {
      const milieu = im.x + im.largeur / 2;
      const pointe = haut - im.antenne * hauteur;
      points.push(
        `L${f(milieu - 0.8)} ${f(haut)}`, `L${f(milieu - 0.8)} ${f(pointe)}`,
        `L${f(milieu + 0.8)} ${f(pointe)}`, `L${f(milieu + 0.8)} ${f(haut)}`,
      );
    }
    points.push(`L${f(im.x + im.largeur)} ${f(haut)}`);
  }
  points.push(`L${largeur} ${hauteur} Z`);
  return points.join(" ");
}

/** Les fenetres allumees : peu nombreuses, tirees elles aussi. */
export function fenetres(immeubles: readonly Immeuble[], nom: string, hauteur = 100): { x: number; y: number }[] {
  const hasard = tirage(graineDuTexte("fenetres:" + nom));
  const sortie: { x: number; y: number }[] = [];
  for (const im of immeubles) {
    const haut = hauteur - im.hauteur * hauteur;
    for (let y = haut + 4; y < hauteur - 3; y += 5) {
      for (let x = im.x + 3; x < im.x + im.largeur - 3; x += 5) {
        if (hasard() < 0.07) sortie.push({ x, y });
      }
    }
  }
  return sortie;
}

/**
 * Un guillochis : l hypotrochoide que tracent les tours a guillocher
 * des graveurs de billets. Un cercle de rayon r roule dans un cercle de
 * rayon R, et un point a la distance d de son centre dessine la rosace.
 *
 * R et r sont entiers : la courbe se referme apres r / pgcd(R, r) tours.
 */
export function guilloche(R: number, r: number, d: number, pasParTour = 96): string {
  const pgcd = (a: number, b: number): number => (b ? pgcd(b, a % b) : a);
  const tours = r / pgcd(R, r);
  const k = (R - r) / r;
  const n = Math.round(pasParTour * tours);
  let chemin = "";
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * tours * 2 * Math.PI;
    const x = (R - r) * Math.cos(t) + d * Math.cos(k * t);
    const y = (R - r) * Math.sin(t) - d * Math.sin(k * t);
    chemin += (i ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
  }
  return chemin + "Z";
}

/** Des ondes paralleles dephasees : la bande de securite d un billet.
 *  Chacune est un chemin qui traverse la « largeur » de part en part. */
export function ondes(nombre: number, largeur: number, hauteur: number, periode: number, amplitude: number): string[] {
  const lignes: string[] = [];
  for (let j = 0; j < nombre; j++) {
    const base = (hauteur / (nombre + 1)) * (j + 1);
    const phase = (j / nombre) * Math.PI * 2;
    let d = "";
    for (let x = 0; x <= largeur; x += 4) {
      const y = base + amplitude * Math.sin((x / periode) * Math.PI * 2 + phase);
      d += (x ? "L" : "M") + x + " " + y.toFixed(2);
    }
    lignes.push(d);
  }
  return lignes;
}
