import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Brain, X, Smartphone, MessageSquare, Users, CloudLightning, Coffee, Globe } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useLogFocusDistraction } from "@/hooks/useFocusDistractions";

/* LE CARNET DE DISTRACTIONS
 *
 * Il ne s ouvrait pas — ou plutot il s ouvrait dans le vide. Le billet
 * etait bien monte dans le DOM, 285 par 207, mais la barre de commandes
 * porte un clip-path, et un clip-path DECOUPE SES DESCENDANTS. Un billet
 * pose au-dessus de la barre tombait donc hors de la decoupe : invisible,
 * et inatteignable au clic.
 *
 * Il est desormais monte dans une porte de sortie, a la racine du
 * document, ou aucun ancetre ne peut le rogner. Sa position est mesuree
 * sur le bouton et suivie au defilement.
 *
 * ET IL DEMANDE MOINS DE TRAVAIL QU AVANT
 *
 * Noter une distraction pendant qu on essaie de se concentrer est un
 * comble : chaque seconde passee a ecrire est une seconde de plus hors du
 * travail. Six causes courantes s enregistrent donc d un seul clic, et la
 * saisie libre reste pour le reste. La categorie, colonne qui existait
 * dans la table sans jamais etre remplie, sert enfin a quelque chose.
 */

const LIMITE = 140;

const RAPIDES = [
  { cat: "phone", cle: "focus.distraction.quick.phone", icone: Smartphone },
  { cat: "message", cle: "focus.distraction.quick.message", icone: MessageSquare },
  { cat: "person", cle: "focus.distraction.quick.person", icone: Users },
  { cat: "thought", cle: "focus.distraction.quick.thought", icone: CloudLightning },
  { cat: "body", cle: "focus.distraction.quick.body", icone: Coffee },
  { cat: "web", cle: "focus.distraction.quick.web", icone: Globe },
] as const;

interface Position { haut: number; gauche: number; largeur: number; versLeBas: boolean }

