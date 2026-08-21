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
import { Check, MessageSquare, ListOrdered, ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { getCostCategoryLabel } from "@/lib/goalConstants";
import { HabitHeatmap } from "@/components/habits/HabitHeatmap";
import { BoutonHonneur } from "./BoutonHonneur";

const deuxChiffres = (n: number) => String(n).padStart(2, "0");

export interface EtapeDossier {
  id: string;
  title: string;
  order: number;
  status: string;
  notes?: string | null;
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
  const faites = etapes.filter((e) => e.status === "completed").length;

  return (
    <section className="gd-volet">
      <header className="gd-tete">
        {t("goals.detail.steps", "Étapes")}
        <b>{faites}/{etapes.length}</b>
      </header>
      <div className="gd-liste">
        {etapes.map((e, i) => {
          const faite = e.status === "completed";
          const cout = coutParEtape.get(e.id);
          return (
            <div
              key={e.id}
              className="gd-etape"
              data-faite={faite ? "1" : "0"}
              style={{ ["--t" as string]: teinte }}
            >
              <span className="gd-num">{deuxChiffres(i + 1)}</span>
              {/* Cocher une etape et l ouvrir sont deux gestes
                  distincts : deux boutons, pas une ligne cliquable
                  avec une zone morte au milieu. */}
              <button
                type="button"
                className="gd-case"
                onClick={() => onBasculer(e.id, e.status)}
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
        })}
        {etapes.length === 0 && (
          <p className="gd-vide">{t("goals.detail.noSteps", "Aucune étape")}</p>
        )}
      </div>
    </section>
  );
});

/* ── Le registre ────────────────────────────────────────────────── */

export const DossierRegistre = React.memo(function DossierRegistre({
  postes, etapes, teinte, devise, coutEstime,
}: {
  postes: PosteDossier[];
  etapes: EtapeDossier[];
  teinte: string;
  devise: string;
  coutEstime: number;
}) {
  const { t } = useTranslation();

  const rangParEtape = React.useMemo(() => {
    const m = new Map<string, number>();
    etapes.forEach((e, i) => m.set(e.id, i + 1));
    return m;
  }, [etapes]);

  /* Un poste est finance de deux facons, et les deux comptent : son
     etape est validee — c est ce que la fiche mesurait deja — ou la
     piece a ete acquise depuis l arbitrage de la page Finance. */
  const estFinance = React.useCallback((p: PosteDossier) => {
    if (p.acquired_at) return true;
    if (!p.step_id) return false;
    return etapes.some((e) => e.id === p.step_id && e.status === "completed");
  }, [etapes]);

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
  onBasculer: (index: number) => void;
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
              onClick={() => onBasculer(i)}
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

export interface MembreDossier {
  id: string;
  name: string;
  difficulty: string;
  status: string;
  progress: number;
  isCompleted: boolean;
  isMissing?: boolean;
}

/* Trois facons de lire un groupe, dans cet ordre : celui qu on a
   choisi en le composant, les plus avances d abord, les plus en
   retard d abord. Le bouton passe de l une a l autre. */
const TRIS = ["ordre", "avance", "retard"] as const;
type Tri = (typeof TRIS)[number];
const CLE_TRI = "vowpact.groupe.tri";

const ICONE_TRI = {
  ordre: ListOrdered,
  avance: ArrowDownWideNarrow,
  retard: ArrowUpNarrowWide,
} as const;

export const DossierMembres = React.memo(function DossierMembres({
  membres, teintePar, dynamique, onOuvrir, auSeuil, onHonorer, onEclat,
}: {
  membres: MembreDossier[];
  teintePar: (difficulte: string) => string;
  dynamique: boolean;
  onOuvrir: (id: string) => void;
  /** Tous les membres sont franchis, le groupe n est pas encore honore. */
  auSeuil: boolean;
  onHonorer: () => void;
  onEclat?: (x: number, y: number, couleur: string) => void;
}) {
  const { t } = useTranslation();
  const franchis = membres.filter((m) => m.isCompleted).length;

  /* Le choix se garde d un groupe a l autre et d une session a la
     suivante : qui lit ses groupes par avancement les lit tous ainsi. */
  const [tri, setTri] = React.useState<Tri>(() => {
    const garde = typeof localStorage !== "undefined" ? localStorage.getItem(CLE_TRI) : null;
    return (TRIS as readonly string[]).includes(garde ?? "") ? (garde as Tri) : "ordre";
  });

  const changerTri = () => {
    const suivant = TRIS[(TRIS.indexOf(tri) + 1) % TRIS.length];
    setTri(suivant);
    try { localStorage.setItem(CLE_TRI, suivant); } catch { /* mode prive */ }
  };

  const ordonnes = React.useMemo(() => {
    if (tri === "ordre") return membres;
    /* Le tri de JavaScript est stable : a avancement egal, les membres
       gardent l ordre du groupe. Un objectif introuvable n a pas
       d avancement — il finit en bas, dans les deux sens. */
    const rang = (m: MembreDossier) => (m.isMissing ? -1 : m.progress);
    return [...membres].sort((a, b) => {
      if (a.isMissing !== b.isMissing) return a.isMissing ? 1 : -1;
      return tri === "avance" ? rang(b) - rang(a) : rang(a) - rang(b);
    });
  }, [membres, tri]);

  const IconeTri = ICONE_TRI[tri];
  const nomTri = tri === "ordre"
    ? t("goals.detail.sortOrder", "Ordre")
    : t("goals.detail.sortProgress", "Avancement");

  return (
    <section className="gd-volet">
      <header className="gd-tete">
        {dynamique
          ? t("goals.detail.dynamicGroup", "Groupe dynamique")
          : t("goals.detail.group", "Groupe")}
        <span className="gd-tete-fin">
          <b>{franchis}/{membres.length}</b>
          {membres.length > 1 && (
            <button
              type="button"
              className="gd-tete-bouton gd-tri"
              onClick={changerTri}
              title={t("goals.detail.sortHint", "Changer l'ordre d'affichage")}
              aria-label={`${t("goals.detail.sortHint", "Changer l'ordre d'affichage")} — ${nomTri}`}
            >
              <IconeTri size={11} aria-hidden="true" />
              {nomTri}
            </button>
          )}
        </span>
      </header>
      <div className="gd-liste">
        {ordonnes.map((m, i) => {
          const t2 = teintePar(m.difficulty);
          const cellules = 10;
          const pleines = Math.round((m.progress / 100) * cellules);
          return (
            <button
              key={m.id}
              type="button"
              className="gd-membre"
              style={{ ["--t" as string]: t2 }}
              onClick={() => onOuvrir(m.id)}
              disabled={m.isMissing}
            >
              <span className="gd-num">{deuxChiffres(i + 1)}</span>
              <span className="gd-membre-nom" title={m.name}>
                {m.isMissing ? t("goals.detail.missingGoal", "Objectif introuvable") : m.name}
              </span>
              <span className="gd-membre-jauge" aria-hidden="true">
                {Array.from({ length: cellules }, (_, k) => (
                  <u key={k} className={k < pleines ? "on" : ""} />
                ))}
              </span>
              <span className="gd-membre-pct">{m.progress}%</span>
            </button>
          );
        })}
        {membres.length === 0 && (
          <p className="gd-vide">{t("goals.detail.noMembers", "Aucun membre")}</p>
        )}
      </div>
      {auSeuil && (
        <BoutonHonneur total={membres.length} onHonorer={onHonorer} onEclat={onEclat} />
      )}
    </section>
  );
});
