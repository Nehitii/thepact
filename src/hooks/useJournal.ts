import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  mood: string;
  life_context: string | null;
  created_at: string;
  updated_at: string;
}

export type JournalMood = 
  | "contemplative" 
  | "nostalgic" 
  | "inspired" 
  | "heavy" 
  | "calm" 
  | "reflective"
  | "grateful"
  | "melancholic";

export const MOOD_CONFIG: Record<JournalMood, { icon: string; color: string; bgColor: string }> = {
  contemplative: { icon: "🌙", color: "text-indigo-300", bgColor: "bg-indigo-500/20" },
  nostalgic: { icon: "📜", color: "text-amber-300", bgColor: "bg-amber-500/20" },
  inspired: { icon: "✨", color: "text-cyan-300", bgColor: "bg-cyan-500/20" },
  heavy: { icon: "🌧️", color: "text-slate-400", bgColor: "bg-slate-500/20" },
  calm: { icon: "🍃", color: "text-emerald-300", bgColor: "bg-emerald-500/20" },
  reflective: { icon: "🔮", color: "text-purple-300", bgColor: "bg-purple-500/20" },
  grateful: { icon: "💜", color: "text-pink-300", bgColor: "bg-pink-500/20" },
  melancholic: { icon: "🌊", color: "text-blue-300", bgColor: "bg-blue-500/20" },
};

export function useJournalEntries(userId: string | undefined) {
  return useQuery({
    queryKey: ["journal-entries", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as JournalEntry[];
    },
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
      life_context?: string;
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
      toast({ title: "Entry saved", description: "Your memory has been recorded" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to save entry", 
        description: error.message,
        variant: "destructive" 
      });
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
      updates 
    }: { 
      id: string; 
      userId: string;
      updates: Partial<Pick<JournalEntry, "title" | "content" | "mood" | "life_context">>
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
      toast({ title: "Entry updated" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update entry", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return { userId };
    },
    onSuccess: ({ userId }) => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries", userId] });
      toast({ title: "Entry deleted" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to delete entry", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}
