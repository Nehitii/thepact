import { useCallback, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Bouton } from "@/socle/ds/console-ui";
import { DataPanel } from "@/socle/ds/settings-ui";
import { RosaceDuPacte, VERSION_ALPHABET, ecritureDeLaVersion, usePactMutation } from "@/domaines/objectifs";

/* REFONDRE LE SCEAU — le seul geste qui change tous ses signes.
 *
 * ═══ POURQUOI CE PANNEAU EXISTE ═══
 *
 * « pacts.sigil_version » a ete ajoutee par migration avec
 * « default 1 ». Tous les pactes anterieurs sont donc en v1 — et rien,
 * nulle part, ne les faisait passer en v2. « useSceller » ecrit la
 * version courante AU SCELLEMENT, ce qui ne vaut que pour un pacte
 * jure apres coup. Un porteur d avant se voyait donc refuser le nouvel
 * alphabet a vie, sur la derniere version du code, sans que rien a
 * l ecran ne lui dise pourquoi son sceau ne ressemblait pas a ce qu on
 * lui montrait.
 *
 * Le figement est VOULU : un sceau qui bouge tout seul n est pas un
 * sceau, et personne ne doit retrouver un matin une figure qu il n a
 * pas choisie. Mais figer n est pas enfermer. Le geste existe, il est
 * explicite, et il ne part jamais d une mise a jour.
 *
 * ═══ ON MONTRE AVANT DE DEMANDER ═══
 *
 * Les deux sceaux cote a cote, dessines avec le VRAI nom et les VRAIES
 * valeurs du pacte. Un bouton « refondre » sans montrer ce qu on perd
 * demanderait de signer a l aveugle — et ce qui change ici n est pas un
 * reglage, c est la figure entiere : meme squelette, pas un signe en
 * commun.
 *
 * ═══ IL DISPARAIT QUAND IL N A PLUS RIEN A DIRE ═══
 *
 * Un pacte deja a jour ne voit qu une ligne. Un panneau qui propose une
 * refonte impossible est du bruit dans une console de reglages.
 */

interface Props {
  userId: string;
  pactId: string | null;
  nom: string;
  /** Dans leur ordre de rang : elles placent les medaillons. */
  valeurs?: readonly string[];
  /** Celle du pacte. Absente le temps du chargement. */
  version?: number;
  /** Pour que la page relise la version qu elle vient de faire ecrire. */
  onRefondu: (version: number) => void;
}

/** Assez remplie pour que l anneau se lise dans une vignette. */
const JAUGE_ILLUSTRATIVE = 62;

function Vignette({ nom, valeurs, version, legende, courant }: {
  nom: string; valeurs?: readonly string[]; version: number;
  legende: string; courant: boolean;
}) {
  return (
    <figure className="m-0 flex flex-col items-center gap-2">
      {/* CENT QUATRE-VINGTS, PAS CENT TRENTE-DEUX. Ce panneau existe
          pour qu on voie ce qu on change ; a 132 px un ideogramme de
          medaillon ne faisait que 10,2 px et les deux versions se
          ressemblaient. A 180 il en fait 13,9 — l ordre de grandeur du
          tableau de bord, qui en montre 19,5. La comparaison est donc
          honnete plutot que decorative. */}
      <div
        className={
          "grid h-[180px] w-[180px] place-items-center border p-1 " +
          (courant ? "border-primary/15 bg-primary/[0.02]" : "border-primary/40 bg-primary/[0.06]")
        }
      >
        <RosaceDuPacte
          nom={nom}
          valeurs={valeurs}
          version={version}
          progression={JAUGE_ILLUSTRATIVE / 100}
          elan={0.4}
          alt={`${legende} — sceau de ${nom || "ton pacte"}`}
          className="h-full w-full text-primary"
        />
      </div>
      <figcaption className="ds-t-label font-mono uppercase tracking-wider text-primary/40">
        {legende}
      </figcaption>
    </figure>
  );
}

