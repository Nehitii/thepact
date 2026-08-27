import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
/* `Trans` plutôt que `t()` : la phrase porte le chemin DANS une balise
   <code>. Avec `t()` seul, il faudrait la couper en deux morceaux dont
   l'ordre change d'une langue à l'autre. C'est le seul endroit du dépôt
   qui en a besoin. */
import { Trans, useTranslation } from "react-i18next";

import { Home, ArrowLeft } from "lucide-react";
import "@/styles/introuvable.css";

/**
 * LA PAGE DES CHEMINS QUI N'EXISTENT PAS.
 *
 * ═══════════════════════════════════════════════════════════════
 * CE QU'ELLE DIT MAINTENANT
 *
 * Elle disait « 404 » avec un triangle d'avertissement au milieu du
 * nombre — le pictogramme générique de l'erreur, celui de n'importe
 * quelle page de n'importe quel site. Rien n'y appartenait à cette
 * application-ci.
 *
 * Elle dit maintenant quelque chose que seule celle-ci peut dire :
 * M.I.A tourne au signal, et là où il n'y en a pas, elle finit par
 * s'endormir. La page n'annonce plus une panne, elle montre un
 * endroit vide — et quelqu'un qui y attendait.
 *
 * L'ILLUSTRATION VIENT DE LA PLANCHE DE POSES. Découpée du fond par
 * propagation depuis les bords (le fond est un dégradé : le comparer
 * à une couleur de référence n'aurait rien donné), puis adoucie sur
 * un pixel pour lui rendre son anticrénelage.
 *
 * LE FLOTTEMENT EST DANS LA FEUILLE DE STYLE, pas ici : c'est de la
 * présentation, et il doit pouvoir s'éteindre sous
 * `prefers-reduced-motion` sans que ce composant ait à le savoir.
 * ═══════════════════════════════════════════════════════════════
 */
const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [decroche, setDecroche] = useState(false);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  /* LE DÉCROCHAGE EST SÉPARÉ DU JOURNAL.
     Les deux vivaient dans le même effet, dont la dépendance était le
     chemin : changer de route relançait donc l'intervalle. Ils n'ont
     rien à voir — l'un trace, l'autre décore — et celui-ci ne dépend
     de rien. */
  useEffect(() => {
    const rythme = setInterval(() => {
      setDecroche(true);
      setTimeout(() => setDecroche(false), 180);
    }, 4500);
    return () => clearInterval(rythme);
  }, []);

  return (
    <div className="introuvable">
      <div className="introuvable__balayage" aria-hidden="true" />
      <div className="introuvable__aure" aria-hidden="true" />

      <div className="introuvable__equerre introuvable__equerre--hg" aria-hidden="true" />
      <div className="introuvable__equerre introuvable__equerre--hd" aria-hidden="true" />
      <div className="introuvable__equerre introuvable__equerre--bg" aria-hidden="true" />
      <div className="introuvable__equerre introuvable__equerre--bd" aria-hidden="true" />

      <div className="introuvable__colonne">
        <div className="introuvable__scene">
          {/* ELLE VIENT AVANT LE NOMBRE, ET C'EST L'ESSENTIEL DU PLAN :
              en colonne, ce qui est écrit d'abord est en haut. Elle est
              donc suspendue AU-DESSUS du 404, qui remonte sous elle
              d'un demi-cadratin. Son ombre tombe sur les chiffres —
              c'est ce qui fait lire de la hauteur plutôt qu'un simple
              empilement. */}
          <div className="introuvable__flotte">
            <img
              src="/marque/mia-flottante.png"
              /* Les dimensions natives réservent la place avant que
                 l'image arrive : sans elles, tout ce qui suit sauterait
                 au chargement. */
              width={466}
              height={411}
              alt={t("notFound.miaAlt", "M.I.A endormie, flottant dans le vide")}
              className="introuvable__mia"
            />
            <div className="introuvable__ombre" aria-hidden="true" />
          </div>

          {/* `aria-hidden` : le nombre est déjà dit par l'étiquette qui
              suit. Un lecteur d'écran qui annonce « 404 » puis « signal
              perdu, route introuvable » répète la même chose deux fois. */}
          <div
            className={`introuvable__nombre${decroche ? " introuvable__nombre--decroche" : ""}`}
            aria-hidden="true"
          >
            404
          </div>
        </div>

        <div className="introuvable__hud">
          <span className="introuvable__temoin" aria-hidden="true" />
          {t("notFound.signalPerdu", "Signal perdu — route introuvable")}
        </div>

        <p className="introuvable__chemin">
          <Trans
            i18nKey="notFound.chemin"
            values={{ chemin: location.pathname }}
            components={[<code key="c" />]}
            defaults="Le chemin demandé <0>{{chemin}}</0> n’existe pas dans ce système."
          />
        </p>

        <p className="introuvable__voix">
          <b>M.I.A</b>
          {t("notFound.voixMia", "Il n’y a rien ici. Enfin, rien qui ne puisse t’intéresser, nous sommes quelque part dans la mère du code de cette application maudite… Quelque chose ne me plaît pas ici…")}
        </p>

        {/* Le `Button` générique de l'application est écarté ici :
            Rajdhani, coins arrondis, remplissage plein — rien qui
            appartienne à cette page, dont tout le reste parle en
            monospace et en capitales espacées. Les deux issues
            reprennent l'idiome de l'étiquette HUD ci-dessus. */}
        <div className="introuvable__actions">
          <button
            type="button"
            className="introuvable__bouton introuvable__bouton--retour"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft aria-hidden="true" /> {t("notFound.retour", "Retour")}
          </button>
          <button
            type="button"
            className="introuvable__bouton introuvable__bouton--issue"
            onClick={() => navigate("/")}
          >
            <Home aria-hidden="true" /> {t("notFound.tableauDeBord", "Tableau de bord")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
