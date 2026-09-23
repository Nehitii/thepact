import { memo, useMemo, useRef, type CSSProperties, type PointerEvent } from "react";
import { RosaceDuPacte } from "@/domaines/objectifs";
import { useTailleDuNom } from "@/domaines/accueil/hooks/useTailleDuNom";
import { zoneLisible } from "@/domaines/accueil/logique/bandeaux";
import { guilloche, numeroDuDocument, ondes } from "@/domaines/accueil/logique/dessinsDuBandeau";
import { selonTheme } from "@/socle/outils/encrePapier";
import { jourLocal } from "@/socle/outils/jour";
import type { ProprietesDuBandeau } from "@/domaines/accueil/types";
import { BasculeDeMesure, SceauDuPacte } from "@/domaines/accueil/composants/bandeau/communs";
import { dateNumerique, nombre, useLectureDuBandeau } from "@/domaines/accueil/composants/bandeau/lecture";
import "@/domaines/accueil/composants/bandeau/piece-du-pacte.css";

/* VARIANTE D — LA PIECE.
 *
 * THESE. Un pacte est une identite qu on se donne. Il a donc sa piece :
 * une carte au format ID-1, polycarbonate nacre, guillochis a la teinte
 * du pacte, le sceau a la place de la photographie, et tout ce que la
 * base sait de lui dans des champs — nom, devise, valeurs, jure le,
 * echeance, rang, avancement.
 *
 * LA ZONE LISIBLE PAR MACHINE EST VRAIE. Trois lignes de trente signes
 * au format des cartes d identite, avec les chiffres de controle de
 * l OACI : le numero, le jour du serment, l echeance. Un lecteur de
 * documents la lirait. C est le detail qui separe un objet d un decor.
 *
 * L OBJET REPOND A LA MAIN. La carte s incline sous le pointeur, et le
 * film holographique change de couleur avec l angle — le seul
 * mouvement de la variante, et il n existe que si on le provoque.
 *
 * L EFFET CHOISI DEVIENT LA FEUILLE DU FILM : or, cuivre, cyan, violet.
 * Sur une carte imprimee, un halo n a pas de sens ; une feuille
 * metallique, si. « Parasites » devient un defaut de reperage : le nom
 * imprime en deux passes mal calees.
 *
 * Une carte claire sur un tableau sombre : c est un objet pose sur le
 * bureau, pas une surface de l interface. Elle ne change pas avec le
 * theme. Sous 560 px de large, elle se redresse en badge. */

const FEUILLES: Readonly<Record<string, string>> = {
  "gold-glow": "or",
  "fire-glow": "cuivre",
  "cyan-glow": "cyan",
  "purple-glow": "violet",
};

/* Les guillochis ne dependent de rien : on les trace une fois. */
const Guillochis = memo(function Guillochis() {
  const rosace = guilloche(96, 36, 30);
  const bandes = ondes(9, 1000, 70, 150, 6);
  return (
    <svg className="pi-guillochis" viewBox="0 0 1000 630" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g transform="translate(860 250) scale(2.1)">
        {[0, 10, 20, 30, 40, 50].map((a) => <path key={a} d={rosace} transform={`rotate(${a})`} />)}
      </g>
      <g transform="translate(150 470) scale(1.05)" opacity="0.7">
        {[0, 15, 30, 45].map((a) => <path key={a} d={rosace} transform={`rotate(${a})`} />)}
      </g>
      <g transform="translate(0 38)">{bandes.map((d, i) => <path key={i} d={d} />)}</g>
      <g transform="translate(0 404)" opacity="0.8">{bandes.map((d, i) => <path key={i} d={d} />)}</g>
    </svg>
  );
});

