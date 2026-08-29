/**
 * Les deux volets du dossier : ce qu on fait, ce que ca coute.
 *
 * Ils se font face au lieu de se succeder. Le registre ne recopie
 * plus le titre entier de chaque etape sous chaque poste — il la
 * designe par son numero de gouttiere, celui-la meme qu affiche le
 * rail des etapes a cote.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import { Check, MessageSquare, Sparkle } from "lucide-react";
import { formatCurrency } from "@/socle/outils/currency";
import { getCostCategoryLabel } from "@/domaines/objectifs/logique/goalConstants";
import { HabitHeatmap } from "@/domaines/objectifs/composants/HabitHeatmap";
import { deuxChiffres } from "@/domaines/objectifs/logique/triDuDossier";

export interface EtapeDossier {
  id: string;
  title: string;
  order: number;
  status: string | null;
  notes?: string | null;
  /** L etape ultime : hors avancement, elle porte l objectif au zenith. */
  is_ultimate?: boolean;
}

export interface PosteDossier {
  id: string;
  name: string;
  price: number;
  category: string | null;
  step_id: string | null;
  acquired_at?: string | null;
}

/* ── Le rail des etapes ─────────────────────────────────────────── */

export const DossierEtapes = React.memo(function DossierEtapes({
  etapes, teinte, coutParEtape, devise, onBasculer, onOuvrir,
}: {
  etapes: EtapeDossier[];
  teinte: string;
  coutParEtape: Map<string, number>;
  devise: string;
  onBasculer: (stepId: string, statut: string) => void;
  onOuvrir: (stepId: string) => void;
}) {
  const { t } = useTranslation();

  /* L ETAPE ULTIME SE LIT A PART.
   *
   * Elle n est pas la n-ieme d une suite : elle est a cote. Elle ne
   * porte donc pas de rang, elle ne compte pas dans la fraction du
   * volet — sans quoi un objectif de cinq etapes plus l ultime
   * afficherait 5/6 une fois tout fait, et l objectif honore aurait
   * l air inacheve — et elle vient apres, sous son propre intertitre,
   * parce qu on n y va qu une fois le reste tenu. */
  const ordinaires = etapes.filter((e) => !e.is_ultimate);
  const ultime = etapes.find((e) => e.is_ultimate);
  const faites = ordinaires.filter((e) => e.status === "completed").length;

  const ligne = (e: EtapeDossier, rang: number | null) => {
    const faite = e.status === "completed";
    const cout = coutParEtape.get(e.id);
    return (
      <div
        key={e.id}
        className="gd-etape"
        data-faite={faite ? "1" : "0"}
        data-ultime={rang === null ? "1" : "0"}
        style={{ ["--t" as string]: teinte }}
      >
        <span className="gd-num">
          {rang === null ? <Sparkle size={11} aria-hidden="true" /> : deuxChiffres(rang)}
        </span>
        {/* Cocher une etape et l ouvrir sont deux gestes distincts :
            deux boutons, pas une ligne cliquable avec une zone morte
            au milieu. */}
        <button
          type="button"
          className="gd-case"
          onClick={() => onBasculer(e.id, e.status ?? "pending")}
          aria-pressed={faite}
          aria-label={faite
            ? t("goals.detail.uncheckStep", "Décocher l'étape")
            : t("goals.detail.checkStep", "Valider l'étape")}
        >
          {faite && <Check size={11} strokeWidth={3} aria-hidden="true" />}
        </button>
        <button type="button" className="gd-ouvrir" onClick={() => onOuvrir(e.id)} title={e.title}>
          <span className="gd-etape-titre">{e.title}</span>
        </button>
        {e.notes
          ? <MessageSquare size={12} className="gd-note" aria-hidden="true" />
          : <span />}
        {cout
          ? <span className="gd-etape-cout">{formatCurrency(cout, devise)}</span>
          : <span />}
      </div>
    );
  };

  return (
    <section className="gd-volet">
      <header className="gd-tete">
        {t("goals.detail.steps", "Étapes")}
        <b>{faites}/{ordinaires.length}</b>
      </header>
      <div className="gd-liste">
        {ordinaires.map((e, i) => ligne(e, i + 1))}

        {ultime && (
          /* L ETAPE ULTIME N EST PAS UNE LIGNE DE PLUS.
           *
           * C est l objet le plus rare de l application : il faut
           * l avoir designee, puis l avoir franchie. La poser au bout
           * de la liste, separee par un simple filet, la rangeait a
           * cote des autres — alors qu elle n est pas du meme ordre.
           *
           * Elle a donc sa propre plaque, chanfreinee comme les cadres
           * de l application, avec sa languette d or en applique. Et
           * surtout deux etats franchement differents : dormante, elle
           * est contenue, sombre, sous une trame en attente ; franchie,
           * elle s allume — la plaque prend l or, le titre passe en
           * encre sombre, et le sceau du zenith tombe. Le passage d un
           * etat a l autre est l evenement ; il fallait qu il se voie.
           */
          <div className="gd-ultime" data-atteint={ultime.status === "completed" ? "1" : "0"}>
            <span className="gd-ultime-halo" aria-hidden="true" />
            <p className="gd-ultime-tete">
              <span className="gd-ultime-languette">
                <Sparkle size={10} aria-hidden="true" />
                {t("goals.detail.ultimate", "Étape ultime")}
              </span>
              <span className="gd-ultime-mention">
                {ultime.status === "completed"
                  ? t("goals.detail.zenithReached", "Zénith atteint")
                  : t("goals.detail.ultimateHint", "hors avancement")}
              </span>
            </p>
            {ligne(ultime, null)}
          </div>
        )}

        {etapes.length === 0 && (
          <p className="gd-vide">{t("goals.detail.noSteps", "Aucune étape")}</p>
        )}
      </div>
    </section>
  );
});

