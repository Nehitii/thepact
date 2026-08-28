import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Search, Target, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getStatusLabel } from "@/lib/goalConstants";
import { teinteDuPalier } from "@/hooks/useCarteObjectif";
import { useUserGoals, type UserGoal } from "@/domaines/social/hooks/useCommunity";

/* RATTACHER UN OBJECTIF A UNE PUBLICATION.
 *
 * C etait un <select> natif. Trois defauts, tous les trois inevitables
 * avec cet element :
 *
 * — SA LISTE EST DESSINEE PAR LE SYSTEME. Sur Windows elle s ouvre en
 *   blanc, au milieu d une page noire, et aucune feuille de style ne
 *   peut l atteindre. C est le seul endroit de l application ou le
 *   theme sombre s arretait net.
 *
 * — TRENTE-NEUF OPTIONS SANS RECHERCHE. Il fallait derouler la liste
 *   entiere pour trouver un objectif, sans autre indice que son nom.
 *
 * — LES NOMS ETAIENT COUPES. Le declencheur etait plafonne a 180px, et
 *   le plus long des objectifs — « Achat - Habitat & amenagement
 *   interieur » — n en montrait qu un tiers.
 *
 * Ce qui le remplace est un panneau de la page, dans sa langue
 * graphique : un champ de recherche qui ignore les accents, la liste
 * triee par ce qui est en cours d abord, la pastille du palier a
 * gauche, l etat a droite, et le clavier de bout en bout.
 *
 * La requete ne part plus au chargement du fil mais a l ouverture de
 * ce panneau : personne ne paie trente-neuf objectifs pour lire des
 * publications. */

const ORDRE: Record<string, number> = {
  in_progress: 0,
  not_started: 1,
  paused: 2,
  validated: 3,
  fully_completed: 4,
};

function sansAccents(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

interface Props {
  valeur: string;
  onChoisir: (id: string, nom: string | null) => void;
}

export function ChoixObjectif({ valeur, onChoisir }: Props) {
  const { t } = useTranslation();
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [vise, setVise] = useState(0);
  const boite = useRef<HTMLDivElement>(null);
  const champ = useRef<HTMLInputElement>(null);

  const { data: objectifs = [], isLoading } = useUserGoals();

  const choisi = objectifs.find((o) => o.id === valeur) || null;

  const liste = useMemo(() => {
    const q = sansAccents(recherche.trim());
    return objectifs
      .filter((o) => !q || sansAccents(o.name).includes(q))
      .sort((a, b) => {
        const oa = ORDRE[a.status || "not_started"] ?? 9;
        const ob = ORDRE[b.status || "not_started"] ?? 9;
        return oa !== ob ? oa - ob : a.name.localeCompare(b.name, "fr");
      });
  }, [objectifs, recherche]);

  /* Fermeture au clic dehors. */
  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e: MouseEvent) => {
      if (boite.current && !boite.current.contains(e.target as Node)) setOuvert(false);
    };
    document.addEventListener("mousedown", dehors);
    return () => document.removeEventListener("mousedown", dehors);
  }, [ouvert]);

  useEffect(() => {
    if (ouvert) champ.current?.focus();
    else { setRecherche(""); setVise(0); }
  }, [ouvert]);

  useEffect(() => { setVise(0); }, [recherche]);

  const poser = (o: UserGoal | null) => {
    onChoisir(o?.id ?? "", o?.name ?? null);
    setOuvert(false);
  };

  const auClavier = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); setOuvert(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setVise((i) => Math.min(i + 1, liste.length - 1)); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setVise((i) => Math.max(i - 1, 0)); return; }
    if (e.key === "Enter") { e.preventDefault(); if (liste[vise]) poser(liste[vise]); }
  };

  return (
    <div className="co-choix" ref={boite}>
      <button
        type="button"
        className="co-puce co-choix-declencheur"
        aria-haspopup="listbox"
        aria-expanded={ouvert}
        onClick={() => setOuvert((v) => !v)}
      >
        <Target aria-hidden="true" />
        <span className="co-choix-nom">
          {choisi ? choisi.name : t("community.create.attachGoal", "Associer un objectif")}
        </span>
        {choisi && (
          <i
            className="co-puce-fermer"
            role="button"
            tabIndex={0}
            aria-label={t("community.create.detach", "Détacher l'objectif")}
            onClick={(e) => { e.stopPropagation(); poser(null); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); poser(null); } }}
          >
            <X aria-hidden="true" />
          </i>
        )}
      </button>

      {ouvert && (
        <div className="co-choix-panneau" role="listbox" onKeyDown={auClavier}>
          <div className="co-choix-recherche">
            <Search aria-hidden="true" />
            <input
              ref={champ}
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              onKeyDown={auClavier}
              placeholder={t("community.create.searchGoal", "Chercher un objectif…")}
              aria-label={t("community.create.searchGoal", "Chercher un objectif…")}
            />
          </div>

          <div className="co-choix-liste">
            {isLoading && (
              <p className="co-choix-message">{t("community.create.loadingGoals", "Chargement…")}</p>
            )}

            {!isLoading && liste.length === 0 && (
              <p className="co-choix-message">
                {recherche
                  ? t("community.create.noMatch", "Aucun objectif ne correspond")
                  : t("community.create.noGoalYet", "Aucun objectif dans votre pacte")}
              </p>
            )}

            {liste.map((o, i) => {
              const teinte = teinteDuPalier(o.difficulty);
              return (
                <button
                  key={o.id}
                  type="button"
                  role="option"
                  aria-selected={o.id === valeur}
                  className="co-choix-ligne"
                  data-vise={i === vise ? "oui" : "non"}
                  onMouseEnter={() => setVise(i)}
                  onClick={() => poser(o)}
                >
                  <span className="co-choix-palier" style={{ background: teinte.couleur }} aria-hidden="true" />
                  <span className="co-choix-titre">{o.name}</span>
                  <span className="co-choix-etat">{getStatusLabel(o.status || "not_started", t)}</span>
                  {o.id === valeur && <Check className="co-choix-coche" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
