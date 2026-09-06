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
  /**
   * CE QUI EST DEJA JURE, pendant la forge.
   *
   * Le sceau se construisait d un coup, au nom : anneaux nus pendant
   * quatre ecrans, puis la figure entiere d un seul geste. On ne
   * voyait pas ce qu on fabriquait, on le decouvrait a la fin.
   *
   * Chaque declaration revele donc SA couche. Hors du rite — sur le
   * tableau de bord, ou le pacte est complet — tout est revele, et
   * c est le defaut.
   */
  revele?: {
    /** Le signe et la teinte : l etoile et le moyeu. */
    signe?: boolean;
    /** La phrase : les graduations et les marques du dedans. */
    phrase?: boolean;
  };
  /** Ce que le sceau dit aux lecteurs d ecran. Vide par defaut. */
  alt?: string;
  className?: string;
}

/* Les couronnes. Chaque famille a la sienne, et n en sort pas : c est
   ce qui rend le chevauchement impossible par construction plutot que
   par reglage. Mesure sur la version d avant : douze paires se
   croisaient, les medaillons mordant sur l etoile. */
/* L ETOILE EST LA SEULE COUCHE QUI DEBORDAIT, et la seule qui pouvait :
   elle se dessine APRES les medaillons, donc par-dessus, la ou toutes
   les autres passent dessous et sont proprement percees par le disque.

   Mesure : le disque d un medaillon va de 0,328 a 0,612 ; la pointe de
   l etoile etait a 0,345, plus la moitie de son contour de 2,4 px non
   mis a l echelle — soit 0,011 unite. Son bord visible tombait donc a
   0,356 et mordait de 3,0 px dans le disque. Et comme elle TOURNE,
   chacune de ses pointes balayait tour a tour chaque medaillon.

   A 0,29 le bord visible tombe a 0,301 : il reste 2,8 px de garde,
   du meme ordre que l ecart des pointes exterieures. */
const R = {
  pointe: 1.03, pointeLong: 0.11, pointeEcart: 0.026,
  piste: 0.955, pisteHaut: 0.995,
  railHaut: 0.9, railBas: 0.69, signes: 0.8,
  construction: 0.6, marques: 0.585, moyeu: 0.36,
  medaillon: 0.47, medaillonRayon: 0.142,
  etoile: 0.29, etoileTrait: 2.4, coeur: 0.175,
} as const;

/* Reservee a la garde : elle verifie que les couronnes ne se coupent
   pas, plutot que de croire le commentaire qui le promet. */
export const _couronnes = R;

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

/**
 * Une pointe cardinale, POSEE A DISTANCE de l anneau de garde.
 *
 * Son sommet interieur tombait exactement sur « R.pointe », c est-a-dire
 * sur le rayon de l anneau : les deux se touchaient en un point, et la
 * pointe se lisait comme une excroissance du cercle plutot que comme une
 * piece a part. Les deux autres losanges de la figure — celui du rail
 * haut, celui du rail bas — flottaient deja entre leurs couronnes ;
 * seule celle-ci etait collee.
 *
 * L ECART SE COMPTE EN PIXELS RENDUS, pas en unites. Le viewBox fait
 * 2,4 pour un sceau large de 238 px au tableau de bord : une unite vaut
 * donc environ 99 px, et l anneau de garde, en trait non mis a
 * l echelle, ne fait que 0,8 px — soit 0,008 unite. Un ecart de 0,026
 * fait un peu plus de deux pixels et demi : trois fois l epaisseur du
 * trait, assez pour se lire comme un detachement voulu et non comme un
 * defaut de rendu.
 *
 * La longueur passe de 0,12 a 0,11 pour que la silhouette ne grandisse
 * presque pas : la pointe finit a 1,166 au lieu de 1,15, et il reste
 * 0,034 avant le bord du viewBox.
 */
