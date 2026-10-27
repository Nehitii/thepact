import { useId, useRef, type CSSProperties } from "react";
import { useJourneeDesOrdres, type OrdreLu } from "@/domaines/accueil/hooks/useJourneeDesOrdres";
import { useGlissement } from "@/domaines/accueil/hooks/useGlissement";
import type { ProprietesDesOrdres } from "@/domaines/accueil/types";
import { Bascule, BoutonPointer, Tambours, Tampon, Trous } from "@/domaines/accueil/composants/ordres/pointeuse/communs";
import { mesureDe, surTrois } from "@/domaines/accueil/composants/ordres/pointeuse/lecture";
import "@/domaines/accueil/composants/ordres/pointeuse/casiers.css";

/* VARIANTE B2 — LES DEUX CASIERS.
 *
 * Dans un atelier, on ne pointe pas seulement : on DEPLACE sa carte. Elle
 * attend dans le casier de gauche ; pointee, elle passe dans celui de
 * droite. L etat d un ordre devient une PLACE — on voit d un coup d oeil
 * ce qui reste a faire et ce qui est fait, sans lire une ligne.
 *
 * Chaque casier a trois poches, une par ordre possible : le matin, les
 * « Pointées » sont trois poches vides ; le soir, c est l inverse. La
 * carte glisse d une poche a l autre quand on pointe, et celles du
 * dessous remontent d un cran.
 *
 * Seul le haut de la carte depasse de sa poche — le genre, le nom tape,
 * la rangee de trous. Le devant de la poche porte l etiquette (la
 * mesure, la prime) et, quand la carte est pleine, le bouton rouge.
 * Replie, il ne reste que les deux casiers et leurs comptes. */

function Fiche({ o, n, onReclamer }: { o: OrdreLu; n: number; onReclamer: (id: string) => void }) {
  return (
    <div
      className="pc-fiche"
      data-glisse={o.id}
      data-etat={o.reclamee ? "reclamee" : o.prete ? "prete" : "en-cours"}
      data-pointage={o.enReclamation || undefined}
      style={{ "--pt-c": o.genre.couleur } as CSSProperties}
      title={o.description ?? undefined}
    >
      <div className="pc-carton">
        <span className="pc-ligne">
          <span>N° {n}</span>
          <span className="pc-genre">{o.genre.court}</span>
        </span>
        <span className="pc-ligne pc-ligne--nom">
          <span className="pc-nom">{o.title}</span>
          <Trous o={o} rangee maximum={5} />
        </span>
        {o.description && <span className="sr-only">{o.description}</span>}
        {o.reclamee && <Tampon o={o} className="pc-tampon" />}
      </div>
      <div className="pc-devant">
        <span className="pc-etiquette">{mesureDe(o, o.genre.unite)} · {o.reward_bonds} B</span>
        {o.prete && <BoutonPointer o={o} onReclamer={onReclamer} />}
      </div>
    </div>
  );
}

function Casier({ titre, ordres, places, rang, onReclamer }: {
  titre: string;
  ordres: OrdreLu[];
  places: number;
  rang: (o: OrdreLu) => number;
  onReclamer: (id: string) => void;
}) {
  return (
    <div className="pc-casier" role="group" aria-label={`${titre} : ${ordres.length}`}>
      <span className="pc-titre">{titre} <small>{ordres.length}/{places}</small></span>
      <ol className="pc-poches">
        {Array.from({ length: places }, (_, i) => {
          const o = ordres[i];
          return (
            <li key={o?.id ?? `vide-${i}`} className="pc-poche" data-vide={o ? undefined : ""}>
              {o && <Fiche o={o} n={rang(o)} onReclamer={onReclamer} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function PointeuseCasiers(p: ProprietesDesOrdres) {
  const { journee: j, lignes, cloture } = useJourneeDesOrdres(p);
  const corps = useId();
  const casiers = useRef<HTMLDivElement>(null);
  useGlissement(casiers);

  const places = Math.max(3, lignes.length);
  const rang = (o: OrdreLu) => lignes.indexOf(o) + 1;
  const close = j.etat === "close";

  return (
    <section
      className={`pc ${p.className ?? ""}`}
      aria-label="Ordres du jour"
      data-etat={j.etat}
      data-replie={p.replie || undefined}
    >
      <div className="pc-cadre pt-acier">
        <header className="pc-tete">
          <span className="pt-plaque">Ordres du jour</span>
          <span className="pc-droite">
            {lignes.length > 0 && (
              <>
                <span className="pc-releve" aria-label={`Prime : ${j.primeAcquise} sur ${j.primeTotale} bonds`}>
                  <small>Prime</small>
                  <Tambours texte={`${surTrois(j.primeAcquise)}/${surTrois(j.primeTotale)}`} />
                  <small>B</small>
                </span>
                <span className="pc-releve" title="Les ordres tombent à minuit UTC"
                  aria-label={close ? "Journée close" : `Clôture dans ${cloture.texte}, à ${cloture.heureLocale}`}>
                  <small>{close ? "Close" : `Clôture ${cloture.heureLocale}`}</small>
                  <Tambours texte={close ? "00:00" : cloture.horloge} />
                </span>
              </>
            )}
            <Bascule replie={p.replie} onBasculer={p.onBasculerRepli} controle={corps} />
          </span>
        </header>

        <div className="pc-casiers" id={corps} ref={casiers}>
          {p.chargement ? (
            <p className="pc-mot" data-attente="">Les cartes arrivent…</p>
          ) : lignes.length === 0 ? (
            <p className="pc-mot">Aucune carte aujourd’hui. Ouvre une mission et les ordres suivront.</p>
          ) : (
            <>
              <Casier titre="À pointer" ordres={lignes.filter((o) => !o.reclamee)} places={places} rang={rang} onReclamer={p.onReclamer} />
              <Casier titre="Pointées" ordres={lignes.filter((o) => o.reclamee)} places={places} rang={rang} onReclamer={p.onReclamer} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