/* ── Le registre ────────────────────────────────────────────────── */

export const DossierRegistre = React.memo(function DossierRegistre({
  postes, etapes, teinte, devise, coutEstime, objectifTermine, onAcquerir,
}: {
  postes: PosteDossier[];
  etapes: EtapeDossier[];
  teinte: string;
  devise: string;
  coutEstime: number;
  /** Un objectif termine a tout paye, pieces cochees ou non. */
  objectifTermine?: boolean;
  /** Marquer une piece achetee, sans toucher a son etape. */
  onAcquerir?: (id: string, acquis: boolean) => void;
}) {
  const { t } = useTranslation();

  const rangParEtape = React.useMemo(() => {
    const m = new Map<string, number>();
    etapes.forEach((e, i) => m.set(e.id, i + 1));
    return m;
  }, [etapes]);

  /* Une piece est payee de deux facons, et les deux comptent : son
     etape a ete validee, ou elle a ete achetee pour elle-meme.

     ACHETER N EST PAS FAIRE. On achete l epilateur avant de
     commencer a s epiler ; le materiel de tir avant le premier tir.
     Lier l achat a la validation de l etape obligeait a declarer
     faite une etape qui ne l est pas — une donnee fausse pour en
     corriger une autre. */
  const payeParEtape = React.useCallback((p: PosteDossier) => (
    Boolean(p.step_id) && etapes.some((e) => e.id === p.step_id && e.status === "completed")
  ), [etapes]);

  /* MESURE : deux pieces de l objectif « Vendre » — 250 € — etaient
     comptees non financees alors que l objectif est termine. Elles
     n ont pas d etape, donc le declencheur d etape ne pouvait rien,
     et la synchronisation n avait marque que les lignes de wishlist.
     Le compte du pacte, lui, tombait juste : il compte un objectif
     termine EN ENTIER par un autre chemin. C etait donc la lecture
     de cette fiche qui mentait, pas la donnee — et le correctif est
     en lecture, sans toucher a une seule ligne. */
  const estFinance = React.useCallback(
    (p: PosteDossier) => Boolean(objectifTermine) || Boolean(p.acquired_at) || payeParEtape(p),
    [payeParEtape, objectifTermine],
  );

  const total = coutEstime > 0
    ? coutEstime
    : postes.reduce((s, p) => s + Number(p.price || 0), 0);
  const finance = postes.filter(estFinance).reduce((s, p) => s + Number(p.price || 0), 0);
  const restant = Math.max(0, total - finance);

  return (
    <section className="gd-volet">
      <header className="gd-tete">
        {t("goals.detail.ledger", "Registre")}
        <b>{postes.length} {t("goals.detail.items", "postes")}</b>
      </header>
      <div className="gd-liste">
        {postes.map((p) => {
          const rang = p.step_id ? rangParEtape.get(p.step_id) : undefined;
          return (
            <div
              key={p.id}
              className="gd-poste"
              data-finance={estFinance(p) ? "1" : "0"}
              style={{ ["--t" as string]: teinte }}
            >
              <span className={`gd-ref${rang ? "" : " gd-ref--libre"}`}>
                {rang ? `#${deuxChiffres(rang)}` : "—"}
              </span>
              <span className="gd-poste-corps">
                <span className="gd-poste-nom" title={p.name}>{p.name}</span>
                {p.category && (
                  <span className="gd-poste-cat">{getCostCategoryLabel(p.category, t)}</span>
                )}
              </span>
              <span className="gd-prix">{formatCurrency(Number(p.price || 0), devise)}</span>
              {onAcquerir && (
                /* Une etape validee a deja paye sa piece : la case le
                   montre et se verrouille, plutot que d offrir un
                   geste qui contredirait l etape. */
                <button
                  type="button"
                  className="gd-case"
                  aria-pressed={estFinance(p)}
                  disabled={payeParEtape(p) || Boolean(objectifTermine)}
                  title={objectifTermine
                    ? t("goals.detail.paidByGoal", "Payé — l’objectif est terminé")
                    : payeParEtape(p)
                    ? t("goals.detail.paidByStep", "Payé par la validation de l’étape")
                    : p.acquired_at
                      ? t("goals.detail.unbuy", "Marquer non acheté")
                      : t("goals.detail.buy", "Marquer acheté")}
                  onClick={() => onAcquerir(p.id, !p.acquired_at)}
                >
                  {estFinance(p) && <Check className="gd-case-coche" aria-hidden="true" />}
                </button>
              )}
            </div>
          );
        })}
        {postes.length === 0 && (
          <p className="gd-vide">{t("goals.detail.noItems", "Aucun poste de coût")}</p>
        )}
      </div>
      <div className="gd-somme">
        <div><span>{t("goals.detail.total", "Total")}</span><b>{formatCurrency(total, devise)}</b></div>
        <div><span>{t("goals.detail.financed", "Financé")}</span><b className="est-verte">{formatCurrency(finance, devise)}</b></div>
        <div><span>{t("goals.detail.remaining", "Restant")}</span><b className="est-or">{formatCurrency(restant, devise)}</b></div>
      </div>
    </section>
  );
});

