import { useCallback, useRef, useState } from "react";
import { Shield, Eye, Bell, Users, Award, Loader2, Share2, Target, Link2 } from "lucide-react";
import { useProfileSettings } from "@/hooks/useProfileSettings";
import { toast } from "@/hooks/use-toast";
import { ProfileSettingsShell } from "@/components/profile/ProfileSettingsShell";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  SettingsBreadcrumb, CyberSeparator, DataPanel, SettingRow, SyncIndicator,
} from "@/components/profile/settings-ui";
import { BlockedUsersPanel } from "@/components/profile/BlockedUsersPanel";

export default function PrivacyControl() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile, isLoading, updateProfile } = useProfileSettings();
  const queryClient = useQueryClient();
  const [syncingPanel, setSyncingPanel] = useState<number | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout>>();

  const markSync = useCallback((panel: number) => {
    setSyncingPanel(panel);
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => setSyncingPanel(null), 2000);
  }, []);

  type PrivacyKey =
    | "community_profile_discoverable"
    | "show_activity_status"
    | "share_goals_progress"
    | "share_achievements"
    | "community_updates_enabled"
    | "achievement_celebrations_enabled";

  const toggle = useCallback((key: PrivacyKey, value: boolean, panel: number) => {
    updateProfile.mutate(
      { [key]: value },
      {
        onSuccess: () => {
          toast({ title: t("settings.privacy.toasts.updated"), description: t("settings.privacy.toasts.updatedDesc") });
          markSync(panel);
        },
      }
    );
  }, [updateProfile, t, markSync]);

  const isPending = isLoading || updateProfile.isPending;

  // Shared data overview
  const { data: sharedData } = useQuery({
    queryKey: ["shared-data-overview", user?.id],
    queryFn: async () => {
      if (!user?.id) return { sharedGoals: 0, sharedPacts: 0, sharedGoalsList: [], sharedPactsList: [] };
      const { data: goals, error: gErr } = await supabase
        .from("shared_goals")
        .select("id, goal_id, shared_with_id")
        .eq("owner_id", user.id);
      const { data: pacts, error: pErr } = await supabase
        .from("shared_pacts")
        .select("id, pact_id, member_id")
        .eq("owner_id", user.id);
      return {
        sharedGoals: goals?.length || 0,
        sharedPacts: pacts?.length || 0,
        sharedGoalsList: goals || [],
        sharedPactsList: pacts || [],
      };
    },
    enabled: !!user?.id,
  });

  const revokeGoalShare = useMutation({
    mutationFn: async (shareId: string) => {
      const { error } = await supabase.from("shared_goals").delete().eq("id", shareId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-data-overview"] });
      toast({ title: "Partage révoqué", description: "L'accès a été retiré." });
    },
  });

  const revokePactShare = useMutation({
    mutationFn: async (shareId: string) => {
      const { error } = await supabase.from("shared_pacts").delete().eq("id", shareId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-data-overview"] });
      toast({ title: "Partage révoqué", description: "L'accès au pact a été retiré." });
    },
  });

  // Stats
  const visibilityOn = [profile?.community_profile_discoverable ?? true, profile?.show_activity_status ?? true].filter(Boolean).length;
  const sharingOn = [profile?.share_goals_progress ?? true, profile?.share_achievements ?? true].filter(Boolean).length;

  if (isLoading) {
    return (
      <ProfileSettingsShell title={t("settings.privacy.title")} subtitle={t("settings.privacy.subtitle")} icon={<Shield className="h-7 w-7 text-primary" />} containerClassName="max-w-3xl">
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </ProfileSettingsShell>
    );
  }

  return (
    <ProfileSettingsShell title={t("settings.privacy.title")} subtitle={t("settings.privacy.subtitle")} icon={<Shield className="h-7 w-7 text-primary" />} containerClassName="max-w-3xl">
      <SettingsBreadcrumb code="PRV.05" />
      <CyberSeparator />

      {/* ── PANEL 1: Community Visibility ── */}
      <DataPanel
        code="MODULE_01" title="VISIBILITÉ COMMUNAUTAIRE"
        statusText={<span className={cn(visibilityOn === 2 ? "text-muted-foreground" : "text-[hsl(40,100%,50%)]")}>{visibilityOn}/2 ACTIFS</span>}
        footerLeft={<span>VISIBLE: <b className="text-primary">{visibilityOn}/2</b></span>}
        footerRight={<SyncIndicator syncing={syncingPanel === 1} />}
      >
        <SettingRow icon={<Users className="h-4 w-4 text-primary" />} label={t("settings.privacy.profileDiscoverable")} description={t("settings.privacy.profileDiscoverableDesc")} checked={profile?.community_profile_discoverable ?? true} disabled={isPending} onToggle={(v) => toggle("community_profile_discoverable", v, 1)} />
        <SettingRow icon={<Eye className="h-4 w-4 text-primary" />} label={t("settings.privacy.showActivityStatus")} description={t("settings.privacy.showActivityStatusDesc")} checked={profile?.show_activity_status ?? true} disabled={isPending} onToggle={(v) => toggle("show_activity_status", v, 1)} />
      </DataPanel>

      {/* ── PANEL 2: Goal Visibility ── */}
      <DataPanel
        code="MODULE_02" title="VISIBILITÉ DES OBJECTIFS"
        statusText={<span className={cn(sharingOn === 2 ? "text-muted-foreground" : "text-[hsl(40,100%,50%)]")}>{sharingOn}/2 ACTIFS</span>}
        footerLeft={<span>PARTAGE: <b className="text-primary">{sharingOn}/2</b></span>}
        footerRight={<SyncIndicator syncing={syncingPanel === 2} />}
      >
        <SettingRow icon={<Eye className="h-4 w-4 text-primary" />} label={t("settings.privacy.shareGoalsProgress")} description={t("settings.privacy.shareGoalsProgressDesc")} checked={profile?.share_goals_progress ?? true} disabled={isPending} onToggle={(v) => toggle("share_goals_progress", v, 2)} />
        <SettingRow icon={<Award className="h-4 w-4 text-primary" />} label={t("settings.privacy.shareAchievements")} description={t("settings.privacy.shareAchievementsDesc")} checked={profile?.share_achievements ?? true} disabled={isPending} onToggle={(v) => toggle("share_achievements", v, 2)} />
      </DataPanel>

      {/* ── PANEL 3: Community Notifications ── */}
      <DataPanel
        code="MODULE_03" title="NOTIFICATIONS COMMUNAUTAIRES"
        footerRight={<SyncIndicator syncing={syncingPanel === 3} />}
      >
        <SettingRow icon={<Bell className="h-4 w-4 text-primary" />} label={t("settings.privacy.communityUpdates")} description={t("settings.privacy.communityUpdatesDesc")} checked={profile?.community_updates_enabled ?? true} disabled={isPending} onToggle={(v) => toggle("community_updates_enabled", v, 3)} />
        <SettingRow icon={<Award className="h-4 w-4 text-primary" />} label={t("settings.privacy.achievementCelebrations")} description={t("settings.privacy.achievementCelebrationsDesc")} checked={profile?.achievement_celebrations_enabled ?? true} disabled={isPending} onToggle={(v) => toggle("achievement_celebrations_enabled", v, 3)} />
      </DataPanel>

      {/* ── PANEL 4: Blocked Users ── */}
      <BlockedUsersPanel />

      {/* ── PANEL 5: Shared Data Overview ── */}
      <DataPanel
        code="MODULE_05" title="DONNÉES PARTAGÉES"
        footerLeft={<><span>GOALS: <b className="text-primary">{sharedData?.sharedGoals || 0}</b></span><span>PACTS: <b className="text-primary">{sharedData?.sharedPacts || 0}</b></span></>}
      >
        <div className="py-4 space-y-3">
          {(!sharedData?.sharedGoals && !sharedData?.sharedPacts) ? (
            <div className="text-center py-6">
              <Share2 className="h-8 w-8 text-primary/20 mx-auto mb-2" />
              <p className="text-[11px] text-muted-foreground font-mono tracking-wider">AUCUNE DONNÉE PARTAGÉE</p>
            </div>
          ) : (
            <>
              {sharedData?.sharedGoalsList && sharedData.sharedGoalsList.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[9px] text-primary/40 font-mono tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                    <Target className="h-3 w-3" /> OBJECTIFS PARTAGÉS ({sharedData.sharedGoals})
                  </p>
                  {sharedData.sharedGoalsList.map((sg: any) => (
                    <div key={sg.id} className="flex items-center justify-between px-3 py-2 border border-primary/10 bg-primary/[0.02] text-[10px] font-mono">
                      <span className="text-primary/60 truncate flex-1">Goal #{sg.goal_id.slice(0, 8)}...</span>
                      <button
                        onClick={() => revokeGoalShare.mutate(sg.id)}
                        disabled={revokeGoalShare.isPending}
                        className="text-red-400/60 hover:text-red-400 transition-colors ml-2 uppercase tracking-wider"
                      >
                        RÉVOQUER
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {sharedData?.sharedPactsList && sharedData.sharedPactsList.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[9px] text-primary/40 font-mono tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                    <Link2 className="h-3 w-3" /> PACTS PARTAGÉS ({sharedData.sharedPacts})
                  </p>
                  {sharedData.sharedPactsList.map((sp: any) => (
                    <div key={sp.id} className="flex items-center justify-between px-3 py-2 border border-primary/10 bg-primary/[0.02] text-[10px] font-mono">
                      <span className="text-primary/60 truncate flex-1">Pact #{sp.pact_id.slice(0, 8)}...</span>
                      <button
                        onClick={() => revokePactShare.mutate(sp.id)}
                        disabled={revokePactShare.isPending}
                        className="text-red-400/60 hover:text-red-400 transition-colors ml-2 uppercase tracking-wider"
                      >
                        RÉVOQUER
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DataPanel>

      <div className="h-8" />
    </ProfileSettingsShell>
  );
}
