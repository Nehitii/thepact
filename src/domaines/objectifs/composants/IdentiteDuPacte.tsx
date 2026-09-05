import { PactVisual } from "@/domaines/objectifs/composants/PactVisual";
import { RosaceDuPacte } from "@/domaines/objectifs/composants/RosaceDuPacte";
import { familleDeLaPolice, styleDeLEffet } from "@/domaines/objectifs/logique/typographieDuPacte";
import { useThemeSombre } from "@/socle/hooks/useThemeSombre";
import "@/domaines/objectifs/identiteDuPacte.css";

/* CE QUE LE PACTE MONTRE DE LUI : son sceau, son nom, sa raison.
 *
 * ═══ POURQUOI CE BLOC EST SORTI DU BANDEAU ═══
 *
 * « Mon pacte » laisse choisir cinq choses — le nom, la raison, le
 * symbole, la police, l effet — et n en montrait qu un fragment : un
 * logo de 44 px a cote du titre, sans sceau, sans echelle, sans le
 * fond sur lequel tout cela se pose. On choisissait donc une police et
 * un effet pour un ecran qu on ne voyait pas.
 *
 * Recopier le bandeau dans la page de reglages aurait produit une
 * deuxieme verite — exactement ce qui venait d arriver aux tables de
 * polices, recopiees d un ecran a l autre jusqu a diverger.
 *
 * ET LE BANDEAU NE PEUT PAS ETRE IMPORTE PAR LES REGLAGES : « accueil »
 * importe deja « profil ». L inverse fermerait un cycle entre les deux
 * domaines. Le bloc descend donc la ou les deux ont deja le droit
 * d aller — ici.
 *
 * IL NE PORTE PAS LES STATISTIQUES NI LE RANG. Le bandeau les affiche,
 * mais on ne les regle pas depuis « Mon pacte » : les montrer dans un
 * apercu ajouterait du bruit, pas de l information.
 */

interface Props {
  nom?: string;
  mantra?: string;
  symbole?: string;
  /** Dans leur ordre de rang : elles placent les medaillons du sceau. */
  valeurs?: readonly string[];
  /** Sous quel alphabet ce pacte a ete jure. */
  version?: number;
  /** De 0 a 100. L anneau du sceau EST la jauge. */
  progression: number;
  /** Combien de chantiers sont ouverts. Le logo bat avec. */
  enCours?: number;
  police?: string | null;
  effet?: string | null;
  /* LE TITRE N EST PAS TOUJOURS UN « h1 ». Sur le tableau de bord il
     est le titre de la page ; dans un panneau de reglages il n est
     qu un apercu, et un second « h1 » y casserait le plan du
     document. */
  commeTitre?: boolean;
  /** Reduit le bloc sans le redessiner : tout y est en « em ». */
  compact?: boolean;
}

export function IdentiteDuPacte({
  nom, mantra, symbole = "flame", valeurs, version,
  progression, enCours = 0, police, effet,
  commeTitre = true, compact = false,
}: Props) {
  const famille = familleDeLaPolice(police);
  /* L effet suit le theme : sur le noir la lumiere s ajoute, sur le
     papier elle ne peut que salir. « styleDeLEffet » tranche. */
  const sombre = useThemeSombre();
  const styleDeffet = styleDeLEffet(effet, sombre);
  const Titre = commeTitre ? "h1" : "p";
  const elan = Math.min(1, enCours / 5);

  return (
    <div
      className="relative z-10 flex flex-col items-center"
      /* TOUT LE BLOC EST EN « em » : une seule taille de reference le
         reduit en entier, sans qu aucune valeur ne soit dupliquee. */
      style={compact ? { fontSize: 9 } : undefined}
    >
      <div className="singularity-core mb-6">
        <div className="singularity-influx" />
        <div className="singularity-flare" />
        <div className="singularity-corona" />
        <div className="singularity-nucleus" />
        {/* LE SCEAU A PRIS LA PLACE DU ROND.
            « singularity-ring » n etait pas un ornement : c etait LA
            JAUGE d avancement du pacte, un degrade conique masque en
            anneau. La rosace la reprend sur sa piste externe — sans
            quoi remplacer le rond aurait fait perdre une information. */}
        <RosaceDuPacte
          className="singularity-sceau"
          nom={nom ?? ""}
          valeurs={valeurs}
          version={version}
          progression={Math.min(1, Math.max(0, progression / 100))}
          elan={elan}
          alt={nom ? `Sceau de ${nom}` : ""}
        />
        {/* GRILLE, PAS BLOC : le logo est un « inline-block » et se
            posait sur la ligne de base, qui reserve sous lui la place
            des jambages — quatre pixels au-dessus du centre du sceau. */}
        <div className="relative grid place-items-center" style={{ zIndex: 4 }}>
          {/* LE LOGO DIT CE QUI EST EN COURS.
              Il ondulait a vide — trois anneaux a 8, 5 et 3 secondes,
              quoi qu il arrive. Cinq chantiers ouverts font le plein
              elan ; zero, et il ralentit jusqu a presque s arreter, ce
              qui est en soi une information. */}
          <PactVisual
            symbol={symbole}
            size="sm"
            progress={progression}
            elan={elan}
            titre={
              enCours > 0
                ? `${enCours} ${enCours > 1 ? "objectifs en cours" : "objectif en cours"}`
                : "Aucun objectif en cours"
            }
          />
        </div>
      </div>

      <Titre
        style={{
          fontFamily: famille,
          fontSize: compact ? "1.9em" : "clamp(28px, 5vw, 58px)",
          fontWeight: 900,
          letterSpacing: compact ? 3 : 6,
          textTransform: "uppercase",
          color: "var(--nexus-heading)",
          lineHeight: 1.1,
          margin: 0,
          textAlign: "center",
          ...styleDeffet,
        }}
      >
        {nom || "NEXUS OS"}
      </Titre>

      <p
        style={{
          fontWeight: 300,
          fontSize: compact ? "1.35em" : 13,
          letterSpacing: compact ? 2 : 4,
          color: "var(--nexus-text-dim)",
          textTransform: "uppercase",
          marginTop: 10,
          maxWidth: 500,
          textAlign: "center",
        }}
      >
        {mantra || "Neural Execution & Unified Experience System"}
      </p>
    </div>
  );
}
