import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, UserCheck, Loader2, Users } from "lucide-react";
import { FriendAvatar } from "./FriendAvatar";
import { CyberEmpty } from "@/components/ui/cyber-states";
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
  const [searching, setSearching] = useState(false);
  const [mutualCounts, setMutualCounts] = useState<Record<string, number>>({});

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const data = await onSearch(query);
      setResults(data);
      // Load mutual counts in background
      const counts: Record<string, number> = {};
      await Promise.all(
        data.map(async (p) => {
          counts[p.id] = await getMutualCount(p.id);
        })
      );
      setMutualCounts(counts);
    } catch {
      toast.error(t("friends.searchFailed"));
    } finally {
      setSearching(false);
    }
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
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("friends.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10 bg-muted/50 border-border font-rajdhani"
              aria-label={t("friends.searchMembers")}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider text-xs"
            aria-label={t("common.search")}
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.search")}
          </Button>
        </div>

        {results.length === 0 ? (
          <CyberEmpty
            icon={Search}
            title={t("friends.findAllies")}
            subtitle={t("friends.searchHint")}
          />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {results.map((profile, i) => {
              const status = getFriendshipStatus(profile.id);
              const mc = mutualCounts[profile.id];
              return (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card"
                >
                  <FriendAvatar name={profile.display_name} avatarUrl={profile.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold font-orbitron tracking-wide truncate text-foreground">
                      {profile.display_name || t("friends.unknownAgent")}
                    </h3>
                    {mc != null && mc > 0 && (
                      <p className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {t("friends.mutualFriends", { count: mc })}
                      </p>
                    )}
                  </div>
                  {status === "none" && (
                    <Button
                      size="sm"
                      onClick={() => handleSend(profile.id)}
                      disabled={sendingRequest}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold uppercase tracking-wider h-8"
                      aria-label={t("friends.addFriend")}
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                      {t("friends.addFriend")}
                    </Button>
                  )}
                  {status === "pending_sent" && (
                    <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                      {t("friends.requestSentStatus")}
                    </span>
                  )}
                  {status === "pending_received" && (
                    <span className="text-xs text-violet-400 font-mono uppercase tracking-wider">
                      {t("friends.wantsToBeFriends")}
                    </span>
                  )}
                  {status === "accepted" && (
                    <span className="text-xs text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5" /> {t("friends.alreadyFriends")}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </ScrollArea>
  );
}