export function PieceDuPacte(p: ProprietesDuBandeau) {
  const l = useLectureDuBandeau(p);
  const carte = useRef<HTMLDivElement>(null);
  const encre = selonTheme(l.teinte, false);
  const numero = useMemo(() => numeroDuDocument(l.nom), [l.nom]);
  const { cadre, taille, tient } = useTailleDuNom<HTMLDListElement>({
    texte: l.nom, famille: l.famille, graisse: 900, espacement: 0.03, min: 15, max: 58,
  });
  const zone = zoneLisible({
    numero,
    jureLe: l.jureLe ? jourLocal(l.jureLe) : null,
    terme: l.terme ? jourLocal(l.terme) : null,
    nom: l.nom,
    valeurs: l.valeurs,
    niveau: p.level,
    missions: p.totalMissions,
    jours: p.activeDays,
    progression: l.progression,
    rang: p.rankName,
  });
  const date = (d?: Date) => (d ? dateNumerique(d).replace(/\//g, " ") : "—");

  /* L inclinaison suit le pointeur, jamais le doigt : sur un ecran
     tactile, faire pencher la carte bloquerait le defilement. */
  const bouger = (e: PointerEvent<HTMLDivElement>) => {
    const el = carte.current;
    if (!el || e.pointerType === "touch") return;
    if (document.documentElement.getAttribute("data-reduce-motion") === "true") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--pi-ry", `${(nx * 14).toFixed(2)}deg`);
    el.style.setProperty("--pi-rx", `${(-ny * 10).toFixed(2)}deg`);
    el.style.setProperty("--pi-mx", (nx + 0.5).toFixed(3));
    el.style.setProperty("--pi-my", (ny + 0.5).toFixed(3));
  };
  const quitter = () => {
    const el = carte.current;
    if (!el) return;
    for (const v of ["--pi-ry", "--pi-rx", "--pi-mx", "--pi-my"]) el.style.removeProperty(v);
  };

  return (
    <section className="pi" aria-labelledby="pi-nom" onPointerMove={bouger} onPointerLeave={quitter}>
      <div
        ref={carte}
        className="pi-carte"
        data-feuille={FEUILLES[l.effet] ?? "arc-en-ciel"}
        data-parasites={l.effet === "glitch" || undefined}
        style={{ "--pi-encre": encre, "--pi-teinte": l.teinte } as CSSProperties}
      >
        <Guillochis />
        <div className="pi-page">
          <div className="pi-entete">
            <span className="pi-emetteur">Overwrite</span>
            <span className="pi-titre">Carte du pacte</span>
            <span className="pi-numero">N° {numero.slice(0, 3)} {numero.slice(3, 6)} {numero.slice(6)}</span>
          </div>
          <p className="pi-micro" aria-hidden="true">{`${l.mantra || l.nom} · `.repeat(12)}</p>

          <div className="pi-corps">
            <div className="pi-portrait">
              <SceauDuPacte
                nom={l.nom}
                valeurs={l.valeurs}
                version={p.sigilVersion}
                part={l.part}
                elan={l.elan}
                symbole={p.pactSymbol}
                enCours={p.enCours ?? 0}
              />
            </div>

            <dl className="pi-champs" ref={cadre}>
              <div className="pi-champ pi-champ--large">
                <dt>Nom</dt>
                <dd><h1 id="pi-nom" className="pi-nom" style={{ fontFamily: l.famille, fontSize: taille, whiteSpace: tient ? "nowrap" : undefined }}>{l.nom}</h1></dd>
              </div>
              {l.mantra && (
                <div className="pi-champ pi-champ--large"><dt>Devise</dt><dd className="pi-devise">{l.mantra}</dd></div>
              )}
              {l.valeurs.length > 0 && (
                <div className="pi-champ pi-champ--large"><dt>Valeurs</dt><dd>{l.valeurs.join(", ")}</dd></div>
              )}
              <div className="pi-champ"><dt>Juré le</dt><dd className="pi-chiffres">{date(l.jureLe)}</dd></div>
              <div className="pi-champ"><dt>Échéance</dt><dd className="pi-chiffres">{date(l.terme)}</dd></div>
              <div className="pi-champ">
                <dt>Rang</dt>
                <dd>{p.rankName ?? "—"} · niv. <span className="pi-chiffres">{p.level}</span></dd>
              </div>
              <div className="pi-champ">
                <dt>Avancement</dt>
                <dd>
                  <BasculeDeMesure lecture={l} onChanger={p.onChangerMesure} className="pi-bascule">
                    <span className="pi-chiffres">{l.progression} %</span> {l.mesureLue}
                  </BasculeDeMesure>
                </dd>
              </div>
              <div className="pi-champ">
                <dt>Missions</dt>
                <dd className="pi-chiffres">{nombre(p.totalMissions)}</dd>
              </div>
              <div className="pi-champ">
                <dt>Jour</dt>
                <dd className="pi-chiffres">{nombre(p.activeDays)}</dd>
              </div>
            </dl>

            <div className="pi-cote" aria-hidden="true">
              <svg className="pi-puce" viewBox="0 0 48 38">
                <rect x="0.5" y="0.5" width="47" height="37" rx="6" />
                <path d="M0.5 13H15M0.5 25H15M33 13H47.5M33 25H47.5M15 0.5V37.5M33 0.5V37.5M15 19H33M24 0.5V11M24 27V37.5" />
              </svg>
              <div className="pi-holo">
                <RosaceDuPacte nom={l.nom} valeurs={l.valeurs} version={p.sigilVersion} progression={1} elan={0} />
              </div>
              <div className="pi-fantome">
                <RosaceDuPacte nom={l.nom} valeurs={l.valeurs} version={p.sigilVersion} progression={l.part} elan={0} />
              </div>
            </div>
          </div>

          <p className="pi-zone" aria-label="Zone lisible par machine">
            {zone.map((ligne, i) => <span key={i}>{ligne}</span>)}
          </p>
        </div>
        <div className="pi-film" aria-hidden="true" />
      </div>
    </section>
  );
}
