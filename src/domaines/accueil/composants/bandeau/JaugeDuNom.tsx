import type { CSSProperties } from "react";
import { useTailleDuNom } from "@/domaines/accueil/hooks/useTailleDuNom";
import { romain } from "@/domaines/accueil/logique/bandeaux";
import type { ProprietesDuBandeau } from "@/domaines/accueil/types";
import { BasculeDeMesure, SceauDuPacte } from "@/domaines/accueil/composants/bandeau/communs";
import { datePleine, nombre, useApparition, useLectureDuBandeau } from "@/domaines/accueil/composants/bandeau/lecture";
import "@/domaines/accueil/composants/bandeau/jauge-du-nom.css";

/* VARIANTE A — LE NOM EST LA JAUGE.
 *
 * THESE. Le bandeau actuel met un pourcentage sous le nom, comme on
 * met une legende sous une image. Ici le nom EST la mesure : ses
 * lettres sont creuses, et la lumiere les remplit de gauche a droite a
 * mesure que le pacte avance. A 62 %, on lit « ANAN » plein et « TA »
 * encore vide. On ne consulte pas l avancement : on le voit en lisant
 * son propre nom.
 *
 * Une regle graduee sous le nom dit que c est une mesure et non un
 * effet de style ; son curseur porte le chiffre, et c est lui qui
 * bascule entre objectifs et etapes — la lumiere suit.
 *
 * LE RESTE EST UNE PHRASE. Le sceau, la raison, les valeurs, puis les
 * chiffres dans une seule phrase au lieu de quatre compteurs alignes :
 * « Juré le 24 juin 2026 — jour 91. » Une rangee de compteurs se
 * parcourt ; une phrase se lit, et c est un pacte.
 *
 * LES DEUX THEMES. Tout passe par les jetons « --nexus-* » : sur le
 * papier, la lumiere devient de l encre, et le creux un trait de
 * crayon. C est la seule variante qui n est pas un objet. */

const pluriel = (n: number, un: string, plusieurs: string) => (n > 1 ? plusieurs : un);

export function JaugeDuNom(p: ProprietesDuBandeau) {
  const l = useLectureDuBandeau(p);
  const pret = useApparition();
  const { cadre, taille, tient } = useTailleDuNom<HTMLDivElement>({
    texte: l.nom, famille: l.famille, graisse: 900, espacement: 0.02, min: 34, max: 184,
  });
  const enCours = p.enCours ?? 0;

  return (
    <section
      className="jn"
      aria-labelledby="jn-nom"
      style={{ "--jn-p": pret ? l.part : 0, "--jn-neon": l.teinte, "--jn-teinte": l.encre } as CSSProperties}
    >
      <div className="jn-jauge" ref={cadre}>
        <div className="jn-bloc">
          <h1 id="jn-nom" className="jn-nom" style={{ fontFamily: l.famille, fontSize: taille, whiteSpace: tient ? "nowrap" : undefined }}>
            <span className="jn-creux" aria-hidden="true">{l.nom}</span>
            <span className="jn-plein" style={l.styleEffet}>{l.nom}</span>
            <span className="jn-front" aria-hidden="true" />
          </h1>
          <div className="jn-regle" aria-hidden="true" />
          <div className="jn-curseur">
            <BasculeDeMesure lecture={l} onChanger={p.onChangerMesure} className="jn-mesure">
              <b>{l.progression} %</b> <span>{l.mesureLue}</span>
            </BasculeDeMesure>
          </div>
        </div>
      </div>

      <div className="jn-pied">
        <SceauDuPacte
          taille={84}
          nom={l.nom}
          valeurs={l.valeurs}
          version={p.sigilVersion}
          part={l.part}
          elan={l.elan}
          symbole={p.pactSymbol}
          enCours={enCours}
          className="jn-sceau"
        />
        <div className="jn-serment">
          {l.mantra && <p className="jn-raison">{l.mantra}</p>}
          {l.valeurs.length > 0 && (
            <ol className="jn-valeurs" aria-label="Valeurs jurées">
              {l.valeurs.map((v, i) => (
                <li key={v + i}><span aria-hidden="true">{romain(i + 1)}</span>{v}</li>
              ))}
            </ol>
          )}
        </div>
        <p className="jn-phrase">
          {l.jureLe && <>Juré le {datePleine(l.jureLe)} — </>}
          <b>jour {nombre(p.activeDays)}</b>.{" "}
          <b>{nombre(p.totalMissions)}</b> {pluriel(p.totalMissions, "mission", "missions")},{" "}
          {enCours > 0
            ? <><b>{enCours}</b> {pluriel(enCours, "chantier ouvert", "chantiers ouverts")}.</>
            : <>aucun chantier ouvert.</>}{" "}
          Niveau <b>{p.level}</b>{p.rankName && <>, {p.rankName}</>}
          {p.rankXPTarget ? (
            <> — <b>{nombre(p.rankXP ?? 0)}</b> sur {nombre(p.rankXPTarget)} XP
              {p.nextRankName && <> avant {p.nextRankName}</>}.</>
          ) : "."}
        </p>
      </div>
    </section>
  );
}
