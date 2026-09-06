import { useMemo } from "react";
import { rosaceDuPacte, ORDRE_PAR_DEFAUT, type Rosace } from "@/domaines/objectifs/logique/rosace";
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
    /** Le signe : le polygone et le centre. */
    signe?: boolean;
    /** La phrase : la couronne de graduations. */
    phrase?: boolean;
  };
  /** Ce que le sceau dit aux lecteurs d ecran. Vide par defaut. */
  alt?: string;
  className?: string;
}

/* ═══ LES COURONNES ═══
 *
 * Chaque famille a la sienne et n en sort pas : c est ce qui rend le
 * chevauchement impossible par construction plutot que par reglage.
 * Un test le mesure — la promesse en prose n avait pas suffi, l etoile
 * de la figure precedente mordait de trois pixels sur les medaillons.
 *
 * LA FIGURE SE LIT DE L EXTERIEUR VERS LE CENTRE :
 *
 *   1,166 .. 1,056   les pointes cardinales, detachees
 *   1,03             l anneau de garde
 *   1,005            la piste — la jauge d avancement
 *   0,920            l inscription : le nom, lettre a lettre
 *   0,845 / 0,83     le filet double qui ferme l inscription
 *   0,70             le polygone etoile, et ses medaillons aux sommets
 *   0,56 / 0,43      le filet double du champ interieur
 *   0,50             les graduations
 *   0,34 / 0,305     le centre — la monture du logo, et rien d autre
 *
 * LES GARDES SE COMPTENT EN PIXELS RENDUS. Le premier reglage tenait
 * l inscription a 0,955 pour une lettre de 0,115 : elle mordait sur la
 * piste ET sur son filet, et les medaillons, poses a 0,80, remontaient
 * jusque dans la bande des lettres. Ici chaque famille garde deux
 * pixels au moins de ses voisines, sur un sceau de 253 px :
 *
 *   lettre / piste           2,0 px
 *   lettre / filet           2,0 px
 *   medaillon / lettre       4,9 px
 *   medaillon / filet bas    1,7 px
 *   centre / logo            3,9 px
 */
const R = {
  pointe: 1.03, pointeLong: 0.11, pointeEcart: 0.026,
  garde: 1.03, piste: 1.005,
  filetHaut: 0.845, filetHautDeux: 0.83,
  inscription: 0.92, lettre: 0.1,
  polygone: 0.7, medaillonRayon: 0.115,
  graduations: 0.5,
  filetBas: 0.56, filetBasDeux: 0.43,
  construction: 0.46,
  coeur: 0.34, coeurDeux: 0.305,
} as const;

/* Reservee a la garde : elle verifie que les couronnes ne se coupent
   pas, plutot que de croire le commentaire qui le promet. */
export const _couronnes = R;

const DEUX_PI = Math.PI * 2;
const HAUT = -Math.PI / 2;
const f = (x: number) => x.toFixed(3);
const surLeCercle = (a: number, r: number) => `${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)}`;

/** Un anneau. */
const anneau = (r: number, w: number, o: number, tirets?: string) =>
  `<circle cx="0" cy="0" r="${f(r)}" fill="none" stroke="currentColor" stroke-width="${w}"`
  + ` opacity="${o}" vector-effect="non-scaling-stroke"${tirets ? ` stroke-dasharray="${tirets}"` : ""}/>`;

/** Un segment radial. */
const rayon = (a: number, r1: number, r2: number, w: number, o: number) =>
  `<line x1="${f(Math.cos(a) * r1)}" y1="${f(Math.sin(a) * r1)}" x2="${f(Math.cos(a) * r2)}"`
  + ` y2="${f(Math.sin(a) * r2)}" stroke="currentColor" stroke-width="${w}" opacity="${o}"`
  + ` vector-effect="non-scaling-stroke"/>`;

/**
 * Un caractere, pose et tourne.
 *
 * « rot » est en degres. Sur le pourtour il vaut l angle de la lettre
 * plus un quart de tour : une inscription se lit debout, la tete vers
 * l exterieur, pas couchee sur le rayon.
 */
const signe = (d: string, x: number, y: number, taille: number, rot: number, w: number, o = 1) =>
  `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(taille)}) translate(-.5 -.5)"`
  + `${o < 1 ? ` opacity="${o}"` : ""}><path d="${d}" fill="none" stroke="currentColor"`
  + ` stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`
  + ` vector-effect="non-scaling-stroke"/></g>`;

/** Une pointe cardinale, posee a distance de l anneau de garde. */
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
 * LE POLYGONE ETOILE {n/k} — ce qui manquait a la figure d avant.
 *
 * On part d un sommet et l on avance de k a chaque pas jusqu a revenir
 * au depart. Quand k et n ne sont pas premiers entre eux, un seul tour
 * ne visite pas tous les sommets : il faut repartir de ceux qu on n a
 * pas vus. C est ce qui donne l hexagramme — deux triangles au lieu
 * d un trace unique.
 */
