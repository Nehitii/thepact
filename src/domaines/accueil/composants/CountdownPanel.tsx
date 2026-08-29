import { useState, useMemo } from "react";
import { CornerBrackets } from "@/domaines/accueil/composants/CornerBrackets";
import { useVisibleInterval } from "@/socle/hooks/useVisibleInterval";
import { useThemeSombre } from "@/socle/hooks/useThemeSombre";

/**
 * Le compte a rebours du pacte, en regle.
 *
 * ═══════════════════════════════════════════════════════════════
 * CE PANNEAU DISAIT UNE SEULE CHOSE — COMBIEN IL RESTE — DE NEUF
 * FACONS, ET IL CASSAIT EN LE DISANT.
 *
 * LA CASSE. Les chiffres etaient en `clamp(28px, 4vw, 48px)` : ils
 * suivaient la FENETRE, alors que la largeur du panneau vient de son
 * CONTENEUR depuis qu'il partage une rangee avec le monitoring. Les
 * deux sont independants — le composant avait ete rendu sensible a son
 * conteneur pour sa GRILLE, jamais pour sa TYPOGRAPHIE. Dans une
 * fenetre de 1400 px et une colonne de 560, les chiffres prenaient
 * leur taille maximale dans la boite minimale : trois lignes, des
 * deux-points orphelins, 753 px de haut.
 *
 * LA REDITE. Cinq releves disaient le meme segment de temps — jours
 * restants, jours au total, part ecoulee, debut, fin. Trois autres
 * etaient deja ailleurs sur le meme ecran : le nom du pacte (barre
 * systeme + bandeau), la completion des objectifs (bandeau), et le
 * statut, ecrit DEUX FOIS dans ce cadre-ci — « NIVEAU / ATTENTION » a
 * gauche, « STATUT ◆ ATTENTION » a droite.
 *
 * LE PARTI. Une duree ne s'enumere pas, elle se montre. Les cinq
 * releves deviennent un dessin : une regle bornee par les deux dates,
 * la part faite en plein, le curseur sur aujourd'hui, et ce qu'il
 * reste se lit dans le vide. C'est la meme langue que la jauge du jour
 * de la barre systeme.
 *
 * Ce qui disparait avec : les secondes (un redessin par seconde pour
 * une echeance a six ans), l'anneau tournant, les trois icones de
 * statut, la colonne de metadonnees, et les props `pactName`,
 * `goalsCompleted`, `totalGoals` — le panneau ne depend plus des
 * objectifs.
 * ═══════════════════════════════════════════════════════════════
 */

interface CountdownPanelProps {
  projectStartDate?: string | null;
  projectEndDate?: string | null;
}

/* Les phases gardent leurs teintes, leurs sceaux et leurs animations :
   ce n'est pas un autre panneau, c'est le meme sous un autre parti.
   `label` remplace l'ancien couple label/statusLabel, qui nommait la
   meme chose a partir du meme seuil, avec deux mots differents. */
const PHASE_VERTE = {
  primary: "#00e676",
  rgb: "0,230,118",
  label: "NOMINAL",
  sceau: "✓",
  pouls: "none",
  clignote: "none",
} as const;

const PHASE_AMBREE = {
  primary: "#ffab00",
  rgb: "255,171,0",
  label: "ATTENTION",
  sceau: "◆",
  pouls: "cdPouls 2.5s ease-in-out infinite",
  clignote: "none",
} as const;

const PHASE_ROUGE = {
  primary: "#ff1744",
  rgb: "255,23,68",
  label: "CRITIQUE",
  sceau: "⚠",
  pouls: "cdPouls 1s ease-in-out infinite",
  clignote: "cdClignote 2s step-end infinite",
} as const;

/* ─── LE MEME PANNEAU, SUR DU PAPIER ───
   Tout se peint en styles INLINE : aucune feuille, meme prefixee
   `.light`, ne peut l'atteindre. La version claire vit donc ici, a
   cote de la sombre. Le neon est fait pour briller sur du noir ; sur
   du papier il s'evapore. La teinte est conservee — vert, ambre,
   rouge restent reconnaissables — seule la clarte tombe assez bas
   pour porter. */
