import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useCurrentWeekReview, useWeeklyReviews, useGenerateWeeklyReview,
  useSaveWeeklyReflection, type WeeklyReview,
} from "@/hooks/useWeeklyReview";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/socle/ui/dialog";
import { Sparkles, Loader2, Check, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════════
   LA REVUE HEBDOMADAIRE

   CE QU'ELLE ÉTAIT : six tuiles de chiffres, une note en étoiles, un
   champ libre intitulé « Your reflection ». Relevé sur les quatre
   revues enregistrées en quatre mois — la note est nulle QUATRE FOIS
   et la réflexion nulle QUATRE FOIS. Les deux seules parties où l'on
   demandait quelque chose n'ont jamais servi une seule fois.

   Ce n'était pas un problème d'habillage. Une revue qui s'ouvre sur un
   tableau de bord met en position de lecteur, pas d'auteur ; et une
   case blanche ne pose aucune question à laquelle on ait envie de
   répondre. Quatre revues en quatre mois là où il en faudrait
   dix-sept : le rituel ne prenait pas.

   CE QU'ELLE EST : trois temps, une question par écran.
     1. La semaine RACONTÉE en trois lignes, avec la comparaison dans
        la phrase, puis UNE question choisie selon ce que la semaine
        montre. Une semaine creuse — le cas le plus fréquent — ne
        demande pas la même chose qu'une semaine pleine.
     2. La note, en CINQ MOTS et non cinq étoiles. « Trois étoiles » ne
        se relit pas une semaine plus tard ; « lente » si. Et M.I.A
        peut s'en servir, ce qu'un entier ne permet pas.
     3. UNE INTENTION pour la semaine suivante — la seule chose qu'une
        revue lègue à la suivante, et ce qui la transforme en série.

   Les chiffres arrivent EN DERNIER, une fois qu'on a répondu. On ne
   demande pas à quelqu'un de juger sa semaine après lui avoir montré
   six zéros.

   LE SOLDE FINANCIER A ÉTÉ RETIRÉ DES MESURES DE LA SEMAINE. Il est
   calculé à partir des revenus et dépenses RÉCURRENTS, c'est-à-dire
   un solde MENSUEL : il ne bouge pas d'une semaine à l'autre. Il n'y a
   aucune table de mouvements datés dans l'application, donc aucun
   solde hebdomadaire à calculer. Une constante présentée comme un
   résultat de la semaine ne dit rien — et pire, elle ment.
   ═══════════════════════════════════════════════════════════════ */

const MOTS = ["vide", "lente", "correcte", "bonne", "pleine"] as const;
const SIGNES = ["◦", "◔", "◑", "◕", "●"];

interface Props {
  open: boolean;
  onClose: () => void;
}

type Temps = 1 | 2 | 3 | "bilan";

export function WeeklyReviewModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  const { data: revue } = useCurrentWeekReview();
  const { data: historique = [] } = useWeeklyReviews();
  const engendrer = useGenerateWeeklyReview();
  const enregistrer = useSaveWeeklyReflection();

  const [temps, setTemps] = useState<Temps>(1);
  const [note, setNote] = useState("");
  const [motif, setMotif] = useState<number | null>(null);
  const [intention, setIntention] = useState("");

  /* L'ÉTAT SUIT LA REQUÊTE, IL NE LA DEVANCE PAS. La version
     précédente initialisait ces champs avec « useState(revue?.… ) » :
     au premier rendu la requête n'a pas répondu, la valeur lue était
     donc toujours vide, et une réflexion déjà écrite ne se rechargeait
     jamais.

     MAIS IL NE LA SUIT QU'UNE FOIS. React Query recharge au retour de
     focus : sans ce garde, aller chercher un mot dans un autre onglet
     et revenir écraserait la phrase en cours d'écriture par ce que le
     serveur porte encore. On recopie donc à l'ouverture de la revue,
     et plus jamais ensuite — sauf si c'est une autre semaine. */
  const remplie = useRef<string | null>(null);
  useEffect(() => {
    if (!revue?.id || remplie.current === revue.id) return;
    remplie.current = revue.id;
    setNote(revue.reflection_note ?? "");
    setMotif(revue.week_rating ?? null);
    setIntention(revue.next_intention ?? "");
  }, [revue?.id, revue?.reflection_note, revue?.week_rating, revue?.next_intention]);

  useEffect(() => { if (open) setTemps(1); }, [open]);

  /* La semaine d'avant, pour la comparaison et pour rappeler ce qu'on
     s'était promis. L'historique est déjà chargé — pas de requête. */
  const precedente = useMemo<WeeklyReview | undefined>(
    () => historique.find((r) => r.id !== revue?.id && r.week_start < (revue?.week_start ?? "9999")),
    [historique, revue?.id, revue?.week_start],
  );

  const n = (v: number | null | undefined) => v ?? 0;
  const etapes = n(revue?.steps_completed);
  const objectifs = n(revue?.goals_progressed);
  const journal = n(revue?.journal_entries_count);
  const taches = n(revue?.todo_completed);
  const total = etapes + journal + taches;
  const totalAvant = n(precedente?.steps_completed) + n(precedente?.journal_entries_count) + n(precedente?.todo_completed);

  const joursRestants = useMemo(() => {
    if (!revue?.week_end) return 0;
    const fin = new Date(revue.week_end + "T23:59:59");
    return Math.max(0, Math.ceil((fin.getTime() - Date.now()) / 86_400_000));
  }, [revue?.week_end]);

  /* ── LA QUESTION SUIT LA SEMAINE ──────────────────────────────
     Un champ blanc sans question ne se remplit pas : quatre revues
     vides le prouvent. Celle-ci change selon ce que la semaine
     montre — c'est tout l'écart entre « raconte-nous » et une vraie
     question. */
  const question = total === 0
    ? t("weekly.q.vide", "Qu'est-ce qui a pris la place ?")
    : totalAvant > 0 && total < totalAvant
      ? t("weekly.q.baisse", "Qu'est-ce qui a ralenti cette semaine ?")
      : total > totalAvant
        ? t("weekly.q.hausse", "Qu'est-ce que tu recommencerais la semaine prochaine ?")
        : t("weekly.q.stable", "Qu'est-ce qui mérite d'être noté, cette semaine ?");

  const sauver = (champs: Parameters<typeof enregistrer.mutate>[0]) => {
    if (!revue?.id) return;
    enregistrer.mutate(champs);
  };

  const suivant = () => {
    if (!revue?.id) { setTemps((v) => (v === 3 ? "bilan" : ((v as number) + 1) as Temps)); return; }
    if (temps === 1) { sauver({ reviewId: revue.id, reflection_note: note.trim() || null }); setTemps(2); return; }
    if (temps === 2) { sauver({ reviewId: revue.id, week_rating: motif }); setTemps(3); return; }
    if (temps === 3) {
      sauver({ reviewId: revue.id, next_intention: intention.trim() || null });
      toast.success(t("weekly.garde", "Ta semaine est gardée."));
      setTemps("bilan");
    }
  };

  const engendrerLaRevue = async () => {
    try {
      await engendrer.mutateAsync();
      toast.success(t("weekly.releve", "Les chiffres de la semaine sont relevés."));
    } catch (e) {
      toast.error(t("weekly.echec", "Le relevé a échoué."), {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const dates = revue
    ? `${jour(revue.week_start)} – ${jour(revue.week_end)}`
    : t("weekly.enCours", "Semaine en cours");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rv" aria-describedby={undefined}>
        <DialogHeader className="rv-tete">
          <p className="rv-sur">{dates}</p>
          <DialogTitle className="rv-titre">
            {temps === "bilan"
              ? t("weekly.titre.bilan", "Ta semaine, relevée")
              : t("weekly.titre.rituel", "Ta semaine en trois temps")}
          </DialogTitle>
        </DialogHeader>

        {!revue ? (
          /* ── PAS ENCORE DE RELEVÉ ─────────────────────────────
             On ne montre pas un rituel qui n'a rien à raconter : on
             propose d'abord d'aller chercher les chiffres. */
          <div className="rv-corps">
            <p className="rv-vide">
              {t("weekly.pasEncore", "Les chiffres de cette semaine n'ont pas encore été relevés.")}
            </p>
            <button type="button" className="rv-bouton" onClick={engendrerLaRevue} disabled={engendrer.isPending}>
              {engendrer.isPending ? <Loader2 className="rv-tourne" aria-hidden /> : <Sparkles aria-hidden />}
              {t("weekly.relever", "Relever la semaine")}
            </button>
          </div>
        ) : temps === "bilan" ? (
          <div className="rv-corps">
            <div className="rv-mesures">
              <Mesure valeur={etapes} mot={t("weekly.m.etapes", "étapes validées")} avant={n(precedente?.steps_completed)} />
              <Mesure valeur={objectifs} mot={t("weekly.m.objectifs", "objectifs touchés")} avant={n(precedente?.goals_progressed)} />
              <Mesure valeur={journal} mot={t("weekly.m.journal", "entrées de journal")} avant={n(precedente?.journal_entries_count)} />
              <Mesure valeur={taches} mot={t("weekly.m.taches", "tâches cochées")} avant={n(precedente?.todo_completed)} />
            </div>

            {motif && (
              <p className="rv-verdict">
                {t("weekly.verdict", "Semaine")} <b>{t(`weekly.mot.${MOTS[motif - 1]}`, MOTS[motif - 1])}</b>
              </p>
            )}

            {intention.trim() && (
              <p className="rv-promesse">
                <Quote aria-hidden />
                {intention.trim()}
              </p>
            )}

            {revue.ai_insights && (
              <div className="rv-mia">
                <p className="rv-mia-nom">{t("weekly.mia", "Ce que M.I.A en retient")}</p>
                <p className="rv-mia-mot">{revue.ai_insights}</p>
              </div>
            )}

            <div className="rv-pied">
              <button type="button" className="rv-bouton rv-bouton--fantome" onClick={() => setTemps(1)}>
                <ChevronLeft aria-hidden />
                {t("weekly.reprendre", "Reprendre")}
              </button>
              <button type="button" className="rv-bouton rv-bouton--fantome" onClick={engendrerLaRevue} disabled={engendrer.isPending}>
                {engendrer.isPending ? <Loader2 className="rv-tourne" aria-hidden /> : <Sparkles aria-hidden />}
                {t("weekly.reprendreChiffres", "Refaire le relevé")}
              </button>
              <button type="button" className="rv-bouton" onClick={onClose}>
                <Check aria-hidden />
                {t("common.close", "Fermer")}
              </button>
            </div>
          </div>
        ) : (
          <div className="rv-corps">
            <div className="rv-pas" aria-hidden>
              <i data-fait={temps >= 1 ? "oui" : "non"} />
              <i data-fait={temps >= 2 ? "oui" : "non"} />
              <i data-fait={temps >= 3 ? "oui" : "non"} />
            </div>

            {temps === 1 && (
              <>
                <p className="rv-lettre">
                  <Lettre
                    etapes={etapes} objectifs={objectifs} journal={journal} taches={taches}
                    totalAvant={totalAvant} joursRestants={joursRestants} t={t}
                  />
                </p>
                <p className="rv-question">{question}</p>
                <textarea
                  className="rv-champ"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("weekly.deuxLignes", "Deux lignes suffisent.")}
                  aria-label={question}
                />
              </>
            )}

            {temps === 2 && (
              <>
                <p className="rv-question">{t("weekly.q.note", "Cette semaine, tu dirais quoi ?")}</p>
                <p className="rv-aide">
                  {t("weekly.aideNote", "Un mot suffit. Personne ne le lira à part toi et M.I.A.")}
                </p>
                <div className="rv-choix" role="group" aria-label={t("weekly.q.note", "Cette semaine, tu dirais quoi ?")}>
                  {MOTS.map((m, i) => (
                    <button
                      key={m}
                      type="button"
                      className="rv-choix-un"
                      aria-pressed={motif === i + 1}
                      onClick={() => setMotif(i + 1)}
                    >
                      <b aria-hidden>{SIGNES[i]}</b>
                      <span>{t(`weekly.mot.${m}`, m)}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {temps === 3 && (
              <>
                {precedente?.next_intention && (
                  <p className="rv-rappel">
                    <Quote aria-hidden />
                    {t("weekly.rappel", "La semaine dernière, tu t'étais promis :")}{" "}
                    <b>{precedente.next_intention}</b>
                  </p>
                )}
                <p className="rv-question">{t("weekly.q.intention", "Une chose, pour la semaine qui vient.")}</p>
                <p className="rv-aide">
                  {t("weekly.aideIntention", "La revue de dimanche prochain te la rappellera.")}
                </p>
                <textarea
                  className="rv-champ"
                  value={intention}
                  onChange={(e) => setIntention(e.target.value)}
                  placeholder={t("weekly.uneChose", "Une seule. Celle qui compte.")}
                  aria-label={t("weekly.q.intention", "Une chose, pour la semaine qui vient.")}
                />
              </>
            )}

            <div className="rv-pied">
              {temps > 1 && (
                <button type="button" className="rv-bouton rv-bouton--fantome" onClick={() => setTemps(((temps as number) - 1) as Temps)}>
                  <ChevronLeft aria-hidden />
                  {t("common.back", "Retour")}
                </button>
              )}
              {/* ON PEUT PASSER. Un rituel qu'on ne peut pas quitter
                  est un formulaire, et un formulaire, on le fuit. */}
              <button type="button" className="rv-bouton rv-bouton--fantome" onClick={() => setTemps(temps === 3 ? "bilan" : (((temps as number) + 1) as Temps))}>
                {t("weekly.passer", "Passer")}
              </button>
              <button type="button" className="rv-bouton" onClick={suivant} disabled={enregistrer.isPending}>
                {temps === 3 ? t("weekly.garder", "Garder") : t("common.next", "Suivant")}
                {temps === 3 ? <Check aria-hidden /> : <ChevronRight aria-hidden />}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── LA SEMAINE, RACONTÉE ───────────────────────────────────────
   Trois lignes plutôt que six tuiles. Le cas qui revient le plus est
   la semaine creuse : c'est celui qu'un tableau de zéros rend
   déprimant, et celui qu'une phrase peut porter. */
function Lettre({
  etapes, objectifs, journal, taches, totalAvant, joursRestants, t,
}: {
  etapes: number; objectifs: number; journal: number; taches: number;
  totalAvant: number; joursRestants: number;
  t: (cle: string, repli: string, opts?: Record<string, unknown>) => string;
}) {
  const total = etapes + journal + taches;
  const morceaux: string[] = [];
  if (etapes > 0) {
    morceaux.push(objectifs > 1
      ? t("weekly.l.etapesN", "{{n}} étapes validées sur {{o}} objectifs", { n: etapes, o: objectifs })
      : t("weekly.l.etapes1", "{{n}} étape validée", { n: etapes }));
  }
  if (journal > 0) morceaux.push(t("weekly.l.journal", "{{count}} entrée de journal", { count: journal }));
  if (taches > 0) morceaux.push(t("weekly.l.taches", "{{count}} tâche cochée", { count: taches }));

  return (
    <>
      {total === 0 ? (
        <span className="rv-rien">
          {t("weekly.l.rien", "Cette semaine, aucune étape validée, aucune entrée de journal, aucune tâche cochée.")}
        </span>
      ) : (
        <>
          {t("weekly.l.debut", "Cette semaine :")} <b>{morceaux.join(", ")}</b>.
        </>
      )}
      {" "}
      {totalAvant > 0 && (
        <>
          {t("weekly.l.avant", "La semaine d'avant en comptait {{n}}.", { n: totalAvant })}{" "}
        </>
      )}
      {joursRestants > 0 && (
        <b className="rv-reste">
          {t("weekly.l.reste", "Il te reste {{count}} jours.", { count: joursRestants })}
        </b>
      )}
    </>
  );
}

function Mesure({ valeur, mot, avant }: { valeur: number; mot: string; avant: number }) {
  const ecart = valeur - avant;
  return (
    <div className="rv-mesure">
      <b>{valeur}</b>
      <span>{mot}</span>
      {avant > 0 || valeur > 0 ? (
        <i data-sens={ecart > 0 ? "haut" : ecart < 0 ? "bas" : "plat"}>
          {ecart > 0 ? `+${ecart}` : ecart < 0 ? `${ecart}` : "="}
        </i>
      ) : null}
    </div>
  );
}

function jour(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
