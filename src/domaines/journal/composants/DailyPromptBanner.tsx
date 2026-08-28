import { motion, useReducedMotion } from "framer-motion";
import { X, SlidersHorizontal } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useDailyJournalPrompt, useEnregistrerOrientation } from "@/domaines/journal/hooks/useJournalPrompt";
import { useProfile } from "@/hooks/useProfile";
import { FAMILLES, famillesRetenues } from "@/domaines/journal/logique/familles";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { useQuestionCongediee } from "@/domaines/journal/hooks/useQuestionCongediee";

interface Props {
  onUse?: (prompt: string) => void;
}

/**
 * L EPHEMERIDE.
 *
 * TROIS TENTATIVES AVANT CELLE-CI, ET CHACUNE A APPRIS QUELQUE CHOSE.
 *
 * Un bandeau encadre d abord : la seule boite d une page qui n en
 * contient aucune, donc une notification tombee par erreur dans une
 * archive.
 *
 * Puis une piece du dossier — meme cote, meme filet, meme rythme. Elle
 * ne derangeait plus rien, et c etait le probleme : elle disparaissait.
 * On ne repond pas a une question qu on ne voit pas.
 *
 * Puis une plaque de verre balayee par un scanline. Le verre etait
 * juste ; le balayage ne l etait pas — une decoration qui boucle sans
 * rien dire, et qui finit par agacer.
 *
 * CE QUI RESTE : LA DATE FAIT LE GRAPHISME.
 *
 * Un chiffre de soixante pixels a gauche, et « question du jour » cesse
 * d etre une etiquette qu on ecrit : c est la date qui le dit, et l on
 * comprend sans un mot qu elle changera demain. Le bloc est en ENCRE et
 * non dans le rouge du journal — le rouge sert deja aux numeros de
 * ligne quinze centimetres plus bas, et deux rouges se disputent.
 *
 * Le cyan, lui, ne sert qu a ce qui PARLE : le canal, la diode, l
 * invitation. C est la couleur dont l app se sert partout pour se
 * designer elle-meme, jamais celle du journal. Ce partage tient tout :
 * l encre pour le temps, le cyan pour la voix.
 *
 * LA QUESTION S ECRIT DEVANT TOI, et c est ce qui attire — une phrase
 * qui apparait signe par signe se regarde jusqu au bout, la ou un cadre
 * ne fait que se voir.
 */
/* La table des cinq categories heritees — reflection, gratitude, cbt,
   visualization, stoic — vivait ici en dur. Les familles sont
   desormais declarees une seule fois, dans lib/journal/familles. */
const NOM_DE_FAMILLE: Record<string, string> = Object.fromEntries(
  FAMILLES.map((f) => [f.cle, f.nom]),
);

/** La frappe, signe par signe. Rendue d un coup si l on veut moins de mouvement. */
function useFrappe(texte: string, actif: boolean) {
  const [n, setN] = useState(actif ? 0 : texte.length);

  useEffect(() => {
    if (!actif) { setN(texte.length); return; }
    setN(0);
    /* Dix-huit millisecondes : assez lent pour qu on VOIE la phrase
       s ecrire, assez rapide pour qu on n attende pas. Une question de
       soixante signes prend une seconde. */
    const t = setInterval(() => {
      setN((v) => {
        if (v >= texte.length) { clearInterval(t); return v; }
        return v + 1;
      });
    }, 18);
    return () => clearInterval(t);
  }, [texte, actif]);

  return { visible: texte.slice(0, n), fini: n >= texte.length };
}

/**
 * LA QUESTION CONGÉDIÉE PEUT REVENIR.
 *
 * Elle se fermait pour la journée, et rien ne la rappelait : une croix
 * cliquée par erreur coûtait la question du jour jusqu'au lendemain.
 *
 * L'état sort donc de la bannière. Il vivait dans un useState privé, ce
 * qui interdisait à la page de savoir qu'il y avait quelque chose à
 * rappeler — et une page qui ne sait pas ne peut pas proposer.
 */