function polygone(n: number, k: number, r: number, w: number, o: number): string {
  let out = "";
  const vus = new Set<number>();
  for (let depart = 0; depart < n; depart++) {
    if (vus.has(depart)) continue;
    const cycle: string[] = [];
    let i = depart;
    do {
      vus.add(i);
      cycle.push(surLeCercle(HAUT + (i / n) * DEUX_PI, r).replace(" ", ","));
      i = (i + k) % n;
    } while (i !== depart);
    out += `<polygon points="${cycle.join(" ")}" fill="none" stroke="currentColor"`
      + ` stroke-width="${w}" opacity="${o}" stroke-linejoin="round"`
      + ` vector-effect="non-scaling-stroke"/>`;
  }
  return out;
}

/**
 * LA PISTE DE PROGRESSION, creuse et remplie.
 *
 * Sur le tableau de bord, le sceau prend la place de
 * « singularity-ring » — qui n est pas un ornement mais LA JAUGE
 * d avancement du pacte. Il la reprend, sans quoi remplacer le rond
 * ferait perdre une information.
 *
 * Le rail vide se voit autant que la part remplie : sans lui, un arc
 * partiel se lit comme un trait rate au lieu d une jauge.
 */
const piste = (part: number) => {
  const creux = anneau(R.piste, 3.4, 0.1);
  if (part <= 0) return creux;
  if (part >= 1) return creux + anneau(R.piste, 3.4, 0.95);
  const a1 = HAUT + part * DEUX_PI;
  return creux
    + `<path d="M${surLeCercle(HAUT, R.piste)} A${f(R.piste)} ${f(R.piste)} 0 ${part > 0.5 ? 1 : 0} 1`
    + ` ${surLeCercle(a1, R.piste)}" fill="none" stroke="currentColor" stroke-width="3.4"`
    + ` stroke-linecap="round" opacity=".95" vector-effect="non-scaling-stroke"/>`;
};

/* « avecSigne » et non « signe » : ce dernier est la fonction qui
   dessine un caractere, et le parametre la masquait. */
