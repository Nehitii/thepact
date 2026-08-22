import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGoalFilters } from "@/hooks/useGoalFilters";

/* ═══════════════════════════════════════════════════════════════
   ALLER A L OBJECTIF D A COTE

   Ouvrir une fiche etait un aller simple : on revenait a la liste, on
   cherchait la ligne suivante, on la rouvrait. Trois gestes pour lire
   deux objectifs de suite.

   DANS QUEL ORDRE ? DANS CELUI QU ON REGARDAIT.

   C est toute la question, et la seule reponse acceptable. Si l on a
   trie par echeance et filtre sur les objectifs actifs, la fleche doit
   suivre CE classement — sinon elle paraitrait aleatoire, et une
   navigation qu on ne peut pas anticiper ne sert a rien.

   Le tri et les filtres vivent deja en localStorage : le meme hook
   rejoue donc exactement la sequence que la liste montrait, sans qu on
   ait a la faire transiter par la route.

   ON NE BOUCLE PAS. Arrive au dernier, la fleche ne ramene pas au
   premier : rien a l ecran ne dirait qu on a fait le tour, et l on
   croirait la liste infinie. Le bouton se desactive, ce qui dit « c est
   le bout » sans un mot.
   ═══════════════════════════════════════════════════════════════ */

interface ObjetMinimal { id: string; name: string }

export interface Voisins<T> {
  precedent: T | null;
  suivant: T | null;
  /** Le rang dans la sequence, a partir de 1. Zero si l objectif n y est pas. */
  rang: number;
  total: number;
  allerAuPrecedent: () => void;
  allerAuSuivant: () => void;
}

export function useVoisinsDObjectif<T extends ObjetMinimal>(
  tousLesObjectifs: T[],
  idCourant: string | undefined,
): Voisins<T> {
  const navigate = useNavigate();
  const { sorted } = useGoalFilters(tousLesObjectifs as never);

  const sequence = (sorted as unknown as T[]) ?? [];
  const i = useMemo(() => sequence.findIndex((g) => g.id === idCourant), [sequence, idCourant]);

  /* ON ARRIVE PARFOIS D AILLEURS.
     Un lien depuis le calendrier, la recherche, un membre de groupe :
     l objectif ouvert peut ne pas entrer dans les filtres en cours.
     Mon premier reflexe avait ete de basculer sur la liste entiere —
     et le total sautait alors de 25 a 38 d une fiche a l autre, ce qui
     rendait le rang inutilisable : on ne sait plus si l on avance dans
     une sequence ou dans une autre.
     La sequence reste donc CELLE QU ON PARCOURAIT, taille comprise. Ce
     qui change, c est qu on n y est pas : le rang le dit — « — / 25 »
     — le retour arriere n a pas de sens, et la fleche avant fait
     entrer dans la liste par son premier. */
  const horsSequence = i < 0;
  const precedent = horsSequence ? null : (i > 0 ? sequence[i - 1] : null);
  const suivant = horsSequence
    ? (sequence[0] ?? null)
    : (i < sequence.length - 1 ? sequence[i + 1] : null);

  const allerAuPrecedent = useCallback(() => {
    if (precedent) navigate(`/goals/${precedent.id}`);
  }, [precedent, navigate]);

  const allerAuSuivant = useCallback(() => {
    if (suivant) navigate(`/goals/${suivant.id}`);
  }, [suivant, navigate]);

  /* LES FLECHES DU CLAVIER, MAIS PAS N IMPORTE QUAND.
     On ne detourne pas une fleche qui sert deja : dans un champ, elle
     deplace le curseur ; dans une fenetre, elle appartient a la
     fenetre ; avec un modificateur, elle appartient au systeme. */
  useEffect(() => {
    const auClavier = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;

      const cible = e.target as HTMLElement | null;
      const balise = cible?.tagName;
      if (balise === "INPUT" || balise === "TEXTAREA" || balise === "SELECT") return;
      if (cible?.isContentEditable) return;

      if (e.key === "ArrowLeft" && precedent) { e.preventDefault(); allerAuPrecedent(); }
      if (e.key === "ArrowRight" && suivant) { e.preventDefault(); allerAuSuivant(); }
    };
    document.addEventListener("keydown", auClavier);
    return () => document.removeEventListener("keydown", auClavier);
  }, [precedent, suivant, allerAuPrecedent, allerAuSuivant]);

  return {
    precedent,
    suivant,
    rang: horsSequence ? 0 : i + 1,
    total: sequence.length,
    allerAuPrecedent,
    allerAuSuivant,
  };
}
