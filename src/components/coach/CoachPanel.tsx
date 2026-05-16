/**
 * Coach Panel — slide-in right drawer accessible globally via Cmd+J.
 * Persistent panel for conversations with the AI Coach.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Bot, Send, Plus, X, MessageSquare, Loader2, Brain } from "lucide-react";
import {
  useCoachConversations,
  useCoachMessages,
  useCoachStream,
} from "@/hooks/useCoach";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CoachInsightsList } from "@/components/coach/CoachInsightsList";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CoachPanel({ open, onClose }: Props) {
  const { conversations, create } = useCoachConversations();
  const [activeId, setActiveId] = useState<string | null>(null);
  const { data: messages = [] } = useCoachMessages(activeId);
  const { send, streaming, streamText } = useCoachStream(activeId);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-pick first conversation
  useEffect(() => {
    if (open && !activeId && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [open, activeId, conversations]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, streamText]);

  const handleNew = async () => {
    const conv = await create("Nouvelle conversation");
    setActiveId(conv.id);
  };

  const [indexing, setIndexing] = useState(false);
  const handleIndex = async () => {
    if (indexing) return;
    setIndexing(true);
    try {
      const { data, error } = await supabase.functions.invoke("coach-index-memory", { body: {} });
      if (error) throw error;
      const n = (data as any)?.indexed ?? 0;
      toast.success(n ? `${n} souvenirs indexés.` : "Mémoire déjà à jour.");
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur indexation");
    } finally {
      setIndexing(false);
    }
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || streaming) return;
    let convId = activeId;
    if (!convId) {
      const conv = await create(text.slice(0, 60));
      convId = conv.id;
      setActiveId(convId);
    }
    setDraft("");
    await send(text);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[90] bg-background/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            role="dialog"
            aria-label="Coach IA"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed top-0 right-0 z-[91] h-screen w-full sm:w-[440px] bg-card border-l border-border shadow-2xl flex flex-col isolate [contain:paint]"
          >
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-primary/15 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-display text-sm uppercase tracking-wider">Pacte Coach</p>
                  <p className="text-[11px] text-muted-foreground">Cmd+J</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={handleIndex} disabled={indexing} aria-label="Indexer la mémoire">
                  {indexing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={handleNew} aria-label="Nouvelle conversation">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={onClose} aria-label="Fermer">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </header>

            {/* Conversations strip */}
            {conversations.length > 0 && (
              <div className="flex gap-1 overflow-x-auto px-3 py-2 border-b border-border/50 scrollbar-none">
                {conversations.slice(0, 12).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={cn(
                      "shrink-0 px-2.5 py-1 text-xs rounded-md border transition-colors",
                      c.id === activeId
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "border-border/40 text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    <MessageSquare className="h-3 w-3 inline mr-1" />
                    {c.title.slice(0, 24)}
                  </button>
                ))}
              </div>
            )}

            {/* Proactive insights from background cron */}
            <CoachInsightsList />

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && !streaming && (
                <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12">
                  <Bot className="h-10 w-10 text-primary/60 mb-3" />
                  <p className="font-display text-sm uppercase tracking-wider">Pacte Coach</p>
                  <p className="text-xs text-muted-foreground mt-2 max-w-[280px]">
                    Pose-moi une question, demande un plan, ou raconte ta journée.
                    J'analyse tes données pour t'aider à avancer.
                  </p>
                </div>
              )}
              {messages.map((m) => (
                <MessageBubble key={m.id} role={m.role} content={m.content} />
              ))}
              {streaming && streamText && (
                <MessageBubble role="assistant" content={streamText} streaming />
              )}
              {streaming && !streamText && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Coach réfléchit…
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-border p-3">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKey}
                placeholder="Écris au Coach… (Cmd+Enter pour envoyer)"
                className="min-h-[64px] resize-none text-sm"
                disabled={streaming}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Gemini 2.5 Flash
                </span>
                <Button size="sm" onClick={handleSend} disabled={streaming || !draft.trim()}>
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Envoyer
                </Button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

function MessageBubble({
  role,
  content,
  streaming = false,
}: {
  role: string;
  content: string;
  streaming?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap break-words",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted/60 text-foreground border border-border/40",
          streaming && "animate-pulse",
        )}
      >
        {content}
      </div>
    </div>
  );
}