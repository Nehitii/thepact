import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { Search, Plus, Sun, Moon, MonitorSmartphone, Info, RotateCcw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/socle/ui/popover";
import { useAuth } from "@/socle/contextes/AuthContext";
import { useJournalEntries, useDeleteJournalEntry, useJournalCounts } from "@/domaines/journal/hooks/useJournal";
import type { JournalEntry } from "@/domaines/journal/types";
import { MOOD_OPTIONS } from "@/domaines/journal/types";
import { JournalEntryCard } from "@/domaines/journal/composants/JournalEntryCard";
import { JournalNewEntryModal } from "@/domaines/journal/composants/JournalNewEntryModal";
import { DailyPromptBanner } from "@/domaines/journal/composants/DailyPromptBanner";
import { useQuestionCongediee } from "@/domaines/journal/hooks/useQuestionCongediee";
import { DSPageShell } from "@/socle/ds";
import { cn } from "@/socle/outils/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/socle/ui/alert-dialog";
import { PREF } from "@/socle/outils/preferencesAffichage";

/* LOG.01 — LE DOSSIER
 *
 * Le journal etait un panneau neon parmi d autres. Il devient une piece
 * d archive : papier casse, encre noire, un seul rouge — celui du sceau.
 * Chaque entree est un document, avec sa cote a gauche, sa bande
 * d humeur estampee et son texte a soixante-six caracteres.
 *
 * Le theme suit celui de l application, et la page peut le forcer : on
 * n ecrit pas dans la meme lumiere le matin et le soir. Le choix local
 * est garde, et « Auto » rend la main a l application.
 */

type Lumiere = "auto" | "clair" | "sombre";

function lumiereInitiale(): Lumiere {
  try {
    const v = localStorage.getItem(PREF.JOURNAL_LUMIERE) as Lumiere | null;
    if (v === "clair" || v === "sombre" || v === "auto") return v;
  } catch { /* stockage indisponible */ }
  return "auto";
}

export default function Journal() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();

  const [lumiere, setLumiere] = useState<Lumiere>(lumiereInitiale);
  useEffect(() => {
    try { localStorage.setItem(PREF.JOURNAL_LUMIERE, lumiere); } catch { /* sans consequence */ }
  }, [lumiere]);
  const theme = lumiere === "auto" ? (resolvedTheme === "light" ? "clair" : "sombre") : lumiere;

  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);

  const [questionCongediee, reglerQuestion] = useQuestionCongediee();
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rechercheEnvoyee, setRechercheEnvoyee] = useState("");
  const [filterMood, setFilterMood] = useState<string | null>(null);
  const [epinglees, setEpinglees] = useState(false);
  const [amorce, setAmorce] = useState("");

  /* On ne part pas en base a chaque frappe. */
  useEffect(() => {
    const id = setTimeout(() => setRechercheEnvoyee(search.trim()), 320);
    return () => clearTimeout(id);
  }, [search]);

  const filtre = useMemo(
    () => ({ recherche: rechercheEnvoyee, humeur: filterMood, epinglees }),
    [rechercheEnvoyee, filterMood, epinglees],
  );

  const { data, isLoading, isFetching, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useJournalEntries(user?.id, filtre);
  const { data: comptes } = useJournalCounts(user?.id);
  const deleteEntry = useDeleteJournalEntry();

  const entries = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const filtreActif = !!rechercheEnvoyee || !!filterMood || epinglees;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !hasNextPage) return;
      observerRef.current = new IntersectionObserver(
        (es) => { if (es[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage(); },
        { threshold: 0.1 },
      );
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );
  useEffect(() => () => observerRef.current?.disconnect(), []);

  const handleEdit = (entry: JournalEntry) => { setEditingEntry(entry); setAmorce(""); setIsNewEntryOpen(true); };
  const handleDelete = async () => {
    if (!deletingEntryId || !user) return;
    try { await deleteEntry.mutateAsync({ id: deletingEntryId, userId: user.id }); }
    catch { /* le toast d erreur est porte par la mutation */ }
    setDeletingEntryId(null);
  };
  const handleCloseModal = (open: boolean) => {
    setIsNewEntryOpen(open);
    if (!open) { setEditingEntry(null); setAmorce(""); }
  };

  const LUMIERES: { id: Lumiere; icone: typeof Sun; cle: string }[] = [
    { id: "auto", icone: MonitorSmartphone, cle: "journal.theme.auto" },
    { id: "clair", icone: Sun, cle: "journal.theme.light" },
    { id: "sombre", icone: Moon, cle: "journal.theme.dark" },
  ];

  if (!user) {
    return (
      <DSPageShell width="lg">
        <div className="jr-etat">{t("journal.loading")}</div>
      </DSPageShell>
    );
  }

  return (
    <DSPageShell width="lg" padding="tight">
      <div className="jr" data-jr={theme} data-humeur={filterMood ?? undefined}>
        {/* La tranche : ce qu on lit sur le dos d un dossier range */}
        <div className="jr-marge" aria-hidden="true">
          <span className="jr-kana">{t("journal.spine")}</span>
          <span className="jr-sceau">秘</span>
          {filterMood && (
            <span className="jr-sceau-nom">{t(`journal.moods.${filterMood}`)}</span>
          )}
          <span className="jr-kana">LOG.01</span>
        </div>

        <div className="jr-corps">
          <header className="jr-tete">
            <h1>{t("journal.title")}</h1>
            <p className="jr-dossier">
              {t("journal.dossier")} <b>{t("journal.pieces", { count: comptes?.total ?? 0 })}</b>
            </p>

            <div className="jr-outils">
              <label className="jr-champ">
                <Search className="w-3.5 h-3.5" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label={t("journal.searchLabel")}
                  placeholder={t("journal.searchPlaceholder")}
                />
              </label>

              <div className="jr-bascule" role="group" aria-label={t("journal.theme.label")}>
                {LUMIERES.map(({ id, icone: Icone, cle }) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={lumiere === id}
                    onClick={() => setLumiere(id)}
                    aria-label={t(cle)}
                    title={t(cle)}
                  >
                    <Icone className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="jr-bouton"
                onClick={() => { setEditingEntry(null); setAmorce(""); setIsNewEntryOpen(true); }}
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                {t("journal.write")}
              </button>
            </div>
          </header>

          <div className="jr-filtres" role="group" aria-label={t("journal.filterLabel")}>
            <button
              type="button"
              className="jr-filtre"
              aria-pressed={!filterMood && !epinglees}
              onClick={() => { setFilterMood(null); setEpinglees(false); }}
            >
              {t("journal.filters.all")} <b>{comptes?.total ?? 0}</b>
            </button>
            <button
              type="button"
              className="jr-filtre"
              aria-pressed={epinglees}
              onClick={() => { setEpinglees((v) => !v); setFilterMood(null); }}
            >
              {t("journal.badges.pinned")} <b>{comptes?.epinglees ?? 0}</b>
            </button>
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.id}
                type="button"
                className="jr-filtre"
                aria-pressed={filterMood === m.id}
                onClick={() => { setFilterMood(filterMood === m.id ? null : m.id); setEpinglees(false); }}
              >
                {t(`journal.moods.${m.id}`)}
              </button>
            ))}

            {/* Un dossier a toujours sa legende. */}
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="jr-legende-ouvrir" aria-label={t("journal.legend.open")}>
                  <Info className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">{t("journal.legend.short")}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="jr-legende" data-jr={theme}>
                <p className="jr-legende-tete"><b>LOG.01</b>{t("journal.legend.title")}</p>
                <div className="jr-legende-corps">
                  {MOOD_OPTIONS.map((m) => (
                    <div
                      key={m.id}
                      className="jr-legende-ligne"
                      style={{ ["--jr-etat" as string]: `var(--jr-etat-${m.id})` } as React.CSSProperties}
                    >
                      <span className="jr-legende-sym" aria-hidden="true">{m.sym}</span>
                      <span>
                        <b className="jr-legende-nom">{t(`journal.moods.${m.id}`)}</b>
                        <span className="jr-legende-def">{t(`journal.moodsDesc.${m.id}`)}</span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Les deux mesures portees au pied de chaque piece :
                    elles etaient demandees a l ecriture sans qu on
                    dise jamais ce qu elles pesent. */}
                <p className="jr-legende-tete jr-legende-tete-2">
                  <b>02</b>{t("journal.legend.measures")}
                </p>
                <div className="jr-legende-corps">
                  <div className="jr-legende-ligne">
                    <span className="jr-legende-sym" aria-hidden="true">◑</span>
                    <span>
                      <b className="jr-legende-nom">{t("journal.valence")}</b>
                      <span className="jr-legende-def">{t("journal.legend.valenceDesc")}</span>
                    </span>
                  </div>
                  <div className="jr-legende-ligne">
                    <span className="jr-legende-sym" aria-hidden="true">▮</span>
                    <span>
                      <b className="jr-legende-nom">{t("journal.energy")}</b>
                      <span className="jr-legende-def">{t("journal.legend.energyDesc")}</span>
                    </span>
                  </div>
                </div>

                <p className="jr-legende-pied">{t("journal.legend.hint")}</p>
              </PopoverContent>
            </Popover>
          </div>

          {/* LA QUESTION CONGÉDIÉE PEUT REVENIR.
              Une croix cliquée par erreur coûtait la question du jour
              jusqu'au lendemain. Le bouton n'existe que dans ce cas : il
              n'y a rien à rappeler tant qu'elle est là. */}
          {questionCongediee && (
            <button
              type="button"
              className="jr-question-rappel"
              onClick={() => reglerQuestion(false)}
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              {t("journal.prompt.rappeler", "Revoir la question du jour")}
            </button>
          )}

          <div className="jr-doc">
            <DailyPromptBanner
              onUse={(prompt) => {
                /* La question du jour etait jetee : la page ouvrait un
                   editeur vide. Elle arrive maintenant a destination. */
                setEditingEntry(null); setAmorce(prompt); setIsNewEntryOpen(true);
              }}
            />

            {isLoading ? (
              <p className="jr-etat">{t("journal.loadingLogs")}</p>
            ) : entries.length === 0 ? (
              <div className="jr-etat" role="status">
                <b>{filtreActif ? t("journal.noMatch") : t("journal.noEntries")}</b>
                {filtreActif && (
                  <button
                    type="button"
                    className="jr-bouton est-sobre"
                    onClick={() => { setSearch(""); setFilterMood(null); setEpinglees(false); }}
                  >
                    {t("journal.clearFilters")}
                  </button>
                )}
              </div>
            ) : (
              entries.map((entry) => (
                <JournalEntryCard
                  key={entry.id}
                  entry={entry}
                  theme={theme}
                  onEdit={handleEdit}
                  onDelete={(id) => setDeletingEntryId(id)}
                />
              ))
            )}

            <div ref={sentinelRef} className="h-10 flex items-center justify-center">
              {isFetchingNextPage && <span className="jr-fin">{t("journal.loadingMore")}</span>}
            </div>

            {entries.length > 0 && !hasNextPage && (
              <p className="jr-fin">{t("journal.endOfLog")}</p>
            )}
          </div>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {isFetching && !isLoading ? t("journal.searching") : ""}
      </p>

      <JournalNewEntryModal
        open={isNewEntryOpen}
        onOpenChange={handleCloseModal}
        userId={user.id}
        editingEntry={editingEntry}
        amorce={amorce}
        theme={theme}
      />

      <AlertDialog open={!!deletingEntryId} onOpenChange={(o) => { if (!o) setDeletingEntryId(null); }}>
        <AlertDialogContent className={cn("jr-dlg")} data-jr={theme}>
          <AlertDialogHeader>
            <AlertDialogTitle className="jr-titre" style={{ marginBottom: 0 }}>
              {t("journal.delete.title")}
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: "var(--jr-encre-2)" }}>
              {t("journal.delete.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="jr-bouton est-sobre">{t("journal.delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction className="jr-bouton" onClick={handleDelete}>{t("journal.delete.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DSPageShell>
  );
}
