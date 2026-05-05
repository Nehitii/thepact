/**
 * AI Coach hooks — conversations, messages and streaming send.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CoachConversation {
  id: string;
  user_id: string;
  title: string;
  archived: boolean;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface CoachMessage {
  id: string;
  conversation_id: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  created_at: string;
}

export function useCoachConversations() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["coach_conversations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as CoachConversation[];
      const { data, error } = await (supabase as any)
        .from("coach_conversations")
        .select("*")
        .eq("user_id", user.id)
        .eq("archived", false)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data as CoachConversation[];
    },
    enabled: !!user?.id,
  });

  const create = useMutation({
    mutationFn: async (title?: string) => {
      if (!user?.id) throw new Error("Non authentifié");
      const { data, error } = await (supabase as any)
        .from("coach_conversations")
        .insert({ user_id: user.id, title: title ?? "Nouvelle conversation" })
        .select()
        .single();
      if (error) throw error;
      return data as CoachConversation;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coach_conversations", user?.id] }),
    onError: (e: any) => toast.error(e?.message ?? "Erreur"),
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("coach_conversations")
        .update({ archived: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coach_conversations", user?.id] }),
  });

  return {
    conversations: list.data ?? [],
    isLoading: list.isLoading,
    create: create.mutateAsync,
    archive: archive.mutateAsync,
  };
}

export function useCoachMessages(conversationId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["coach_messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [] as CoachMessage[];
      const { data, error } = await (supabase as any)
        .from("coach_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as CoachMessage[];
    },
    enabled: !!conversationId && !!user?.id,
  });
}

/**
 * Streaming send — yields incremental assistant text via setStreamingText.
 */
export function useCoachStream(conversationId: string | null) {
  const qc = useQueryClient();
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");

  const send = useCallback(
    async (message: string, model = "google/gemini-2.5-flash") => {
      if (!conversationId || !message.trim()) return;
      setStreaming(true);
      setStreamText("");
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("Session expirée");

        const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co/ai-coach`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ conversation_id: conversationId, message, model }),
        });

        if (!res.ok || !res.body) {
          const err = await res.text();
          throw new Error(err || `HTTP ${res.status}`);
        }

        // Refresh user message immediately
        qc.invalidateQueries({ queryKey: ["coach_messages", conversationId] });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let text = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                text += delta;
                setStreamText(text);
              }
            } catch (_) { /* ignore */ }
          }
        }
        // Final refresh to load persisted assistant message
        await qc.invalidateQueries({ queryKey: ["coach_messages", conversationId] });
        await qc.invalidateQueries({ queryKey: ["coach_conversations"] });
      } catch (e: any) {
        toast.error(e?.message ?? "Erreur Coach");
      } finally {
        setStreaming(false);
        setStreamText("");
      }
    },
    [conversationId, qc],
  );

  return { send, streaming, streamText };
}