import { useMemo } from "react";
import { rosaceDuPacte, type Rosace } from "@/domaines/objectifs/logique/rosace";
import "@/domaines/objectifs/sceau.css";

interface Props {
  nom: string;
  /** Les valeurs, dans leur ordre de rang : il grave le sceau. */
  valeurs?: readonly string[];
  /** L avancement du pacte, de 0 a 1. La piste externe le porte. */
  progression?: number;
  /** La version sous laquelle ce pacte a ete jure — « pacts.sigil_version ». */
  version?: number;
  /**
   * L ELAN, de 0 a 1 — a quel rythme le sceau tourne.
   *
   * C est la regle que « PactVisual » a posee pour ce produit : a un,
   * il tourne a sa cadence ; a zero, trois fois plus lentement, presque
   * immobile. Ce n est pas une jauge — on ne lit pas un nombre dans une
   * vitesse. C est un ETAT, qu on sent avant de le lire.
   */
  elan?: number;
  /** Ce que le sceau dit aux lecteurs d ecran. Vide par defaut. */
  alt?: string;
  className?: string;
}

/* Les couronnes. Chaque famille a la sienne, et n en sort pas : c est
   ce qui rend le chevauchement impossible par construction plutot que
   par reglage. Mesure sur la version d avant : douze paires se
   croisaient, les medaillons mordant sur l etoile. */
const R = {
  pointe: 1.03, pointeLong: 0.12,
  piste: 0.955, pisteHaut: 0.995,
  railHaut: 0.9, railBas: 0.69, signes: 0.8,
  construction: 0.6, marques: 0.585, moyeu: 0.36,
  medaillon: 0.47, medaillonRayon: 0.142,
  etoile: 0.345, coeur: 0.175,
} as const;

const DEUX_PI = Math.PI * 2;
const f = (x: number) => x.toFixed(3);
const surLeCercle = (a: number, r: number) => `${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)}`;

/** Un anneau. */
const anneau = (r: number, w: number, o: number, tirets?: string) =>
  `<circle cx="0" cy="0" r="${r}" fill="none" stroke="currentColor" stroke-width="${w}"`
  + ` opacity="${o}" vector-effect="non-scaling-stroke"${tirets ? ` stroke-dasharray="${tirets}"` : ""}/>`;

/** Un segment radial. */
const rayon = (a: number, r1: number, r2: number, w: number, o: number) =>
  `<line x1="${f(Math.cos(a) * r1)}" y1="${f(Math.sin(a) * r1)}" x2="${f(Math.cos(a) * r2)}"`
  + ` y2="${f(Math.sin(a) * r2)}" stroke="currentColor" stroke-width="${w}" opacity="${o}"`
  + ` vector-effect="non-scaling-stroke"/>`;

/** Un losange plein, pose sur un rayon. */
const losange = (a: number, r: number, t: number) => {
  const x = Math.cos(a) * r, y = Math.sin(a) * r;
  return `<path d="M${f(x)} ${f(y - t)} L${f(x + t)} ${f(y)} L${f(x)} ${f(y + t)} L${f(x - t)} ${f(y)} Z"`
    + ` fill="currentColor" opacity=".75"/>`;
};

/** Une pointe cardinale, hors de l anneau de garde. */
const pointe = (a: number) => {
  const c = Math.cos(a), s = Math.sin(a), l = R.pointeLong, w = 0.026;
  const p = Math.cos(a + Math.PI / 2) * w, q = Math.sin(a + Math.PI / 2) * w;
  return `<path d="M${f(c * R.pointe)} ${f(s * R.pointe)}`
    + ` L${f(c * (R.pointe + l * 0.45) + p)} ${f(s * (R.pointe + l * 0.45) + q)}`
    + ` L${f(c * (R.pointe + l))} ${f(s * (R.pointe + l))}`
    + ` L${f(c * (R.pointe + l * 0.45) - p)} ${f(s * (R.pointe + l * 0.45) - q)} Z"`
    + ` fill="currentColor" opacity=".92"/>`;
};

/**
 * LA PISTE DE PROGRESSION, creuse et remplie.
 *
 * Sur le tableau de bord, la rosace prend la place de
 * « singularity-ring » — qui n est pas un ornement mais LA JAUGE
 * d avancement du pacte. Elle la reprend, sans quoi remplacer le rond
 * ferait perdre une information.
 *
 * Le rail vide se voit autant que la part remplie : sans lui, un arc
 * partiel se lit comme un trait rate au lieu d une jauge.
 */
