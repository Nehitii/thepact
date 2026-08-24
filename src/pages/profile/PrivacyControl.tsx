import { useCallback, useRef, useState } from "react";
import { Eye, Bell, Users, Award, Loader2, Share2, Target, Link2 } from "lucide-react";
import { useProfileSettings } from "@/hooks/useProfileSettings";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ConsoleReglages } from "@/components/profile/ConsoleReglages";
import { Panneau, Reglage } from "@/components/profile/console-ui";
import { BlockedUsersPanel } from "@/components/profile/BlockedUsersPanel";

type CleVieePrivee =
  | "community_profile_discoverable"
  | "show_activity_status"
  | "share_goals_progress"
  | "share_achievements"
  | "community_updates_enabled"
  | "achievement_celebrations_enabled";

export default function PrivacyControl() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile, isLoading, updateProfile } = useProfileSettings();
  const queryClient = useQueryClient();

  const [journaux, setJournaux] = useState<Record<string, { texte: string; type: "info" | "ok" | "warn" }>>({});
  const minuteurs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const noter = useCallback((panneau: string, texte: string, type: "info" | "ok" | "warn" = "ok") => {
    setJournaux((j) => ({ ...j, [panneau]: { texte, type } }));
    clearTimeout(minuteurs.current[panneau]);
    minuteurs.current[panneau] = setTimeout(
      () => setJournaux((j) => ({ ...j, [panneau]: { texte: "en attente", type: "info" } })),
      4000,
    );
  }, []);

  const basculer = useCallback(
    (cle: CleVieePrivee, valeur: boolean, panneau: string, nom: string) => {
      updateProfile.mutate({ [cle]: valeur }, {
        onSuccess: () => {
          toast.success(t("settings.privacy.toasts.updated"));
          noter(panneau, `${nom.toLowerCase()} → ${valeur ? "visible" : "masqué"}`, valeur ? "ok" : "warn");
        },
      });
    },
    [updateProfile, t, noter],
  );

  const enCours = isLoading || updateProfile.isPending;

  const { data: partages } = useQuery({
    queryKey: ["shared-data-overview", user?.id],
    queryFn: async () => {
      if (!user?.id) return { objectifs: [], pactes: [] };
      const { data: goals } = await supabase.from("shared_goals").select("id, goal_id, shared_with_id").eq("owner_id", user.id);
      const { data: pacts } = await supabase.from("shared_pacts").select("id, pact_id, member_id").eq("owner_id", user.id);
      return { objectifs: goals ?? [], pactes: pacts ?? [] };
    },
    enabled: !!user?.id,
  });

  const revoquer = useMutation({
    mutationFn: async ({ table, id }: { table: "shared_goals" | "shared_pacts"; id: string }) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ["shared-data-overview"] });
      toast.success(t("settings.privacy.shareRevoked", "Partage révoqué"));
      noter("partages", `${v.table === "shared_goals" ? "objectif" : "pacte"} → partage révoqué`, "warn");
    },
  });

  const visibles = [profile?.community_profile_discoverable ?? true, profile?.show_activity_status ?? true].filter(Boolean).length;
  const partagees = [profile?.share_goals_progress ?? true, profile?.share_achievements ?? true].filter(Boolean).length;
  const nbPartages = (partages?.objectifs.length ?? 0) + (partages?.pactes.length ?? 0);

  if (isLoading) {
    return (
      <ConsoleReglages titre={t("settings.privacy.title")}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ConsoleReglages>
    );
  }

  const attente = { texte: "en attente", type: "info" } as const;

  /* Une case decochee, ici, protege : l etat « tout actif » n est donc
     pas un etat de reussite. Le temoin reste neutre quand on se cache,
     et ne s allume que pour dire ce qui est expose. */
  const tonExposition = (n: number) => (n === 0 ? "neutre" : "actif");

  return (
    <ConsoleReglages
      titre={t("settings.privacy.title")}
      note={t("settings.privacy.subtitle")}
    >
      <Panneau
        code="priv.visibility"
        etat={t("settings.console.activeOf", "{{n}} sur {{total}}", { n: visibles, total: 2 })}
        ton={tonExposition(visibles)}
        rang="primaire"
        journal={journaux.visibilite ?? attente}
      >
        <Reglage
          nom={t("settings.privacy.profileDiscoverable")}
          note={t("settings.privacy.profileDiscoverableDesc")}
          icone={<Users />}
        >
          <Switch
            checked={profile?.community_profile_discoverable ?? true}
            disabled={enCours}
            onCheckedChange={(v) => basculer("community_profile_discoverable", v, "visibilite", t("settings.privacy.profileDiscoverable"))}
          />
        </Reglage>

        <Reglage
          nom={t("settings.privacy.showActivityStatus")}
          note={t("settings.privacy.showActivityStatusDesc")}
          icone={<Eye />}
        >
          <Switch
            checked={profile?.show_activity_status ?? true}
            disabled={enCours}
            onCheckedChange={(v) => basculer("show_activity_status", v, "visibilite", t("settings.privacy.showActivityStatus"))}
          />
        </Reglage>
      </Panneau>

      <Panneau
        code="priv.goals"
        etat={t("settings.console.activeOf", "{{n}} sur {{total}}", { n: partagees, total: 2 })}
        ton={tonExposition(partagees)}
        journal={journaux.objectifs ?? attente}
      >
        <Reglage
          nom={t("settings.privacy.shareGoalsProgress")}
          note={t("settings.privacy.shareGoalsProgressDesc")}
          icone={<Eye />}
        >
          <Switch
            checked={profile?.share_goals_progress ?? true}
            disabled={enCours}
            onCheckedChange={(v) => basculer("share_goals_progress", v, "objectifs", t("settings.privacy.shareGoalsProgress"))}
          />
        </Reglage>

        <Reglage
          nom={t("settings.privacy.shareAchievements")}
          note={t("settings.privacy.shareAchievementsDesc")}
          icone={<Award />}
        >
          <Switch
            checked={profile?.share_achievements ?? true}
            disabled={enCours}
            onCheckedChange={(v) => basculer("share_achievements", v, "objectifs", t("settings.privacy.shareAchievements"))}
          />
        </Reglage>
      </Panneau>

      <Panneau
        code="priv.community"
        etat={t("settings.console.synced", "synchronisé")}
        ton="actif"
        journal={journaux.communaute ?? attente}
      >
        <Reglage
          nom={t("settings.privacy.communityUpdates")}
          note={t("settings.privacy.communityUpdatesDesc")}
          icone={<Bell />}
        >
          <Switch
            checked={profile?.community_updates_enabled ?? true}
            disabled={enCours}
            onCheckedChange={(v) => basculer("community_updates_enabled", v, "communaute", t("settings.privacy.communityUpdates"))}
          />
        </Reglage>

        <Reglage
          nom={t("settings.privacy.achievementCelebrations")}
          note={t("settings.privacy.achievementCelebrationsDesc")}
          icone={<Award />}
        >
          <Switch
            checked={profile?.achievement_celebrations_enabled ?? true}
            disabled={enCours}
            onCheckedChange={(v) => basculer("achievement_celebrations_enabled", v, "communaute", t("settings.privacy.achievementCelebrations"))}
          />
        </Reglage>
      </Panneau>

      <BlockedUsersPanel />

      {/* ── CE QUI EST DEJA PARTAGE ── */}
      <Panneau
        code="priv.shared"
        etat={nbPartages
          ? t("settings.privacy.sharedCount", "{{n}} partage(s)", { n: nbPartages })
          : t("settings.console.none", "aucun")}
        ton={nbPartages ? "actif" : "neutre"}
        journal={journaux.partages ?? attente}
      >
        {nbPartages === 0 ? (
          <p className="flex items-center gap-2.5 py-4 text-sm font-rajdhani text-muted-foreground">
            <Share2 className="h-4 w-4 opacity-40" />
            {t("settings.privacy.noSharedData", "Rien n’est partagé pour l’instant.")}
          </p>
        ) : (
          <div className="py-2 space-y-4">
            {partages!.objectifs.length > 0 && (
              <ListePartages
                icone={<Target className="h-3 w-3" />}
                titre={t("settings.privacy.sharedGoals", "Objectifs partagés")}
                lignes={partages!.objectifs.map((o) => ({ id: o.id, etiquette: `#${o.goal_id.slice(0, 8)}` }))}
                onRevoquer={(id) => revoquer.mutate({ table: "shared_goals", id })}
                enCours={revoquer.isPending}
                libelleRevoquer={t("settings.privacy.revoke", "Révoquer")}
              />
            )}
            {partages!.pactes.length > 0 && (
              <ListePartages
                icone={<Link2 className="h-3 w-3" />}
                titre={t("settings.privacy.sharedPacts", "Pactes partagés")}
                lignes={partages!.pactes.map((p) => ({ id: p.id, etiquette: `#${p.pact_id.slice(0, 8)}` }))}
                onRevoquer={(id) => revoquer.mutate({ table: "shared_pacts", id })}
                enCours={revoquer.isPending}
                libelleRevoquer={t("settings.privacy.revoke", "Révoquer")}
              />
            )}
          </div>
        )}
      </Panneau>
    </ConsoleReglages>
  );
}

function ListePartages({
  icone, titre, lignes, onRevoquer, enCours, libelleRevoquer,
}: {
  icone: React.ReactNode;
  titre: string;
  lignes: { id: string; etiquette: string }[];
  onRevoquer: (id: string) => void;
  enCours: boolean;
  libelleRevoquer: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="rg-champ-etiquette flex items-center gap-1.5">
        {icone} {titre} ({lignes.length})
      </p>
      {lignes.map((l) => (
        <div
          key={l.id}
          className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-primary/10 bg-primary/[0.02] font-mono text-xs"
        >
          <span className="text-primary/70 truncate">{l.etiquette}</span>
          <button
            type="button"
            onClick={() => onRevoquer(l.id)}
            disabled={enCours}
            className="text-destructive/70 hover:text-destructive transition-colors uppercase tracking-wider disabled:opacity-40"
          >
            {libelleRevoquer}
          </button>
        </div>
      ))}
    </div>
  );
}
