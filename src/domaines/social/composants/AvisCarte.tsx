import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bell, Gift, Trophy, MessageSquare, Megaphone, X, ArrowRight,
  Star, Zap, Heart, Info, AlertTriangle, Check, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import { useAuth } from "@/socle/contextes/AuthContext";
import type { Notification } from "@/domaines/social/hooks/useNotifications";

/**
 * UN AVIS DANS LA BOÎTE.
 *
 * ═══════════════════════════════════════════════════════════════
 * CE QUI CHANGE PAR RAPPORT À NotificationCard
 *
 * — TOUT ÉTAIT EN ANGLAIS, dans une application française :
 *   « Claimed », « Claim », « Reward Claimed! », « +N Bonds added to
 *   your balance », « Failed to claim », « Please try again later ».
 *   Et les dates passaient par formatDistanceToNow SANS locale, donc
 *   « 4 days ago » sous un titre français.
 *
 * — L'ICÔNE DE LIEN EXTERNE SUR UN LIEN INTERNE. La carte affichait
 *   ExternalLink à côté du libellé d'action, alors que la validation
 *   juste au-dessus REFUSE tout ce qui n'est pas un chemin relatif.
 *   L'icône promettait le contraire de ce que le code garantit.
 *
 * — TOUTE LA CARTE ÉTAIT « cursor-pointer », y compris les avis qui
 *   ne mènent nulle part. Sur les soixante-six avis en base,
 *   trente-six n'ont pas de destination : cliquer ne faisait que les
 *   marquer lus, sans rien dire. Ici, seul un avis qui mène quelque
 *   part se comporte comme un lien — et il le montre.
 *
 * — L'ÉCARTER ÉTAIT INVISIBLE AU DOIGT. « opacity-0
 *   group-hover:opacity-100 » : un écran tactile n'a pas de survol.
 *   Le bouton existait, personne ne pouvait le voir.
 * ═══════════════════════════════════════════════════════════════
 */

/* La validation d'URL est reprise telle quelle : elle empêche une
   redirection ouverte. Seuls les chemins relatifs passent — ni URL
   absolue, ni « javascript: », ni « //autre-site.com ». */
function estUnCheminInterne(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const propre = url.trim();
  if (!propre.startsWith("/")) return false;
  if (propre.startsWith("//")) return false;
  try {
    const test = new URL(propre, "https://internal.app");
    return test.hostname === "internal.app";
  } catch {
    return false;
  }
}

const ICONES: Record<string, React.ComponentType<{ className?: string }>> = {
  bell: Bell,
  gift: Gift,
  trophy: Trophy,
  message: MessageSquare,
  announcement: Megaphone,
  star: Star,
  zap: Zap,
  heart: Heart,
  info: Info,
  warning: AlertTriangle,
};

/* La teinte vient de la priorité, et passe par une variable CSS plutôt
   que par un nom de classe composé : c'est exactement le piège dans
   lequel l'ancienne page était tombée avec « border-${color} ». */
const TEINTES: Record<string, string> = {
  critical:      "var(--bx-alerte)",
  important:     "var(--bx-veille)",
  social:        "var(--bx-humain)",
  informational: "var(--bx-signal)",
  silent:        "var(--bx-encre-3)",
};

interface Props {
  avis: Notification;
  /** Déjà mis en forme par la page : elle possède la locale. */
  quand: string;
  onLu: () => void;
  onEcarter: () => void;
}

export function AvisCarte({ avis, quand, onLu, onEcarter }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reclamation, setReclamation] = useState(false);

  const Icone = ICONES[avis.icon_key || "bell"] || Bell;
  const destination = avis.cta_url && estUnCheminInterne(avis.cta_url) ? avis.cta_url : null;

  const aUnDon =
    avis.reward_type &&
    ((avis.reward_type === "bonds" && (avis.reward_amount ?? 0) > 0) ||
      (avis.reward_type !== "bonds" && avis.reward_cosmetic_id));
  const donPris = avis.reward_claimed === true;

  const reclamer = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id || reclamation || donPris) return;
    setReclamation(true);
    try {
      /* Le serveur valide la propriété, empêche la double réclamation,
         crédite et marque. Rien de tout cela ne se décide ici. */
      const { data, error } = await supabase.rpc("claim_notification_reward", {
        p_notification_id: avis.id,
      });
      if (error) throw error;
      const resultat = data as unknown as { success?: boolean; error?: string } | null;
      if (resultat && resultat.success === false) throw new Error(resultat.error || "refus");

      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["bond-balance"] });
      queryClient.invalidateQueries({ queryKey: ["user-cosmetics"] });

      toast.success(t("inbox.rewardClaimed", "Récompense récupérée"), {
        description:
          avis.reward_type === "bonds"
            ? t("inbox.rewardBonds", "+{{n}} Bonds crédités", { n: avis.reward_amount })
            : t("inbox.rewardCosmetic", "Ajoutée à votre collection"),
      });
    } catch {
      toast.error(t("inbox.rewardFailed", "La récompense n'a pas pu être récupérée"), {
        description: t("inbox.rewardRetry", "Réessayez dans un instant."),
      });
    } finally {
      setReclamation(false);
    }
  };

  const ouvrir = () => {
    if (!avis.is_read) onLu();
    if (destination) navigate(destination);
  };

  const teinte = TEINTES[avis.priority] ?? TEINTES.informational;

  return (
    <article
      className="bx-avis"
      style={{ ["--bx-teinte" as string]: teinte }}
      data-lu={avis.is_read ? "oui" : "non"}
      data-agir={destination ? "oui" : "non"}
      /* Un avis sans destination n'est pas un bouton : il ne prend ni le
         focus ni le clavier, et son curseur reste une flèche. */
      {...(destination
        ? {
            role: "link" as const,
            tabIndex: 0,
            onClick: ouvrir,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ouvrir(); }
            },
          }
        : {})}
    >
      <span className="bx-avis-icone">
        <Icone aria-hidden="true" />
      </span>

      <div className="bx-avis-corps">
        <h3 className="bx-avis-titre">{avis.title}</h3>
        {avis.description && <p className="bx-avis-texte">{avis.description}</p>}

        <div className="bx-avis-pied">
          <span className="bx-avis-quand">{quand}</span>

          {aUnDon && (donPris ? (
            <span className="bx-pris">
              <Check aria-hidden="true" />
              {t("inbox.claimed", "Récupérée")}
            </span>
          ) : (
            <button type="button" className="bx-don" onClick={reclamer} disabled={reclamation}>
              {reclamation ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Gift aria-hidden="true" />}
              {avis.reward_type === "bonds"
                ? t("inbox.claimBonds", "Récupérer +{{n}}", { n: avis.reward_amount })
                : t("inbox.claim", "Récupérer")}
            </button>
          ))}

          {destination && (
            <span className="bx-avis-aller">
              {avis.cta_label || t("inbox.open", "Ouvrir")}
              {/* Une flèche, pas une icône de lien externe : la
                  destination est toujours interne, par construction. */}
              <ArrowRight aria-hidden="true" />
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {avis.image_url && <img className="bx-avis-image" src={avis.image_url} alt="" loading="lazy" />}
        <button
          type="button"
          className="bx-ecarter"
          aria-label={t("inbox.dismiss", "Écarter cette notification")}
          onClick={(e) => { e.stopPropagation(); onEcarter(); }}
        >
          <X aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
