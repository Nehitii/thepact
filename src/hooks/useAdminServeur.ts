import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * L'ADMINISTRATION, CÔTÉ SERVEUR.
 *
 * ═══════════════════════════════════════════════════════════════
 * POURQUOI CES APPELS NE SONT PAS DES REQUÊTES ORDINAIRES
 *
 * L'écran de diffusion faisait « from('profiles').select('id') » pour
 * énumérer les destinataires. `profiles` n'a qu'une politique de
 * lecture — « auth.uid() = id ». MESURÉ en endossant le rôle : 1
 * profil rendu sur 4. « Envoyer à tous » partait donc vers
 * l'administrateur seul, et annonçait « envoyé à 1 utilisateur ».
 *
 * C'était la TROISIÈME occurrence du même piège dans ce dépôt — après
 * les noms des conversations privées et la recherche d'alliés. La
 * règle qui en sort tient en une ligne : ON N'ÉNUMÈRE JAMAIS LES
 * UTILISATEURS DEPUIS LE CLIENT. Ce qui touche tout le monde se fait
 * dans une fonction serveur qui vérifie elle-même le droit d'agir.
 *
 * Chacune de ces fonctions exige une session ÉLEVÉE : le rôle seul ne
 * suffit pas, puisqu'un jeton volé le porte aussi. Le refus remonte
 * avec le code 42501, que l'écran traduit en une phrase.
 * ═══════════════════════════════════════════════════════════════
 */

export interface Diffusion {
  titre: string;
  description?: string;
  categorie: "system" | "progress" | "social" | "marketing";
  priorite: "critical" | "important" | "informational" | "social" | "silent";
  icone: string;
  ctaLabel?: string;
  ctaUrl?: string;
  recompenseType?: string | null;
  recompenseMontant?: number | null;
  recompenseCosmetique?: string | null;
  /** Nul = tout le monde. */
  destinataire?: string | null;
}

export interface CompteRenduDiffusion {
  envoyes: number;
  /** Écartés parce qu'ils ont coupé cette catégorie dans leurs réglages. */
  ecartes: number;
  cibles: number;
}

export interface LigneJournal {
  id: string;
  quand: string;
  qui: string;
  action: string;
  cible_type: string;
  cible_id: string | null;
  details: Record<string, unknown>;
}

export interface LigneAnnuaire {
  user_id: string;
  nom: string;
  inscrit_le: string;
  derniere_connexion: string | null;
  est_admin: boolean;
}

export interface LigneRoster {
  user_id: string;
  nom: string;
  role: string;
  depuis: string;
  derniere_connexion: string | null;
  a_un_second_facteur: boolean;
  c_est_moi: boolean;
}

/** Traduit un refus du serveur en phrase lisible. */
export function motDeLErreur(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  if (/aal2|session élevée/i.test(m)) return "Session non élevée : confirmez votre second facteur.";
  if (/chemin interne/i.test(m)) return "Le lien doit commencer par « / ».";
  if (/au moins un administrateur/i.test(m)) return "Il doit rester au moins un administrateur.";
  if (/son propre rôle/i.test(m)) return "On ne retire pas son propre rôle.";
  return m;
}

export function useDiffuser() {
  const qc = useQueryClient();
  return useMutation<CompteRenduDiffusion, Error, Diffusion>({
    mutationFn: async (d) => {
      const { data, error } = await supabase.rpc("diffuser_notification", {
        p_titre: d.titre,
        p_description: d.description ?? null,
        p_categorie: d.categorie,
        p_priorite: d.priorite,
        p_icone: d.icone,
        p_cta_label: d.ctaLabel ?? null,
        p_cta_url: d.ctaUrl ?? null,
        p_recompense_type: d.recompenseType ?? null,
        p_recompense_montant: d.recompenseMontant ?? null,
        p_recompense_cosmetique: d.recompenseCosmetique ?? null,
        p_destinataire: d.destinataire ?? null,
      });
      if (error) throw error;
      return data as unknown as CompteRenduDiffusion;
    },
    onSuccess: () => {
      /* Le journal EST l'historique des diffusions : il n'y a plus de
         seconde source à tenir à jour. */
      qc.invalidateQueries({ queryKey: ["journal-admin"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useJournalAdmin(limite = 50) {
  return useQuery<LigneJournal[]>({
    queryKey: ["journal-admin", limite],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("journal_admin", { p_limite: limite });
      if (error) throw error;
      return (data ?? []) as unknown as LigneJournal[];
    },
    staleTime: 30_000,
  });
}

export function useRosterAdmin() {
  return useQuery<LigneRoster[]>({
    queryKey: ["roster-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("roster_admin");
      if (error) throw error;
      return (data ?? []) as unknown as LigneRoster[];
    },
    staleTime: 30_000,
  });
}

/**
 * L'ANNUAIRE.
 *
 * La liste déroulante « écrire à une personne » se remplissait depuis
 * `profiles` : elle contenait UN nom, celui de l'administrateur. Viser
 * quelqu'un d'autre était impossible depuis l'écran.
 */
export function useAnnuaire(recherche = "") {
  return useQuery<LigneAnnuaire[]>({
    queryKey: ["annuaire-admin", recherche],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("annuaire_utilisateurs", {
        p_recherche: recherche || null,
      });
      if (error) throw error;
      return (data ?? []) as unknown as LigneAnnuaire[];
    },
    staleTime: 60_000,
  });
}

export function useChangerLeRole() {
  const qc = useQueryClient();
  return useMutation<void, Error, { userId: string; admin: boolean }>({
    mutationFn: async ({ userId, admin }) => {
      const { error } = await supabase.rpc("changer_le_role", {
        p_user_id: userId,
        p_admin: admin,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roster-admin"] });
      qc.invalidateQueries({ queryKey: ["journal-admin"] });
      qc.invalidateQueries({ queryKey: ["server-admin-check"] });
    },
  });
}
