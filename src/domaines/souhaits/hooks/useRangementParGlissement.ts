import { useCallback, useMemo, useState } from "react";
import {
  KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent, type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { useAuth } from "@/socle/contextes/AuthContext";
import { useRangerDansListe } from "@/domaines/souhaits/hooks/useWishlistLists";
import {
  accepteLeDepot, listeDesignee, type ArticleRangeable,
} from "@/domaines/souhaits/logique/rangementEntreListes";
import {
  changeDeCible, laPlusProche, prochaineCible, type CibleAtteignable,
} from "@/domaines/souhaits/logique/cibleAuClavier";

/**
 * Ou la fleche mene la cible.
 *
 * dnd-kit veut des COORDONNEES ; on lui rend donc le centre de la
 * cible choisie, et c est sa detection de collision qui en deduit
 * l onglet survole. La regle du choix, elle, est testee a part.
 */
const deplacerLaCible: KeyboardCoordinateGetter = (evenement, { currentCoordinates, context }) => {
  if (!changeDeCible(evenement.key)) return undefined;
  evenement.preventDefault();

  const cibles: CibleAtteignable[] = [];
  /* « droppableContainers » est une Map : l iterer rend des paires. */
  for (const [, c] of context.droppableContainers ?? []) {
    const r = c.rect.current;
    if (c.disabled || !r) continue;
    cibles.push({ id: String(c.id), x: r.left + r.width / 2, y: r.top + r.height / 2 });
  }
  if (!cibles.length) return undefined;

  /* Les cibles sont donnees dans l ordre ou elles se sont enregistrees ;
     on les remet dans l ordre ou elles se LISENT, de gauche a droite,
     sinon « suivante » ne veut rien dire pour qui regarde l ecran. */
  cibles.sort((a, b) => a.y - b.y || a.x - b.x);

  const depuis = laPlusProche(cibles, currentCoordinates.x, currentCoordinates.y);
  /* Le premier appui n a pas encore de cible : « laPlusProche » rend
     alors la cible la plus proche de l article saisi, et l on n avance
     pas d un cran par-dessus. */
  const dejaSurUneCible = depuis >= 0
    && Math.hypot(cibles[depuis].x - currentCoordinates.x, cibles[depuis].y - currentCoordinates.y) < 4;
  const index = dejaSurUneCible ? prochaineCible(cibles, depuis, evenement.key) : Math.max(depuis, 0);
  return { x: cibles[index].x, y: cibles[index].y };
};

/**
 * LE GESTE : PRENDRE UN ARTICLE, LE POSER SUR UNE LISTE.
 *
 * Les listes existaient et rien ne pouvait y entrer. Ce crochet tient
 * le geste et rien d autre — ce qu il a le droit de faire est decide
 * dans « logique/rangementEntreListes.ts », avec ses tests.
 *
 * ON DEPLACE ENTRE LISTES, ON NE REORDONNE PAS DEDANS : les cibles de
 * depot sont les ONGLETS, jamais les autres articles. C est aussi ce
 * qui empeche le tri manuel de revenir par cette porte.
 *
 * LE CLAVIER EN FAIT AUTANT QUE LA SOURIS. Le capteur clavier de
 * dnd-kit est monte au meme titre que les autres : espace pour
 * saisir, fleches pour viser, espace pour lacher. Et pour ceux qui
 * n ont ni l un ni l autre — le telephone tenu d une main — le menu
 * « ranger dans… » fait le meme travail sans geste : un deplacement
 * qui n existe qu a la souris n existe pas sur mobile.
 */
export function useRangementParGlissement(articles: readonly ArticleRangeable[]) {
  const { user } = useAuth();
  const ranger = useRangerDansListe();
  const [saisi, setSaisi] = useState<string | null>(null);

  const capteurs = useSensors(
    /* Huit pixels avant de commencer : sans ce seuil, un clic sur une
       carte devient un glissement rate et n ouvre plus la fiche. */
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    /* Au doigt, c est le TEMPS qui distingue la prise du defilement :
       une contrainte de distance rendrait la page impossible a faire
       defiler des qu on la touche sur une carte. */
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
    /* AU CLAVIER, UNE FLECHE CHANGE DE DESTINATION — elle ne pousse
       pas un point de vingt-cinq pixels. Les onglets sont en haut de
       la page : les atteindre a la poussee demanderait trente appuis,
       et davantage si la page a defile. Voir
       « logique/cibleAuClavier.ts ». */
    useSensor(KeyboardSensor, { coordinateGetter: deplacerLaCible }),
  );

  const parId = useMemo(() => new Map(articles.map((a) => [a.id, a])), [articles]);
  const article = saisi ? parId.get(saisi) ?? null : null;

  const auDepart = useCallback((e: DragStartEvent) => {
    setSaisi(String(e.active.id));
  }, []);

  const aLArrivee = useCallback(
    (e: DragEndEvent) => {
      setSaisi(null);
      const a = parId.get(String(e.active.id));
      const cible = e.over ? String(e.over.id) : null;
      if (!a || !user?.id || !accepteLeDepot(a, cible)) return;
      ranger.mutate({ userId: user.id, itemId: a.id, listId: listeDesignee(cible as string) });
    },
    [parId, user?.id, ranger],
  );

  const aLAbandon = useCallback(() => setSaisi(null), []);

  /* Ranger sans glisser — le menu, et la meme regle. */
  const rangerDirectement = useCallback(
    (itemId: string, cible: string) => {
      const a = parId.get(itemId);
      if (!a || !user?.id || !accepteLeDepot(a, cible)) return;
      ranger.mutate({ userId: user.id, itemId, listId: listeDesignee(cible) });
    },
    [parId, user?.id, ranger],
  );

  return { capteurs, saisi, article, auDepart, aLArrivee, aLAbandon, rangerDirectement };
}