export function FocusDistractionButton() {
  const { t } = useTranslation();
  const mouvementReduit = useReducedMotion();
  const log = useLogFocusDistraction();

  const [ouvert, setOuvert] = useState(false);
  const [note, setNote] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  /* Le compte de la seance : le voir monter est en soi un rappel. */
  const [comptees, setComptees] = useState(0);
  const [pos, setPos] = useState<Position | null>(null);

  const boutonRef = useRef<HTMLButtonElement | null>(null);
  const billetRef = useRef<HTMLDivElement | null>(null);
  const champRef = useRef<HTMLTextAreaElement | null>(null);

  /* La position se mesure sur le bouton, et se refait au defilement : un
     billet en position fixe qui reste accroche a un bouton qui bouge
     serait pire que pas de billet du tout. */
  const placer = useCallback(() => {
    const b = boutonRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const largeur = Math.min(320, window.innerWidth - 24);
    const haut = 300;
    const versLeBas = r.top < haut + 16;
    let gauche = r.left + r.width / 2 - largeur / 2;
    gauche = Math.max(12, Math.min(gauche, window.innerWidth - largeur - 12));
    setPos({
      haut: versLeBas ? r.bottom + 10 : r.top - 10,
      gauche,
      largeur,
      versLeBas,
    });
  }, []);

  useLayoutEffect(() => {
    if (!ouvert) return;
    placer();
    window.addEventListener("scroll", placer, true);
    window.addEventListener("resize", placer);
    return () => {
      window.removeEventListener("scroll", placer, true);
      window.removeEventListener("resize", placer);
    };
  }, [ouvert, placer]);

  // Le champ prend la main a l ouverture, le bouton la reprend a la fermeture.
  useEffect(() => {
    if (ouvert) champRef.current?.focus();
    else boutonRef.current?.focus({ preventScroll: true });
  }, [ouvert]);

  /* Echap ferme, un clic au-dehors ferme. Sans cela un billet en position
     fixe reste a l ecran quoi qu on fasse. */
  useEffect(() => {
    if (!ouvert) return;
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setOuvert(false); }
    };
    const auClic = (e: MouseEvent) => {
      const c = e.target as Node;
      if (billetRef.current?.contains(c) || boutonRef.current?.contains(c)) return;
      setOuvert(false);
    };
    // En capture : la page ecoute deja Echap pour arreter la seance.
    document.addEventListener("keydown", auClavier, true);
    document.addEventListener("mousedown", auClic);
    return () => {
      document.removeEventListener("keydown", auClavier, true);
      document.removeEventListener("mousedown", auClic);
    };
  }, [ouvert]);

  const enregistrer = useCallback(
    async (texte: string, categorie: string | null) => {
      const propre = texte.trim().slice(0, LIMITE);
      if (!propre) return;
      setErreur(null);
      try {
        await log.mutateAsync({ note: propre, category: categorie });
        setComptees((n) => n + 1);
        setNote("");
        setOuvert(false);
        toast(t("focus.distraction.saved"), { duration: 1400 });
      } catch (e) {
        // Un message dans le billet, pas seulement une bulle qui passe :
        // on vient d ecrire quelque chose, on doit savoir qu il est perdu.
        setErreur(e instanceof Error && /auth/i.test(e.message)
          ? t("focus.distraction.errorAuth")
          : t("focus.distraction.error"));
      }
    },
    [log, t],
  );

  const reste = LIMITE - note.length;

  const billet = pos && (
    <motion.div
      ref={billetRef}
      role="dialog"
      aria-modal="false"
      aria-label={t("focus.distraction.title")}
      className="dst-billet"
      style={{
        top: pos.versLeBas ? pos.haut : undefined,
        bottom: pos.versLeBas ? undefined : window.innerHeight - pos.haut,
        left: pos.gauche,
        width: pos.largeur,
      }}
      initial={mouvementReduit ? false : { opacity: 0, y: pos.versLeBas ? -8 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={mouvementReduit ? undefined : { opacity: 0, y: pos.versLeBas ? -6 : 6 }}
      transition={{ duration: 0.18, ease: [0.3, 0.85, 0.25, 1] }}
    >
      <div className="dst-tete">
        <span className="dst-titre">{t("focus.distraction.title")}</span>
        <button type="button" onClick={() => setOuvert(false)} aria-label={t("common.close")} className="dst-fermer">
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      <p className="dst-aide">{t("focus.distraction.explain")}</p>

      {/* Un clic suffit pour les six causes qui reviennent tout le temps.
          Ecrire pendant qu on essaie de se concentrer est un comble. */}
      <div className="dst-rapides" role="group" aria-label={t("focus.distraction.quickLabel")}>
        {RAPIDES.map(({ cat, cle, icone: Icone }) => (
          <button
            key={cat}
            type="button"
            className="cyb cyb--petit"
            disabled={log.isPending}
            onClick={() => enregistrer(t(cle), cat)}
          >
            <Icone className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t(cle)}</span>
          </button>
        ))}
      </div>

      <div className="dst-separateur" aria-hidden="true"><span>{t("focus.distraction.orWrite")}</span></div>

      <textarea
        ref={champRef}
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, LIMITE))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); enregistrer(note, null); }
        }}
        placeholder={t("focus.distraction.placeholder")}
        aria-label={t("focus.distraction.placeholder")}
        rows={2}
        maxLength={LIMITE}
        className="dst-champ"
      />

      {erreur && <p className="dst-erreur" role="alert">{erreur}</p>}

      <div className="dst-pied">
        <span className={`dst-reste${reste <= 20 ? " est-court" : ""}`}>{reste}</span>
        <button
          type="button"
          onClick={() => enregistrer(note, null)}
          disabled={!note.trim() || log.isPending}
          className="cyb cyb--petit cyb--or"
        >
          {log.isPending ? t("focus.distraction.saving") : t("focus.distraction.submit")}
          <kbd aria-hidden="true">⌘↵</kbd>
        </button>
      </div>
    </motion.div>
  );

  return (
    <>
      <button
        ref={boutonRef}
        type="button"
        onClick={() => { setErreur(null); setOuvert((v) => !v); }}
        aria-label={t("focus.distraction.open")}
        aria-expanded={ouvert}
        aria-haspopup="dialog"
        title={t("focus.distraction.explain")}
        className={`cyb cyb--icone dst-bouton${ouvert ? " est-actif" : ""}`}
      >
        <Brain className="w-4 h-4" aria-hidden="true" />
        <span className="dst-libelle">{t("focus.distraction.short")}</span>
        {comptees > 0 && <span className="dst-compte" aria-hidden="true">{comptees}</span>}
      </button>

      {/* Une porte de sortie a la racine : la barre de commandes porte un
          clip-path, et un clip-path decoupe ses descendants — le billet y
          etait invisible et inatteignable. */}
      {createPortal(<AnimatePresence>{ouvert && billet}</AnimatePresence>, document.body)}
    </>
  );
}

export default FocusDistractionButton;
