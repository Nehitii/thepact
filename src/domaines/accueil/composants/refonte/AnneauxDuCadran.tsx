import {
  arc, angleDeLHeure, angleDuDelai, polaire, RAYONS, CENTRE, type Satellite, type Secteur,
} from "@/domaines/accueil/logique/cadranDuPacte";
import { lireDate } from "@/domaines/accueil/logique/lectureDuTableau";
import { PACTE, RANG, type EntreeDuJour } from "@/domaines/accueil/logique/scenarioDuTableau";

/* LE DESSIN DU CADRAN : cinq anneaux, du centre vers le bord.
 *
 *   paliers    l avancement en etapes, un secteur par difficulte
 *   satellites les objectifs, sur le secteur de leur palier
 *   delai      le pacte entier, de son debut (en haut) a sa fin
 *   journee    vingt-quatre heures, et ce qui s y est passe
 *   rang       l experience vers le rang suivant
 *
 * Tout est en SVG pur : aucun anneau ne connait React au-dela de ses
 * donnees, et chaque arc porte « pathLength = 1 » pour que le trace
 * d entree soit le meme quelle que soit sa longueur. */

const GENRES: Record<EntreeDuJour["genre"], string> = {
  habitude: "#34d399", ordre: "#ffcc00", etape: "#00d4ff", journal: "#aa44ff", tache: "#ff8c00",
};

interface Props {
  maintenant: Date;
  secteurs: readonly Secteur[];
  sats: readonly Satellite[];
  choisi: Satellite | undefined;
  journee: readonly EntreeDuJour[];
}

function Trace({ d, className, i }: { d: string; className: string; i: number }) {
  return <path d={d} className={`ca-trace ${className}`} pathLength={1} style={{ ["--i" as string]: i }} />;
}

