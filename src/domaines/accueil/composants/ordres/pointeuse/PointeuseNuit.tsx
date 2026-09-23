import { useId } from "react";
import { useJourneeDesOrdres } from "@/domaines/accueil/hooks/useJourneeDesOrdres";
import { usePoliceDuBanc } from "@/domaines/accueil/hooks/usePoliceDuBanc";
import type { ProprietesDesOrdres } from "@/domaines/accueil/types";
import { Bascule, Carte } from "@/domaines/accueil/composants/ordres/pointeuse/communs";
import { surTrois } from "@/domaines/accueil/composants/ordres/pointeuse/lecture";
import "@/domaines/accueil/composants/ordres/pointeuse/nuit.css";

const POLICES = "https://fonts.googleapis.com/css2?family=Special+Elite&family=Tilt+Neon&display=swap";

/* VARIANTE B4 — L ATELIER DE NUIT.
 *
 * La pointeuse descend dans la rue. Plus de platine d acier en plein
 * jour : le casier est scelle dans le beton de l enseigne, et une lampe
 * grillagee, au-dessus, eclaire les cartes — le reste du mur est dans
 * l ombre. La plaque est emaillee bleu et blanc, comme les plaques de
 * rue, et comme la plaque « Boutique » des enseignes de la rue.
 *
 * LES COMPTEURS SONT DES TUBES NIXIE : du neon, encore, mais dans le
 * verre — un chiffre orange allume devant les autres, qu on devine
 * eteints derriere la grille. La prime acquise, et le temps avant la
 * cloture. C est la pointeuse qui parle la meme langue que l enseigne
 * et la rue. */

function Nixies({ texte }: { texte: string }) {
  return (
    <span className="pn-nixies" aria-hidden="true">
      {[...texte].map((c, i) =>
        /\d/.test(c) ? (
          <span key={i} className="pn-tube">
            <span className="pn-grille" />
            <b>{c}</b>
          </span>
        ) : (
          <span key={i} className="pn-points" />
        ),
      )}
    </span>
  );
}

export function PointeuseNuit(p: ProprietesDesOrdres) {
  usePoliceDuBanc(POLICES);
  const { journee: j, lignes, cloture } = useJourneeDesOrdres(p);
  const corps = useId();
  const close = j.etat === "close";

  return (
    <section
      className={`pn ${p.className ?? ""}`}
      aria-label="Ordres du jour"
      data-etat={j.etat}
      data-replie={p.replie || undefined}
    >
      <span className="pn-lampe" aria-hidden="true"><i /></span>
      <header className="pn-tete">
        <span className="pn-plaque">Ordres du jour</span>
        <span className="pn-droite">
          {lignes.length > 0 && (
            <>
              <span className="pn-releve" aria-label={`Prime : ${j.primeAcquise} sur ${j.primeTotale} bonds`}>
                <small>Prime</small>
                <Nixies texte={surTrois(j.primeAcquise)} />
                <small>/ {j.primeTotale} B</small>
              </span>
              <span className="pn-releve" title="Les ordres tombent à minuit UTC"
                aria-label={close ? "Journée close" : `Clôture dans ${cloture.texte}, à ${cloture.heureLocale}`}>
                <small>{close ? "Close" : `Clôture ${cloture.heureLocale}`}</small>
                <Nixies texte={close ? "00:00" : cloture.horloge} />
              </span>
            </>
          )}
          <Bascule replie={p.replie} onBasculer={p.onBasculerRepli} controle={corps} />
        </span>
      </header>

      <div className="pn-casier" id={corps}>
        {p.chargement ? (
          <p className="pn-mot" data-attente="">Les cartes arrivent…</p>
        ) : lignes.length === 0 ? (
          <p className="pn-mot">Aucune carte ce soir. Ouvre une mission et les ordres suivront.</p>
        ) : (
          lignes.map((o, i) => <Carte key={o.id} o={o} n={i + 1} onReclamer={p.onReclamer} />)
        )}
      </div>
    </section>
  );
}
