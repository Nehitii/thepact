import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { UserCheck, X, Clock, Send } from "lucide-react";
import { FriendAvatar } from "./FriendAvatar";
import { CyberLoader, CyberEmpty } from "@/components/ui/cyber-states";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { FriendRequest } from "@/hooks/useFriends";
import { supabase } from "@/integrations/supabase/client";

interface RequestsTabProps {
  pendingRequests: FriendRequest[];
  sentRequests: any[];
  loading: boolean;
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
}

export function RequestsTab({ pendingRequests, sentRequests, loading, onAccept, onDecline }: RequestsTabProps) {
  const { t } = useTranslation();

  const handleAccept = async (id: string) => {
    try {
      await onAccept(id);
      toast.success(t("friends.requestAccepted"));
    } catch {
      toast.error(t("friends.acceptFailed"));
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await onDecline(id);
      toast.success(t("friends.requestDeclined"));
    } catch {
      toast.error(t("friends.declineFailed"));
    }
  };

  const handleCancelSent = async (id: string) => {
    try {
      await supabase.from("friendships").delete().eq("id", id);
      toast.success(t("friends.requestCancelled"));
    } catch {
      toast.error(t("friends.cancelFailed"));
    }
  };

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-6 max-w-3xl mx-auto">
        {/* Received */}
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
          {t("friends.receivedRequests")}
        </h4>

        {loading ? (
          <CyberLoader rows={2} label={t("common.loading")} />
        ) : pendingRequests.length === 0 ? (
          <CyberEmpty
            icon={Clock}
            title={t("friends.noRequestsTitle")}
            subtitle={t("friends.noRequestsDesc")}
          />
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 mb-8">
              {pendingRequests.map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                  transition={{ delay: i * 0.05 }}
                  layout
                  className="flex items-center gap-4 p-4 rounded-xl border border-violet-500/30 bg-violet-500/5"
                >
                  <FriendAvatar
                    name={req.sender_profile?.display_name}
                    avatarUrl={req.sender_profile?.avatar_url}
                    ring="violet"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold font-orbitron tracking-wide truncate text-foreground">
                      {req.sender_profile?.display_name || t("friends.unknownAgent")}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(req.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider h-8"
                      aria-label={t("friends.acceptRequest")}
                    >
                      <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                      {t("friends.accept")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDecline(req.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/30 text-xs font-bold uppercase tracking-wider h-8"
                      aria-label={t("friends.declineRequest")}
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" />
                      {t("friends.decline")}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Sent */}
        {sentRequests.length > 0 && (
          <>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 mt-6">
              {t("friends.sentRequests")}
            </h4>
            <div className="space-y-2">
              {sentRequests.map((req: any) => (
                <div key={req.id} className="flex items-center gap-4 p-3 rounded-xl border border-border bg-card/50">
                  <Send className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-mono">
                      {t("friends.sentTo")} {req.receiver_id.slice(0, 8)}…
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 font-mono">
                      {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCancelSent(req.id)}
                    className="text-xs text-muted-foreground hover:text-destructive h-7"
                    aria-label={t("friends.cancelRequest")}
                  >
                    <X className="h-3 w-3 mr-1" />
                    {t("common.cancel")}
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
