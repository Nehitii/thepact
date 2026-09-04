import { PactVisual, RosaceDuPacte } from "@/domaines/objectifs";

interface Props {
  nomDuPacte: string;
  valeurs: readonly string[];
  symbole: string;
  mantra: string;
  /** La teinte du pacte, en couleur CSS resolue. */
  teinte: string;
  /** Vrai une fois le serment signe : la piste du sceau se remplit. */
  scelle?: boolean;
  sansAnimation?: boolean;
}

/**
 * L OBJET DU PACTE.
 *
 * LE RITE N EST PAS UNE SUITE DE FENETRES : c est un objet qu on
 * forge, et qui reste sous les yeux du debut a la fin. Chaque reponse
 * le change pour de vrai — le nom fait naitre les signes, le symbole
 * bat en son centre, la teinte gagne tout l ecran, les valeurs
 * viennent s ancrer a ses medaillons.
 *
 * C EST CE QUI REMPLACE LA BARRE DE PROGRESSION. On ne lit pas
 * combien il reste : on voit ce qu on a deja.
 *
 * ═══ C EST LE MEME SCEAU QUE LE TABLEAU DE BORD ═══
 *
 * Il dessinait auparavant son propre anneau, avec ses propres traits
 * et ses propres angles. Deux dessins pour un seul objet : le rite en
 * forgeait un, le hub en montrait un autre, et rien ne garantissait
 * qu ils se ressemblent. « RosaceDuPacte » est desormais la seule
 * figure — ce qu on voit se former ici est exactement ce qu on
 * retrouvera sur le tableau de bord.
 *
 * ETEINT tant qu aucun signe n est choisi : l ancien rite montrait une
 * flamme ambre des la premiere question, un defaut deguise en choix.
 */
export function LObjetDuPacte({
  nomDuPacte, valeurs, symbole, mantra, teinte, scelle, sansAnimation,
}: Props) {
  const eteint = symbole.length === 0;

  return (
    <div
      className={`ob-objet${eteint ? " ob-objet--eteint" : ""}`}
      style={{ "--ob-teinte": teinte } as React.CSSProperties}
    >
      {/* Le cercle dans sa propre boite carree : le halo, la rosace et
          le coeur se posent en absolu, et la legende garde sa place
          dans le flux — sans quoi elle passait sous la voie. */}
      <div className="ob-objet-cadre">
        <div className="ob-objet-halo" aria-hidden="true" />

        {/* LA PISTE SE REMPLIT AU SERMENT. Ailleurs elle porte
            l avancement du pacte ; ici il n y a rien a avancer — elle
            dit donc la seule chose qui se passe : c est signe. */}
        <RosaceDuPacte
          className="ob-objet-rosace"
          nom={nomDuPacte}
          valeurs={valeurs}
          progression={scelle ? 1 : 0}
        />

        <div className="ob-objet-coeur">
          {eteint
            ? <svg className="ob-coeur-vide" viewBox="-1 -1 2 2" aria-hidden="true">
                <circle cx="0" cy="0" r="0.8" strokeWidth={1.2} strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
              </svg>
            : /* « sm », comme le tableau de bord. En « lg » le symbole faisait
                 128 px dans un objet de 190 : il debordait du sceau et
                 en cassait le cercle. */
              <PactVisual symbol={symbole} size="sm" elan={scelle ? 1 : 0.55} />}
        </div>
      </div>

      <div className="ob-objet-legende">
        <b className="ob-objet-nom">{nomDuPacte || "—"}</b>
        {mantra && <span className="ob-objet-mantra">{mantra}</span>}
      </div>
    </div>
  );
}
