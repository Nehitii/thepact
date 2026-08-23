import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Clapperboard, Plus, Target, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { VictoryReelCard } from "./VictoryReelCard";
import { CreateReelModal } from "./CreateReelModal";
import { useCompletedGoals, useVictoryReels } from "@/hooks/useCommunity";
import { useAuth } from "@/contexts/AuthContext";

/* LA PILE DE VIDEOS.
 *
 * Une seule video visible, on passe a la suivante — molette, glisser
 * vertical, fleches, ou les deux boutons. La navigation etait
 * autrefois branchee sur la molette UNIQUEMENT en mobile
 * (`if (!isMobile) return`), ce qui la rendait inerte a la souris,
 * la ou la molette existe vraiment.
 *
 * goToNext et goToPrev etaient recrees a chaque rendu et absents des
 * dependances des deux effets : les ecouteurs se reinscrivaient sans
 * arret sur des versions perimees. Ils sont stabilises par
 * useCallback, et les effets les declarent. */

export function VictoryReelsFeed() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: reels, isLoading } = useVictoryReels();
  const { data: accomplis = [] } = useCompletedGoals();
  const [index, setIndex] = useState(0);
  const [modale, setModale] = useState(false);
  const scene = useRef<HTMLDivElement>(null);

  const total = reels?.length ?? 0;

  const suivant = useCallback(() => setIndex((i) => (i < total - 1 ? i + 1 : i)), [total]);
  const precedent = useCallback(() => setIndex((i) => (i > 0 ? i - 1 : i)), []);

  useEffect(() => {
    const el = scene.current;
    if (!el || total === 0) return;

    let departY = 0;
    let dernier = 0;

    const molette = (e: WheelEvent) => {
      e.preventDefault();
      const maintenant = e.timeStamp;
      if (maintenant - dernier < 450) return;
      dernier = maintenant;
      if (e.deltaY > 0) suivant(); else precedent();
    };
    const debut = (e: TouchEvent) => { departY = e.touches[0].clientY; };
    const fin = (e: TouchEvent) => {
      const ecart = departY - e.changedTouches[0].clientY;
      if (Math.abs(ecart) > 50) { if (ecart > 0) suivant(); else precedent(); }
    };

    el.addEventListener("wheel", molette, { passive: false });
    el.addEventListener("touchstart", debut, { passive: true });
    el.addEventListener("touchend", fin, { passive: true });
    return () => {
      el.removeEventListener("wheel", molette);
      el.removeEventListener("touchstart", debut);
      el.removeEventListener("touchend", fin);
    };
  }, [suivant, precedent, total]);

  useEffect(() => {
    if (total === 0) return;
    const touche = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement | null;
      if (cible && /^(INPUT|TEXTAREA|SELECT)$/.test(cible.tagName)) return;
      if (e.key === "ArrowDown" || e.key === "j") suivant();
      else if (e.key === "ArrowUp" || e.key === "k") precedent();
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [suivant, precedent, total]);

  if (isLoading) {
    return (
      <div className="co-scene" aria-busy="true">
        <span className="co-os" style={{ width: "100%", height: "100%", borderRadius: 0 }} />
      </div>
    );
  }

  /* L ETAT VIDE FAIT SON TRAVAIL.
     Il ne disait rien de ce qu est une video de victoire, ni de ce
     qu il faut pour en publier une — un objectif accompli, sans quoi
     le formulaire s ouvre sur rien. Il montre desormais ce qu on a :
     le nombre d objectifs deja franchis, ou le chemin pour en
     franchir un. */
  if (total === 0) {
    const peutPublier = accomplis.length > 0;
    return (
      <>
        <div className="co-vide">
          <Clapperboard aria-hidden="true" />
          <h3>{t("community.reels.noReelsTitle", "Pas encore de vidéos de victoire")}</h3>
          <p>
            {t(
              "community.reels.what",
              "Une vidéo de victoire est un format vertical, court, rattaché à un objectif que vous avez mené à son terme. C'est la preuve qui accompagne le chiffre.",
            )}
          </p>

          {user && (
            <p className="co-vide-etat">
              {peutPublier ? <Trophy aria-hidden="true" /> : <Target aria-hidden="true" />}
              {peutPublier
                ? t("community.reels.ready", { count: accomplis.length, defaultValue: "{{count}} objectifs accomplis, prêts à être racontés" })
                : t("community.reels.needGoal", "Il faut d'abord mener un objectif à son terme")}
            </p>
          )}

          {user && peutPublier && (
            <button type="button" className="co-bouton" onClick={() => setModale(true)}>
              <Plus aria-hidden="true" />
              {t("community.reels.createReel", "Créer une vidéo")}
            </button>
          )}
          {user && !peutPublier && (
            <a className="co-bouton co-bouton--discret" href="/goals">
              {t("community.reels.goToGoals", "Voir mes objectifs")}
            </a>
          )}
        </div>
        <CreateReelModal isOpen={modale} onClose={() => setModale(false)} />
      </>
    );
  }

  return (
    <>
      <div ref={scene} style={{ position: "relative" }}>
        <VictoryReelCard reel={reels![index]} isActive />

        <div className="co-nav">
          <button
            type="button"
            onClick={precedent}
            disabled={index === 0}
            aria-label={t("community.reels.previous", "Précédent")}
          >
            <ChevronUp aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={suivant}
            disabled={index >= total - 1}
            aria-label={t("community.reels.next", "Suivant")}
          >
            <ChevronDown aria-hidden="true" />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid var(--co-filet)" }}>
        <span style={{ fontFamily: "var(--co-fonte-chiffre)", fontSize: 13, color: "var(--co-texte-2)", fontVariantNumeric: "tabular-nums" }}>
          {index + 1} {t("community.reels.of", "sur")} {total}
        </span>
        {user && (
          <button type="button" className="co-bouton" style={{ marginLeft: "auto" }} onClick={() => setModale(true)}>
            <Plus aria-hidden="true" />
            {t("community.reels.createReel", "Créer une vidéo")}
          </button>
        )}
      </div>

      <CreateReelModal isOpen={modale} onClose={() => setModale(false)} />
    </>
  );
}
