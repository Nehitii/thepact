import type { EtatDuJour } from "@/hooks/useEtatDuJour";
import type { ExpressionMia } from "@/components/mia/VisageMia";
import { PREF } from "./preferencesAffichage";

/**
 * L'humeur ambiante de M.I.A.
 *
 * ═══════════════════════════════════════════════════════════════
 * L'ANNEAU DE M.I.A EST L'ANNEAU DU PACTE.
 *
 * Sur les planches, son anneau est or et entier quand elle est calme, et
 * rouge et brisé quand elle est en colère. Le compte à rebours du pacte
 * a exactement trois phases et exactement ces couleurs : vert nominal,
 * ambre attention, rouge critique.
 *
 * Ce n'est donc pas une coïncidence à exploiter, c'est une identité à
 * respecter. SON VISAGE AU REPOS PORTE LA PHASE DU PACTE, pas son
 * opinion sur vous. Sa colère est celle de l'instrument : une échéance
 * qui casse, pas une remontrance.
 *
 * ET ELLE NE RÉAGIT PAS À CE QUE VOUS N'AVEZ PAS FAIT.
 * Un compagnon qui commente vos absences devient insupportable en trois
 * semaines. Par défaut elle se tait là-dessus. Le réglage
 * `vowpact.mia.absences` l'autorise, pour qui le veut — et c'est le seul
 * endroit du code où une humeur dépend d'une inaction.
 * ═══════════════════════════════════════════════════════════════
 */

const SEUIL_ABSENCE = 10;

export function reagitAuxAbsences(): boolean {
  try {
    return localStorage.getItem(PREF.MIA_ABSENCES) === "1";
  } catch {
    return false;
  }
}

export function reglerReactionAuxAbsences(actif: boolean): void {
  try {
    localStorage.setItem(PREF.MIA_ABSENCES, actif ? "1" : "0");
  } catch {
    /* navigation privée : le réglage ne tiendra que la session */
  }
}

export interface ContexteHumeur {
  /** Vraie quand le modèle est en train de chercher. */
  cherche?: boolean;
  /** Vraie quand l'utilisateur est en train d'écrire. */
  ecoute?: boolean;
}

/**
 * Le visage qu'elle porte quand elle ne dit rien de particulier :
 * en-tête de console, état vide, apparition sur le tableau de bord.
 */
export function humeurAmbiante(etat: EtatDuJour | undefined, ctx: ContexteHumeur = {}): ExpressionMia {
  /* Ce qu'elle fait maintenant passe avant ce que le pacte raconte. */
  if (ctx.cherche) return "reflexion";

  if (!etat) return "neutre";

  /* Le pacte est échu : elle ne commente plus. */
  if (etat.pacte && etat.pacte.total > 0 && etat.pacte.reste === 0) return "eteinte";

  /* L'absence, et seulement si on l'y a autorisée. */
  if (
    reagitAuxAbsences() &&
    etat.joursSansPointage !== null &&
    etat.joursSansPointage >= SEUIL_ABSENCE
  ) {
    return "abattue";
  }

  /* Après minuit, elle a des heures. Ce n'est pas un reproche. */
  const h = new Date().getHours();
  if (h >= 0 && h < 5) return "lasse";

  if (ctx.ecoute) return "calme";

  switch (etat.phase) {
    case "critique":
      /* Dernier jour : elle a le droit d'être drôle à ce sujet. */
      return etat.pacte && etat.pacte.reste <= 1 ? "menacante" : "severe";
    case "attention":
      return "neutre";
    case "nominal":
      return "calme";
    default:
      return "neutre";
  }
}

/* ── LES PASSAGES ──
   Ce qui mérite qu'elle apparaisse sur le tableau de bord. Rare, sinon
   ce n'est plus un passage, c'est un bandeau. */
export type ClePassage = "phase" | "journee-close" | "pacte-echu" | "absence";

export interface Passage {
  cle: ClePassage;
  texte: string;
  expression: ExpressionMia;
  /** Ce qu'on retient pour ne pas le rejouer. */
  empreinte: string;
}

const LIBELLE_PHASE: Record<string, string> = {
  nominal: "phase initiale",
  attention: "phase intermédiaire",
  critique: "phase terminale",
};

export function chercherPassage(etat: EtatDuJour | undefined, vuAvant: string | null): Passage | null {
  if (!etat) return null;

  if (etat.pacte && etat.pacte.total > 0 && etat.pacte.reste === 0) {
    const p: Passage = {
      cle: "pacte-echu",
      texte: `${etat.pacte.nom} est arrivé à son terme. ${etat.objectifs.finis} objectifs terminés sur ${etat.objectifs.enCours + etat.objectifs.aVenir + etat.objectifs.finis}.`,
      expression: "triste-sourire",
      empreinte: `echu:${etat.pacte.id}`,
    };
    return p.empreinte === vuAvant ? null : p;
  }

  /* Le pacte a changé de phase depuis la dernière visite. */
  if (etat.pacte && etat.phase !== "inconnue") {
    const empreinte = `phase:${etat.pacte.id}:${etat.phase}`;
    /* On ne signale que si l'on avait DÉJÀ vu une phase : la première
       visite ne bascule rien, elle découvre. */
    if (vuAvant?.startsWith(`phase:${etat.pacte.id}:`) && vuAvant !== empreinte) {
      return {
        cle: "phase",
        texte:
          etat.phase === "critique"
            ? `${etat.pacte.nom} entre en phase terminale. ${etat.pacte.reste} jours.`
            : `${etat.pacte.nom} passe en ${LIBELLE_PHASE[etat.phase]}. ${etat.pacte.reste} jours restants.`,
        expression: etat.phase === "critique" ? "colere" : "neutre",
        empreinte,
      };
    }
    /* Rien à dire, mais on retient la phase pour la prochaine fois. */
    if (!vuAvant?.startsWith(`phase:${etat.pacte.id}:`)) {
      return { cle: "phase", texte: "", expression: "neutre", empreinte };
    }
  }

  return null;
}

/** Le passage joyeux du jour : tous les ordres réclamés. Il se rejoue chaque jour. */
export function passageDuJour(etat: EtatDuJour | undefined, vuAvant: string | null): Passage | null {
  if (!etat || !etat.ordres.length) return null;
  if (!etat.ordres.every((o) => o.reclame)) return null;
  const empreinte = `close:${new Date().toISOString().slice(0, 10)}`;
  if (empreinte === vuAvant) return null;
  const prime = etat.ordres.reduce((s, o) => s + o.prime, 0);
  return {
    cle: "journee-close",
    texte: `Journée close. ${prime} bonds pris sur les trois ordres.`,
    expression: "joie",
    empreinte,
  };
}
