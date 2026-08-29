import { ReactNode, ReactElement, cloneElement, forwardRef, isValidElement, useId } from "react";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/socle/ui/select";
import { cn } from "@/socle/outils/utils";
/* CE FICHIER N IMPORTE PLUS SA FEUILLE, ET C EST DELIBERE.
   Ce sont les NEUF PAGES qui rendent ces briques qui importent
   `socle/ds/reglages.css`. Cela a l air moins pratique — c est neuf
   lignes au lieu d une, et une page qui oublierait l import perdrait
   son style. C est le prix de 10 947 octets retires du chemin
   critique, et il est mesure.

   POURQUOI : Vite hisse dans la feuille d entree toute feuille
   atteinte depuis un MODULE PARTAGE, pour n avoir ni doublon ni
   chargement en retard. Ce fichier est partage par quatre domaines ;
   sa feuille partait donc dans l entree, servie a la page de connexion
   comprise. Importee directement par des pages, elle obtient son
   propre morceau — 8 014 o charges seulement par qui en a besoin.

   DEUX ESSAIS L ONT DIT AVANT DE LE FAIRE. Retirer cet import en
   laissant `ConsoleReglages` l importer n a rien change : ce composant
   est partage lui aussi. Ce n est ni le nombre d importateurs ni le
   nombre de routes — c est le fait qu un MODULE PARTAGE soit sur le
   chemin.

   La liste des neuf pages se retrouve par la fermeture transitive des
   imports vers ce fichier ; elle est dans le compte-rendu de l etape 4
   au cas ou une dixieme apparaisse. */

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
  /* L INTITULE EST UN VOISIN, PAS UNE ETIQUETTE.

     Radix rend ses interrupteurs et ses glissieres sans texte propre.
     Sans rattachement explicite, la console annoncait dix-neuf
     controles « bouton » sans jamais dire lesquels : visuellement
     etiquetes, muets a l oreille.

     On rattache ici plutot qu a chaque appel — vingt sites
     aujourd hui, et tous ceux qui viendront. Un enfant qui porte
     deja son propre nom garde le sien. */
  const idNom = useId();
  const enfant =
    isValidElement(children) &&
    !(children.props as Record<string, unknown>)["aria-label"] &&
    !(children.props as Record<string, unknown>)["aria-labelledby"]
      ? cloneElement(children as ReactElement<Record<string, unknown>>, { "aria-labelledby": idNom })
      : children;

  return (
    <div className="rg-reglage" data-large={large ? "" : undefined}>
      <span className="rg-reglage-nom" id={idNom}>
        {icone}
        {nom}
      </span>
      {note && <span className="rg-reglage-note">{note}</span>}
      <div className="rg-reglage-controle">{enfant}</div>
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

export function Jauge({
  children,
  valeur,
  ...reste
}: { children: ReactNode; valeur: ReactNode } & Record<string, unknown>) {
  /* Elle s intercale entre `Reglage` et la glissiere pour coller la
     valeur chiffree a cote. En s intercalant, elle interceptait
     l etiquette : elle la relaie desormais. */
  const lie = reste["aria-labelledby"];
  const enfant =
    lie && isValidElement(children) &&
    !(children.props as Record<string, unknown>)["aria-labelledby"]
      ? cloneElement(children as ReactElement<Record<string, unknown>>, { "aria-labelledby": lie })
      : children;

  return (
    <div className="rg-jauge">
      {enfant}
      <span className="rg-valeur">{valeur}</span>
    </div>
  );
}

/* ── LE BOUTON ───────────────────────────────────────────────── */

/* Quatorze styles de bouton coexistaient dans les reglages — des
   hauteurs de 16 a 136 px, deux familles de police, la casse au
   hasard. Un seul style, quatre intentions. */
/* La `ref` est transmise : Radix pose la sienne sur le declencheur
   qu il enveloppe (`AlertDialogTrigger asChild`), et un composant qui
   la laisse tomber declenche « Function components cannot be given
   refs » — le declencheur perd alors son ancrage et son focus. */
export const Bouton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    role?: "primaire" | "normal" | "discret" | "danger";
    pleine?: boolean;
  }
>(function Bouton({ role = "normal", pleine, className, ...reste }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn("rg-bouton", className)}
      data-role={role !== "normal" ? role : undefined}
      data-pleine={pleine ? "" : undefined}
      {...reste}
    />
  );
});

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

/* ── UN EDITEUR ──────────────────────────────────────────────── */

/* UN INTITULE QUI NE DESIGNE RIEN N EST PAS UN INTITULE.
 *
 * L ancien kit dessinait un `<label>` voisin du controle, sans
 * `htmlFor`, sans `id` en face, et sans l englober : le lien etait
 * purement visuel. Sur la page Compte, sept champs de suite
 * s annoncaient « zone d edition, vide ».
 *
 * Les deux composants ci-dessous possedent le cablage plutot que de le
 * laisser a l appelant : `htmlFor` pour une saisie native,
 * `aria-labelledby` pour une liste Radix — qui est un bouton et non un
 * `select`, et qu un `<label>` englobant ne nomme donc pas de facon
 * fiable. */

interface EditeurCommun {
  etiquette: ReactNode;
  /* Une phrase sous le champ : ce qu on attend, ou ce qui ne va pas. */
  aide?: ReactNode;
  /* Vrai quand `aide` decrit une faute : elle passe en rouge et le
     champ avec elle. */
  faute?: boolean;
  /* Prend la largeur des deux colonnes de `.rg-champs`. */
  pleine?: boolean;
}

export function ChampTexte({
  etiquette, aide, faute, pleine, className, ...reste
}: EditeurCommun & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className="rg-editeur" data-pleine={pleine ? "" : undefined}>
      <label className="rg-champ-etiquette" htmlFor={id}>{etiquette}</label>
      <input
        id={id}
        className={cn("rg-saisie", className)}
        data-faute={faute ? "" : undefined}
        aria-invalid={faute || undefined}
        aria-describedby={aide ? `${id}-aide` : undefined}
        {...reste}
      />
      {aide && <p className="rg-editeur-aide" id={`${id}-aide`} data-faute={faute ? "" : undefined}>{aide}</p>}
    </div>
  );
}

export function ChampListe({
  etiquette, aide, faute, pleine, valeur, onChange, placeholder, disabled, children,
}: EditeurCommun & {
  valeur: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="rg-editeur" data-pleine={pleine ? "" : undefined}>
      {/* Un `<span>` porteur d id, pas un `<label>` : Radix rend un
          bouton, que `htmlFor` ne designe pas. */}
      <span className="rg-champ-etiquette" id={id}>{etiquette}</span>
      <Select value={valeur} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="rg-saisie" aria-labelledby={id} data-faute={faute ? "" : undefined}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-card border-primary/20 max-h-[300px]">{children}</SelectContent>
      </Select>
      {aide && <p className="rg-editeur-aide" data-faute={faute ? "" : undefined}>{aide}</p>}
    </div>
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