const pointe = (a: number) => {
  const c = Math.cos(a), s = Math.sin(a), l = R.pointeLong, w = 0.026;
  const r0 = R.pointe + R.pointeEcart;
  const p = Math.cos(a + Math.PI / 2) * w, q = Math.sin(a + Math.PI / 2) * w;
  return `<path d="M${f(c * r0)} ${f(s * r0)}`
    + ` L${f(c * (r0 + l * 0.45) + p)} ${f(s * (r0 + l * 0.45) + q)}`
    + ` L${f(c * (r0 + l))} ${f(s * (r0 + l))}`
    + ` L${f(c * (r0 + l * 0.45) - p)} ${f(s * (r0 + l * 0.45) - q)} Z"`
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
/* « avecSigne » et non « signe » : ce dernier est la fonction qui
   dessine un glyphe, et le parametre la masquait. */
function dessiner(r: Rosace, progression: number, avecSigne: boolean, avecPhrase: boolean): string {
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
  /* LES GRADUATIONS VIENNENT AVEC LA PHRASE : c est la gravure. */
  out += `</g><g class="sceau-couche sceau-grad">`;
  if (avecPhrase) {
    for (let i = 0; i < branches * 6; i++) {
      const a = -Math.PI / 2 + (i / (branches * 6)) * DEUX_PI;
      const longue = i % 6 === 0;
      out += rayon(a, R.railHaut, R.railHaut + 0.035, longue ? 1.4 : 0.6, longue ? 0.55 : 0.22);
    }
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
  /* LE MOYEU VIENT AVEC LE SIGNE : c est la charpente qui porte
     l etoile, elle n a pas de raison d exister avant elle. */
  if (avecSigne) {
    out += anneau(R.construction, 0.7, 0.3, ".014 .024") + anneau(0.485, 0.6, 0.22);
    for (let b = 0; b < branches; b++) {
      const a = -Math.PI / 2 + (b / branches) * DEUX_PI;
      out += rayon(a, R.moyeu, R.railBas, 0.9, 0.26) + losange(a, 0.645, 0.022);
    }
    out += anneau(R.moyeu, 1.3, 0.5);
  }
  if (avecPhrase) {
    for (let i = 0; i < branches * 4; i++) {
      const a = -Math.PI / 2 + ((i + 0.5) / (branches * 4)) * DEUX_PI;
      out += rayon(a, R.marques, R.marques + 0.03, 0.8, 0.35);
    }
  }

  /* LE TROU EST CELUI DE LA PAGE, PAS UN NOIR ECRIT EN DUR.
     Les deux disques perces — medaillons et coeur — se remplissaient
     de « var(--ds-bg-base-solide, #080B12) ». Ce jeton n existe nulle
     part dans le depot : c est donc toujours le repli qui servait, un
     quasi-noir fixe. En theme clair, sur un fond a 249/248/246, chaque
     medaillon devenait une pastille noire. « --ds-bg-base » existe,
     lui, et change avec le theme.

     LES MEDAILLONS NE TOURNENT PAS : leurs signes doivent rester
     droits. Une couronne qui tourne emporte ses signes avec elle.
     La couche est nommee : elle ne tourne pas, mais on doit pouvoir la
     designer — au style comme a la mesure. */
  out += `</g><g class="sceau-couche sceau-medaillons">`;
  if (r.medaillons.length > 0) {
    const pts = r.medaillons.map((m) => surLeCercle(m.angle, R.medaillon).replace(" ", ","));
    for (const m of r.medaillons) {
      const x = Math.cos(m.angle) * R.medaillon, y = Math.sin(m.angle) * R.medaillon;
      out += `<circle cx="${f(x)}" cy="${f(y)}" r="${R.medaillonRayon}" fill="hsl(var(--ds-bg-base, 220 50% 4%))"`
        + ` stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/>`;
      out += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(R.medaillonRayon * 0.78)}" fill="none"`
        + ` stroke="currentColor" stroke-width=".7" opacity=".5" vector-effect="non-scaling-stroke"/>`;
      /* UN IDEOGRAMME DEMANDE PLUS DE PLACE QU UNE LETTRE. Les
         medaillons de la v3 portent un caractere de quatre a douze
         traits, la ou les versions precedentes posaient un signe de
         deux ou trois. A 0,12 il devenait une tache : le signe
         n occupait que 12,7 px dans un anneau qui en offre 23,4. A
         0,185 la boite dessinee fait 13,7 px pour une diagonale de
         19,3 px — il reste 4 px de garde avant l anneau. Le trait
         s affine d autant, sans quoi trois barres se toucheraient. */
      const denses = r.version >= 3;
      out += signe(m.d, x, y, denses ? 0.185 : 0.12, 0, denses ? 1.5 : 1.8, false);
    }
    if (pts.length > 1) {
      out += `<polygon points="${pts.join(" ")}" fill="none" stroke="currentColor"`
        + ` stroke-width=".9" opacity=".35" vector-effect="non-scaling-stroke"/>`;
    }
  }

  /* L ETOILE VIENT AVEC LE SIGNE. Elle etait la des le premier ecran,
     avant qu on ait rien choisi : la figure centrale d un pacte qui
     n existait pas encore. */
  out += `</g><g class="sceau-couche sceau-etoile">`;
  const sommets: string[] = [];
  for (let i = 0; i < branches * 2; i++) {
    const a = -Math.PI / 2 + (i / (branches * 2)) * DEUX_PI;
    sommets.push(surLeCercle(a, i % 2 ? R.etoile * 0.38 : R.etoile).replace(" ", ","));
  }
  if (avecSigne) {
    out += `<polygon points="${sommets.join(" ")}" fill="currentColor" opacity=".22"/>`
      + `<polygon points="${sommets.join(" ")}" fill="none" stroke="currentColor" stroke-width="${R.etoileTrait}"`
      + ` stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
  }
  /* Le coeur reste fixe, comme les medaillons. */
  out += `</g><g class="sceau-couche sceau-coeur">`;
  if (avecSigne) {
    out += `<circle cx="0" cy="0" r="${R.coeur}" fill="hsl(var(--ds-bg-base, 220 50% 4%))" stroke="currentColor"`
      + ` stroke-width="2" vector-effect="non-scaling-stroke"/>` + anneau(0.135, 0.8, 0.45);
  }
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
  nom, valeurs = [], progression = 0, version, elan = 0.5, revele, alt = "", className,
}: Props) {
  /* Hors du rite, tout est deja jure : on revele tout. */
  const avecSigne = revele?.signe ?? true;
  const avecPhrase = revele?.phrase ?? true;
  const part = Math.min(1, Math.max(0, progression));
  const dessin = useMemo(
    () => dessiner(rosaceDuPacte(nom, valeurs, version), part, avecSigne, avecPhrase),
    [nom, valeurs, version, part, avecSigne, avecPhrase],
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
