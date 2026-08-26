import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Pact } from "@/hooks/usePact";
import { BondIcon } from "@/components/ui/bond-icon";
import { useAuth } from "@/contexts/AuthContext";
import { useBondBalance } from "@/hooks/useShop";
import { usePoulsDuJour } from "@/hooks/usePoulsDuJour";
import { useVisibleInterval } from "@/hooks/useVisibleInterval";
import { useThemeSombre } from "@/hooks/useThemeSombre";
import { selonTheme } from "@/lib/encrePapier";

/* `rankData` etait declaree ici, passee par Home, et jamais lue :
   un reste de la jauge de rang retiree de cette barre. */
interface NeuralBarProps {
  pact: Pact;
}

export function NeuralBar({ pact }: NeuralBarProps) {
  const sombre = useThemeSombre();
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

  return (
    <div className="sticky top-0 z-[100] w-full">
      {/* Main bar */}
      <header className="neural-bar h-12 flex items-center justify-between gap-5 px-6 overflow-hidden relative">
        {/* ── LE NOM DU PACTE, A SA VRAIE LARGEUR ──

            Il etait rogne a vingt-six pixels et s affichait « An… ».
            Pas par manque de place : les trois groupes portaient tous
            `flex-1`, donc chacun faisait 194 px quoi qu il contienne —
            la jauge en prenait 120, le libelle SYS 26, il restait 26 px
            pour le nom. La barre n a plus que deux groupes, ecartes,
            et le nom prend ce qu il lui faut.

            SYS est parti : vingt-six pixels et une gouttiere pour un
            mot sans donnee derriere lui, le seul de la barre. */}
        <span className="truncate max-w-[42vw] font-orbitron text-[13px] font-bold uppercase tracking-[0.16em] text-foreground">
          {pact.name}
        </span>

        {/* A droite : le pouls des systemes, puis le solde. */}
        <div className="flex min-w-0 shrink-0 items-center gap-4">
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


          {/* L horloge cesse d etre la vedette. C etait le plus gros
              element de la barre, au centre — et la seule information
              que le systeme affiche deja, a trois centimetres de la.
              Elle reste, en second plan, la ou on la cherche. */}
          <span className="font-mono text-xs tracking-[0.14em] text-muted-foreground tabular-nums">
            {timeStr}
          </span>
        </div>

        {/* ── LA JOURNEE PASSE SOUS TOUT LE RESTE ──

            La jauge du jour occupait 120 px dans un coin, ou elle se
            lisait comme un reglage parmi d autres. Elle devient la
            BORDURE BASSE de la barre, sur toute sa largeur : le jour
            avance sous la page entiere, tout seul, que l on fasse
            quelque chose ou non. C est exactement son propos.

            Elle remplace la scanline, qui balayait le meme bord sans
            rien signifier. */}
        <div
          className="absolute inset-x-0 bottom-0 h-[2px] bg-primary/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(partDuJour)}
          aria-label={t("home.neuralBar.dayElapsed", "Journée écoulée")}
          title={`${t("home.neuralBar.dayElapsed", "Journée écoulée")} — ${Math.round(partDuJour)} %`}
        >
          <div className="h-full neural-bar-progress" style={{ width: `${partDuJour}%` }} />
        </div>
      </header>

      {/* CSS keyframes */}
      <style>{`
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
