import { useMemo } from "react";
import { Panneau } from "@/socle/ds/console-ui";
import { FondVivant } from "@/socle/ds/fonds/FondVivant";
import { FONDS_AU_CHOIX, useFondDuTableau } from "@/socle/ds/fonds/choix";
import { PROPOSITIONS, teinteDuPacte } from "@/socle/ds/fonds/catalogue";
import { useThemeSombre } from "@/socle/hooks/useThemeSombre";
import { useAuth } from "@/socle/contextes/AuthContext";
import { usePact, useValeursDuPacte, rosaceDuPacte } from "@/domaines/objectifs";
import "@/domaines/profil/reglage-du-fond.css";

interface Props {
  noter: (panneau: string, texte: string, type?: "info" | "ok" | "warn") => void;
  journal: { texte: string; type?: "info" | "ok" | "warn" } | null;
}

/* LE FOND DU TABLEAU DE BORD.
 *
 * UN FOND NE SE CHOISIT PAS SUR SON NOM. « Horizon » ou « Essaim » ne
 * disent rien de ce qu on verra ; l apercu, si. Il tourne en direct,
 * dans la teinte du pacte et avec son sceau — c est le fond qu on
 * aura, pas une vignette de catalogue.
 *
 * UN SEUL APERCU A LA FOIS. Huit apercus vivants feraient huit
 * contextes graphiques ouverts ensemble, et certains navigateurs en
 * refusent au-dela d une poignee. Le choix se fait donc en un clic, et
 * l apercu change avec lui.
 *
 * La constellation s y montre a moitie tracee : sur le tableau de
 * bord, c est la progression du pacte qui l allume. */
export function PanneauFond({ noter, journal }: Props) {
  const { user } = useAuth();
  const { data: pact } = usePact(user?.id);
  const { data: valeurs = [] } = useValeursDuPacte(user?.id);
  const [fond, choisir] = useFondDuTableau();
  const sombre = useThemeSombre();

  const sceau = useMemo(
    () => (pact ? rosaceDuPacte(pact.name, valeurs, pact.sigil_version ?? 1) : undefined),
    [pact, valeurs],
  );
  const choix = PROPOSITIONS.filter((p) => FONDS_AU_CHOIX.includes(p.id));
  const courant = choix.find((p) => p.id === fond) ?? choix[0];

  return (
    <Panneau
      code="Fond du tableau de bord"
      etat={courant.nom.toLowerCase()}
      ton="actif"
      taille="pleine"
      journal={journal}
    >
      <div className="rg-fond">
        <figure className="rg-fond-apercu">
          <div className="rg-fond-ecran" aria-hidden="true">
            <FondVivant
              key={courant.id}
              id={courant.id}
              teinte={teinteDuPacte(pact?.color)}
              sceau={sceau}
              progression={0.5}
              cadre
            />
          </div>
          <figcaption className="rg-fond-legende">{courant.idee}</figcaption>
        </figure>

        <div className="rg-fond-choix" role="group" aria-label="Fond du tableau de bord">
          {choix.map((p) => (
            <button
              key={p.id}
              type="button"
              className="rg-fond-option"
              aria-pressed={p.id === courant.id}
              onClick={() => {
                if (p.id === courant.id) return;
                choisir(p.id);
                noter("fond", `fond → ${p.nom.toLowerCase()}`);
              }}
            >
              {p.nom}
            </button>
          ))}
        </div>

        <p className="rg-fond-note">
          {!sombre && (
            <>Tu es en thème clair : le tableau de bord y garde le ciel classique, les autres fonds sont faits pour la nuit. </>
          )}
          Les fonds animés tournent sur la carte graphique. Ils s’arrêtent quand l’onglet est caché, et se figent si
          tu réduis les animations.
        </p>
      </div>
    </Panneau>
  );
}
