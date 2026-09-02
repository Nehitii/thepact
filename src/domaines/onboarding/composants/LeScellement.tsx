import { useTranslation, Trans } from "react-i18next";
import { Link } from "react-router-dom";
import { FenetreSysteme } from "@/domaines/onboarding/composants/FenetreSysteme";
import { peutSigner, type EtatDuRite } from "@/domaines/onboarding/logique/rite";


interface Props {
  etat: EtatDuRite;
  modifier: (champ: Partial<EtatDuRite> | ((e: EtatDuRite) => Partial<EtatDuRite>)) => void;
  /** Le geste tenu vit dans son crochet — voir l acte 4 de la spec. */
  signature: React.ReactNode;
}

/**
 * ACTE III — LE SCELLEMENT.
 *
 * Le cercle, les clauses, la signature. Le sigil s y dessine a partir
 * du nom et des valeurs : c est le premier endroit ou le porteur voit
 * l objet que son pacte produit.
 *
 * LE THEATRE ENROBE LE CONSENTEMENT, IL NE LE REMPLACE PAS. Une case
 * a cocher REELLE, decochee par defaut, des liens REELS vers les
 * pages, et surtout : UNE ACTION DISTINCTE DU GESTE DE SIGNATURE. Si
 * cocher et signer etaient le meme geste, le consentement cesserait
 * d etre libre, specifique et non equivoque — et la mise en scene n a
 * pas le droit de rendre la lecture invisible, seulement desirable.
 *
 * C est pourquoi la signature reste INERTE tant que la case n est pas
 * cochee : le geste ne doit meme pas pouvoir commencer.
 */
export function LeScellement({ etat, modifier, signature }: Props) {
  const { t } = useTranslation();

  return (
    <FenetreSysteme entete={t("onboarding.scellement.entete")}>
      {/* LE CERCLE N EST PLUS ICI. Il vivait dans cette fenetre, et
          l atelier le montre desormais en permanence a cote : l avoir
          aux deux endroits donnait deux sceaux du meme pacte sur le
          meme ecran. C est l objet de gauche qui ferme son anneau
          quand la signature aboutit. */}
      <p className="ob-ligne">{t("onboarding.scellement.clausesTitre")}</p>

      <label className="ob-clauses">
        <input
          type="checkbox"
          checked={etat.clausesAcceptees}
          onChange={(e) => modifier({ clausesAcceptees: e.target.checked })}
        />
        <span>
          <Trans
            i18nKey="onboarding.scellement.clauses"
            components={{
              conditions: <Link to="/legal" target="_blank" rel="noopener noreferrer" />,
              confidentialite: <Link to="/legal" target="_blank" rel="noopener noreferrer" />,
            }}
          />
        </span>
      </label>

      {/* La signature ne s offre pas avant la case : deux gestes, dans
          cet ordre, et jamais fondus l un dans l autre. */}
      <div aria-live="polite">
        {peutSigner(etat)
          ? signature
          : <p className="ob-ligne ob-ligne--sourde">{t("onboarding.scellement.avantLaCase")}</p>}
      </div>
    </FenetreSysteme>
  );
}