const piste = (part: number) => {
  const creux = anneau(R.piste, 3.4, 0.1);
  if (part <= 0) return creux;
  if (part >= 1) return creux + anneau(R.piste, 3.4, 0.95);
  const a0 = -Math.PI / 2, a1 = a0 + part * DEUX_PI;
  return creux
    + `<path d="M${surLeCercle(a0, R.piste)} A${R.piste} ${R.piste} 0 ${part > 0.5 ? 1 : 0} 1`
    + ` ${surLeCercle(a1, R.piste)}" fill="none" stroke="currentColor" stroke-width="3.4"`
    + ` stroke-linecap="round" opacity=".95" vector-effect="non-scaling-stroke"/>`;
};

/** Un signe, pose a son angle et tourne vers l exterieur. */
const signe = (d: string, x: number, y: number, taille: number, rot: number, w: number, miroir: boolean) =>
  `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(taille)}) translate(-.5 -.5)`
  + `${miroir ? " matrix(-1,0,0,1,1,0)" : ""}"><path d="${d}" fill="none" stroke="currentColor"`
  + ` stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></g>`;

/** Le dessin entier, en une chaine : rien a reconcilier cote React. */
function dessiner(r: Rosace, progression: number): string {
  let out = "";

  /* Les couches externes existent meme sans nom : un cadre qui attend
     vaut mieux qu un vide. */
  const branches = r.branches || 4;
  for (let b = 0; b < branches; b++) out += pointe(-Math.PI / 2 + (b / branches) * DEUX_PI);
  out += anneau(R.pointe, 0.8, 0.28);
  out += piste(progression) + anneau(R.pisteHaut, 0.5, 0.16);
  out += anneau(R.railHaut, 2.2, 0.85) + anneau(R.railBas, 2.2, 0.85) + anneau(R.railBas - 0.015, 0.6, 0.3);

  /* LES GRADUATIONS TOURNENT A L ENVERS de la bande : c est le
     contresens qui fait le mecanisme. Deux couronnes dans le meme sens
     se lisent comme un seul bloc qui pivote. */
  out += `</g><g class="sceau-couche sceau-grad">`;
  for (let i = 0; i < branches * 6; i++) {
    const a = -Math.PI / 2 + (i / (branches * 6)) * DEUX_PI;
    const longue = i % 6 === 0;
    out += rayon(a, R.railHaut, R.railHaut + 0.035, longue ? 1.4 : 0.6, longue ? 0.55 : 0.22);
  }

  /* LA BANDE. La taille des signes suit l arc reellement disponible :
     a huit branches, deux signes par demi-secteur n ont que 0,099
     d arc pour une forme de 0,115 — ils se chevauchaient. */
  out += `</g><g class="sceau-couche sceau-bande">`;
  if (r.bandes.length > 0) {
    const secteur = DEUX_PI / r.branches;
    const parBranche = r.bandes[0].signes.length;
    const taille = Math.min(0.125, ((secteur * 0.5) / (parBranche + 1)) * R.signes * 1.55);
    for (const bande of r.bandes) {
      out += losange(bande.angle, R.railHaut + 0.03, 0.016);
      bande.signes.forEach((d, i) => {
        const ecart = ((i + 1) / (parBranche + 1)) * secteur * 0.5;
        for (const cote of [-1, 1] as const) {
          const a = bande.angle + cote * ecart;
          out += signe(d, Math.cos(a) * R.signes, Math.sin(a) * R.signes, taille,
            (a * 180) / Math.PI + 90, 1.35, cote < 0);
        }
      });
    }
  }

  out += `</g><g class="sceau-couche sceau-moyeu">`;
  out += anneau(R.construction, 0.7, 0.3, ".014 .024") + anneau(0.485, 0.6, 0.22);
  for (let i = 0; i < branches * 4; i++) {
    const a = -Math.PI / 2 + ((i + 0.5) / (branches * 4)) * DEUX_PI;
    out += rayon(a, R.marques, R.marques + 0.03, 0.8, 0.35);
  }
  for (let b = 0; b < branches; b++) {
    const a = -Math.PI / 2 + (b / branches) * DEUX_PI;
    out += rayon(a, R.moyeu, R.railBas, 0.9, 0.26) + losange(a, 0.645, 0.022);
  }
  out += anneau(R.moyeu, 1.3, 0.5);

  /* LES MEDAILLONS NE TOURNENT PAS : leurs signes doivent rester
     droits. Une couronne qui tourne emporte ses signes avec elle. */
  out += `</g><g class="sceau-couche">`;
  if (r.medaillons.length > 0) {
    const pts = r.medaillons.map((m) => surLeCercle(m.angle, R.medaillon).replace(" ", ","));
    for (const m of r.medaillons) {
      const x = Math.cos(m.angle) * R.medaillon, y = Math.sin(m.angle) * R.medaillon;
      out += `<circle cx="${f(x)}" cy="${f(y)}" r="${R.medaillonRayon}" fill="var(--ds-bg-base-solide, #080B12)"`
        + ` stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/>`;
      out += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(R.medaillonRayon * 0.78)}" fill="none"`
        + ` stroke="currentColor" stroke-width=".7" opacity=".5" vector-effect="non-scaling-stroke"/>`;
      out += signe(m.d, x, y, 0.12, 0, 1.8, false);
    }
    if (pts.length > 1) {
      out += `<polygon points="${pts.join(" ")}" fill="none" stroke="currentColor"`
        + ` stroke-width=".9" opacity=".35" vector-effect="non-scaling-stroke"/>`;
    }
  }

  out += `</g><g class="sceau-couche sceau-etoile">`;
  const sommets: string[] = [];
  for (let i = 0; i < branches * 2; i++) {
    const a = -Math.PI / 2 + (i / (branches * 2)) * DEUX_PI;
    sommets.push(surLeCercle(a, i % 2 ? R.etoile * 0.38 : R.etoile).replace(" ", ","));
  }
  out += `<polygon points="${sommets.join(" ")}" fill="currentColor" opacity=".22"/>`
    + `<polygon points="${sommets.join(" ")}" fill="none" stroke="currentColor" stroke-width="2.4"`
    + ` stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
  /* Le coeur reste fixe, comme les medaillons. */
  out += `</g><g class="sceau-couche">`;
  out += `<circle cx="0" cy="0" r="${R.coeur}" fill="var(--ds-bg-base-solide, #080B12)" stroke="currentColor"`
    + ` stroke-width="2" vector-effect="non-scaling-stroke"/>` + anneau(0.135, 0.8, 0.45);
  if (r.coeur) out += signe(r.coeur, 0, 0, 0.19, 0, 2.4, false);

  /* Une seule couche ouverte au depart, une seule fermee a la fin :
     les « </g><g> » intercales decoupent le dessin sans compter. */
  return `<g class="sceau-couche">${out}</g>`;
}

/**
 * LA ROSACE DU PACTE.
 *
 * Le sceau, dessine. La structure vient de « logique/rosace » ; ici on
 * ne fait que la poser sur ses couronnes.
 *
 * IL N EXISTE QU A UN ENDROIT — le tableau de bord, ou il tient la
 * place du rond du heros, et le rite, ou il se forge. Ni la carte
 * d identite, ni la guilde, ni le pantheon : une figure a dix couches
 * devient une tache sur une vignette de liste.
 *
 * LE DESSIN EST UNE CHAINE. Deux cents elements SVG rendus en JSX
 * donneraient deux cents nœuds a reconcilier a chaque battement de la
 * progression ; ici React ne voit qu une propriete qui change.
 */
export function RosaceDuPacte({
  nom, valeurs = [], progression = 0, version, elan = 0.5, alt = "", className,
}: Props) {
  const part = Math.min(1, Math.max(0, progression));
  const dessin = useMemo(
    () => dessiner(rosaceDuPacte(nom, valeurs, version), part),
    [nom, valeurs, version, part],
  );

  /* LES DUREES DESCENDENT DE L ELAN. A un, la bande fait un tour en
     40 s ; a zero, en 120 s — le facteur trois que « PactVisual » a
     pose pour ce produit. Le souffle, lui, suit la progression : un
     pacte qui avance respire plus vite, et de plus loin. */
  const cadence = useMemo(() => {
    const e = Math.min(1, Math.max(0, elan));
    const lent = 3 - e * 2;
    return {
      "--sceau-t-bande": (40 * lent).toFixed(1) + "s",
      "--sceau-t-grad": (70 * lent).toFixed(1) + "s",
      "--sceau-t-moyeu": (95 * lent).toFixed(1) + "s",
      "--sceau-t-etoile": (150 * lent).toFixed(1) + "s",
      "--sceau-t-souffle": (9 - part * 4).toFixed(1) + "s",
      "--sceau-repos": (0.9 - part * 0.28).toFixed(2),
    } as React.CSSProperties;
  }, [elan, part]);

  return (
    <svg
      className={className ? className + " sceau-anime" : "sceau-anime"}
      style={cadence}
      viewBox="-1.2 -1.2 2.4 2.4"
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      dangerouslySetInnerHTML={{ __html: dessin }}
    />
  );
}