export function AlphabetDuSceau({ userId, pactId, nom, valeurs, version, onRefondu }: Props) {
  const [demande, setDemande] = useState(false);
  const { updatePact, isUpdating } = usePactMutation(userId, pactId);

  const refondre = useCallback(async () => {
    await updatePact({ sigil_version: VERSION_ALPHABET });
    onRefondu(VERSION_ALPHABET);
    setDemande(false);
    toast.success("Sceau refondu", {
      description: "Ton pacte porte le nouvel alphabet.",
    });
  }, [updatePact, onRefondu]);

  /* Le temps du chargement, on ne dit rien : annoncer « a jour » puis se
     dedire une seconde plus tard est pire que se taire. */
  if (version === undefined) return null;

  const aJour = version >= VERSION_ALPHABET;
  /* ON DIT CE QUI CHANGE VRAIMENT, PAS UN TEXTE GENERAL. La v3 garde
     les signes de la v2 et ne remplace que ceux des medaillons : ecrire
     « tous ses signes » a qui n en verra changer que trois serait un
     mensonge, et ce panneau existe justement pour ne pas en faire. */
  const avant = ecritureDeLaVersion(version);
  const apres = ecritureDeLaVersion(VERSION_ALPHABET);
  const bandeChange = avant.signes !== apres.signes;

  return (
    <DataPanel
      code="MODULE_02c"
      title="Alphabet du sceau"
      statusText={
        aJour
          ? <span className="text-primary/50">à jour · v{version}</span>
          : <span className="text-amber-400/80">v{version} · une refonte est possible</span>
      }
    >
      <div className="space-y-4 py-4">
        {aJour ? (
          <p className="ds-t-label font-mono tracking-wider text-primary/25">
            Ton sceau est dessiné avec l’alphabet courant. Il ne changera plus
            de lui-même : c’est ce qui en fait un sceau.
          </p>
        ) : (
          <>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Ton pacte a été juré sous une écriture plus ancienne. Son sceau en
              garde les signes — c’est voulu : une figure jurée ne se redessine
              pas toute seule. La structure ne bougera pas ;{" "}
              {bandeChange
                ? <>en revanche <b className="text-primary/70">tous</b> ses signes changent, ceux de la bande comme ceux des valeurs.</>
                : <>seuls les caractères des <b className="text-primary/70">valeurs</b> changent — la bande, qui épelle ton nom, reste la même.</>}
            </p>

            <div className="flex flex-wrap items-start justify-center gap-6">
              <Vignette nom={nom} valeurs={valeurs} version={version} legende="Aujourd’hui" courant />
              <Vignette nom={nom} valeurs={valeurs} version={VERSION_ALPHABET} legende={`Après · v${VERSION_ALPHABET}`} courant={false} />
            </div>

            {demande ? (
              <div className="space-y-2 border border-amber-400/30 bg-amber-400/[0.04] p-3">
                <p className="ds-t-label font-mono uppercase tracking-wider text-amber-400/80">
                  Refondre le sceau de « {nom || "ton pacte"} » ?
                </p>
                <p className="text-xs text-muted-foreground">
                  Il portera la figure de droite. On peut revenir en arrière,
                  mais pas en un clic depuis cet écran.
                </p>
                <div className="flex gap-2">
                  <Bouton role="primaire" onClick={refondre} disabled={isUpdating || !pactId}>
                    {isUpdating
                      ? <><Loader2 className="animate-spin" />Refonte…</>
                      : <><RefreshCw />Oui, refondre</>}
                  </Bouton>
                  <Bouton role="discret" onClick={() => setDemande(false)} disabled={isUpdating}>
                    Annuler
                  </Bouton>
                </div>
              </div>
            ) : (
              <Bouton role="primaire" onClick={() => setDemande(true)} disabled={!pactId}>
                <RefreshCw />Refondre le sceau
              </Bouton>
            )}
          </>
        )}
      </div>
    </DataPanel>
  );
}
