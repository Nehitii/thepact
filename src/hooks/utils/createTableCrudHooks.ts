/**
 * Generic CRUD hooks factory for Supabase tables.
 *
 * Generates `useList`, `useUpsert`, `useDelete` React Query hooks for a given
 * table. Keeps every call site fully typed via the `TRow` generic — internal
 * `as any` casts are confined to the factory to bridge the wide `keyof Tables`
 * union of the typed Supabase client.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CrudFactoryOptions {
  queryKey: string;
  /** Scope reads/writes to the authenticated user via `user_id`. Default: true. */
  requireUser?: boolean;
  /** Optional default ordering applied in `useList`. */
  orderBy?: { column: string; ascending?: boolean };
  /** Optional toast.success messages. If omitted, no toast is shown. */
  successMessages?: { upsert?: string; delete?: string };
  /**
   * Appelé après une écriture réussie, avec l'identifiant de la personne.
   *
   * SERT À COMPTER, PAS À AGIR. Les succès de l'application ont besoin de
   * savoir qu'une ligne a été créée ; la fabrique est le seul endroit qui
   * le sait pour les tables qui passent par elle. On ne veut pas pour
   * autant y faire entrer `lib/achievements` : l'appelant passe ce qu'il
   * veut, la fabrique ignore ce que ça fait.
   *
   * Ne jamais y mettre quelque chose dont l'échec doive interrompre
   * l'écriture — elle est déjà faite quand ceci s'exécute.
   */
  apresEcriture?: (userId: string) => void;
}

export function createTableCrudHooks<TRow extends { id: string }>(
  tableName: string,
  options: CrudFactoryOptions,
) {
  const requireUser = options.requireUser ?? true;
  /* LE SEUL ELARGISSEMENT DU FICHIER, ET IL EST ICI.

     Le client typé exige un nom de table littéral pour déduire la forme
     des lignes ; cette fabrique en reçoit un à l'exécution. On élargit
     donc une fois, à l'endroit exact où la contrainte se pose, et tout
     ce qui en découle (`q`, `row`) hérite de ce seul point — au lieu
     d'être ré-élargi à chaque usage, ce qui donnerait à croire qu'il y a
     trois renoncements là où il n'y en a qu'un.

     Les appelants, eux, restent entièrement typés par `TRow`. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = () => (supabase as any).from(tableName);
  const key = options.queryKey;

  function useList() {
    const { user } = useAuth();
    return useQuery({
      queryKey: [key, requireUser ? user?.id : "all"],
      queryFn: async () => {
        if (requireUser && !user?.id) return [] as TRow[];
        let q = table().select("*");
        if (requireUser) q = q.eq("user_id", user!.id);
        if (options.orderBy) {
          q = q.order(options.orderBy.column, {
            ascending: options.orderBy.ascending ?? true,
          });
        }
        const { data, error } = await q;
        if (error) throw error;
        return (data ?? []) as TRow[];
      },
      enabled: requireUser ? !!user?.id : true,
    });
  }

  function useUpsert() {
    const qc = useQueryClient();
    const { user } = useAuth();
    return useMutation({
      mutationFn: async (payload: Partial<TRow>): Promise<TRow> => {
        if (requireUser && !user?.id) throw new Error("Not authenticated");
        const row = requireUser
          ? { ...payload, user_id: user!.id }
          : payload;
        /* Une modification partielle n est pas un « upsert ».
         *
         * « upsert » envoie un INSERT … ON CONFLICT : la ligne inseree
         * doit etre constructible AVANT que le conflit soit vu. Un
         * appel qui ne porte que { id, is_active } echoue donc sur les
         * colonnes obligatoires absentes — « name » ici — et le serveur
         * repond 400. C est ce qui empechait de desactiver une ligne
         * recurrente : le geste partait, et rien ne revenait.
         *
         * Avec un identifiant on met a jour ; sans, on insere. */
        if (row.id) {
          const { id, ...champs } = row;
          let requete = table().update(champs).eq("id", id);
          if (requireUser) requete = requete.eq("user_id", user!.id);
          const { data, error } = await requete.select();
          if (error) throw error;
          /* Une regle de securite qui bloque ne renvoie pas d erreur
             mais zero ligne : sans ce controle, l echec passerait pour
             un succes. */
          if (!data || data.length === 0) throw new Error("Aucune ligne modifiee");
          return data[0] as TRow;
        }

        const { data, error } = await table()
          .insert(row)
          .select()
          .single();
        if (error) throw error;
        return data as TRow;
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [key] });
        if (options.successMessages?.upsert) {
          toast.success(options.successMessages.upsert);
        }
        if (user?.id) options.apresEcriture?.(user.id);
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  function useDelete() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await table()
          .delete()
          .eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [key] });
        if (options.successMessages?.delete) {
          toast.success(options.successMessages.delete);
        }
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  return { useList, useUpsert, useDelete };
}