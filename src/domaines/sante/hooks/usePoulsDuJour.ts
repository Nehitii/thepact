import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Le pouls des cinq systèmes actifs, pour la barre de fréquence.
 *
 * ═══════════════════════════════════════════════════════════════
 * CINQ SYSTÈMES, ET PAS LES AUTRES.
 *
 * Objectifs, calendrier, finance et liste de souhaits sont des
 * systèmes PASSIFS : on les consulte, on les tient à jour, mais on n'y
 * « fait » rien qui puisse se dater à la journée. Les cinq retenus
 * sont ceux où un geste se pose : une tâche cochée, un appel tenu, une
 * entrée écrite, un relevé de santé, une session de concentration.
 *
 * UNE SEULE REQUÊTE. La barre système est visible sur TOUTES les pages
 * de l'application : cinq allers-retours par page se paieraient
 * partout. Une RPC les rassemble.
 *
 * LA JOURNÉE EST CELLE DE L'UTILISATEUR, pas celle du serveur. La
 * fenêtre est calculée ici, en heure locale, et passée à la base. Sans
 * ça, une session terminée à 00 h 30 à Paris tomberait la veille en
 * UTC et la barre mentirait sur la journée.
 * ═══════════════════════════════════════════════════════════════
 */

/** Ce que la base renvoie : des comptes bruts, sans interprétation. */
interface PoulsBrut {
  taches: number;
  appel: number;
  journal: number;
  sante: number;
  focus_minutes: number;
}

/** Trois états, parce qu'une barre de quatorze pixels n'en porte pas plus. */
export type EtatSysteme = "eteint" | "amorce" | "plein";

export interface Systeme {
  cle: "focus" | "taches" | "appel" | "journal" | "sante";
  nom: string;
  etat: EtatSysteme;
  /** Ce qu'on montre au survol : « 42 min », « 3 tâches », « tenu ». */
  detail: string;
}

/**
 * Les seuils.
 *
 * Deux systèmes s'accumulent — on peut cocher trois tâches ou tenir
 * une heure — et méritent un état intermédiaire. Les trois autres sont
 * des gestes uniques de la journée : l'appel se tient ou ne se tient
 * pas. Leur barre n'a donc que deux positions, et c'est exact.
 *
 * Vingt-cinq minutes pour la concentration : c'est une session, l'unité
 * que la page Focus emploie déjà.
 */
function etat(valeur: number, plein: number): EtatSysteme {
  if (valeur <= 0) return "eteint";
  return valeur >= plein ? "plein" : "amorce";
}

/** Minuit local à minuit local, plus la date au format du calendrier. */
function fenetreDuJour() {
  const debut = new Date();
  debut.setHours(0, 0, 0, 0);
  const fin = new Date(debut);
  fin.setDate(fin.getDate() + 1);

  /* La date locale écrite à la main : toISOString() bascule en UTC et
     rendrait « hier » pour tout l'est de Greenwich en soirée. */
  const jour = [
    debut.getFullYear(),
    String(debut.getMonth() + 1).padStart(2, "0"),
    String(debut.getDate()).padStart(2, "0"),
  ].join("-");

  return { debut: debut.toISOString(), fin: fin.toISOString(), jour };
}

export function usePoulsDuJour(userId: string | undefined) {
  const { debut, fin, jour } = fenetreDuJour();

  return useQuery({
    /* Le jour fait partie de la clé : à minuit, le cache d'hier n'est
       plus le bon, et il se remplace de lui-même. */
    queryKey: ["pouls-du-jour", userId, jour],
    enabled: !!userId,
    /* Ces gestes se posent quelques fois par jour : inutile de
       redemander à chaque page. Les cinq systèmes invalident cette
       clé quand on agit, donc la barre répond au geste sans attendre
       l'expiration ; ce délai n'est qu'un filet pour ce qui se
       passerait ailleurs — un autre onglet, un autre appareil. */
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<Systeme[]> => {
      /* `src/integrations/supabase/types.ts` est genere depuis le
         schema et ne connait pas encore cette fonction : sans la
         conversion, TypeScript refuse un nom qui n'est pas dans sa
         liste. Le projet emploie deja ce recours ailleurs (voir
         `daily_quests` dans useDailyQuests). La conversion est
         contenue ici, sur la seule ligne d'appel — la forme du retour,
         elle, reste verifiee par `PoulsBrut`. */
      const { data, error } = await (supabase.rpc as unknown as (
        nom: string,
        args: Record<string, string>,
      ) => Promise<{ data: unknown; error: { message: string } | null }>)("pouls_du_jour", {
        p_debut: debut,
        p_fin: fin,
        p_jour: jour,
      });
      if (error) throw error;

      const b = ((Array.isArray(data) ? data[0] : data) ?? {}) as Partial<PoulsBrut>;
      const taches = b.taches ?? 0;
      const appel = b.appel ?? 0;
      const journal = b.journal ?? 0;
      const sante = b.sante ?? 0;
      const minutes = b.focus_minutes ?? 0;

      /* L'ordre est celui de la barre latérale : on retrouve les mêmes
         systèmes dans le même sens, donc on lit la barre sans
         apprendre une seconde grammaire. */
      return [
        {
          cle: "focus",
          nom: "Focus",
          etat: etat(minutes, 25),
          detail: minutes > 0 ? `${minutes} min` : "rien aujourd'hui",
        },
        {
          cle: "taches",
          nom: "To-do list",
          etat: etat(taches, 3),
          detail: taches > 0 ? `${taches} ${taches > 1 ? "tâches" : "tâche"}` : "rien aujourd'hui",
        },
        {
          cle: "appel",
          nom: "The Call",
          etat: etat(appel, 1),
          detail: appel > 0 ? "tenu" : "pas encore",
        },
        {
          cle: "journal",
          nom: "Journal",
          etat: etat(journal, 1),
          detail: journal > 0 ? `${journal} ${journal > 1 ? "entrées" : "entrée"}` : "rien aujourd'hui",
        },
        {
          cle: "sante",
          nom: "Santé",
          etat: etat(sante, 1),
          detail: sante > 0 ? "relevé fait" : "pas encore",
        },
      ];
    },
  });
}
