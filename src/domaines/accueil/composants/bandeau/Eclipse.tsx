import { useMemo, type CSSProperties } from "react";
import { useTailleDuNom } from "@/domaines/accueil/hooks/useTailleDuNom";
import { rayonsDeLaCouronne } from "@/domaines/accueil/logique/dessinsDuBandeau";
import type { ProprietesDuBandeau } from "@/domaines/accueil/types";
import { BasculeDeMesure, SceauDuPacte } from "@/domaines/accueil/composants/bandeau/communs";
import { datePleine, nombre, useApparition, useLectureDuBandeau } from "@/domaines/accueil/composants/bandeau/lecture";
import "@/domaines/accueil/composants/bandeau/eclipse.css";

/* VARIANTE B — L ECLIPSE.
 *
 * THESE. Le sceau devient la lune, et il passe devant le soleil. La
 * progression est la MAGNITUDE de l eclipse — le mot exact des
 * astronomes pour la part du diametre solaire couverte : 0,62, c est
 * 62 % des objectifs atteints. Plus le pacte avance, plus la lumiere
 * brute du soleil recule, et plus la couronne — a la teinte du pacte —
 * se revele autour du disque. A 100 %, la totalite : la couronne
 * entiere, et la perle de lumiere qu on appelle l anneau de diamant.
 *
 * La lumiere change donc de nature en avancant : l eclat blanc, qu on
 * ne choisit pas, cede a la couronne, qui est celle du pacte. Et le
 * sceau, grave sur la face sombre de la lune, s eclaire avec elle.
 *
 * A DROITE, LES EPHEMERIDES. Les chiffres du pacte en table
 * d almanach : un libelle, une valeur en chasse fixe, une regle fine.
 * « Totalité : encore 38 % » dit ce qui reste sans le dire en rouge.
 *
 * UN CIEL, PAS UN THEME. La variante reste nocturne en theme clair :
 * c est un objet — une photographie du ciel — et non une surface de
 * l interface. */

export function Eclipse(p: ProprietesDuBandeau) {
  const l = useLectureDuBandeau(p);
  const pret = useApparition();
  const { cadre, taille, tient } = useTailleDuNom<HTMLDivElement>({
    texte: l.nom, famille: l.famille, graisse: 900, espacement: 0.06, min: 28, max: 84,
  });
  const rayons = useMemo(() => rayonsDeLaCouronne(l.nom), [l.nom]);
  const totale = l.progression >= 100;
  const magnitude = l.part.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const enCours = p.enCours ?? 0;

  return (
    <section
      className="ec"
      aria-labelledby="ec-nom"
      data-totale={totale || undefined}
      style={{ "--ec-p": pret ? l.part : 0, "--ec-teinte": l.teinte } as CSSProperties}
    >
      <div className="ec-grille">
        <div className="ec-astre" aria-hidden="true">
          <svg className="ec-couronne" viewBox="-3 -3 6 6">
            {rayons.map((r, i) => {
              const a = (r.angle * Math.PI) / 180;
              const fin = 1 + r.longueur;
              return (
                <line
                  key={i}
                  x1={(Math.cos(a) * 0.97).toFixed(3)}
                  y1={(Math.sin(a) * 0.97).toFixed(3)}
                  x2={(Math.cos(a) * fin).toFixed(3)}
                  y2={(Math.sin(a) * fin).toFixed(3)}
                  strokeWidth={(0.014 * r.epaisseur).toFixed(4)}
                  opacity={r.opacite.toFixed(2)}
                />
              );
            })}
          </svg>
          <div className="ec-halo" />
          <div className="ec-eclat" />
          <div className="ec-soleil" />
          <div className="ec-lune">
            <SceauDuPacte
              nom={l.nom}
              valeurs={l.valeurs}
              version={p.sigilVersion}
              part={l.part}
              elan={l.elan}
              symbole={p.pactSymbol}
              enCours={enCours}
              className="ec-sceau"
            />
          </div>
          <div className="ec-perle" />
        </div>

        <div className="ec-texte" ref={cadre}>
          <h1 id="ec-nom" className="ec-nom" style={{ fontFamily: l.famille, fontSize: taille, whiteSpace: tient ? "nowrap" : undefined, ...l.styleEffet }}>
            {l.nom}
          </h1>
          {l.mantra && <p className="ec-raison">{l.mantra}</p>}

          <dl className="ec-ephemerides">
            <div className="ec-ligne ec-ligne--mesure">
              <dt>Magnitude</dt>
              <dd>
                <BasculeDeMesure lecture={l} onChanger={p.onChangerMesure} className="ec-bascule">
                  <b>{magnitude}</b>
                  <span>{l.progression} % des {l.mesureLue}</span>
                </BasculeDeMesure>
              </dd>
            </div>
            <div className="ec-ligne">
              <dt>Totalité</dt>
              <dd>{totale ? "atteinte" : <>encore <b>{100 - l.progression} %</b></>}</dd>
            </div>
            <div className="ec-ligne">
              <dt>Niveau</dt>
              <dd><b>{p.level}</b>{p.rankName && <> · {p.rankName}</>}</dd>
            </div>
            {p.rankXPTarget ? (
              <div className="ec-ligne">
                <dt>Expérience</dt>
                <dd>
                  <b>{nombre(p.rankXP ?? 0)}</b> / {nombre(p.rankXPTarget)} XP
                  {p.nextRankName && <> · vers {p.nextRankName}</>}
                </dd>
              </div>
            ) : null}
            <div className="ec-ligne">
              <dt>Missions</dt>
              <dd>
                <b>{nombre(p.totalMissions)}</b>
                {enCours > 0 && <> · {enCours} en cours</>}
              </dd>
            </div>
            <div className="ec-ligne">
              <dt>Jour</dt>
              <dd><b>{nombre(p.activeDays)}</b>{l.jureLe && <> · depuis le {datePleine(l.jureLe)}</>}</dd>
            </div>
            {l.valeurs.length > 0 && (
              <div className="ec-ligne">
                <dt>Valeurs</dt>
                <dd>{l.valeurs.join(" · ")}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </section>
  );
}
