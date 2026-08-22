import { motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useDailyJournalPrompt } from "@/hooks/useJournalPrompt";

interface Props {
  onUse?: (prompt: string) => void;
}

/**
 * LA PIECE NON ECRITE.
 *
 * La question du jour etait un bandeau : un cadre, un fond teinte, une
 * croix de fermeture, une etiquette « CBT ». Tout ce qu on pose SUR un
 * document quand on veut interrompre celui qui le lit.
 *
 * Or la page est un dossier. Les entrees n ont pas de cadre : elles se
 * suivent, separees par un filet, avec leur cote a gauche — date,
 * heure, reference, nombre de mots — et leurs lignes numerotees. Le
 * bandeau etait la seule boite d une page qui n en contient aucune, et
 * il se lisait donc comme une notification tombee par erreur dans une
 * archive. Sa largeur ne servait a rien non plus : sept cents pixels
 * de cadre pour une question de quarante-cinq signes, et un
 * « >> UTILISER » orphelin tout en bas.
 *
 * Elle devient la premiere piece du dossier : celle qui n est pas
 * encore ecrite. Meme colonne de cote, mais elle porte « AUJOURD HUI »
 * et « A ECRIRE » la ou les autres portent une heure et un nombre de
 * mots. La question prend la place du titre — c est le texte le plus
 * important de la page a cet instant, il n avait pas a en etre le plus
 * petit.
 *
 * L INVITATION EST DANS LA FORME, PLUS DANS UN BOUTON.
 *
 * Sous la question, la ligne 01 attend, exactement comme dans une
 * entree ecrite. Elle dit ou le texte irait sans avoir a le demander,
 * et toute sa surface ouvre l editeur — on clique la ligne, pas un
 * lien perdu dessous.
 */
const FAMILLE: Record<string, string> = {
  reflection: "journal.prompt.famille.reflection",
  gratitude: "journal.prompt.famille.gratitude",
  cbt: "journal.prompt.famille.cbt",
  visualization: "journal.prompt.famille.visualization",
  stoic: "journal.prompt.famille.stoic",
};

export function DailyPromptBanner({ onUse }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: prompt, isLoading } = useDailyJournalPrompt(user?.id);
  const dayKey = new Date().toDateString();
  const storageKey = `journal-prompt-dismissed-${dayKey}`;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(storageKey) === "1");
    /* Une cle par jour masque s accumulait pour toujours. */
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith("journal-prompt-dismissed-") && k !== storageKey) localStorage.removeItem(k);
      }
    } catch { /* stockage indisponible */ }
  }, [storageKey]);

  if (isLoading || !prompt || dismissed) return null;

  /* « CBT » et « RFL » n apprenaient rien : personne ne sait ce que
     veut dire CBT. La famille se dit en toutes lettres. */
  const cle = FAMILLE[prompt.category];
  const famille = cle ? t(cle, prompt.category) : prompt.category;

  return (
    <motion.article
      className="jr-entree jr-question"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      aria-label={t("journal.prompt.region")}
    >
      <div className="jr-entete">
        <div className="jr-cote">
          <b>{format(new Date(), "yyyy.MM.dd")}</b>
          <span>{t("journal.prompt.aujourdhui", "Aujourd’hui")}</span>
          <span>{famille}</span>
          <span>{t("journal.prompt.aEcrire", "À écrire")}</span>
        </div>

        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <span className="jr-bande jr-question-bande">
              {t("journal.prompt.label")}
            </span>
            <button
              type="button"
              className="jr-menu"
              onClick={() => {
                localStorage.setItem(storageKey, "1");
                setDismissed(true);
              }}
              aria-label={t("journal.prompt.dismiss")}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* La question prend la place du titre d une entree. */}
          <h2 className="jr-titre jr-question-texte">{prompt.prompt}</h2>

          <button type="button" className="jr-question-ligne" onClick={() => onUse?.(prompt.prompt)}>
            <span className="jr-question-num" aria-hidden="true">01</span>
            <span className="jr-question-appel">
              {t("journal.prompt.use")}
              <ArrowRight aria-hidden="true" />
            </span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}
