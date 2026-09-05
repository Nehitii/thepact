import { IdentiteDuPacte } from "@/domaines/objectifs";

/* CE QUE LE TABLEAU DE BORD VA MONTRER — pendant qu on le regle.
 *
 * « Mon pacte » laisse choisir cinq choses : le nom, la raison, le
 * symbole, la police et l effet du titre. Il n en montrait qu un
 * fragment — un logo de 44 px pose a cote du titre, sans le sceau,
 * sans l echelle, sans le fond noir sur lequel tout cela se pose. On
 * choisissait donc une typographie pour un ecran qu on ne voyait pas,
 * et il fallait enregistrer puis revenir au tableau de bord pour
 * savoir ce qu on venait de faire.
 *
 * IL EST COLLANT, ET C EST TOUT L INTERET. Le choix de la police est
 * en bas du second panneau ; un apercu pose en haut de la page serait
 * sorti de l ecran au moment precis ou il sert. Il reste donc visible
 * pendant qu on fait defiler les reglages.
 *
 * CE N EST PAS UNE COPIE DU BANDEAU, C EST LE BANDEAU. Le meme
 * composant, les memes valeurs, la meme table de polices — une copie
 * aurait diverge, ce qui venait justement d arriver aux tables de
 * polices, recopiees d un ecran a l autre jusqu a proposer deux fontes
 * que l application n embarque pas.
 *
 * LA JAUGE EST ILLUSTRATIVE, ET L ECRAN LE DIT. Le sceau, lui, est le
 * vrai : il se deduit du nom, des valeurs dans leur ordre de rang et
 * de la version sous laquelle le pacte a ete jure.
 */

interface Props {
  nom: string;
  mantra: string;
  symbole: string;
  /** Dans leur ordre de rang : elles placent les medaillons du sceau. */
  valeurs?: readonly string[];
  /** Sous quel alphabet le pacte a ete jure. Sans elle, un pacte de la
   *  v1 se redessinerait en v2 dans son propre apercu. */
  version?: number;
  police: string;
  effet: string;
}

/** Assez remplie pour que l anneau se lise, pas assez pour se faire
 *  passer pour une mesure. */
const JAUGE_ILLUSTRATIVE = 62;

export function ApercuDuBandeau({
  nom, mantra, symbole, valeurs, version, police, effet,
}: Props) {
  return (
    <div className="sticky top-2 z-30 mb-4 border border-primary/25 bg-[hsl(var(--ds-bg-base))]/95 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-primary/15 px-3 py-1.5">
        <span className="ds-t-label font-mono uppercase tracking-[0.22em] text-primary/40">
          Aperçu du tableau de bord
        </span>
        <span className="ds-t-label font-mono uppercase tracking-wider text-primary/20">
          jauge illustrative
        </span>
      </div>
      <div className="flex justify-center overflow-hidden px-3 py-4">
        <IdentiteDuPacte
          compact
          commeTitre={false}
          nom={nom}
          mantra={mantra}
          symbole={symbole}
          valeurs={valeurs}
          version={version}
          police={police}
          effet={effet}
          progression={JAUGE_ILLUSTRATIVE}
          enCours={2}
        />
      </div>
    </div>
  );
}