export function DailyPromptBanner({ onUse }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const locale = useDateFnsLocale();
  const sobre = useReducedMotion();
  const { data: prompt, isLoading } = useDailyJournalPrompt(user?.id);
  const { data: profil } = useProfile(user?.id);
  const enregistrerOrientation = useEnregistrerOrientation(user?.id);
  const [orientationOuverte, setOrientationOuverte] = useState(false);
  const retenues = famillesRetenues(profil?.journal_prompt_families);
  const [dismissed, setDismissed] = useQuestionCongediee();

  const texte = prompt?.prompt ?? "";
  const { visible, fini } = useFrappe(texte, !!prompt && !sobre);

  if (isLoading || !prompt || dismissed) return null;

  /* « CBT » et « RFL » n apprenaient rien : personne ne sait ce que
     veut dire CBT. La famille se dit en toutes lettres. */
  const cle = NOM_DE_FAMILLE[prompt.category];
  const famille = cle ? t(cle, prompt.category) : prompt.category;

  /* Decocher la derniere famille ne doit pas vider le journal :
     famillesRetenues traite l ensemble vide comme « toutes ». */
  const basculer = (f: string) => {
    const suivantes = retenues.includes(f)
      ? retenues.filter((x) => x !== f)
      : [...retenues, f];
    enregistrerOrientation.mutate(suivantes);
  };

  const jour = new Date();

  return (
    <motion.section
      className="jr-q"
      data-sobre={sobre ? "1" : "0"}
      initial={sobre ? { opacity: 0 } : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      aria-label={t("journal.prompt.region")}
    >
      {/* LE BLOC DU JOUR. Il porte la date en entier pour les lecteurs
          d ecran ; a l oeil, seul le chiffre compte. */}
      <div className="jr-q-jour">
        <span className="sr-only">{format(jour, "d MMMM yyyy", { locale })}</span>
        <b aria-hidden="true">{format(jour, "d")}</b>
        <span aria-hidden="true">{format(jour, "MMM", { locale }).replace(".", "")}</span>
      </div>

      <div className="jr-q-corps">
        <header className="jr-q-tete">
          <span className="jr-q-canal">
            <i className="jr-q-diode" aria-hidden="true" />
            {t("journal.prompt.label")}
          </span>
          <span className="jr-q-meta">{famille}</span>
          <button
            type="button"
            className="jr-q-orienter"
            aria-expanded={orientationOuverte}
            onClick={() => setOrientationOuverte((v) => !v)}
            title={t("journal.prompt.orienter")}
            aria-label={t("journal.prompt.orienter")}
            style={{ marginLeft: "auto" }}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="jr-q-fermer"
            style={{ marginLeft: 6 }}
            onClick={() => setDismissed(true)}
            aria-label={t("journal.prompt.dismiss")}
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </header>

        {orientationOuverte && (
          <div className="jr-q-familles" role="group" aria-label={t("journal.prompt.orienter")}>
            {FAMILLES.map((f) => (
              <button
                key={f.cle}
                type="button"
                className="jr-q-famille"
                aria-pressed={retenues.includes(f.cle)}
                title={t(f.quoi)}
                onClick={() => basculer(f.cle)}
              >
                {t(f.nom)}
              </button>
            ))}
            <p>{t("journal.prompt.orienterAide")}</p>
          </div>
        )}

        {/* Le texte complet reste lisible par les technologies
            d assistance : elles n ont pas a attendre la frappe. */}
        <p className="jr-q-texte">
          <span aria-hidden="true">{visible}</span>
          <span className="sr-only">{texte}</span>
          {!fini && <i className="jr-q-curseur" aria-hidden="true" />}
        </p>

        <button type="button" className="jr-q-repondre" onClick={() => onUse?.(prompt.prompt)}>
          <span aria-hidden="true">&gt;</span>
          {t("journal.prompt.use")}
          <i className="jr-q-curseur" aria-hidden="true" />
        </button>
      </div>
    </motion.section>
  );
}
