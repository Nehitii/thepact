import { useState, useRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Radar, UserPlus, UserCheck, Loader2, Users } from "lucide-react";
import { AvatarPing } from "./AvatarPing";
import { CyberEmpty } from "@/components/ui/cyber-states";
import { DSPanel, DSSkeleton } from "@/components/ds";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useMutualFriends } from "@/hooks/useMutualFriends";

export interface SearchProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface SearchTabProps {
  onSearch: (query: string) => Promise<SearchProfile[]>;
  onSendRequest: (receiverId: string) => Promise<void>;
  sendingRequest: boolean;
  getFriendshipStatus: (id: string) => "none" | "pending_sent" | "pending_received" | "accepted";
}

export function SearchTab({ onSearch, onSendRequest, sendingRequest, getFriendshipStatus }: SearchTabProps) {
  const { t } = useTranslation();
  const { getMutualCount } = useMutualFriends();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProfile[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [mutualCounts, setMutualCounts] = useState<Record<string, number>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);
    try {
      const data = await onSearch(query);
      setResults(data);
      const counts: Record<string, number> = {};
      await Promise.all(data.map(async (p) => { counts[p.id] = await getMutualCount(p.id); }));
      setMutualCounts(counts);
    } catch {
      toast.error(t("friends.searchFailed"));
    } finally {
      setSearching(false);
    }
  }, [query, onSearch, getMutualCount, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(), 200);
  };

  const handleSend = async (id: string) => {
    try {
      await onSendRequest(id);
      toast.success(t("friends.requestSent"));
      setResults((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast.error(t("friends.sendFailed"));
    }
  };

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-4 sm:p-6 max-w-3xl mx-auto">
        {/* Network Scanner Input */}
        <DSPanel tier="muted" className="mb-6">
          <span className="absolute -top-2 left-3 px-1.5 font-mono text-[9px] tracking-[0.22em] uppercase text-[hsl(var(--ds-accent-primary))] bg-[hsl(var(--ds-surface-1))]">
            [ TARGET QUERY ]
          </span>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Radar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--ds-accent-primary))]" />
              <Input
                placeholder={t("friends.searchPlaceholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 bg-[hsl(var(--ds-surface-2)/0.5)] border-[hsl(var(--ds-border-default)/0.3)] focus-visible:border-[hsl(var(--ds-accent-primary)/0.6)] focus-visible:ring-1 focus-visible:ring-[hsl(var(--ds-accent-primary)/0.3)] font-mono uppercase tracking-wider text-xs h-9"
                aria-label={t("friends.searchMembers")}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={searching || !query.trim()}
              className="h-9 px-4 font-orbitron text-[11px] tracking-[0.2em] uppercase border"
              style={{
                color: "hsl(var(--ds-accent-primary))",
                background: "hsl(var(--ds-accent-primary) / 0.1)",
                borderColor: "hsl(var(--ds-accent-primary) / 0.5)",
              }}
              aria-label={t("common.search")}
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "SCAN"}
            </Button>
          </div>
        </DSPanel>

        {searching ? (
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--ds-accent-primary)/0.7)] mb-3">
              [ SCANNING NETWORK... ]
            </p>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16">
                <DSSkeleton compact />
              </div>
            ))}
          </div>
        ) : !searched ? (
          <CyberEmpty
            icon={Radar}
            title={t("friends.findAllies")}
            subtitle="// AWAITING TARGET COORDINATES"
          />
        ) : results.length === 0 ? (
          <CyberEmpty
            icon={Radar}
            title={t("friends.noMatchingFriends", { defaultValue: "No targets found" })}
            subtitle="// SCAN COMPLETE — ZERO MATCHES"
          />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2.5">
            {results.map((profile, i) => {
              const status = getFriendshipStatus(profile.id);
              const mc = mutualCounts[profile.id];
              return (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                >
                  <DSPanel tier="secondary" className="!p-0">
                    <div className="flex items-center gap-3 p-3 sm:p-4">
                      <AvatarPing
                        name={profile.display_name}
                        avatarUrl={profile.avatar_url}
                        size="md"
                        state="offline"
                        showRing={false}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold font-orbitron tracking-wide truncate text-[hsl(var(--ds-text-primary))]">
                          {profile.display_name || t("friends.unknownAgent")}
                        </h3>
                        {mc != null && mc > 0 && (
                          <p className="text-[9px] text-[hsl(var(--ds-text-muted))] font-mono uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                            <Users className="h-2.5 w-2.5" />
                            MUTUAL × {mc}
                          </p>
                        )}
                      </div>
                      {status === "none" && (
                        <Button
                          size="sm"
                          onClick={() => handleSend(profile.id)}
                          disabled={sendingRequest}
                          className="h-8 text-xs font-bold uppercase tracking-wider border"
                          style={{
                            color: "hsl(var(--ds-accent-primary))",
                            background: "hsl(var(--ds-accent-primary) / 0.1)",
                            borderColor: "hsl(var(--ds-accent-primary) / 0.5)",
                          }}
                          aria-label={t("friends.addFriend")}
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                          {t("friends.addFriend")}
                        </Button>
                      )}
                      {status === "pending_sent" && (
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[hsl(var(--ds-text-muted))]">
                          {t("friends.requestSentStatus")}
                        </span>
                      )}
                      {status === "pending_received" && (
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[hsl(var(--ds-accent-special))]">
                          {t("friends.wantsToBeFriends")}
                        </span>
                      )}
                      {status === "accepted" && (
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[hsl(var(--ds-accent-success))] flex items-center gap-1.5">
                          <UserCheck className="h-3 w-3" /> {t("friends.alreadyFriends")}
                        </span>
                      )}
                    </div>
                  </DSPanel>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </ScrollArea>
  );
}
