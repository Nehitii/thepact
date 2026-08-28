import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, X, Target, ListTodo, CornerDownLeft, type LucideIcon } from "lucide-react";
import { classer } from "@/lib/rechercheMots";
import { useRechercheBarre } from "@/hooks/useRechercheBarre";

/* ═══════════════════════════════════════════════════════════════
   LA RECHERCHE SE DÉPLIE À CÔTÉ DE LA BARRE

   Elle ouvrait jusqu'ici la palette ⌘K — une boîte au centre de
   l'écran, qui recouvre la page et fait oublier d'où l'on vient. Ce
   volet-ci se déploie CONTRE la barre : on garde la navigation sous
   les yeux pendant qu'on cherche.

   L'ORDRE DES RÉPONSES EST LE SUJET. Quelqu'un qui tape « sport »
   cherche neuf fois sur dix la page, pas l'objectif. Les menus
   passent donc devant, toujours, et se comparent SANS REQUÊTE — ils
   apparaissent à la frappe. Les objectifs et les tâches viennent
   ensuite, en second rideau, quand le mot ne désigne aucune page ou
   quand on veut plus.

   LA PALETTE ⌘K RESTE. Elle fait autre chose : des actions, des
   réglages, un lanceur. Ce volet ne cherche que des NOMS.
   ═══════════════════════════════════════════════════════════════ */

export interface EntreeCherchable {
  to: string;
  libelle: string;
  icone: LucideIcon;
  /* Le groupe d'où vient l'entrée, montré en petit à droite : « Amis »
     tout seul ne dit pas si c'est une page ou un réglage. */
  groupe: string;
}

interface Props {
  ouverte: boolean;
  fermer: () => void;
  entrees: EntreeCherchable[];
  pactId?: string | null;
  userId?: string;
}

export function RechercheBarre({ ouverte, fermer, entrees, pactId, userId }: Props) {
  const [terme, setTerme] = useState("");
  const [differe, setDiffere] = useState("");
  const champ = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  /* On attend que la frappe se calme avant d'interroger la base. Deux
     cent vingt millisecondes : assez pour ne pas tirer à chaque
     lettre, trop peu pour qu'on le sente. */
  useEffect(() => {
    const m = window.setTimeout(() => setDiffere(terme), 220);
    return () => window.clearTimeout(m);
  }, [terme]);

  useEffect(() => {
    if (!ouverte) { setTerme(""); setDiffere(""); return; }
    /* Le focus attend la fin de l'ouverture : le poser pendant que le
       volet glisse fait sauter la page vers l'élément. */
    const m = window.setTimeout(() => champ.current?.focus(), 60);
    return () => window.clearTimeout(m);
  }, [ouverte]);

  const { data } = useRechercheBarre(differe, pactId, userId);

  const menus = useMemo(() => {
    if (!terme.trim()) return [];
    return entrees
      .map((e) => ({ e, score: classer(e.libelle + " " + e.groupe, terme) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 7)
      .map((x) => x.e);
  }, [entrees, terme]);

  const objectifs = data?.objectifs ?? [];
  const taches = data?.taches ?? [];
  const rien = !!terme.trim() && !menus.length && !objectifs.length && !taches.length;

  const aller = (to: string) => { navigate(to); fermer(); };

  /* L etat arrive brut de la base — « not_started ». Le dictionnaire
     des objectifs le traduit deja, et il couvre aussi « active » et
     « completed », que portent les taches. A defaut, on montre la
     valeur : un mot anglais reste plus utile qu un vide. */
  const direEtat = (e: string | null) => (e ? t(`goals.statuses.${e}`, e) : null);

  const auClavier = (ev: React.KeyboardEvent) => {
    if (ev.key === "Escape") { ev.preventDefault(); fermer(); return; }
    if (ev.key !== "Enter") return;
    /* Entrée prend la PREMIÈRE réponse, dans l'ordre affiché — donc un
       menu s'il y en a un. C'est le même ordre que l'œil. */
    const premier = menus[0]?.to
      ?? (objectifs[0] ? "/goals" : undefined)
      ?? (taches[0] ? "/todo" : undefined);
    if (premier) { ev.preventDefault(); aller(premier); }
  };

  return (
    <div className="sb-volet" data-ouvert={ouverte ? "oui" : "non"} aria-hidden={!ouverte}>
      <div className="sb-volet-tete">
        <Search aria-hidden />
        <input
          ref={champ}
          type="search"
          className="sb-volet-champ"
          value={terme}
          onChange={(e) => setTerme(e.target.value)}
          onKeyDown={auClavier}
          placeholder={t("nav.chercherQuoi", "Une page, un objectif, une tâche…")}
          aria-label={t("nav.chercher", "Rechercher")}
          tabIndex={ouverte ? 0 : -1}
        />
        <button
          type="button"
          className="sb-volet-fermer"
          onClick={fermer}
          aria-label={t("common.close", "Fermer")}
          tabIndex={ouverte ? 0 : -1}
        >
          <X aria-hidden />
        </button>
      </div>

      <div className="sb-volet-corps">
        {!terme.trim() && (
          <p className="sb-volet-vide">
            {t("nav.chercherAmorce", "Tapez un mot : les pages d'abord, puis vos objectifs et vos tâches.")}
          </p>
        )}

        {!!menus.length && (
          <>
            <p className="sb-volet-groupe">{t("nav.groupePages", "Pages")}</p>
            {menus.map((e) => {
              const Icone = e.icone;
              return (
                <button key={e.to} type="button" className="sb-volet-item" onClick={() => aller(e.to)}>
                  <Icone aria-hidden />
                  <span className="sb-volet-nom">{e.libelle}</span>
                  <span className="sb-volet-ou">{e.groupe}</span>
                </button>
              );
            })}
          </>
        )}

        {!!objectifs.length && (
          <>
            <p className="sb-volet-groupe">{t("nav.groupeObjectifs", "Objectifs")}</p>
            {objectifs.map((o) => (
              <button key={o.id} type="button" className="sb-volet-item" onClick={() => aller("/goals/" + o.id)}>
                <Target aria-hidden />
                <span className="sb-volet-nom">{o.nom}</span>
                {o.etat && <span className="sb-volet-ou">{direEtat(o.etat)}</span>}
              </button>
            ))}
          </>
        )}

        {!!taches.length && (
          <>
            <p className="sb-volet-groupe">{t("nav.groupeTaches", "Tâches")}</p>
            {taches.map((x) => (
              <button key={x.id} type="button" className="sb-volet-item" onClick={() => aller("/todo")}>
                <ListTodo aria-hidden />
                <span className="sb-volet-nom">{x.nom}</span>
                {x.etat && <span className="sb-volet-ou">{direEtat(x.etat)}</span>}
              </button>
            ))}
          </>
        )}

        {rien && (
          <p className="sb-volet-vide">
            {t("nav.chercherRien", "Rien sous ce mot — ni page, ni objectif, ni tâche.")}
          </p>
        )}
      </div>

      <p className="sb-volet-pied">
        <CornerDownLeft aria-hidden />
        {t("nav.chercherEntree", "Entrée pour la première réponse")}
      </p>
    </div>
  );
}
