import { useState } from "react";
import { UserX, Loader2, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DataPanel } from "@/components/profile/settings-ui";
import { useTranslation } from "react-i18next";

export function BlockedUsersPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: blockedUsers, isLoading } = useQuery({
    queryKey: ["blocked-users", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("blocked_users")
        .select("id, blocked_user_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      if (!data || data.length === 0) return [];
      const blockedIds = data.map((b: any) => b.blocked_user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", blockedIds);

      return data.map((b: any) => {
        const profile = profiles?.find((p: any) => p.id === b.blocked_user_id);
        return {
          ...b,
          display_name: profile?.display_name || t("friends.unknownAgent"),
          avatar_url: profile?.avatar_url,
        };
      });
    },
    enabled: !!user?.id,
  });

  const unblock = useMutation({
    mutationFn: async (blockedUserId: string) => {
      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("user_id", user!.id)
        .eq("blocked_user_id", blockedUserId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
      toast({ title: t("friends.userUnblocked"), description: t("friends.userUnblockedDesc") });
    },
  });

  const filtered = (blockedUsers || []).filter((b: any) =>
    b.display_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DataPanel code="MODULE_04" title={t("friends.blockedUsersTitle")} footerLeft={<span>TOTAL: <b className="text-primary">{blockedUsers?.length || 0}</b></span>}>
      <div className="py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : !blockedUsers || blockedUsers.length === 0 ? (
          <div className="text-center py-6">
            <UserX className="h-8 w-8 text-primary/20 mx-auto mb-2" />
            <p className="text-[11px] text-muted-foreground font-mono tracking-wider">{t("friends.noBlockedUsers")}</p>
          </div>
        ) : (
          <>
            {blockedUsers.length > 3 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/30" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("common.search")}
                  className="pl-9 h-9 bg-primary/5 border-primary/20 font-mono text-xs rounded-none"
                />
              </div>
            )}
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {filtered.map((b: any) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 border border-primary/10 bg-primary/[0.02] hover:border-primary/25 transition-colors"
                  style={{ clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)" }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-mono text-primary shrink-0">
                      {b.display_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-foreground truncate">{b.display_name}</p>
                      <p className="text-[9px] text-muted-foreground font-mono">
                        {new Date(b.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => unblock.mutate(b.blocked_user_id)}
                    disabled={unblock.isPending}
                    className={cn(
                      "px-2.5 py-1 text-[9px] font-mono tracking-wider uppercase border shrink-0",
                      "border-red-500/25 text-red-400/70 hover:text-red-400 hover:border-red-400/45 bg-red-950/20 hover:bg-red-900/25",
                      "transition-colors disabled:opacity-30"
                    )}
                  >
                    {unblock.isPending ? "..." : t("friends.unblock")}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DataPanel>
  );
}
