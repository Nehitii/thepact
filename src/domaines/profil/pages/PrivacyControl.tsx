import { useCallback, useRef, useState } from "react";
import { Eye, Bell, Users, Award, Loader2, Share2, Target, Link2 } from "lucide-react";
import { useProfileSettings } from "@/socle/hooks/useProfileSettings";
import { Switch } from "@/socle/ui/switch";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/socle/contextes/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import { ConsoleReglages } from "@/domaines/profil/composants/ConsoleReglages";
import { Panneau, Reglage } from "@/socle/ds/console-ui";
import { BlockedUsersPanel } from "@/domaines/profil/composants/BlockedUsersPanel";

/* Trois cles de plus figuraient ici — share_achievements,
   community_updates_enabled, achievement_celebrations_enabled —
   sans interrupteur ni effet. Voir useProfileSettings. */
type CleVieePrivee =
  | "community_profile_discoverable"
  | "show_activity_status"
  | "share_goals_progress";

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
      /* Il s efface au lieu de revenir a « en attente » : la ligne
         etait masquee quand ce code a ete ecrit. */
      () => setJournaux((j) => { const c = { ...j }; delete c[panneau]; return c; }),
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

  /* LE PANNEAU NE SE FIGE PLUS PENDANT L ECRITURE.
     `updateProfile.isPending` verrouillait les six interrupteurs a
     chaque bascule — mesure : 71 ms de panneau inerte. Le cache portant
     desormais la valeur avant le reseau, il n y a plus rien a proteger,
     et une ecriture qui echoue revient en arriere d elle-meme. */
  const enCours = isLoading;

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
  const partagees = [profile?.share_goals_progress ?? true].filter(Boolean).length;
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
        code="Visibilité"
        etat={t("settings.console.activeOf", "{{n}} sur {{total}}", { n: visibles, total: 2 })}
        ton={tonExposition(visibles)}
        rang="primaire"
        journal={journaux.visibilite ?? null}
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
        code="Objectifs"
        etat={t("settings.console.activeOf", "{{n}} sur {{total}}", { n: partagees, total: 1 })}
        ton={tonExposition(partagees)}
        journal={journaux.objectifs ?? null}
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

      </Panneau>

      {/* TROIS REGLAGES RETIRES, FAUTE D AVOIR QUOI QUE CE SOIT A GARDER.
          « Partager les succes » : aucun ecran n expose les succes de
          quelqu un d autre — ni la carte publique, ni la communaute.
          Il n y avait rien a partager, donc rien a couper.

          « Mises a jour communautaires » et « Celebrations de succes »
          filtrent des notifications sociales. La table des
          notifications n en a jamais porte une seule : elle ne contient
          que « progress » et « system ». Deux robinets sur une conduite
          vide.

          Les trois colonnes restent en base — les retirer demanderait
          une migration destructrice pour rien. Le jour ou ces
          fonctionnalites existeront, l ecran pourra les reprendre ; en
          attendant il ne promet plus ce qu il ne tient pas.

          Note : la categorie « Notifications sociales », elle, est
          desormais reellement appliquee — voir le declencheur
          notifications_categorie_voulue. */}

      <BlockedUsersPanel />

      {/* ── CE QUI EST DEJA PARTAGE ── */}
      <Panneau
        code="Déjà partagé"
        etat={nbPartages
          ? t("settings.privacy.sharedCount", "{{n}} partage(s)", { n: nbPartages })
          : t("settings.console.none", "aucun")}
        ton={nbPartages ? "actif" : "neutre"}
        journal={journaux.partages ?? null}
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
