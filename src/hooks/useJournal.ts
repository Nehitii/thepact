/**
 * Journal (Neural Log) data hooks.
 *
 * Provides CRUD operations and infinite-scroll pagination for journal entries.
 */
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import type { JournalEntry } from "@/types/journal";

// Re-export types from the central file so existing imports keep working
export type { JournalEntry, JournalMood } from "@/types/journal";
export { MOOD_CONFIG } from "@/types/journal";

const PAGE_SIZE = 20;

/**
 * Infinite-scroll query for journal entries, newest first.
 */
export function useJournalEntries(userId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["journal-entries", userId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) return { data: [] as JournalEntry[], nextPage: undefined };

      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return {
        data: data as JournalEntry[],
        nextPage: data.length === PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!userId,
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (entry: {
      user_id: string;
      title: string;
      content: string;
      mood: string;
      life_context?: string | null;
      energy_level?: number | null;
      valence_level?: number | null;
      linked_goal_id?: string | null;
      tags?: string[];
      is_favorite?: boolean;
      accent_color?: string;
      font_id?: string;
      size_id?: string;
      align_id?: string;
      line_numbers?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("journal_entries")
        .insert(entry)
        .select()
        .single();

      if (error) throw error;
      return data as JournalEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries", data.user_id] });
      toast({ title: "Log recorded", description: "Neural log entry saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save entry", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      userId,
      updates,
    }: {
      id: string;
      userId: string;
      updates: Partial<
        Pick<
          JournalEntry,
          "title" | "content" | "mood" | "life_context" | "energy_level" | "valence_level" | "linked_goal_id" | "tags" | "is_favorite" | "accent_color" | "font_id" | "size_id" | "align_id" | "line_numbers"
        >
      >;
    }) => {
      const { data, error } = await supabase
        .from("journal_entries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { entry: data as JournalEntry, userId };
    },
    onSuccess: ({ userId }) => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries", userId] });
      toast({ title: "Log updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update entry", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase.from("journal_entries").delete().eq("id", id);
      if (error) throw error;
      return { userId };
    },
    onSuccess: ({ userId }) => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries", userId] });
      toast({ title: "Log purged" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete entry", description: error.message, variant: "destructive" });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId, isFavorite }: { id: string; userId: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from("journal_entries")
        .update({ is_favorite: isFavorite })
        .eq("id", id);
      if (error) throw error;
      return { userId };
    },
    onSuccess: ({ userId }) => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries", userId] });
    },
  });
}