/* ── L habitude ─────────────────────────────────────────────────── */

export const DossierHabitude = React.memo(function DossierHabitude({
  coches, duree, teinte, onBasculer,
}: {
  coches: boolean[];
  duree: number;
  teinte: string;
  /* L element touche remonte avec l index : c est de lui que part
     l eclat, plutot que du centre de la fenetre. */
  onBasculer: (index: number, depuis?: Element | null) => void;
}) {
  const { t } = useTranslation();
  const tenus = coches.filter(Boolean).length;

  return (
    <section className="gd-volet">
      <header className="gd-tete">
        {t("goals.detail.habit", "Jours tenus")}
        <b>{tenus}/{duree}</b>
      </header>
      <div className="gd-liste">
        <div className="gd-jours">
          {coches.map((tenu, i) => (
            <button
              key={i}
              type="button"
              className="gd-jour"
              data-tenu={tenu ? "1" : "0"}
              style={{ ["--t" as string]: teinte }}
              onClick={(e) => onBasculer(i, e.currentTarget)}
              aria-pressed={tenu}
              aria-label={`${t("goals.detail.day", "Jour")} ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
});

export const DossierCourbe = React.memo(function DossierCourbe({
  coches, depuis,
}: {
  coches: boolean[];
  depuis?: string;
}) {
  const { t } = useTranslation();

  const donnees = React.useMemo(() => {
    const m = new Map<string, { count: number; completed: boolean }>();
    if (!depuis) return m;
    coches.forEach((tenu, i) => {
      if (!tenu) return;
      const d = new Date(depuis);
      d.setDate(d.getDate() + i);
      m.set(d.toISOString().split("T")[0], { count: 1, completed: true });
    });
    return m;
  }, [coches, depuis]);

  return (
    <section className="gd-volet">
      <header className="gd-tete">{t("goals.detail.rhythm", "Rythme")}</header>
      <div style={{ padding: 12 }}><HabitHeatmap data={donnees} /></div>
    </section>
  );
});

/* ── Les membres d un groupe ────────────────────────────────────── */

/* Trois facons de lire un groupe, dans cet ordre : celui qu on a
   choisi en le composant, les plus avances d abord, les plus en
   retard d abord. Le bouton passe de l une a l autre. */
/* Reexportes : les appelants importaient ces formes depuis ce fichier. */
export { DossierMembres } from "@/domaines/objectifs/composants/detail/dossier/DossierMembres";
export type { MembreDossier } from "@/domaines/objectifs/composants/detail/dossier/DossierMembres";
