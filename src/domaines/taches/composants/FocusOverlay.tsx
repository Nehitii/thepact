import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X, Play, Pause, Check } from "lucide-react";
import { isPast, isToday } from "date-fns";
import { useTranslation } from "react-i18next";
import type { TodoTask } from "@/domaines/taches/hooks/useTodoList";
import { cn } from "@/lib/utils";

/* LE POSTE DE FOCUS
 *
 * Il etait reste en dehors de la refonte : coins arrondis, pastilles
 * genereuses, libelles anglais ecrits en dur — « HYPERFOCUS ACTIVE »,
 * « ELAPSED », « Mission Complete » — la priorite affichee brute
 * (« high »), et un bouton principal en texte primaire sur un fond
 * primaire a vingt pour cent : bleu sur bleu, invisible.
 *
 * Il devient un poste : quatre equerres, une trame, un rail, et un
 * compteur qui EST l element principal — avec sa jauge de soixante
 * crans, une seconde par cran. La teinte est celle de la priorite de
 * la tache, rouge si elle est en retard, et le bouton la porte pleine
 * avec le fond de la page pour texte.
 */

interface FocusOverlayProps {
  task: TodoTask;
  onComplete: () => void;
  onExit: () => void;
}

const enDeuxChiffres = (n: number) => String(n).padStart(2, "0");
const referenceDe = (id: string) => "T." + id.replace(/[^0-9a-f]/gi, "").slice(-4).toUpperCase();

export function FocusOverlay({ task, onComplete, onExit }: FocusOverlayProps) {
  const { t } = useTranslation();
  const immobile = useReducedMotion();
  const [ecoule, setEcoule] = useState(0);
  const [enMarche, setEnMarche] = useState(true);
  const sortieRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!enMarche) return;
    const id = setInterval(() => setEcoule((p) => p + 1), 1000);
    return () => clearInterval(id);
  }, [enMarche]);

  /* Un plein ecran doit se fermer par Echap, et prendre le clavier :
     sans quoi le focus reste sur la page, derriere. */
  useEffect(() => {
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onExit(); }
      if (e.key === " " && e.target === document.body) { e.preventDefault(); setEnMarche((v) => !v); }
    };
    window.addEventListener("keydown", auClavier);
    sortieRef.current?.focus();
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", auClavier);
      document.body.style.overflow = avant;
    };
  }, [onExit]);

  const basculer = useCallback(() => setEnMarche((p) => !p), []);

  const echeance = task.deadline ? new Date(task.deadline) : null;
  const enRetard = !!echeance && isPast(echeance) && !isToday(echeance);

  const minutes = Math.floor(ecoule / 60);
  const secondes = ecoule % 60;

  const bloc = immobile
    ? {}
    : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

  return (
    <motion.div
      className="tsk tsk-foc"
      role="dialog"
      aria-modal="true"
      aria-label={t("todo.focus.title")}
      data-prio={task.priority}
      data-retard={enRetard}
      initial={immobile ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <span className="tsk-foc-equerres" aria-hidden="true" />

      <div className="tsk-foc-rail">
        <b>TSK.01</b>
        <i />
        <span className={cn("tsk-foc-etat", !enMarche && "est-arrete")}>
          <s aria-hidden="true" />
          {t("todo.focus.title")} · {enMarche ? t("todo.focus.running") : t("todo.focus.paused")}
        </span>
        <i />
        <span>{referenceDe(task.id)}</span>
      </div>

      <button
        ref={sortieRef}
        type="button"
        onClick={onExit}
        aria-label={t("todo.focus.exit")}
        className="tsk-outil est-icone tsk-foc-sortie"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>

      <motion.h1
        className="tsk-foc-nom"
        {...bloc}
        transition={{ delay: 0.08, type: "spring", stiffness: 320, damping: 30 }}
      >
        {task.name}
      </motion.h1>

      <motion.div className="tsk-foc-badges" {...bloc} transition={{ delay: 0.16 }}>
        <span className="tsk-badge">{t("todo.categories." + (task.category || "general"))}</span>
        <span
          className="tsk-badge est-teinte"
          style={{ ["--tsk-teinte" as string]: "var(--tsk-foc-teinte)" } as React.CSSProperties}
        >
          {t("todo.priorities." + task.priority)}
        </span>
        {enRetard && (
          <span
            className="tsk-badge est-teinte"
            style={{ ["--tsk-teinte" as string]: "var(--tsk-retard)" } as React.CSSProperties}
          >
            {t("todo.taskCard.overdue")}
          </span>
        )}
      </motion.div>

      <motion.span className="tsk-foc-mesure" {...bloc} transition={{ delay: 0.24 }}>
        {t("todo.focus.elapsed")}
      </motion.span>

      <motion.span
        className={cn("tsk-foc-temps", !enMarche && "est-arrete")}
        role="timer"
        aria-live="off"
        {...bloc}
        transition={{ delay: 0.28 }}
      >
        {enDeuxChiffres(minutes)}<u aria-hidden="true">:</u>{enDeuxChiffres(secondes)}
      </motion.span>

      {/* Soixante crans, une seconde chacun : la minute en cours. */}
      <motion.span
        className={cn("tsk-foc-jauge", !enMarche && "est-arrete")}
        aria-hidden="true"
        {...bloc}
        transition={{ delay: 0.34 }}
      >
        {Array.from({ length: 60 }, (_, i) => (
          <i key={i} className={i < secondes ? "est-plein" : undefined} />
        ))}
      </motion.span>

      <motion.div className="tsk-foc-actions" {...bloc} transition={{ delay: 0.42 }}>
        <button
          type="button"
          onClick={basculer}
          aria-label={enMarche ? t("todo.focus.pause") : t("todo.focus.resume")}
          className="tsk-outil"
        >
          {enMarche
            ? <Pause className="w-3.5 h-3.5" aria-hidden="true" />
            : <Play className="w-3.5 h-3.5" aria-hidden="true" />}
          {enMarche ? t("todo.focus.pause") : t("todo.focus.resume")}
        </button>

        <button type="button" onClick={onComplete} className="tsk-foc-terminer">
          <Check className="w-4 h-4" aria-hidden="true" />
          {t("todo.focus.complete")}
        </button>
      </motion.div>
    </motion.div>
  );
}
