import { motion } from "framer-motion";
import { VisageMia } from "@/domaines/mia";
import { TexteEcrit } from "@/domaines/onboarding/composants/TexteEcrit";
import type { ExpressionDuRite } from "@/domaines/onboarding/logique/repliques";

interface Props {
  texte: string;
  expression: ExpressionDuRite;
  /**
   * Montrer le portrait sur CETTE bulle. Il ne reparait que lorsque
   * son expression change : repete a chaque ligne, il devient un
   * decor et on cesse de le voir.
   */
  visage?: boolean;
  /**
   * Elle n a pas encore de visage du tout — les deux premieres
   * repliques, dites depuis le noir. Distinct de « visage » : une
   * bulle sans portrait garde la colonne vide et donc l alignement,
   * une bulle ANONYME n a pas de colonne et se pose au milieu.
   */
  anonyme?: boolean;
  /** Une bulle passee : dite, et rangee derriere celle qui parle. */
  passee?: boolean;
  /** La bulle en train de s ecrire. Les passees sont deja entieres. */
  ecrite?: boolean;
  sansAnimation?: boolean;
  onFini?: () => void;
}

/**
 * UNE BULLE DE M.I.A. — une vraie.
 *
 * L ancien rite posait ses phrases en texte nu au milieu d une
 * fenetre : on lisait le systeme, on n entendait personne. Une bulle
 * a un EMETTEUR — un visage a cote, une queue qui pointe vers lui — et
 * c est cette queue, minuscule, qui fait la difference entre « du
 * texte s affiche » et « quelqu un te parle ».
 *
 * LES DEUX PREMIERES N ONT PAS DE VISAGE. Elle parle avant d etre la ;
 * la bulle sort du noir, sans emetteur, et c est voulu. Le visage
 * parait a la troisieme, quand elle se reprend.
 *
 * LES BULLES DITES RESTENT. Une conversation garde ce qui a ete dit —
 * sinon chaque phrase efface la precedente et le porteur lit un
 * bandeau, pas un echange.
 */
export function BulleDuRite({
  texte, expression, visage = true, anonyme, passee, ecrite, sansAnimation, onFini,
}: Props) {
  return (
    <motion.div
      className={`ob-bulle${passee ? " ob-bulle--passee" : ""}${anonyme ? " ob-bulle--sansVisage" : ""}`}
      initial={sansAnimation ? false : { opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
    >
      {visage && !anonyme && (
        <div className="ob-bulle-emetteur" aria-hidden="true">
          <VisageMia expression={expression} taille={54} cadre="visage" />
        </div>
      )}

      <div className="ob-bulle-corps">
        {ecrite && !sansAnimation
          ? <TexteEcrit texte={texte} cadence={26} onFini={onFini} />
          : <span>{texte}</span>}
      </div>
    </motion.div>
  );
}
