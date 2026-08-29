import { useCallback, useRef, useState } from "react";
import { Bell, Zap, Volume2, MessageSquare, Gift, AlertCircle, Loader2, Clock, Brain, Send, BellOff } from "lucide-react";
import { useNotificationSettings } from "@/domaines/social";
import { usePushNotifications } from "@/domaines/profil/hooks/usePushNotifications";
import { useAuth } from "@/socle/contextes/AuthContext";
import { supabase } from "@/socle/supabase/client";
import { Switch } from "@/socle/ui/switch";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/socle/ui/select";
import { ConsoleReglages } from "@/domaines/profil/composants/ConsoleReglages";
import { Panneau, Reglage, Champ, Alerte, Bouton } from "@/socle/ds/console-ui";
import "@/socle/ds/reglages.css";

const HEURES = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

export default function NotificationSettings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { settings, isLoading, updateSettings } = useNotificationSettings();
  const push = usePushNotifications();

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
    (cle: string, valeur: boolean, panneau: string, nom: string) => {
      updateSettings.mutate({ [cle]: valeur } as never, {
        onSuccess: () => {
          toast.success(t("settings.notifications.toasts.updated"));
          noter(panneau, `${nom.toLowerCase()} → ${valeur ? "actif" : "coupé"}`, valeur ? "ok" : "warn");
        },
      });
    },
    [updateSettings, t, noter],
  );

  const heuresCalmes = useCallback(
    (cle: string, valeur: string | null) => {
      updateSettings.mutate({ [cle]: valeur || null } as never, {
        onSuccess: () => {
          toast.success(t("common.updated"));
          noter("calme", `${cle.includes("start") ? "début" : "fin"} → ${valeur ?? "aucune"}`, valeur ? "ok" : "warn");
        },
      });
    },
    [updateSettings, t, noter],
  );

  /* LE PANNEAU NE SE FIGE PLUS PENDANT L ECRITURE.
     `updateSettings.isPending` verrouillait les sept interrupteurs a
     chaque bascule. Le cache portant desormais la valeur avant le
     reseau, il n y a plus rien a proteger : chacun reste manipulable,
     et une ecriture qui echoue revient en arriere d elle-meme. */
  const enCours = isLoading;
  const categories = ["system_enabled", "progress_enabled", "social_enabled", "marketing_enabled"] as const;
  const actives = categories.filter((k) => settings?.[k] ?? true).length;

  const debut = (settings as { quiet_hours_start?: string })?.quiet_hours_start || "";
  const fin = (settings as { quiet_hours_end?: string })?.quiet_hours_end || "";
  const calmeActif = !!debut && !!fin;

  if (isLoading) {
    return (
      <ConsoleReglages titre={t("settings.notifications.title")}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ConsoleReglages>
    );
  }


  return (
    <ConsoleReglages
      titre={t("settings.notifications.title")}
      note={t("settings.notifications.subtitle")}
    >
      {/* ── LES FLUX ── */}
      <Panneau
        code="Flux d’alertes"
        etat={t("settings.console.activeOf", "{{n}} sur {{total}}", { n: actives, total: categories.length })}
        /* Zero flux actif n est pas un etat neutre : on ne recevra plus
           rien, et il faut que ca se voie. */
        ton={actives === 0 ? "alerte" : "actif"}
        rang="primaire"
        journal={journaux.flux ?? null}
      >
        {([
          ["system_enabled", "settings.notifications.system", "settings.notifications.systemDesc", <Zap key="z" />],
          ["progress_enabled", "settings.notifications.progress", "settings.notifications.progressDesc", <Volume2 key="v" />],
          ["social_enabled", "settings.notifications.social", "settings.notifications.socialDesc", <MessageSquare key="m" />],
          ["marketing_enabled", "settings.notifications.marketing", "settings.notifications.marketingDesc", <Gift key="g" />],
        ] as const).map(([cle, nomCle, noteCle, icone]) => (
          <Reglage key={cle} nom={t(nomCle)} note={t(noteCle)} icone={icone}>
            <Switch
              checked={settings?.[cle] ?? true}
              disabled={enCours}
              onCheckedChange={(v) => basculer(cle, v, "flux", t(nomCle))}
            />
          </Reglage>
        ))}
      </Panneau>

      {/* ── LES CONTROLES ── */}
      <Panneau
        code="Contrôles"
        etat={settings?.focus_mode
          ? t("settings.notifications.focusOn", "concentration")
          : t("settings.console.synced", "synchronisé")}
        ton={settings?.focus_mode ? "alerte" : "actif"}
        journal={journaux.systeme ?? null}
      >
        {settings?.focus_mode && (
          <Alerte>
            {t("settings.notifications.focusBanner", "Mode concentration actif — toutes les alertes sont silencieuses.")}
          </Alerte>
        )}

        <Reglage
          nom={t("settings.notifications.pushEnabled")}
          note={t("settings.notifications.pushEnabledDesc")}
          icone={<Bell />}
        >
          <Switch
            checked={settings?.push_enabled ?? true}
            disabled={enCours}
            onCheckedChange={(v) => basculer("push_enabled", v, "systeme", t("settings.notifications.pushEnabled"))}
          />
        </Reglage>

        <Reglage
          nom={t("settings.notifications.focusMode")}
          note={t("settings.notifications.focusModeDesc")}
          icone={<AlertCircle />}
        >
          <Switch
            checked={settings?.focus_mode ?? false}
            disabled={enCours}
            onCheckedChange={(v) => basculer("focus_mode", v, "systeme", t("settings.notifications.focusMode"))}
          />
        </Reglage>

        <Reglage
          nom={t("settings.notifications.mia", "M.I.A proactive")}
          note={t("settings.notifications.miaDesc", "M.I.A analyse tes données toutes les quatre heures pour en tirer des constats.")}
          icone={<Brain />}
        >
          <Switch
            checked={(settings as { mia_proactive_enabled?: boolean })?.mia_proactive_enabled ?? true}
            disabled={enCours}
            onCheckedChange={(v) => basculer("mia_proactive_enabled", v, "systeme", t("settings.notifications.mia", "M.I.A proactive"))}
          />
        </Reglage>
      </Panneau>

      {/* ── LES HEURES CALMES ── */}
      <Panneau
        code="Heures calmes"
        etat={calmeActif ? `${debut} → ${fin}` : t("settings.console.off", "coupé")}
        ton={calmeActif ? "actif" : "neutre"}
        journal={journaux.calme ?? null}
      >
        <Reglage
          nom={t("settings.notifications.quietHours", "Ne pas déranger")}
          note={t("settings.notifications.quietHoursDesc", "Aucune notification poussée pendant cette plage. Les deux heures doivent être choisies pour que la plage s’applique.")}
          icone={<Clock />}
          large
        >
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <Champ etiquette={t("settings.notifications.from", "Début")}>
              <Select
                value={debut || "aucune"}
                onValueChange={(v) => heuresCalmes("quiet_hours_start", v === "aucune" ? null : v)}
              >
                <SelectTrigger className="h-9 font-mono text-xs border-primary/20 bg-primary/5">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/20">
                  <SelectItem value="aucune" className="font-mono text-xs">— {t("settings.console.off", "coupé")}</SelectItem>
                  {HEURES.map((h) => (
                    <SelectItem key={h} value={h} className="font-mono text-xs">{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Champ>

            <Champ etiquette={t("settings.notifications.to", "Fin")}>
              <Select
                value={fin || "aucune"}
                onValueChange={(v) => heuresCalmes("quiet_hours_end", v === "aucune" ? null : v)}
              >
                <SelectTrigger className="h-9 font-mono text-xs border-primary/20 bg-primary/5">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/20">
                  <SelectItem value="aucune" className="font-mono text-xs">— {t("settings.console.off", "coupé")}</SelectItem>
                  {HEURES.map((h) => (
                    <SelectItem key={h} value={h} className="font-mono text-xs">{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Champ>
          </div>
        </Reglage>
      </Panneau>

      {/* ── LE PUSH NAVIGATEUR ── */}
      <Panneau
        code="Notifications du navigateur"
        etat={push.subscribed
          ? t("settings.notifications.subscribed", "abonné")
          : t("settings.console.off", "inactif")}
        ton={push.subscribed ? "actif" : "neutre"}
        journal={journaux.push ?? null}
      >
        {!push.supported && (
          <Alerte ton="info">
            {t("settings.notifications.pushUnsupported", "Ce navigateur ne gère pas les notifications poussées, ou tu es dans un aperçu embarqué — elles ne fonctionnent qu’en production.")}
          </Alerte>
        )}

        {push.supported && !push.hasVapid && (
          <Alerte>
            {t("settings.notifications.pushNoVapid", "Les clés VAPID ne sont pas configurées côté serveur.")}
          </Alerte>
        )}

        {push.supported && push.hasVapid && (
          <Reglage
            nom={t("settings.notifications.webpush", "Notifications du navigateur")}
            note={push.subscribed
              ? t("settings.notifications.webpushOn", "Cet appareil recevra les alertes même l’application fermée.")
              : t("settings.notifications.webpushOff", "Cet appareil ne reçoit rien tant qu’il n’est pas abonné.")}
            icone={<Bell />}
            large
          >
            <div className="flex flex-wrap gap-2">
              {!push.subscribed ? (
                <Bouton
                  role="primaire"
                  onClick={async () => {
                    const r = await push.subscribe();
                    if (r.ok) {
                      toast.success(t("settings.notifications.pushOn", "Notifications activées"));
                      noter("push", "abonnement → actif");
                    } else {
                      toast.error(t("settings.notifications.pushRefused", "Abonnement refusé"), { description: r.reason });
                      noter("push", `refus : ${r.reason ?? "inconnu"}`, "warn");
                    }
                  }}
                >
                  <Bell />
                  {t("settings.notifications.enablePush", "Activer")}
                </Bouton>
              ) : (
                <>
                  <Bouton
                    onClick={async () => {
                      if (!user?.id) return;
                      const { error } = await supabase.functions.invoke("push-send", {
                        /* Une demande explicite n est pas une notification :
                           elle passe outre les preferences, sinon le bouton
                           ne prouverait rien quand le push est coupe. */
                        body: { user_id: user.id, title: "Overwrite", body: "Notification de test ✨", url: "/", force: true },
                      });
                      if (error) {
                        toast.error(t("common.error"), { description: error.message });
                        noter("push", "test → échec", "warn");
                      } else {
                        toast.success(t("settings.notifications.testSent", "Test envoyé"));
                        noter("push", "test → envoyé");
                      }
                    }}
                  >
                    <Send />
                    {t("settings.notifications.sendTest", "Envoyer un test")}
                  </Bouton>
                  <Bouton
                    role="discret"
                    onClick={async () => {
                      await push.unsubscribe();
                      toast.success(t("settings.notifications.pushOff", "Notifications désactivées"));
                      noter("push", "abonnement → coupé", "warn");
                    }}
                  >
                    <BellOff />
                    {t("settings.notifications.unsubscribe", "Se désabonner")}
                  </Bouton>
                </>
              )}
            </div>
          </Reglage>
        )}
      </Panneau>
    </ConsoleReglages>
  );
}
