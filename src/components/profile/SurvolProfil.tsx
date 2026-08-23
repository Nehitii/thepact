import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CarteProfilPublic } from "@/components/profile/CarteProfilPublic";
import { useCarteProfil } from "@/hooks/useCarteProfil";
import "@/styles/carte-profil.css";

/* MONTRER LA CARTE DE QUELQU UN EN LE SURVOLANT.
 *
 * TROIS PRECAUTIONS, ET CHACUNE REPARE UN DEFAUT CONNU DES INFOBULLES :
 *
 * 1. UN DELAI AVANT D APPARAITRE. Sans lui, traverser une liste de
 *    membres fait clignoter une carte par ligne. La requete elle-meme
 *    n est lancee qu au bout du delai : un survol qui passe ne coute
 *    rien du tout.
 *
 * 2. UN DELAI AVANT DE DISPARAITRE. La carte s affiche SOUS la ligne :
 *    pour aller la lire, la souris doit quitter la ligne. Sans ce
 *    sursis, elle se refermerait pile au moment ou on la vise. Et
 *    survoler la carte elle-meme la maintient ouverte.
 *
 * 3. ELLE SE RETOURNE. Le dernier membre d une liste est en bas de
 *    l ecran ; une carte de deux cent dix pixels y sortirait du cadre.
 *    On mesure la place disponible au moment d ouvrir.
 *
 * Le clavier est servi aussi : focus ouvre, blur ferme, Echap ferme.
 * Sur un ecran tactile il n y a pas de survol — la carte ne s affiche
 * pas et la ligne garde son comportement habituel. */

const DELAI_OUVERTURE = 320;
const DELAI_FERMETURE = 180;

/* La hauteur reelle de la carte compacte, mesuree : 359px, plus le
   decalage de 8px. Le premier essai retournait la carte en dessous de
   240px de place restante — soit cent vingt pixels trop tard : la
   carte s ouvrait vers le bas et sortait de l ecran. */
const HAUTEUR_CARTE = 368;

interface Props {
  userId: string;
  children: ReactNode;
}

export function SurvolProfil({ userId, children }: Props) {
  const { t } = useTranslation();
  const [ouvert, setOuvert] = useState(false);
  const [sens, setSens] = useState<"bas" | "haut">("bas");
  const ancre = useRef<HTMLDivElement>(null);
  const minuterie = useRef<number>();

  const { data: carte, isLoading } = useCarteProfil(userId, ouvert);

  const annuler = () => {
    if (minuterie.current) window.clearTimeout(minuterie.current);
  };

  const ouvrir = useCallback(() => {
    annuler();
    minuterie.current = window.setTimeout(() => {
      /* La place disponible est mesuree A L OUVERTURE, pas au montage :
         la page a pu defiler entre-temps.
         Quand aucun des deux cotes ne suffit — une ligne au milieu d une
         petite fenetre — on prend le plus grand des deux plutot que de
         s entêter vers le bas. */
      const r = ancre.current?.getBoundingClientRect();
      if (r) {
        const dessous = window.innerHeight - r.bottom;
        const dessus = r.top;
        setSens(dessous < HAUTEUR_CARTE && dessus > dessous ? "haut" : "bas");
      }
      setOuvert(true);
    }, DELAI_OUVERTURE);
  }, []);

  const fermer = useCallback(() => {
    annuler();
    minuterie.current = window.setTimeout(() => setOuvert(false), DELAI_FERMETURE);
  }, []);

  useEffect(() => annuler, []);

  useEffect(() => {
    if (!ouvert) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuvert(false);
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [ouvert]);

  return (
    <div
      ref={ancre}
      className="cp-ancre"
      onMouseEnter={ouvrir}
      onMouseLeave={fermer}
      onFocusCapture={ouvrir}
      onBlurCapture={fermer}
    >
      {children}

      {ouvert && (
        <div
          className="cp-bulle"
          data-sens={sens}
          role="tooltip"
          onMouseEnter={annuler}
          onMouseLeave={fermer}
        >
          {isLoading || !carte ? (
            <div className="cp-attente" aria-busy="true" />
          ) : !carte.trouve ? (
            <p className="cp-muette">{t("guild.profileGone", "Ce profil n’existe plus.")}</p>
          ) : !carte.visible ? (
            <p className="cp-muette">
              {t("guild.profileHidden", "Cette personne garde son profil pour elle.")}
            </p>
          ) : (
            <CarteProfilPublic carte={carte} compacte />
          )}
        </div>
      )}
    </div>
  );
}
