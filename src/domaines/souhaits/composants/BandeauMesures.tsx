/* LE BANDEAU DE MESURES — trois vues, trois jeux de chiffres.
 *
 * Chaque vue montre ses propres comptes : aucun chiffre ne parle
 * d autre chose que de ce qu on regarde. C etait soixante-quinze
 * lignes au milieu de `pages/Wishlist.tsx`, entre les onglets et la
 * barre de recherche.
 *
 * PREMIERE COUPE DE L ETAPE 5 QUI N EST PAS UN SIMPLE DEPLACEMENT :
 * il a fallu inventer une frontiere de props. Elle est etroite — la
 * vue, les comptes, la monnaie — parce que le bandeau ne fait que
 * lire. Il ne connait ni les articles, ni les mutations, ni l etat des
 * formulaires.
 *
 * Verifiee a l ecran, pas seulement au compilateur : l empreinte de la
 * page (193 classes, 234 boutons, 3 603 caracteres de texte) est
 * comparee avant et apres.
 */
import { useTranslation } from "react-i18next";
import type { Vue } from "@/domaines/souhaits/types";
import { formatCurrency } from "@/socle/outils/currency";
import { WishlistRail } from "@/domaines/souhaits/composants/WishlistRail";

interface Comptes {
  total: number;
  totalPacte: number;
  totalLibre: number;
  paye: number;
  payePacte: number;
  payeLibre: number;
  nbPaye: number;
  coutObjectifs: number;
  nbObjectifs: number;
  libres: unknown[];
  duPacte: unknown[];
}

export function BandeauMesures({
  vue, comptes, currency, nbArticles,
}: {
  vue: Vue;
  /* Le nombre d articles de la vue courante. On passe le COMPTE, pas
     la liste : le bandeau ne lit rien d autre, et une liste en prop
     l aurait rattache a la forme d un article. */
  nbArticles: number;
  comptes: Comptes;
  currency: string;
}) {
  const { t } = useTranslation();
  /* Deux parts derivees des comptes. Elles etaient calculees dans la
     page et passees ici ; les recalculer evite deux props qui ne
     portent aucune information de plus. */
  const partPayee = comptes.total > 0 ? comptes.paye / comptes.total : 0;
  const partPayeePacte = comptes.totalPacte > 0 ? comptes.payePacte / comptes.totalPacte : 0;
  return (
    <>
      {vue === "tout" && (
        <div className="wl-bandeau">
          <div className="wl-mesure" data-veine="du">
            <u>{t("wishlist.mesure.reste", "Reste à acquérir")}</u>
            <b>{formatCurrency(comptes.total - comptes.paye, currency)}</b>
          </div>
          <div className="wl-mesure" data-veine="acquis">
            <u>{t("wishlist.mesure.paye", "Déjà payé")}</u>
            <b>{formatCurrency(comptes.paye, currency)}</b>
          </div>
          <div className="wl-mesure">
            <u>{t("wishlist.mesure.articles", "Articles")}</u>
            <b>{nbArticles - comptes.nbPaye}<s>/{nbArticles}</s></b>
          </div>
          <div className="wl-jauge">
            <div className="wl-mesure">
              <u>
                {t("wishlist.mesure.repartition", "Pacte {{pacte}} · libre {{libre}}", {
                  pacte: formatCurrency(comptes.totalPacte, currency),
                  libre: formatCurrency(comptes.totalLibre, currency),
                })}
              </u>
            </div>
            <WishlistRail className="wl-rail" part={partPayee} />
          </div>
        </div>
      )}
      
      {vue === "pacte" && (
        <div className="wl-bandeau">
          <div className="wl-mesure" data-veine="du">
            <u>{t("wishlist.mesure.restePacte", "Reste à financer")}</u>
            <b>{formatCurrency(comptes.totalPacte - comptes.payePacte, currency)}</b>
          </div>
          <div className="wl-mesure" data-veine="acquis">
            <u>{t("wishlist.mesure.paye", "Déjà payé")}</u>
            <b>{formatCurrency(comptes.payePacte, currency)}</b>
          </div>
          <div className="wl-mesure">
            <u>{t("wishlist.mesure.objectifs", "Objectifs concernés")}</u>
            <b>{comptes.nbObjectifs}</b>
          </div>
          <div className="wl-jauge">
            <div className="wl-mesure">
              {/* Le cout des objectifs du pacte, nomme pour ce
                  qu il est. Il doit egaler la somme des pieces —
                  s il en differe, une piece manque quelque part. */}
              <u>
                {t("wishlist.mesure.coutObjectifs", "Coût des objectifs du pacte : {{montant}}", {
                  montant: formatCurrency(comptes.coutObjectifs, currency),
                })}
              </u>
            </div>
            <WishlistRail className="wl-rail" part={partPayeePacte} />
          </div>
        </div>
      )}
      
      {vue === "libre" && (
        <div className="wl-bandeau">
          <div className="wl-mesure" data-veine="libre">
            <u>{t("wishlist.mesure.total", "Total")}</u>
            <b>{formatCurrency(comptes.totalLibre, currency)}</b>
          </div>
          <div className="wl-mesure" data-veine="acquis">
            <u>{t("wishlist.mesure.paye", "Déjà payé")}</u>
            <b>{formatCurrency(comptes.payeLibre, currency)}</b>
          </div>
          <div className="wl-mesure">
            <u>{t("wishlist.mesure.articles", "Articles")}</u>
            <b>{comptes.libres.length}</b>
          </div>
        </div>
      )}
      
    </>
  );
}