function dessiner(r: Rosace, progression: number, avecSigne: boolean, avecPhrase: boolean): string {
  let out = "";
  const n = r.ordre || ORDRE_PAR_DEFAUT;

  /* ── LES ARCS DE CONSTRUCTION ──────────────────────────────────
     Le compas qu on voit encore sous le trace. C est ce qui fait tout
     le fond des cercles arcaniques : n cercles de meme rayon centres
     sur les sommets, dont les intersections ont servi a poser la
     figure. Ils tournent, tres lentement, en sens inverse du reste. */
  out += `<g class="sceau-couche sceau-construction">`;
  if (avecSigne) {
    for (let i = 0; i < n; i++) {
      const a = HAUT + (i / n) * DEUX_PI;
      out += `<circle cx="${f(Math.cos(a) * R.construction)}" cy="${f(Math.sin(a) * R.construction)}"`
        + ` r="${f(R.construction)}" fill="none" stroke="currentColor" stroke-width="0.9"`
        + ` opacity=".13" vector-effect="non-scaling-stroke"/>`;
    }
  }

  /* ── LE CADRE ──────────────────────────────────────────────────
     Il existe des le premier ecran : mieux vaut un cadre qui attend
     qu un sceau qu on n a pas encore. */
  out += `</g><g class="sceau-couche">`;
  for (let i = 0; i < n; i++) out += pointe(HAUT + (i / n) * DEUX_PI);
  out += anneau(R.garde, 0.8, 0.28);
  out += piste(progression);
  out += anneau(R.filetHaut, 1.2, 0.5) + anneau(R.filetHautDeux, 0.7, 0.28);

  /* ── L INSCRIPTION ─────────────────────────────────────────────
     Le nom, lettre a lettre, debout vers l exterieur. Elle tourne :
     c est la couche qui donne son mouvement au sceau. */
  out += `</g><g class="sceau-couche sceau-bande">`;
  r.inscription.forEach((d, i) => {
    const a = HAUT + (i / r.inscription.length) * DEUX_PI;
    const x = Math.cos(a) * R.inscription, y = Math.sin(a) * R.inscription;
    out += signe(d, x, y, R.lettre, (a * 180) / Math.PI + 90, 1.1, 0.85);
  });

  /* ── LES GRADUATIONS VIENNENT AVEC LA PHRASE ───────────────────
     Elles tournent a l envers de l inscription : c est le contresens
     qui fait le mecanisme. Deux couronnes dans le meme sens se lisent
     comme un seul bloc qui pivote. */
  out += `</g><g class="sceau-couche sceau-grad">`;
  if (avecPhrase) {
    for (let i = 0; i < n * 6; i++) {
      const a = HAUT + (i / (n * 6)) * DEUX_PI;
      const long = i % 3 === 0 ? 0.045 : 0.024;
      out += rayon(a, R.graduations, R.graduations + long, i % 3 === 0 ? 1.4 : 0.8, 0.4);
    }
    out += anneau(R.filetBas, 0.9, 0.35) + anneau(R.filetBasDeux, 0.9, 0.35);
  }

  /* ── LE POLYGONE ETOILE ────────────────────────────────────────
     Il vient avec le signe, comme le centre : ce sont les deux choses
     qui font qu il y a un pacte. Il ne tourne pas — les medaillons
     sont poses sur ses sommets, et des signes qui tournent ne se
     lisent plus. Le mouvement est autour de lui, pas en lui. */
  out += `</g><g class="sceau-couche sceau-etoile">`;
  if (avecSigne) {
    out += polygone(n, r.pas || 2, R.polygone, 1.8, 0.9);
    /* A partir de six sommets, le polygone simple se pose dessous en
       filet leger : c est l hexagone sous l hexagramme, qui donne sa
       profondeur a la figure. */
    if (n >= 6) out += polygone(n, 1, R.polygone, 0.9, 0.26);
    out += anneau(R.polygone, 0.8, 0.22);
  }

  /* ── LES MEDAILLONS, SUR LES SOMMETS ───────────────────────────
     Ils ne tournent pas : leurs caracteres doivent rester droits. Une
     couronne qui tourne emporte ses signes avec elle. */
  out += `</g><g class="sceau-couche sceau-medaillons">`;
  /* LES SOMMETS SANS VALEUR RECOIVENT UN NOEUD. Trois valeurs sur sept
     sommets laissaient quatre pointes nues, et la figure paraissait
     inachevee — dans les references, chaque sommet porte quelque chose.
     Un petit disque suffit : il ferme la construction sans rien
     pretendre dire. */
  if (avecSigne) {
    const occupes = new Set(r.medaillons.map((m) => m.sommet));
    for (let i = 0; i < n; i++) {
      if (occupes.has(i)) continue;
      const a = HAUT + (i / n) * DEUX_PI;
      const x = Math.cos(a) * R.polygone, y = Math.sin(a) * R.polygone;
      out += `<circle cx="${f(x)}" cy="${f(y)}" r="0.032"`
        + ` fill="hsl(var(--ds-bg-base, 220 50% 4%))" stroke="currentColor" stroke-width="1.4"`
        + ` opacity=".75" vector-effect="non-scaling-stroke"/>`;
    }
  }
  for (const m of r.medaillons) {
    const x = Math.cos(m.angle) * R.polygone, y = Math.sin(m.angle) * R.polygone;
    out += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(R.medaillonRayon)}"`
      + ` fill="hsl(var(--ds-bg-base, 220 50% 4%))" stroke="currentColor" stroke-width="1.8"`
      + ` vector-effect="non-scaling-stroke"/>`;
    out += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(R.medaillonRayon * 0.8)}" fill="none"`
      + ` stroke="currentColor" stroke-width="0.7" opacity=".45" vector-effect="non-scaling-stroke"/>`;
    out += signe(m.d, x, y, 0.15, 0, 1.4);
  }

  /* ── LE CENTRE EST UNE MONTURE, PAS UNE CASE ───────────────────
     Il portait un caractere deduit du nom. MESURE : le logo du pacte
     fait 0,606 unite de large et le disque en faisait 0,56 — le logo
     le couvrait donc entierement, sur le tableau de bord comme dans le
     rite, ou il est monte au meme endroit. Le caractere n a jamais ete
     visible nulle part.

     Le centre devient ce qu il est vraiment : le double cercle qui
     SERTIT le logo. A 0,34 il deborde de 0,037 unite tout autour —
     un filet de quatre pixels. Et c est aussi ce que font les cercles
     arcaniques : leur milieu est le seul endroit ou l oeil se repose,
     le remplir revient a n avoir aucun centre. */
  out += `</g><g class="sceau-couche sceau-coeur">`;
  if (avecSigne) {
    out += `<circle cx="0" cy="0" r="${f(R.coeur)}" fill="hsl(var(--ds-bg-base, 220 50% 4%))"`
      + ` stroke="currentColor" stroke-width="1.8" vector-effect="non-scaling-stroke"/>`
      + anneau(R.coeurDeux, 1.1, 0.6);
  }

  /* Une seule couche ouverte au depart, une seule fermee a la fin :
     les « </g><g> » intercales decoupent le dessin sans compter. */
  return `<g class="sceau-couche">${out}</g></g>`;
}

/**
 * LE CERCLE DU PACTE.
 *
 * Le sceau, dessine. La structure vient de « logique/rosace » ; ici on
 * ne fait que la poser sur ses couronnes.
 *
 * IL N EXISTE QU A DEUX ENDROITS — le tableau de bord, ou il tient la
 * place du rond du heros, et le rite, ou il se forge. Ni la carte
 * d identite, ni la guilde, ni le pantheon : une figure a six couches
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

  /* LES DUREES DESCENDENT DE L ELAN. A un, l inscription fait un tour
     en 40 s ; a zero, en 120 s — le facteur trois que « PactVisual » a
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
