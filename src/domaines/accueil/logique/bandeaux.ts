/* CE QUE LES VARIANTES DU BANDEAU CALCULENT.
 *
 * Six variantes de la carte principale, une seule table de calculs :
 * les chiffres romains de la stele, la zone lisible par machine de la
 * piece d identite, la taille d un nom qui peut compter cinquante
 * caracteres. Rien de tout cela n a besoin de React. */

const ROMAINS: readonly [number, string][] = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
  [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

/** 91 → « XCI ». Au-dela de 3 999, la numeration romaine n a plus de
 *  signe ; on rend alors le nombre tel quel, plutot que d inventer. */
export function romain(n: number): string {
  const entier = Math.floor(n);
  if (entier <= 0 || entier > 3999) return String(entier);
  let reste = entier;
  let sortie = "";
  for (const [valeur, signe] of ROMAINS) {
    while (reste >= valeur) {
      sortie += signe;
      reste -= valeur;
    }
  }
  return sortie;
}

/** Les accents retires, pour un alphabet de machine. */
export function sansAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Une ligne de zone lisible par machine : capitales sans accent, tout
 *  ce qui n est ni lettre ni chiffre devient « < », a longueur fixe. */
export function ligneLisible(champs: readonly string[], longueur = 44): string {
  const corps = champs
    .map((c) => sansAccents(c).toUpperCase().replace(/[^A-Z0-9]+/g, "<").replace(/^<+|<+$/g, ""))
    .join("<<");
  return corps.padEnd(longueur, "<").slice(0, longueur);
}

/** Un nombre a largeur fixe, complete de zeros : 91 → « 0091 ». */
export function aLargeur(n: number, largeur: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(largeur, "0").slice(-largeur);
}

/**
 * Le facteur de taille d un nom, de 1 (court) a 0,34 (cinquante signes).
 *
 * Un nom de pacte va de trois lettres a cinquante. Le meme corps pour
 * les deux ferait deborder l un ou perdre l autre. On compte en
 * « largeur d affiche » : au-dela de huit signes, la taille baisse comme
 * l inverse de la longueur, pour que le nom tienne toujours sa ligne.
 */
export function facteurDuNom(nom: string): number {
  const n = Math.max(1, [...nom.trim()].length);
  return Math.max(0.34, Math.min(1, 8 / n));
}

/**
 * Le chiffre de controle des documents de voyage (OACI, Doc 9303).
 *
 * Poids 7, 3, 1 repetes ; les chiffres valent eux-memes, A vaut 10 et
 * Z 35, le chevron vaut zero ; on garde l unite de la somme. C est le
 * vrai calcul : une piece d identite dont la zone ne se verifie pas
 * serait un decor de plus. */
export function chiffreDeControle(s: string): string {
  const POIDS = [7, 3, 1];
  let somme = 0;
  [...s].forEach((c, i) => {
    const v = c >= "0" && c <= "9" ? c.charCodeAt(0) - 48
      : c >= "A" && c <= "Z" ? c.charCodeAt(0) - 55
      : 0;
    somme += v * POIDS[i % 3];
  });
  return String(somme % 10);
}

/** « 2026-06-24 » → « 260624 ». Un jour absent s ecrit en chevrons,
 *  comme une date inconnue sur un document. */
function jourCompact(jour: string | null | undefined): string {
  return jour && /^\d{4}-\d{2}-\d{2}$/.test(jour) ? jour.slice(2).replace(/-/g, "") : "<<<<<<";
}

export interface ChampsDeLaZone {
  /** Neuf signes : le numero du document. */
  numero: string;
  /** Jours civils « AAAA-MM-JJ ». */
  jureLe?: string | null;
  terme?: string | null;
  nom: string;
  valeurs: readonly string[];
  niveau: number;
  missions: number;
  jours: number;
  progression: number;
  rang?: string;
}

/**
 * La zone lisible par machine d une carte au format ID-1 : trois lignes
 * de trente signes, comme une carte d identite.
 *
 *   1. type, emetteur « OVW », numero et son controle, puis les
 *      nombres du pacte a largeur fixe ;
 *   2. le jour du serment, l echeance, chacun avec son controle, le
 *      rang, et le controle composite ;
 *   3. le nom, puis les valeurs, la ou une carte met les prenoms.
 */
export function zoneLisible(c: ChampsDeLaZone): [string, string, string] {
  const numero = ligneLisible([c.numero], 9);
  const nombres = aLargeur(c.niveau, 3) + aLargeur(c.missions, 4) + aLargeur(c.jours, 4)
    + aLargeur(Math.round(c.progression), 3);
  const un = ("I<OVW" + numero + chiffreDeControle(numero) + nombres).padEnd(30, "<").slice(0, 30);

  const debut = jourCompact(c.jureLe);
  const fin = jourCompact(c.terme);
  const rang = ligneLisible([c.rang ?? ""], 11);
  const controle = (s: string) => (s.includes("<") ? "<" : chiffreDeControle(s));
  const sansComposite = debut + controle(debut) + "<" + fin + controle(fin) + "OVW" + rang;
  const composite = chiffreDeControle(un.slice(5) + sansComposite.slice(0, 7) + sansComposite.slice(8, 15) + rang);
  const deux = sansComposite + composite;

  const trois = ligneLisible([c.nom, c.valeurs.join(" ")], 30);
  return [un, deux, trois];
}

/** « Tenir ce qui est juré » → « TENIR·CE·QUI·EST·JURÉ » : les
 *  inscriptions romaines separaient les mots d un point a mi-hauteur. */
export function interponctuer(texte: string): string {
  return texte.trim().toLocaleUpperCase("fr-FR").split(/\s+/).filter(Boolean).join("·");
}
