import { useDroppable } from "@dnd-kit/core";
import { useTranslation } from "react-i18next";
import { accepteLeDepot, type ArticleRangeable } from "@/domaines/souhaits/logique/rangementEntreListes";
import type { Vue } from "@/domaines/souhaits/types";

interface Onglet {
  cle: Vue;
  mot: string;
  compte: number;
}

interface Props {
  vue: Vue;
  setVue: (v: Vue) => void;
  /* De quoi compter : le total, ce qui tient au pacte, et chaque liste. */
  total: number;
  duPacte: number;
  parListe: ReadonlyMap<string, { length: number }>;
  listes: ReadonlyArray<{ id: string; name: string }>;
  /** L article en vol, s il y en a un. */
  enVol: ArticleRangeable | null;
}

/**
 * LES VUES — ET LES CIBLES DU RANGEMENT.
 *
 * Les onglets sont les seuls endroits de la page qui DESIGNENT une
 * liste. Ce sont donc eux qui recoivent : cela evite d inventer une
 * seconde grammaire — un panneau de depot, une corbeille — pour un
 * geste dont la destination est deja a l ecran, et lue.
 *
 * ON DEPOSE SUR UN ONGLET, JAMAIS SUR UN AUTRE ARTICLE. Le tri manuel
 * a ete retire de ce domaine ; laisser les cartes se recevoir entre
 * elles le ferait revenir par la porte de derriere, sans que personne
 * l ait decide. L ordre d une liste vient de son tri.
 *
 * L ONGLET QUI ACCUEILLE SE VOIT, ET CELUI QUI REFUSE AUSSI. Un
 * glissement sans retour est un pari : on lache, puis on regarde si
 * ca a pris. « data-survol » dit oui ; « data-refus » dit non — sur la
 * vue du pacte, ou sur la liste d ou l on vient.
 */
function OngletDeVue({ o, actif, setVue, enVol }: {
  o: Onglet; actif: boolean; setVue: (v: Vue) => void; enVol: ArticleRangeable | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: o.cle });
  const survole = isOver && !!enVol;
  const accueille = survole && accepteLeDepot(enVol, o.cle);

  return (
    <button
      ref={setNodeRef}
      type="button"
      role="tab"
      className="wl-onglet"
      data-veine={o.cle}
      aria-selected={actif}
      data-survol={accueille ? "1" : undefined}
      data-refus={survole && !accueille ? "1" : undefined}
      onClick={() => setVue(o.cle)}
    >
      {o.mot} <b>{o.compte}</b>
    </button>
  );
}

export function OngletsDeVue({ vue, setVue, total, duPacte, parListe, listes, enVol }: Props) {
  const { t } = useTranslation();

  /* « Global » et « Le pacte » sont fixes ; les listes suivent. Les
     trois se lisent de la meme facon, elles se construisent donc au
     meme endroit — la page n a pas a savoir dans quel ordre. */
  const onglets: Onglet[] = [
    { cle: "tout", mot: t("wishlist.vue.tout", "Global"), compte: total },
    { cle: "pacte", mot: t("wishlist.vue.pacte", "Le pacte"), compte: duPacte },
    ...listes.map((l) => ({
      cle: l.id as Vue,
      mot: l.name,
      compte: parListe.get(l.id)?.length ?? 0,
    })),
  ];

  return (
    <div className="wl-onglets" role="tablist" aria-label={t("wishlist.vue.aria", "Vues de la liste")}>
      {onglets.map((o) => (
        <OngletDeVue key={o.cle} o={o} actif={vue === o.cle} setVue={setVue} enVol={enVol} />
      ))}
    </div>
  );
}
