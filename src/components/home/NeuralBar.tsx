import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Pact } from "@/hooks/usePact";
import { RankXPData } from "@/hooks/useRankXP";
import { BondIcon } from "@/components/ui/bond-icon";
import { useAuth } from "@/contexts/AuthContext";
import { useBondBalance } from "@/hooks/useShop";
import { usePoulsDuJour } from "@/hooks/usePoulsDuJour";
import { useVisibleInterval } from "@/hooks/useVisibleInterval";
import { useThemeSombre } from "@/hooks/useThemeSombre";
import { selonTheme } from "@/lib/encrePapier";

interface NeuralBarProps {
  pact: Pact;
  rankData: RankXPData;
}

export function NeuralBar({ pact, rankData }: NeuralBarProps) {
  const sombre = useThemeSombre();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());

  const { data: bondBalanceData } = useBondBalance(user?.id);
  const bondBalance = bondBalanceData?.balance ?? 0;

  const { data: pouls } = usePoulsDuJour(user?.id);
  /* Le resume dit d abord ce qui est fait, puis ce qui manque :
     un lecteur d ecran ne peut pas comparer cinq hauteurs. */
  const resumePouls = (() => {
    if (!pouls) return "";
    const faits = pouls.filter((p) => p.etat !== "eteint").map((p) => p.nom);
    const reste = pouls.filter((p) => p.etat === "eteint").map((p) => p.nom);
    if (faits.length === 0) return "Aujourd'hui : aucun systeme touche.";
    const debut = `Aujourd'hui : ${faits.join(", ")}.`;
    return reste.length ? `${debut} Reste : ${reste.join(", ")}.` : `${debut} Les cinq systemes.`;
  })();

  useVisibleInterval(() => setNow(new Date()), 1000);

  /* LA BARRE SYSTEME DIT LA JOURNEE.

     Elle montrait l avancement dans le rang courant. Or le rang est
     deja sur cette page DEUX FOIS : « LVL 5 » dans les statistiques du
     bandeau, et l arc bleu qui entoure le coeur. Un troisieme rappel,
     reduit a 120 px sans chiffre ni infobulle, n apprenait rien.

     A cote d une horloge a la seconde et d une date, une jauge se lit
     naturellement comme du TEMPS. C est ce qu elle mesure desormais :
     la part de la journee ecoulee, de minuit a minuit. Elle avance
     toute seule, ce qui est exactement le propos — le jour passe, que
     l on fasse quelque chose ou non.

     `now` est deja rafraichi chaque seconde pour l horloge : la jauge
     suit sans une minuterie de plus. */
  const partDuJour = (() => {
    const minuit = new Date(now);
    minuit.setHours(0, 0, 0, 0);
    return ((now.getTime() - minuit.getTime()) / 86_400_000) * 100;
  })();

  const timeStr = format(now, "HH:mm:ss");
  const dateStr = format(now, "EEE dd MMM yyyy", { locale: fr }).toUpperCase();

  return (
    <div className="sticky top-0 z-[100] w-full">
      {/* Main bar */}
      <header className="neural-bar h-12 flex items-center justify-between px-6 overflow-hidden relative">
        {/* Scanline sweep */}
        <div className="neural-bar-scanline absolute bottom-0 h-px pointer-events-none" />

        {/* Left: SYS + progress + coords */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="uppercase font-mono ds-t-label tracking-[2px] text-muted-foreground">
            SYS
          </span>

          {/* La journee ecoulee. Une jauge muette de 120 px ne se lit
              pas : elle porte son role et sa valeur, pour la souris
              comme pour un lecteur d ecran. */}
          <div
            className="overflow-hidden shrink-0 rounded-sm bg-primary/10"
            style={{ width: 120, height: 4 }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(partDuJour)}
            aria-label={t("home.neuralBar.dayElapsed", "Journée écoulée")}
            title={`${t("home.neuralBar.dayElapsed", "Journée écoulée")} — ${Math.round(partDuJour)} %`}
          >
            <div
              className="h-full neural-bar-progress"
              style={{ width: `${partDuJour}%` }}
            />
          </div>

          {/* Pact name + ID */}
          <span className="hidden sm:inline truncate max-w-[200px] font-mono ds-t-label tracking-[1px] text-primary/70">
            {pact.name}
          </span>
        </div>

        {/* Center: Clock */}
        <div className="flex-1 min-w-0 text-center leading-none">
          <div className="font-mono text-[0.9375rem] tracking-[3px] text-primary neural-bar-clock">
            {timeStr}
          </div>
          <div className="font-mono ds-t-label tracking-[2px] uppercase mt-px text-muted-foreground">
            {dateStr}
          </div>
        </div>

        {/* Right: Freq bars + Customize */}
        <div className="flex-1 min-w-0 flex justify-end items-center gap-3">
          {/* ── LE POULS DES CINQ SYSTEMES ──

              Ces cinq barres ondulaient a vide : des hauteurs figees
              [4, 8, 12, 6, 10] et une pulsation en boucle, quoi qu il
              arrive. Un egaliseur qui n egalisait rien.

              Elles disent maintenant lesquels des cinq systemes
              ACTIFS ont ete touches aujourd hui — ceux ou l on fait
              quelque chose. Objectifs, calendrier, finance et liste de
              souhaits n y sont pas : on les consulte, on n y pose pas
              de geste datable.

              La place n est pas un hasard : a gauche la jauge dit
              combien de la journee est passee, a droite le solde dit
              ce qu on a accumule. Entre les deux, il manquait ce qu on
              a FAIT.

              Une barre eteinte reste visible : cinq emplacements
              toujours la, dont certains allumes. Les faire disparaitre
              donnerait un rang qui change de largeur, et surtout on ne
              verrait plus ce qui manque — or c est la moitie de
              l information. */}
          {pouls && pouls.length > 0 && (
            <div
              className="hidden lg:flex items-center gap-1.5"
              role="img"
              aria-label={resumePouls}
              title={pouls.map((p) => `${p.nom} : ${p.detail}`).join(" · ")}
            >
              <div className="flex gap-[2px] items-end h-[14px]">
                {pouls.map((p) => (
                  <div
                    key={p.cle}
                    className="nb-pouls rounded-[1px] bg-primary"
                    data-etat={p.etat}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Bond display */}
          <div className="hidden sm:flex items-center gap-1.5">
            <BondIcon size={14} />
            <span
              className="font-mono ds-t-label tracking-[1px]"
              /* Le solde etait ecrit a l or neon : 1,4:1 sur la barre
                 claire, soit un chiffre invisible. Meme or, descendu
                 jusqu a porter, et sans la lueur qui l empatait. */
              style={{
                color: selonTheme("#ffcc00", sombre),
                textShadow: sombre ? "0 0 6px rgba(255,204,0,0.4)" : "none",
              }}
            >
              {bondBalance.toLocaleString("fr-FR")}
            </span>
          </div>

          {/* Customize button */}
          <button
            onClick={() => navigate("/profile")}
            className="neural-bar-btn flex items-center gap-2 cursor-pointer uppercase transition-all font-mono ds-t-label tracking-[2px] text-primary rounded-[4px]"
            style={{
              padding: "6px 14px",
              clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
            }}
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
            {/* Le libelle debordait deja de la barre sous 400px (bord droit a
                393px sur un ecran de 375, rogne par le parent sans defilement
                possible) ; le passage de 10 a 11px aggravait la coupe. */}
            <span className="hidden min-[400px]:inline">
              {t("home.neuralBar.customize", "Personnaliser")}
            </span>
          </button>
        </div>
      </header>

      {/* CSS keyframes */}
      <style>{`
        @keyframes scanline { to { left: 140%; } }
        @keyframes pulseBar { 0%,100%{opacity:1} 50%{opacity:0.6} }
        /* Trois hauteurs, trois opacites. Une barre eteinte garde un
           moignon : on doit voir qu il y a cinq emplacements, et
           lequel est vide. */
        .nb-pouls {
          width: 3px;
          transition: height 420ms cubic-bezier(0.22, 1, 0.36, 1),
                      opacity 420ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .nb-pouls[data-etat="eteint"] { height: 3px;  opacity: 0.22; }
        .nb-pouls[data-etat="amorce"] { height: 8px;  opacity: 0.62; }
        .nb-pouls[data-etat="plein"]  { height: 14px; opacity: 1; }
        /* Seules les barres PLEINES respirent. L ondulation d avant
           ne disait rien ; celle-ci dit  ce systeme est vivant
           aujourd hui , et elle s arrete sur ce qui n a pas ete
           fait. */
        .nb-pouls[data-etat="plein"] { animation: nb-souffle 3.2s ease-in-out infinite; }
        .nb-pouls:nth-child(2)[data-etat="plein"] { animation-delay: 0.24s; }
        .nb-pouls:nth-child(3)[data-etat="plein"] { animation-delay: 0.48s; }
        .nb-pouls:nth-child(4)[data-etat="plein"] { animation-delay: 0.72s; }
        .nb-pouls:nth-child(5)[data-etat="plein"] { animation-delay: 0.96s; }
        @keyframes nb-souffle { 0%,100%{opacity:0.72} 50%{opacity:1} }
        @media (prefers-reduced-motion: reduce) {
          .nb-pouls { transition: none; animation: none !important; }
        }
      `}</style>
    </div>
  );
}
