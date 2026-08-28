import { useState } from "react";
import { Check, Copy, KeyRound, Loader2, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { useGuilds, useInviteCodes, type GuildInviteCode } from "@/domaines/social/hooks/useGuilds";

/* LES CODES D INVITATION.
 *
 * Le panneau etait reste dans l ancien monde au milieu d un module
 * refait : bouton de la bibliotheque en capitales cyan, CyberEmpty,
 * ScrollArea, et le code affiche comme du texte ordinaire alors que
 * c est la SEULE chose qu on vient y chercher.
 *
 * Un code se copie. Il est donc au premier plan, en chiffres, et le
 * bouton confirme le geste au lieu de laisser douter. */

interface Props {
  guildId: string;
  canManage: boolean;
}

export function GuildInviteCodePanel({ guildId, canManage }: Props) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const { createInviteCode, deactivateInviteCode } = useGuilds();
  const { data: codes = [], isLoading } = useInviteCodes(guildId);
  const [copie, setCopie] = useState<string | null>(null);

  const engendrer = async () => {
    try {
      const code = await createInviteCode.mutateAsync({ guildId, expiresInHours: 72 });
      toast.success(t("friends.codeGenerated", { code, defaultValue: "Code créé : {{code}}" }));
    } catch {
      toast.error(t("guild.codeFailed", "La création du code a échoué"));
    }
  };

  const copier = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopie(code);
      /* La confirmation vit sur le bouton lui-meme : une notification
         pour un geste aussi bref se lit apres coup, quand on a deja
         detourne le regard. */
      window.setTimeout(() => setCopie((c) => (c === code ? null : c)), 1600);
    } catch {
      toast.error(t("guild.copyFailed", "La copie a échoué"));
    }
  };

  const retirer = async (id: string) => {
    try {
      await deactivateInviteCode.mutateAsync({ id, guildId });
      toast.success(t("friends.codeDeactivated", "Code désactivé"));
    } catch {
      toast.error(t("guild.codeRevokeFailed", "La désactivation a échoué"));
    }
  };

  const actifs = codes.filter((c: GuildInviteCode) => c.is_active);

  return (
    <>
      {canManage && (
        <div className="gu-barre">
          <button
            type="button"
            className="co-bouton"
            onClick={engendrer}
            disabled={createInviteCode.isPending}
          >
            {createInviteCode.isPending
              ? <Loader2 className="co-tourne" aria-hidden="true" />
              : <Plus aria-hidden="true" />}
            {t("friends.generateCode", "Créer un code")}
          </button>
        </div>
      )}

      {isLoading ? (
        <div aria-busy="true">
          {[0, 1].map((i) => (
            <div className="co-fantome" key={i}>
              <span className="co-os co-os--rond" />
              <span className="co-os" style={{ height: 14, alignSelf: "center" }} />
            </div>
          ))}
        </div>
      ) : actifs.length === 0 ? (
        <div className="co-vide">
          <KeyRound aria-hidden="true" />
          <h3>{t("friends.noCodes", "Aucun code actif")}</h3>
          <p>
            {t(
              "friends.noCodesDesc",
              "Un code d’invitation ouvre la guilde à qui le possède, pour une durée limitée.",
            )}
          </p>
        </div>
      ) : (
        <div className="gu-corps" style={{ paddingTop: 12, display: "grid", gap: 8 }}>
          {actifs.map((c: GuildInviteCode) => (
            <div className="gu-code" key={c.id}>
              <code className="gu-code-suite">{c.code}</code>

              <span className="gu-code-vie">
                <span className="gu-chiffre">
                  {t("guild.codeUses", { count: c.current_uses, defaultValue: "{{count}} utilisation" })}
                  {c.max_uses ? ` / ${c.max_uses}` : ""}
                </span>
                {c.expires_at && (
                  <time className="gu-chiffre" dateTime={c.expires_at}>
                    {t("guild.codeExpires", "expire {{quand}}", {
                      quand: formatDistanceToNow(new Date(c.expires_at), { addSuffix: true, locale }),
                    })}
                  </time>
                )}
              </span>

              <button
                type="button"
                className="co-puce"
                onClick={() => copier(c.code)}
                aria-label={t("guild.copyCode", "Copier le code")}
              >
                {copie === c.code
                  ? <Check aria-hidden="true" style={{ color: "var(--co-soutien)" }} />
                  : <Copy aria-hidden="true" />}
                {copie === c.code ? t("guild.copied", "Copié") : t("common.copy", "Copier")}
              </button>

              {canManage && (
                <button
                  type="button"
                  className="co-puce"
                  onClick={() => retirer(c.id)}
                  disabled={deactivateInviteCode.isPending}
                  aria-label={t("guild.revokeCode", "Désactiver ce code")}
                >
                  <X aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
