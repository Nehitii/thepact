import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CornerBrackets } from "@/domaines/accueil/composants/CornerBrackets";
import { IdentiteDuPacte } from "@/domaines/objectifs";
import { RankCore } from "@/domaines/succes";
import { PREF } from "@/socle/outils/preferencesAffichage";
import { useThemeSombre } from "@/socle/hooks/useThemeSombre";
import { selonTheme } from "@/socle/outils/encrePapier";
import type { MesureProgression, NexusHeroBannerProps } from "@/domaines/accueil/types";
import { STYLE_LIBELLE, ROULEMENT, STYLE_VALEUR } from "@/domaines/accueil/logique/stylesBanniere";
/* Reexporte : la page Home l importait depuis ce composant. */
export type { MesureProgression };

/** La cle de retenue, partagee avec la page qui la lit. */
export const CLE_MESURE = PREF.HUB_MESURE;

export function NexusHeroBanner({
  progression,
  mesure = "goals",
  onChangerMesure,
  level,
  totalMissions,
  activeDays,
  pactName,
  valeurs,
  sigilVersion,
  pactMantra,
  pactSymbol = "flame",
  titleFont = "orbitron",
  titleEffect = "none",
  rankName,
  rankLogoUrl,
  rankTeinte,
  nextRankName,
  rankProgress = 0,
  rankXP = 0,
  rankXPTarget = 0,
  enCours = 0,
}: NexusHeroBannerProps) {
  const sombre = useThemeSombre();

  /* Les quatre chiffres portent un halo de neon. Sur du papier il
     empate le chiffre au lieu de l allumer — c est ce que l on voyait
     sur « OBJECTIFS ATTEINTS ». Et « JOURS ACTIFS » etait ecrit a
     l orange neon en dur : 2,2:1 sur du blanc. */
  const stats = useMemo(() => [
    /* Le libelle dit CE QUI est compte : un pourcentage nu ne se lit
       pas, et deux mesures differentes affichees pareil se confondent
       d une session a l autre. */
    {
      /* LA CLE NE DOIT PAS ETRE LE LIBELLE.

         Elle l etait, et le libelle est precisement ce qui change
         quand on bascule. React voyait donc une colonne disparaitre
         et une autre apparaitre : il demontait tout le sous-arbre.
         AnimatePresence perdait avec lui la memoire de la face
         sortante, et chaque bascule redevenait un premier montage —
         donc aucune animation, ni a l entree ni a la sortie.

         La cle dit CE QU EST la colonne, pas ce qu elle affiche. */
      cle: "mesure",
      value: `${Math.round(progression)}%`,
      label: mesure === "steps" ? "ÉTAPES FRANCHIES" : "OBJECTIFS ATTEINTS",
      /* Le libellé de l'AUTRE mesure. Il n'est jamais lu : il sert de
         gabarit, empilé sous le vrai, pour que la colonne garde
         toujours la largeur du plus long des deux. Sans lui, basculer
         fait varier la cellule de onze pixels et pousse les trois
         voisines — c'est la déformation qu'on voyait. Le calculer au
         lieu de l'écrire en dur laisse la traduction le déplacer sans
         rien casser. */
      gabarit: mesure === "steps" ? "OBJECTIFS ATTEINTS" : "ÉTAPES FRANCHIES",
      color: "hsl(var(--ds-accent-primary))",
      glow: sombre ? "0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)" : "none",
      bascule: onChangerMesure,
      /* La clé du roulement : c'est elle qui dit à AnimatePresence
         qu'on a changé de face. */
      face: mesure,
      titre: mesure === "steps"
        ? "Compter les objectifs atteints à la place"
        : "Compter les étapes franchies à la place",
    },
    { cle: "rang", value: `LVL ${level}`, label: "RANG", color: "hsl(var(--ds-accent-primary))", glow: sombre ? "0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)" : "none" },
    { cle: "missions", value: String(totalMissions), label: "MISSIONS", color: "hsl(var(--ds-accent-primary))", glow: sombre ? "0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)" : "none" },
    { cle: "jours", value: String(activeDays), label: "JOURS ACTIFS", color: selonTheme("#ff8c00", sombre), glow: sombre ? "0 0 8px rgba(255,140,0,0.7), 0 0 30px rgba(255,140,0,0.25)" : "none" },
  ], [progression, mesure, onChangerMesure, level, totalMissions, activeDays, sombre]);

  // La Singularite tire ses trois parametres des donnees reelles du pacte.
  // Sans cela, ce ne serait qu'un economiseur d'ecran.
  const singularity = useMemo(() => {
    // Respiration : plus la serie est longue, plus le rythme ralentit et
    // s'approfondit. 5s au premier jour, 13s au plafond — un organisme au
    // repos, pas un gyrophare. Le palier de 400 jours evite qu'une serie
    // exceptionnelle fige le c\oeur.
    const breath = 5 + Math.min(activeDays, 400) / 50;
    // Luminosite : a 0% le c\oeur couve, a 100% il rayonne. Le plancher de
    // 0.45 garantit qu'un pacte qui demarre reste visible.
    const lum = 0.45 + Math.min(Math.max(progression, 0), 100) / 100 * 0.55;
    return {
      "--sing-breath": `${breath.toFixed(1)}s`,
      "--sing-lum": lum.toFixed(3),
      "--sing-progress": `${Math.min(Math.max(progression, 0), 100)}%`,
    } as React.CSSProperties;
  }, [activeDays, progression]);

  return (
    <div
      className="singularity-stage"
      style={{
        ...singularity,
        background: "var(--nexus-bg)",
        border: "1px solid var(--nexus-border)",
        borderRadius: 4,
        boxShadow: "var(--nexus-shadow)",
        padding: "48px 40px",
        textAlign: "center",
      }}
    >
      <CornerBrackets />

      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px nexus-glow-top" />

      {/* NOYAU DE RANG — variante retenue apres maquette. Il occupait
          355px en panneau separe, puis quatre lignes trop maigres dans ce
          coin. Il devient un satellite du c(oe)ur : meme construction,
          plus petite echelle. Masque sous 1024px, ou la place est prise. */}
      {rankName && (
        <div className="absolute top-5 right-6 z-20 hidden lg:block">
          <RankCore
            level={level}
            rankName={rankName}
            logoUrl={rankLogoUrl}
            teinte={rankTeinte}
            nextRankName={nextRankName}
            progress={rankProgress}
            currentXP={rankXP}
            targetXP={rankXPTarget}
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center">
        {/* CE BLOC EST SORTI D ICI. Le sceau, le nom et la raison sont
            ce que « Mon pacte » regle — et cette page ne les montrait
            pas : on y choisissait une police et un effet pour un ecran
            qu on ne voyait pas. Le bloc vit maintenant dans
            « objectifs », que les deux domaines consomment deja ; le
            recopier aurait fait une deuxieme verite, ce qui venait
            justement d arriver aux tables de polices. */}
        <IdentiteDuPacte
          nom={pactName}
          mantra={pactMantra}
          symbole={pactSymbol}
          valeurs={valeurs}
          version={sigilVersion}
          progression={progression}
          enCours={enCours}
          police={titleFont}
          effet={titleEffect}
        />

        {/* Stats row */}
        <div className="flex justify-center flex-wrap" style={{ gap: 48, marginTop: 32 }}>
          {stats.map((s) => {
            /* Celle qui se bascule est un vrai bouton : elle repond au
               clavier, s annonce comme cliquable, et dit ou elle mene.
               Un <div onClick> ne fait aucun des trois. */
            const Cadre = s.bascule ? "button" : "div";
            return (
            <Cadre
              key={s.cle}
              {...(s.bascule
                ? { type: "button" as const, onClick: s.bascule, title: s.titre, "aria-label": s.titre }
                : {})}
              className={
                "flex flex-col items-center" +
                (s.bascule ? " hb-bascule" : "")
              }
            >
              <span className="hb-piste">
                {/* Le gabarit du chiffre : « 100% » est le plus large que
                    la mesure puisse produire. Il porte la MÊME typographie
                    que la face, sinon il ne mesure pas la bonne chose. */}
                {s.bascule && (
                  <span className="hb-gabarit" aria-hidden="true" style={{ ...STYLE_VALEUR, color: s.color }}>
                    100%
                  </span>
                )}
                {/* Pas de mode popLayout : il sort l element en position absolue,
                    ce qui n a de sens que dans un flux. Ici les deux faces
                    partagent deja la meme cellule de grille — elles se
                    superposent d elles-memes, sans rien deplacer. */}
                <AnimatePresence initial={false}>
                  <motion.span
                    key={s.face ?? "fixe"}
                    className="hb-face"
                    initial={s.bascule ? { y: "0.55em", opacity: 0 } : false}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "-0.55em", opacity: 0 }}
                    transition={ROULEMENT}
                    style={{ ...STYLE_VALEUR, color: s.color, textShadow: s.glow }}
                  >
                    {s.value}
                  </motion.span>
                </AnimatePresence>
              </span>

              <span className="hb-piste" style={{ marginTop: 4 }}>
                {s.bascule && (
                  <span className="hb-gabarit" aria-hidden="true" style={STYLE_LIBELLE}>
                    {s.gabarit}
                  </span>
                )}
                {/* Pas de mode popLayout : il sort l element en position absolue,
                    ce qui n a de sens que dans un flux. Ici les deux faces
                    partagent deja la meme cellule de grille — elles se
                    superposent d elles-memes, sans rien deplacer. */}
                <AnimatePresence initial={false}>
                  <motion.span
                    key={s.face ?? "fixe"}
                    className="hb-face"
                    initial={s.bascule ? { y: "0.55em", opacity: 0 } : false}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "-0.55em", opacity: 0 }}
                    transition={ROULEMENT}
                    style={STYLE_LIBELLE}
                  >
                    {s.label}
                  </motion.span>
                </AnimatePresence>
              </span>
            </Cadre>
            );
          })}
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        /* ── LA PISTE ──
           Le gabarit et la face occupent la MÊME cellule : la piste
           prend donc toujours la largeur du plus large des deux
           libellés, et basculer ne peut plus déplacer les colonnes
           voisines. Le gabarit garde sa place sans être lu — ni à
           l'œil, ni par un lecteur d'écran. */
        .hb-piste { display: grid; justify-items: center; }
        .hb-piste > * { grid-area: 1 / 1; }
        .hb-gabarit { visibility: hidden; pointer-events: none; }
        /* La face qui sort est retirée du flux par framer-motion
           (mode popLayout) : elle ne pousse rien pendant qu'elle
           s'en va. */
        .hb-face { will-change: transform, opacity; }

        /* ── LE SURVOL ──
           Avant : un aplat d'accent à 7 % sur tout le bloc. Franc,
           mais lourd — et sur une rangée de quatre chiffres dont un
           seul est cliquable, un pavé teinté crie plus fort que ce
           qu'il annonce.

           Ici c'est une RÈGLE qui se trace sous la colonne, de la
           gauche vers la droite. Elle dit la même chose — ceci
           répond — en un seul pixel, elle est posée en absolu donc
           elle ne déforme rien, et c'est le geste de la page : un
           trait d'encre plutôt qu'un halo. */
        .hb-bascule {
          position: relative;
          cursor: pointer;
          padding-bottom: 7px;
          background: none;
          border: 0;
        }
        .hb-bascule::after {
          content: "";
          position: absolute;
          left: 0; right: 0; bottom: 0;
          height: 1px;
          background: hsl(var(--ds-current-accent, var(--ds-accent-primary)));
          transform: scaleX(0);
          transform-origin: left center;
          transition: transform 340ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .hb-bascule:hover::after,
        .hb-bascule:focus-visible::after { transform: scaleX(1); }
        /* Le libellé se rapproche de l'encre courante au survol :
           l'accent reste pour la règle, la couleur pour le mot. */
        /* Seul le LIBELLE se rapproche de l encre courante : c est lui
           qui nomme la mesure, donc lui qui repond. Le chiffre garde
           sa couleur — le survol ne doit pas donner l impression que
           la valeur change avant le clic. Cible la seconde piste et
           non  .hb-face:last-child , qui attrapait les deux. */
        .hb-bascule > .hb-piste:last-of-type .hb-face {
          transition: color 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .hb-bascule:hover > .hb-piste:last-of-type .hb-face,
        .hb-bascule:focus-visible > .hb-piste:last-of-type .hb-face {
          color: var(--nexus-text-label);
        }
        .hb-bascule:focus-visible { outline: none; }
        .hb-bascule:focus-visible::after { transform: scaleX(1); height: 2px; }

        @media (prefers-reduced-motion: reduce) {
          .hb-bascule::after { transition: none; }
        }

        @keyframes logoPulse {
          0%,100%{box-shadow:0 0 14px rgba(0,212,255,0.8),0 0 50px rgba(0,212,255,0.2)}
          50%{box-shadow:0 0 24px rgba(0,212,255,1),0 0 80px rgba(0,212,255,0.4)}
        }
        @keyframes glitchReveal {
          0%{opacity:0;clip-path:inset(0 100% 0 0)}
          60%{clip-path:inset(0 0 0 0)}
          65%{clip-path:inset(3px 0 0 0);transform:skewX(-1deg)}
          70%{clip-path:inset(0 0 0 0);transform:skewX(0)}
          75%{clip-path:inset(6px 0 2px 0)}
          80%{clip-path:inset(0 0 0 0)}
          100%{opacity:1}
        }
      `}</style>
    </div>
  );
}
