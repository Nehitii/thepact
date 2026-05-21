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
}

export function createTableCrudHooks<TRow extends { id: string }>(
  tableName: string,
  options: CrudFactoryOptions,
) {
  const requireUser = options.requireUser ?? true;
  const key = options.queryKey;

  function useList() {
    const { user } = useAuth();
    return useQuery({
      queryKey: [key, requireUser ? user?.id : "all"],
      queryFn: async () => {
        if (requireUser && !user?.id) return [] as TRow[];
        let q: any = (supabase as any).from(tableName).select("*");
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
        const row: any = requireUser
          ? { ...payload, user_id: user!.id }
          : payload;
        const { data, error } = await (supabase as any)
          .from(tableName)
          .upsert(row)
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
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  function useDelete() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await (supabase as any)
          .from(tableName)
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