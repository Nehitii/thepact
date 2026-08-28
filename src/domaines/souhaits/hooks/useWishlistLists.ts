import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import { toast } from "sonner";

/**
 * Les listes personnelles de la wishlist.
 *
 * ═══════════════════════════════════════════════════════════════
 * TROIS AU PLUS, ET C'EST LA BASE QUI COMPTE.
 *
 * Une limite tenue par un bouton grisé n'est pas une limite : elle tombe
 * dès qu'on ouvre un second onglet, et elle ne protège pas des écritures
 * qui ne passent pas par l'écran. Le déclencheur `trois_listes_au_plus`
 * compte AVANT d'insérer.
 *
 * L'interface grise quand même le bouton — non pour protéger, mais pour
 * dire d'avance ce que la base répondrait. Les deux ne se remplacent pas.
 *
 * UN POSTE TIENT À UNE LISTE OU À UN OBJECTIF, JAMAIS AUX DEUX. Un poste
 * rattaché à un objectif est financé par le pacte ; le ranger en plus
 * dans une liste ferait compter la même dépense dans deux totaux. Une
 * contrainte de table le refuse, et le message ci-dessous le traduit.
 * ═══════════════════════════════════════════════════════════════
 */

export const LISTES_MAX = 3;

export interface ListeWishlist {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const cle = (userId: string | undefined) => ["wishlist-listes", userId] as const;

/** Ce que la base refuse, dit en français plutôt qu'en code d'erreur. */
function traduireLeRefus(message: string): string {
  if (/Trois listes au plus/i.test(message)) {
    return `Trois listes au plus. Renomme ou supprime l'une des tiennes.`;
  }
  if (/wishlist_lists_nom_unique|duplicate key/i.test(message)) {
    return "Une liste porte déjà ce nom.";
  }
  if (/une_seule_appartenance/i.test(message)) {
    return "Un poste rattaché à un objectif ne peut pas rejoindre une liste : il est déjà financé par le pacte.";
  }
  if (/length\(btrim\(name\)\)|check constraint/i.test(message)) {
    return "Un nom, de un à soixante caractères.";
  }
  return message;
}

export function useListesWishlist(userId: string | undefined) {
  return useQuery({
    queryKey: cle(userId),
    enabled: !!userId,
    queryFn: async (): Promise<ListeWishlist[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("wishlist_lists")
        .select("*")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ListeWishlist[];
    },
  });
}

export function useCreerListe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, nom }: { userId: string; nom: string }) => {
      const propre = nom.trim().slice(0, 60);
      if (!propre) throw new Error("Un nom, de un à soixante caractères.");
      const { data, error } = await supabase
        .from("wishlist_lists")
        .insert({ user_id: userId, name: propre })
        .select()
        .single();
      if (error) throw new Error(traduireLeRefus(error.message));
      return data as ListeWishlist;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: cle(v.userId) });
      toast.success("Liste créée.");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erreur"),
  });
}

export function useRenommerListe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, id, nom }: { userId: string; id: string; nom: string }) => {
      const propre = nom.trim().slice(0, 60);
      if (!propre) throw new Error("Un nom, de un à soixante caractères.");
      const { error } = await supabase.from("wishlist_lists").update({ name: propre }).eq("id", id);
      if (error) throw new Error(traduireLeRefus(error.message));
      return propre;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: cle(v.userId) }),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erreur"),
  });
}

export function useSupprimerListe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { userId: string; id: string; nom: string }) => {
      const { error } = await supabase.from("wishlist_lists").delete().eq("id", id);
      if (error) throw new Error(traduireLeRefus(error.message));
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: cle(v.userId) });
      /* Les postes ne disparaissent pas avec la liste : la clé étrangère
         est en « on delete set null », ils retournent simplement au tas
         des sans-objectif. Il faut donc les relire. */
      qc.invalidateQueries({ queryKey: ["pact-wishlist", v.userId] });
      toast.success(`« ${v.nom} » supprimée. Ses postes sont revenus aux sans-objectif.`);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erreur"),
  });
}

/** Ranger un poste dans une liste, ou l'en sortir avec `null`. */
export function useRangerDansListe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, listId }: { userId: string; itemId: string; listId: string | null }) => {
      const { error } = await supabase.from("wishlist_items").update({ list_id: listId }).eq("id", itemId);
      if (error) throw new Error(traduireLeRefus(error.message));
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["pact-wishlist", v.userId] }),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erreur"),
  });
}