const PHASES_CLAIRES: Record<string, { primary: string; rgb: string }> = {
  "0,230,118": { primary: "#00794A", rgb: "0,121,74" },
  "255,171,0": { primary: "#7A5000", rgb: "122,80,0" },
  "255,23,68": { primary: "#C1002E", rgb: "193,0,46" },
};

/* En sombre la hierarchie des releves est portee par l'alpha. Sur du
   papier cette echelle ne peut pas fonctionner — meme du NOIR PUR a
   0,6 d'alpha sur du blanc plafonne a 4,8:1. La hierarchie change donc
   de support : une encre neutre, opaque, a la bonne clarte. */
const ENCRE_PAPIER: Record<string, string> = {
  "0.6": "#5A6B7D",
  "0.75": "#44586C",
  "0.85": "#33475A",
  "0.92": "#1E2E3E",
};

const JOUR_MS = 86_400_000;
const HEURE_MS = 3_600_000;

export function CountdownPanel({ projectStartDate, projectEndDate }: CountdownPanelProps) {
  const sombre = useThemeSombre();
  const [maintenant, setMaintenant] = useState(() => Date.now());

  const finMs = projectEndDate ? new Date(projectEndDate).getTime() : null;
  const resteMs = finMs === null ? 0 : Math.max(0, finMs - maintenant);

  /* Une seconde pour une echeance a six ans, c'etait soixante
     redessins par minute pour un chiffre qui bouge une fois par jour.
     La cadence suit l'unite affichee : la minute tant qu'on compte en
     jours, la seconde seulement dans les deux derniers jours. */
  useVisibleInterval(() => setMaintenant(Date.now()), resteMs > 2 * JOUR_MS ? 60_000 : 1_000);

  const calc = useMemo(() => {
    if (finMs === null) return null;
    const debutMs = projectStartDate ? new Date(projectStartDate).getTime() : maintenant;
    const total = finMs - debutMs;
    const reste = Math.max(0, finMs - maintenant);
    const pct = total > 0 ? Math.min(100, Math.max(0, ((maintenant - debutMs) / total) * 100)) : 0;

    const partRestante = 100 - pct;
    const phase = partRestante > 75 ? PHASE_VERTE : partRestante > 25 ? PHASE_AMBREE : PHASE_ROUGE;

    /* Le gros chiffre change d'unite quand les jours ne disent plus
       rien : « 0 JOUR » le dernier matin serait un cadran arrete. */
    const gros =
      reste >= 2 * JOUR_MS
        ? { val: Math.ceil(reste / JOUR_MS), unite: "jours restants" }
        : reste >= 2 * HEURE_MS
          ? { val: Math.floor(reste / HEURE_MS), unite: "heures restantes" }
          : { val: Math.floor(reste / 60_000), unite: reste >= 120_000 ? "minutes restantes" : "minute restante" };

    return { pct, phase, gros };
  }, [maintenant, projectStartDate, finMs]);

  if (!projectEndDate || !calc) return null;

  const c = sombre ? calc.phase : { ...calc.phase, ...PHASES_CLAIRES[calc.phase.rgb] };

  /* L'encre d'un releve, a l'intensite demandee. En sombre la chaine
     produite est identique au caractere pres a ce qui etait ecrit
     avant ; en clair l'alpha devient une clarte. */
  const encre = (a: number) => (sombre ? `rgba(${c.rgb},${a})` : ENCRE_PAPIER[String(a)]);

  /* Une lueur autour d'un chiffre se voit sur du noir. Sur du papier
     c'est une bavure : le halo ne s'ajoute pas au fond, il le salit. */
  const lueur = (ombre: string) => (sombre ? ombre : "none");

  const dateCourte = (iso: string) =>
    new Date(iso)
      .toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" })
      .toUpperCase();

  const debutTxt = projectStartDate ? dateCourte(projectStartDate) : "—";
  const finTxt = dateCourte(projectEndDate);
  const pct = calc.pct;
  const pctArrondi = Math.round(pct);

  /* Le libelle du curseur est centre sur son trait, sauf aux deux
     extremites ou il sortirait du cadre : il s'accroche alors par le
     bord qui reste a l'interieur. */
  const ancrage = pct < 14 ? "0" : pct > 86 ? "-100%" : "-50%";

  return (
    <div
      className="countdown-shell relative overflow-hidden"
      role="group"
      aria-label={`Pacte : ${calc.gros.val} ${calc.gros.unite}, ${pctArrondi} % écoulé, statut ${c.label}`}
      style={{
        borderRadius: 4,
        border: `1px solid rgba(${c.rgb},0.15)`,
        background: "var(--nexus-countdown-bg)",
        boxShadow: lueur(`0 0 20px rgba(${c.rgb},0.05)`),
      }}
    >
      <CornerBrackets color={`rgba(${c.rgb},0.4)`} />
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, rgba(${c.rgb},0.4), transparent)` }}
      />
      <div
        className="absolute top-0 bottom-0 left-0"
        style={{
          width: 3,
          background: `linear-gradient(180deg, rgba(${c.rgb},0.8), rgba(${c.rgb},0.1))`,
          boxShadow: lueur(`0 0 12px rgba(${c.rgb},0.6)`),
        }}
      />

      <div className="cd-corps">
        <div className="cd-tete">
          <span
            className="cd-chiffre"
            style={{
              color: c.primary,
              textShadow: lueur(`0 0 10px rgba(${c.rgb},0.7), 0 0 34px rgba(${c.rgb},0.28)`),
            }}
          >
            {calc.gros.val.toLocaleString("fr-FR")}
          </span>
          <span className="cd-unite" style={{ color: encre(0.75) }}>
            {calc.gros.unite}
          </span>
          <span
            className="cd-sceau"
            style={{
              color: c.primary,
              borderColor: `rgba(${c.rgb},0.45)`,
              background: `rgba(${c.rgb},${sombre ? 0.12 : 0.1})`,
              textShadow: lueur(`0 0 6px rgba(${c.rgb},0.45)`),
              animation: c.clignote,
            }}
          >
            {c.sceau} {c.label}
          </span>
        </div>

        {/* LA REGLE. Debut et fin la bornent, la part faite est en
            plein, le curseur marque aujourd'hui — et ce qu'il reste se
            lit dans le vide, a droite du curseur. */}
        <div
          className="cd-regle"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pctArrondi}
          aria-label="Part du pacte écoulée"
          title={`${debutTxt} → ${finTxt} · ${pctArrondi} % écoulé`}
        >
          <div className="cd-voie" style={{ background: `rgba(${c.rgb},${sombre ? 0.12 : 0.18})` }} />
          <div
            className="cd-fait"
            style={{
              width: `${pct}%`,
              background: `rgba(${c.rgb},${sombre ? 0.85 : 0.9})`,
              boxShadow: lueur(`0 0 8px rgba(${c.rgb},0.45)`),
            }}
          />

          <div className="cd-borne" style={{ left: 0, background: encre(0.6) }}>
            <b style={{ color: encre(0.75) }}>DÉBUT · {debutTxt}</b>
          </div>
          <div className="cd-borne cd-borne-fin" style={{ left: "calc(100% - 1px)", background: encre(0.6) }}>
            <b style={{ color: encre(0.75) }}>FIN · {finTxt}</b>
          </div>

          <div
            className="cd-ici"
            style={{
              left: `${pct}%`,
              background: c.primary,
              boxShadow: lueur(`0 0 8px rgba(${c.rgb},0.8)`),
              animation: c.pouls,
            }}
          >
            <b style={{ color: c.primary, transform: `translateX(${ancrage})` }}>
              AUJOURD'HUI · {pctArrondi} %
            </b>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cdPouls { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes cdClignote { 50%{opacity:0.35} }
        @media (prefers-reduced-motion: reduce) {
          .cd-ici, .cd-sceau { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
