import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { RosaceDuPacte } from "@/domaines/objectifs";

/* LES PIECES DU DOSSIER : le tampon, le trombone, le cachet.
 *
 * LE TAMPON EST LE SEUL ETAT. Rien n est vert ou rouge dans le dossier :
 * ce qui est tenu est tamponne TENU, a l encre violette de
 * l administration ; ce qui presse est tamponne a l encre rouge. Un
 * tampon ne se lit pas comme une couleur, il se lit comme un acte.
 *
 * TAMPONNER SE MERITE. Un ordre tenu ne se reprend pas : on appuie, et
 * l on garde appuye le temps que le tampon s encre — six cent
 * cinquante millisecondes, l anneau qui se remplit le montre. Au
 * clavier, Entree tamponne d un coup : maintenir une touche la repete,
 * et ce geste-la ne veut rien dire. */

export type Encre = "violette" | "rouge";

export function Tampon({
  children, encre = "violette", rotation = -6, anime = false, taille = "moyen", className = "",
}: {
  children: ReactNode;
  encre?: Encre;
  rotation?: number;
  anime?: boolean;
  taille?: "petit" | "moyen" | "grand";
  className?: string;
}) {
  return (
    <motion.span
      className={`do-tampon ${className}`}
      data-encre={encre}
      data-taille={taille}
      initial={anime ? { scale: 1.9, opacity: 0, rotate: rotation - 14 } : false}
      animate={{ scale: 1, opacity: 1, rotate: rotation }}
      transition={{ type: "spring", stiffness: 620, damping: 19, mass: 0.7 }}
    >
      {children}
    </motion.span>
  );
}

const DUREE = 650;

/** Le bouton qu on garde appuye pour tamponner. */
export function BoutonTampon({ onTamponne, children }: { onTamponne: () => void; children: ReactNode }) {
  const [part, setPart] = useState(0);
  const depart = useRef<number | null>(null);
  const raf = useRef(0);

  const arreter = () => {
    cancelAnimationFrame(raf.current);
    depart.current = null;
    setPart(0);
  };

  const suivre = (t: number) => {
    if (depart.current === null) return;
    const p = Math.min(1, (t - depart.current) / DUREE);
    setPart(p);
    if (p >= 1) {
      arreter();
      onTamponne();
      return;
    }
    raf.current = requestAnimationFrame(suivre);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <button
      type="button"
      className="do-bouton-tampon"
      style={{ ["--part" as string]: part }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        depart.current = performance.now();
        raf.current = requestAnimationFrame(suivre);
      }}
      onPointerUp={arreter}
      onPointerLeave={arreter}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!e.repeat) onTamponne();
        }
      }}
      aria-label={`${typeof children === "string" ? children : "Tamponner"} — maintenir pour tamponner`}
    >
      <span className="do-anneau" aria-hidden="true" />
      {children}
    </button>
  );
}

/** Un trombone, en deux boucles d un fil d acier. */
export function Trombone({ className = "" }: { className?: string }) {
  return (
    <svg className={`do-trombone ${className}`} viewBox="0 0 24 64" aria-hidden="true">
      <defs>
        <linearGradient id="do-acier" x1="0" x2="1">
          <stop offset="0" stopColor="#8d96a3" />
          <stop offset="0.45" stopColor="#e9edf2" />
          <stop offset="1" stopColor="#6d7682" />
        </linearGradient>
      </defs>
      <path
        d="M8 14 V50 a6 6 0 0 0 12 0 V10 a8 8 0 0 0 -16 0 V52 a10 10 0 0 0 20 0 V24"
        fill="none" stroke="url(#do-acier)" strokeWidth="2.2" strokeLinecap="round"
      />
    </svg>
  );
}

/** Le cachet de cire, frappe du sceau du pacte. Il ne tourne pas : c est
 *  une empreinte, pas le sceau vivant du bandeau. */
export function Cachet({ nom, valeurs, version }: { nom: string; valeurs: readonly string[]; version: number }) {
  return (
    <div className="do-cire" aria-label={`Cachet du pacte ${nom}`} role="img">
      <svg className="do-cire-goutte" viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <radialGradient id="do-cire-lumiere" cx="38%" cy="32%" r="75%">
            <stop offset="0" stopColor="var(--do-cire-clair)" />
            <stop offset="0.55" stopColor="var(--do-cire)" />
            <stop offset="1" stopColor="var(--do-cire-sombre)" />
          </radialGradient>
        </defs>
        <path
          d="M100 8 C128 6 150 18 168 36 C186 54 196 78 192 104 C190 128 184 150 164 168 C146 186 122 194 98 192
             C72 194 50 184 32 166 C14 148 6 126 8 100 C8 74 16 52 34 34 C52 16 74 8 100 8 Z"
          fill="url(#do-cire-lumiere)"
        />
        <circle cx="100" cy="100" r="70" fill="none" stroke="var(--do-cire-sombre)" strokeWidth="3" opacity="0.55" />
        <circle cx="100" cy="100" r="74" fill="none" stroke="var(--do-cire-clair)" strokeWidth="1.2" opacity="0.4" />
      </svg>
      <RosaceDuPacte className="do-cire-sceau" nom={nom} valeurs={valeurs} version={version} progression={1} elan={0} />
    </div>
  );
}
