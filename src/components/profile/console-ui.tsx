import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import "@/styles/reglages.css";

/* LES BRIQUES DE LA CONSOLE.
 *
 * Elles remplacent un kit de quatorze exports dont la moitie ne
 * servait qu a un seul fichier — `SettingsTabBar`, `TerminalLog`,
 * `CyberInput`, `CyberSelect`, `CyberSeparator` avaient chacun un
 * unique appelant. Ici : un panneau, un reglage, trois controles, un
 * journal. Tout le reste se compose. */

/* ── LE PANNEAU ──────────────────────────────────────────────── */

interface PanneauProps {
  /* L intitule code, en majuscules : c est la signature de la console. */
  code: string;
  /* L etat a droite : « SYNC'D », « 3 ACTIFS », « HORS LIGNE »… */
  etat?: ReactNode;
  /* Vert quand tout est en ordre, rouge quand quelque chose manque. */
  ton?: "neutre" | "actif" | "alerte" | "danger";
  /* Le poids visuel. Sept panneaux du meme gris se lisent comme un
     mur : le principal d une section porte le regard, les autres
     reculent. */
  rang?: "primaire" | "normal" | "discret";
  /* « pleine » reclame les deux colonnes de la grille : pour un
     segmente, une palette, un editeur. */
  taille?: "demi" | "pleine";
  /* La derniere operation, en pied de panneau. */
  journal?: { texte: string; type?: "info" | "ok" | "warn" } | null;
  children: ReactNode;
  className?: string;
}

export function Panneau({
  code, etat, ton = "neutre", rang = "normal", taille = "demi", journal, children, className,
}: PanneauProps) {
  return (
    <section
      className={cn("rg-panneau", className)}
      data-danger={ton === "danger" ? "" : undefined}
      data-rang={rang !== "normal" ? rang : undefined}
      data-taille={taille}
    >
      <header className="rg-panneau-tete">
        <span className="rg-panneau-code">{code}</span>
        <span className="rg-panneau-fil" aria-hidden="true" />
        {etat && (
          <span
            className="rg-panneau-etat"
            data-actif={ton === "actif" ? "" : undefined}
            data-alerte={ton === "alerte" || ton === "danger" ? "" : undefined}
          >
            <span className="rg-pastille" aria-hidden="true" />
            {etat}
          </span>
        )}
      </header>

      <div className="rg-panneau-corps">{children}</div>

      {journal && (
        <p className="rg-journal" data-type={journal.type ?? "info"} role="status">
          {journal.texte}
        </p>
      )}
    </section>
  );
}

/* ── UN REGLAGE ──────────────────────────────────────────────── */

interface ReglageProps {
  nom: ReactNode;
  note?: ReactNode;
  icone?: ReactNode;
  /* Le controle passe sous l intitule : pour un segmente, une palette
     ou une glissiere, qui ont besoin de toute la largeur. */
  large?: boolean;
  children: ReactNode;
}

export function Reglage({ nom, note, icone, large, children }: ReglageProps) {
  return (
    <div className="rg-reglage" data-large={large ? "" : undefined}>
      <span className="rg-reglage-nom">
        {icone}
        {nom}
      </span>
      {note && <span className="rg-reglage-note">{note}</span>}
      <div className="rg-reglage-controle">{children}</div>
    </div>
  );
}

/* ── LE SEGMENTE ─────────────────────────────────────────────── */

interface SegmenteProps<T extends string> {
  valeur: T;
  onChange: (v: T) => void;
  options: { valeur: T; libelle: ReactNode; icone?: ReactNode }[];
  aria?: string;
}

export function Segmente<T extends string>({ valeur, onChange, options, aria }: SegmenteProps<T>) {
  return (
    <div className="rg-segmente" role="group" aria-label={aria}>
      {options.map((o) => (
        <button
          key={o.valeur}
          type="button"
          className="rg-segment"
          aria-pressed={valeur === o.valeur}
          onClick={() => onChange(o.valeur)}
        >
          {o.icone}
          {o.libelle}
        </button>
      ))}
    </div>
  );
}

/* ── LA GLISSIERE ────────────────────────────────────────────── */

export function Jauge({ children, valeur }: { children: ReactNode; valeur: ReactNode }) {
  return (
    <div className="rg-jauge">
      {children}
      <span className="rg-valeur">{valeur}</span>
    </div>
  );
}

/* ── LE BOUTON ───────────────────────────────────────────────── */

/* Quatorze styles de bouton coexistaient dans les reglages — des
   hauteurs de 16 a 136 px, deux familles de police, la casse au
   hasard. Un seul style, quatre intentions. */
export function Bouton({
  role = "normal",
  pleine,
  className,
  ...reste
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  role?: "primaire" | "normal" | "discret" | "danger";
  pleine?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn("rg-bouton", className)}
      data-role={role !== "normal" ? role : undefined}
      data-pleine={pleine ? "" : undefined}
      {...reste}
    />
  );
}

/* ── UN CHAMP ETIQUETE ───────────────────────────────────────── */

/* Pour les controles qui viennent par paire — une heure de debut et
   une de fin — et qui ont besoin d un intitule chacun. */
export function Champ({ etiquette, children }: { etiquette: ReactNode; children: ReactNode }) {
  return (
    <label className="rg-champ">
      <span className="rg-champ-etiquette">{etiquette}</span>
      {children}
    </label>
  );
}

/* ── UN AVERTISSEMENT ────────────────────────────────────────── */

/* La bande qui apparait quand un reglage en eteint d autres : le mode
   focus qui silence tout, une cle absente, un service hors ligne. */
export function Alerte({ children, ton = "warn" }: { children: ReactNode; ton?: "warn" | "info" }) {
  return (
    <p className="rg-alerte" data-ton={ton} role="status">
      {children}
    </p>
  );
}
