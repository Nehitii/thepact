import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";
import { CyberLoader, CyberEmpty } from "@/components/ui/cyber-states";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { RequestNode } from "./RequestNode";
import { DSDivider } from "@/components/ds";
import type { FriendRequest, SentRequest } from "@/hooks/useFriends";

interface RequestsTabProps {
  pendingRequests: FriendRequest[];
  sentRequests: SentRequest[];
  loading: boolean;
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
  onCancelSent: (id: string) => Promise<void>;
}

export function RequestsTab({ pendingRequests, sentRequests, loading, onAccept, onDecline, onCancelSent }: RequestsTabProps) {
  const { t } = useTranslation();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const wrap = async (fn: () => Promise<void>, id: string, ok: string, err: string) => {
    setLoadingId(id);
    try { await fn(); toast.success(ok); }
    catch { toast.error(err); }
    finally { setLoadingId(null); }
  };

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-4 sm:p-6 max-w-3xl mx-auto">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-4">
          <h4 className="font-mono text-[10px] tracking-[0.22em] uppercase text-[hsl(var(--ds-accent-special))] shrink-0">
            [ INCOMING SIGNALS ]
          </h4>
          <DSDivider accent="special" />
        </div>

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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2.5 mb-8">
              {pendingRequests.map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, transition: { duration: 0.18 } }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  layout
                >
                  <RequestNode
                    variant="incoming"
                    displayName={req.sender_profile?.display_name ?? null}
                    avatarUrl={req.sender_profile?.avatar_url ?? null}
                    createdAt={req.created_at}
                    loading={loadingId === req.id}
                    onAccept={() => wrap(() => onAccept(req.id), req.id, t("friends.requestAccepted"), t("friends.acceptFailed"))}
                    onDecline={() => wrap(() => onDecline(req.id), req.id, t("friends.requestDeclined"), t("friends.declineFailed"))}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {sentRequests.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-4 mt-8">
              <h4 className="font-mono text-[10px] tracking-[0.22em] uppercase text-[hsl(var(--ds-text-muted))] shrink-0">
                [ TRANSMITTED ]
              </h4>
              <DSDivider accent="primary" />
            </div>
            <div className="space-y-2">
              {sentRequests.map((req) => (
                <RequestNode
                  key={req.id}
                  variant="sent"
                  displayName={req.receiver_profile?.display_name ?? null}
                  avatarUrl={req.receiver_profile?.avatar_url ?? null}
                  createdAt={req.created_at}
                  loading={loadingId === req.id}
                  onCancel={() => wrap(() => onCancelSent(req.id), req.id, t("friends.requestCancelled"), t("friends.cancelFailed"))}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
