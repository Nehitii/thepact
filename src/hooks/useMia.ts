/**
 * M.I.A — fils, messages, flux.
 *
 * Les NOMS DE TABLE ne bougent pas. `coach_conversations` et
 * `coach_messages` gardent les leurs : les renommer ne servirait qu à
 * casser cent cinquante migrations pour une question de vocabulaire.
 * Seul le code qui les lit change de nom.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface FilMia {
  id: string;
  user_id: string;
  title: string;
  archived: boolean;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface MessageMia {
  id: string;
  conversation_id: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  created_at: string;
  metadata?: MetaMessageMia | null;
}

export interface SourceMia {
  source_type: string;
  source_id: string;
  snippet: string;
  similarity?: number;
}

export interface ActeMia {
  tool: string;
  status: "ok" | "error";
  label: string;
  ref_id?: string;
  ref_type?: string;
  error?: string;
}

export interface MetaMessageMia {
  citations?: SourceMia[];
  actions?: ActeMia[];
}

export function useFilsMia() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["coach_conversations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as FilMia[];
      const { data, error } = await supabase
        .from("coach_conversations")
        .select("*")
        .eq("user_id", user.id)
        .eq("archived", false)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data as FilMia[];
    },
    enabled: !!user?.id,
  });

  const create = useMutation({
    mutationFn: async (title?: string | undefined) => {
      if (!user?.id) throw new Error("Non authentifié");
      const { data, error } = await supabase
        .from("coach_conversations")
        .insert({ user_id: user.id, title: title ?? "Nouvelle conversation" })
        .select()
        .single();
      if (error) throw error;
      return data as FilMia;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coach_conversations", user?.id] }),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erreur"),
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
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

export function useMessagesMia(conversationId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["coach_messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [] as MessageMia[];
      const { data, error } = await supabase
        .from("coach_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as MessageMia[];
    },
    enabled: !!conversationId && !!user?.id,
  });
}

/**
 * Streaming send — yields incremental assistant text via setStreamingText.
 */
export function useFluxMia(conversationId: string | null) {
  const qc = useQueryClient();
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");

  // Le modèle n'est volontairement pas envoyé : il est choisi côté serveur
  // (DEFAULT_CHAT_MODEL, surchargeable via le secret AI_CHAT_MODEL). Le figer
  // ici obligerait à reconstruire le front à chaque changement de modèle.
  const send = useCallback(
    async (message: string) => {
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
          body: JSON.stringify({ conversation_id: conversationId, message }),
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
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "M.I.A n a pas repondu");
      } finally {
        setStreaming(false);
        setStreamText("");
      }
    },
    [conversationId, qc],
  );

  return { send, streaming, streamText };
}
/**
 * Les aperçus des fils : le dernier message de chacun.
 *
 * Le tiroir montre, sous chaque titre, la dernière chose qui s'est dite.
 * Une requête pour tous les fils plutôt qu'une par fil — quarante-neuf
 * messages en tout, on peut se permettre de les trier ici.
 */
export function useApercusMia(ids: string[]) {
  const { user } = useAuth();
  const cle = ids.slice().sort().join(",");
  return useQuery({
    queryKey: ["mia_apercus", user?.id, cle],
    queryFn: async () => {
      if (!ids.length) return {} as Record<string, string>;
      const { data, error } = await supabase
        .from("coach_messages")
        .select("conversation_id, content, created_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      const apercus: Record<string, string> = {};
      for (const m of data ?? []) {
        const id = (m as { conversation_id: string }).conversation_id;
        if (apercus[id]) continue;
        apercus[id] = ((m as { content: string }).content ?? "").replace(/\s+/g, " ").trim();
      }
      return apercus;
    },
    enabled: !!user?.id && ids.length > 0,
    staleTime: 30_000,
  });
}