/** Un petit arc autour d un satellite : la part de ses etapes franchies. */
function arcAutour(x: number, y: number, r: number, part: number): string {
  const a = Math.min(359.99, part * 360) * (Math.PI / 180);
  const x1 = x + r * Math.sin(a);
  const y1 = y - r * Math.cos(a);
  return `M ${x} ${y - r} A ${r} ${r} 0 ${part > 0.5 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

export function AnneauxDuCadran({ maintenant, secteurs, sats, choisi, journee }: Props) {
  const aAujourdhui = angleDuDelai(maintenant, PACTE.debut, PACTE.fin);
  const aMaintenant = angleDeLHeure(maintenant.getHours(), maintenant.getMinutes());
  const annees: { a: number; angle: number }[] = [];
  for (let a = PACTE.debut.getFullYear() + 1; a <= PACTE.fin.getFullYear(); a++) {
    annees.push({ a, angle: angleDuDelai(new Date(a, 0, 1), PACTE.debut, PACTE.fin) });
  }
  const echeanceChoisie = choisi?.objectif.echeance
    ? polaire(angleDuDelai(lireDate(choisi.objectif.echeance), PACTE.debut, PACTE.fin), RAYONS.delai)
    : null;
  const marqueJour = polaire(aAujourdhui, RAYONS.delai + 34);

  return (
    <svg viewBox="0 0 1000 1000" className="ca-svg" aria-hidden="true">
      <defs>
        <radialGradient id="ca-halo">
          <stop offset="0%" stopColor="var(--teinte, #8b5cf6)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--teinte, #8b5cf6)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={CENTRE} cy={CENTRE} r={150} fill="url(#ca-halo)" />

      {/* Le rang, au bord : la part du chemin vers le rang suivant. */}
      <Trace d={arc(RAYONS.rang, 0, 360)} className="ca-piste ca-piste-fine" i={0} />
      <Trace d={arc(RAYONS.rang, 0, (RANG.xp / RANG.cible) * 360)} className="ca-rang" i={1} />

      {/* La journee : minuit en haut, l heure qu il est, ce qui a eu lieu. */}
      <Trace d={arc(RAYONS.journee, 0, 360)} className="ca-piste" i={1} />
      <Trace d={arc(RAYONS.journee, 0, aMaintenant)} className="ca-journee" i={2} />
      {Array.from({ length: 24 }, (_, h) => {
        const majeur = h % 6 === 0;
        const a = polaire(h * 15, RAYONS.journee - (majeur ? 11 : 6));
        const b = polaire(h * 15, RAYONS.journee + (majeur ? 11 : 6));
        return <line key={h} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={majeur ? "ca-graduation-majeure" : "ca-graduation"} />;
      })}
      {[0, 6, 12, 18].map((h) => {
        const p = polaire(h * 15, RAYONS.journee + 30);
        return <text key={h} x={p.x} y={p.y} className="ca-heure">{String(h).padStart(2, "0")}</text>;
      })}
      {journee.map((e) => {
        const [h, m] = e.heure.split(":").map(Number);
        const p = polaire(angleDeLHeure(h, m), RAYONS.journee);
        return <circle key={e.heure + e.titre} cx={p.x} cy={p.y} r={6} fill={GENRES[e.genre]} className="ca-evenement" />;
      })}
      {(() => {
        const chute = polaire(angleDeLHeure(2, 0), RAYONS.journee);
        return <circle cx={chute.x} cy={chute.y} r={4} className="ca-chute" />;
      })()}
      {(() => {
        const a = polaire(aMaintenant, RAYONS.journee - 22);
        const b = polaire(aMaintenant, RAYONS.journee + 22);
        return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="ca-aiguille" />;
      })()}

      {/* Le delai : le pacte fait le tour, du debut a la fin, en haut. */}
      <Trace d={arc(RAYONS.delai, 0, 360)} className="ca-piste ca-piste-large" i={2} />
      <Trace d={arc(RAYONS.delai, 0, aAujourdhui)} className="ca-delai" i={3} />
      {annees.map(({ a, angle }) => {
        const p0 = polaire(angle, RAYONS.delai - 9);
        const p1 = polaire(angle, RAYONS.delai + 9);
        const t = polaire(angle, RAYONS.delai + 24);
        return (
          <g key={a}>
            <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} className="ca-graduation" />
            <text x={t.x} y={t.y} className="ca-annee">{a}</text>
          </g>
        );
      })}
      {sats.filter((s) => s.objectif.echeance).map((s) => {
        const p = polaire(angleDuDelai(lireDate(s.objectif.echeance!), PACTE.debut, PACTE.fin), RAYONS.delai);
        const actif = s === choisi;
        return <circle key={s.objectif.id} cx={p.x} cy={p.y} r={actif ? 8 : 4} fill={s.teinte}
          className={actif ? "ca-echeance ca-echeance-choisie" : "ca-echeance"} />;
      })}
      <line
        x1={polaire(aAujourdhui, RAYONS.delai - 14).x} y1={polaire(aAujourdhui, RAYONS.delai - 14).y}
        x2={polaire(aAujourdhui, RAYONS.delai + 14).x} y2={polaire(aAujourdhui, RAYONS.delai + 14).y}
        className="ca-aujourdhui" />
      <text x={marqueJour.x} y={marqueJour.y} className="ca-jour">aujourd’hui</text>

      {/* Les paliers : la piste, et la part franchie. */}
      {secteurs.map((s, i) => (
        <g key={s.palier.cle} style={{ ["--p" as string]: s.palier.teinte }}>
          <Trace d={arc(RAYONS.paliers, s.debut, s.fin)} className="ca-piste-palier" i={3 + i * 0.2} />
          <Trace d={arc(RAYONS.paliers, s.debut, s.debut + ((s.fin - s.debut) * s.palier.faites) / s.palier.etapes)}
            className="ca-palier" i={3.5 + i * 0.2} />
          {(() => {
            const milieu = (s.debut + s.fin) / 2;
            const p = polaire(milieu, 238);
            const tourne = milieu > 90 && milieu < 270 ? milieu + 180 : milieu;
            return (
              <text x={p.x} y={p.y} className="ca-nom-palier" transform={`rotate(${tourne} ${p.x} ${p.y})`}>
                {s.palier.nom}
              </text>
            );
          })()}
        </g>
      ))}

      {/* Le lien : l objectif choisi et son echeance, sur deux anneaux. */}
      {choisi && echeanceChoisie && (
        <line x1={choisi.point.x} y1={choisi.point.y} x2={echeanceChoisie.x} y2={echeanceChoisie.y}
          className="ca-lien" style={{ stroke: choisi.teinte }} />
      )}

      {/* Les satellites. */}
      {sats.map((s) => {
        const o = s.objectif;
        const { x, y } = s.point;
        const actif = s === choisi;
        const classe = o.statut === "fully_completed" ? "tenu" : o.statut === "not_started" ? "attente" : "ouvert";
        return (
          <g key={o.id} className={`ca-sat ca-sat-${classe}`} style={{ ["--p" as string]: s.teinte }}>
            {actif && <circle cx={x} cy={y} r={s.rayon + 8} className="ca-sat-choisi" />}
            {o.habitude ? (
              <rect x={x - s.rayon * 0.75} y={y - s.rayon * 0.75} width={s.rayon * 1.5} height={s.rayon * 1.5}
                transform={`rotate(45 ${x} ${y})`} className="ca-sat-corps" />
            ) : (
              <circle cx={x} cy={y} r={s.rayon} className="ca-sat-corps" />
            )}
            {classe === "ouvert" && !o.habitude && (
              <path d={arcAutour(x, y, s.rayon + 3.5, o.faites / Math.max(1, o.etapes))} className="ca-sat-part" />
            )}
          </g>
        );
      })}
    </svg>
  );
}
