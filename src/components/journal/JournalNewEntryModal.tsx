import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { PanelRightClose, PanelRightOpen, SpellCheck, X } from "lucide-react";
const JournalEditor = lazy(() =>
  import("./JournalEditor").then((m) => ({ default: m.JournalEditor })),
);
import { useCreateJournalEntry, useUpdateJournalEntry } from "@/hooks/useJournal";
import type { JournalEntry } from "@/types/journal";
import {
  ACCENT_COLORS, MOOD_OPTIONS, FONT_OPTIONS, SIZE_OPTIONS, ALIGN_OPTIONS,
  getAccentEtat,
} from "@/types/journal";
import { compterMots, minutesDeLecture, referenceDe, sansParagrapheFinal, texteNu } from "@/lib/journalHtml";
import { useGoals, Goal } from "@/hooks/useGoals";
import { usePact } from "@/hooks/usePact";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* L ATELIER
 *
 * La fenetre avait trois onglets : on ecrivait dans le premier, on
 * reglait dans le deuxieme, et on decouvrait le resultat apres avoir
 * enregistre. Trois vues pour un seul document.
 *
 * Il n y en a plus qu une : la feuille au centre — telle qu elle
 * paraitra dans le dossier — et les reglages sur le cote, qui la
 * changent sous les yeux. Le rail se replie quand l ecran est
 * etroit, et redevient un tiroir sur telephone.
 */

interface JournalNewEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  editingEntry?: JournalEntry | null;
  /** Le texte du prompt du jour, quand l entree part de lui. */
  amorce?: string;
  /** Le journal peut forcer sa lumiere : la fenetre la suit. */
  theme?: "clair" | "sombre";
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="jr-at-sec">
      <h3 className="jr-at-sec-t">{titre}</h3>
      {children}
    </section>
  );
}

function Bascule({ valeur, onChange, label }: { valeur: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={valeur} onClick={() => onChange(!valeur)} className="jr-at-bascule">
      <i aria-hidden="true"><u /></i>
      <span>{label}</span>
    </button>
  );
}

const CLE_BROUILLON = (id?: string) => `journal-draft-${id ?? "new"}`;
const CLE_CORRECTEUR = "vowpact.journal.correcteur";
const CLE_RAIL = "vowpact.journal.rail";

function lireDrapeau(cle: string, defaut: boolean): boolean {
  try {
    const v = localStorage.getItem(cle);
    return v === null ? defaut : v === "1";
  } catch {
    return defaut;
  }
}

export function JournalNewEntryModal({ open, onOpenChange, userId, editingEntry, amorce, theme = "sombre" }: JournalNewEntryModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [lifeContext, setLifeContext] = useState("");
  const [valence, setValence] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [linkedGoalId, setLinkedGoalId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [accentId, setAccentId] = useState("cyan");
  const [moodId, setMoodId] = useState("flow");
  const [fontId, setFontId] = useState("mono");
  const [sizeId, setSizeId] = useState("md");
  const [alignId, setAlignId] = useState("left");
  const [lineNums, setLineNums] = useState(false);
  const [confirmerFermeture, setConfirmerFermeture] = useState(false);
  const [brouillonRestaure, setBrouillonRestaure] = useState(false);

  /* Le correcteur du navigateur : actif par defaut, coupable pour une
     entree pleine de noms propres. */
  const [correcteur, setCorrecteur] = useState(() => lireDrapeau(CLE_CORRECTEUR, true));
  const [rail, setRail] = useState(() =>
    lireDrapeau(CLE_RAIL, typeof window === "undefined" ? true : window.innerWidth >= 1100),
  );

  useEffect(() => { try { localStorage.setItem(CLE_CORRECTEUR, correcteur ? "1" : "0"); } catch { /* sans consequence */ } }, [correcteur]);
  useEffect(() => { try { localStorage.setItem(CLE_RAIL, rail ? "1" : "0"); } catch { /* sans consequence */ } }, [rail]);

  const { user } = useAuth();
  const { data: pact } = usePact(user?.id);
  const { data: goals = [] } = useGoals(pact?.id);
  const activeGoals = useMemo(() => goals.filter((g: Goal) => g.status !== "fully_completed"), [goals]);

  const createEntry = useCreateJournalEntry();
  const updateEntry = useUpdateJournalEntry();
  const isEditing = !!editingEntry;

  /* Ce qui sera range : sans la ligne de manoeuvre de l editeur. La
     comparaison au depart se fait sur la meme forme, sinon une entree
     qui finit par une liste s ouvrirait deja « modifiee ». */
  const contenuNet = useMemo(() => sansParagrapheFinal(content), [content]);
  const mots = useMemo(() => compterMots(contenuNet), [contenuNet]);
  const canSave = !!title.trim() && !!texteNu(contenuNet);

  const cleBrouillon = CLE_BROUILLON(editingEntry?.id);
  const initialRef = useRef<string>("");

  const valeurs = useMemo(
    () => ({ title, content: contenuNet, lifeContext, valence, energy, linkedGoalId, tags, accentId, moodId, fontId, sizeId, alignId, lineNums }),
    [title, contenuNet, lifeContext, valence, energy, linkedGoalId, tags, accentId, moodId, fontId, sizeId, alignId, lineNums],
  );
  const sale = initialRef.current !== "" && JSON.stringify(valeurs) !== initialRef.current;

  // ── Ouverture : entree, puis brouillon s il y en a un ──────
  useEffect(() => {
    if (!open) return;
    setBrouillonRestaure(false);

    const depart = editingEntry
      ? {
        title: editingEntry.title, content: sansParagrapheFinal(editingEntry.content),
        lifeContext: editingEntry.life_context || "", valence: editingEntry.valence_level ?? 5,
        energy: editingEntry.energy_level ?? 5, linkedGoalId: editingEntry.linked_goal_id,
        tags: editingEntry.tags ?? [], accentId: editingEntry.accent_color ?? "cyan",
        moodId: editingEntry.mood ?? "flow", fontId: editingEntry.font_id ?? "mono",
        sizeId: editingEntry.size_id ?? "md", alignId: editingEntry.align_id ?? "left",
        lineNums: editingEntry.line_numbers ?? false,
      }
      : {
        title: "", content: amorce ? `<p>${amorce}</p>` : "", lifeContext: "",
        valence: 5, energy: 5, linkedGoalId: null as string | null, tags: [] as string[],
        accentId: "cyan", moodId: "flow", fontId: "mono", sizeId: "md", alignId: "left", lineNums: false,
      };

    /* Ce qui a ete tape et jamais enregistre revient. */
    let restaure: typeof depart | null = null;
    try {
      const brut = localStorage.getItem(CLE_BROUILLON(editingEntry?.id));
      if (brut) restaure = { ...depart, ...JSON.parse(brut) };
    } catch { /* brouillon illisible : on l ignore */ }

    const v = restaure ?? depart;
    setTitle(v.title); setContent(v.content); setLifeContext(v.lifeContext);
    setValence(v.valence); setEnergy(v.energy); setLinkedGoalId(v.linkedGoalId);
    setTags(v.tags); setTagInput(""); setAccentId(v.accentId); setMoodId(v.moodId);
    setFontId(v.fontId); setSizeId(v.sizeId); setAlignId(v.alignId); setLineNums(v.lineNums);
    initialRef.current = JSON.stringify(depart);
    setBrouillonRestaure(!!restaure);
  }, [open, editingEntry, amorce]);

  // ── Le brouillon suit la frappe ────────────────────────────
  useEffect(() => {
    if (!open || initialRef.current === "") return;
    const courant = JSON.stringify(valeurs);
    if (courant === initialRef.current) return;
    const id = setTimeout(() => {
      try { localStorage.setItem(cleBrouillon, courant); } catch { /* stockage plein */ }
    }, 400);
    return () => clearTimeout(id);
  }, [open, valeurs, cleBrouillon]);

  /* La page derriere defilait encore sous la fenetre. */
  useEffect(() => {
    if (!open) return;
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = avant; };
  }, [open]);

  const oublierBrouillon = useCallback(() => {
    try { localStorage.removeItem(cleBrouillon); } catch { /* sans consequence */ }
  }, [cleBrouillon]);

  const fermer = useCallback(() => {
    initialRef.current = "";
    setConfirmerFermeture(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const demanderFermeture = useCallback(() => {
    if (sale) setConfirmerFermeture(true);
    else { oublierBrouillon(); fermer(); }
  }, [sale, fermer, oublierBrouillon]);

  const addTag = useCallback(() => {
    const nouveau = tagInput.trim().replace(/^[/#]/, "").toLowerCase();
    if (nouveau && !tags.includes(nouveau)) setTags((p) => [...p, nouveau]);
    setTagInput("");
  }, [tagInput, tags]);

  const isPending = createEntry.isPending || updateEntry.isPending;

  const handleSave = useCallback(async () => {
    if (!title.trim() || !texteNu(contenuNet) || isPending) return;
    const payload = {
      title: title.trim(), content: contenuNet, mood: moodId,
      life_context: lifeContext.trim() || null, valence_level: valence, energy_level: energy,
      linked_goal_id: linkedGoalId || null, tags, is_favorite: editingEntry?.is_favorite ?? false,
      accent_color: accentId, font_id: fontId, size_id: sizeId, align_id: alignId, line_numbers: lineNums,
    };
    try {
      if (isEditing && editingEntry) {
        await updateEntry.mutateAsync({ id: editingEntry.id, userId, updates: payload });
      } else {
        await createEntry.mutateAsync({ user_id: userId, ...payload });
      }
      oublierBrouillon();
      fermer();
    } catch {
      /* Le toast d erreur vient de la mutation ; la fenetre reste
         ouverte, et le brouillon avec elle. */
    }
  }, [
    title, contenuNet, moodId, lifeContext, valence, energy, linkedGoalId, tags, accentId,
    fontId, sizeId, alignId, lineNums, isEditing, editingEntry, updateEntry, createEntry,
    userId, oublierBrouillon, fermer, isPending,
  ]);

  const reference = editingEntry ? referenceDe(editingEntry.id) : t("journal.ed.nouvelleRef");
  const dateDoc = editingEntry ? new Date(editingEntry.created_at) : new Date();

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) demanderFermeture(); }}>
        <DialogContent
          className="jr-dlg jr-at fixed left-0 top-0 z-[9999] w-screen max-w-none h-[100dvh] max-h-none translate-x-0 translate-y-0 rounded-none border-0 p-0 gap-0 [&>button]:hidden"
          data-jr={theme}
          onEscapeKeyDown={(e) => { if (sale) { e.preventDefault(); setConfirmerFermeture(true); } }}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">
            {isEditing ? t("journal.modal.editTitle") : t("journal.modal.newTitle")}
          </DialogTitle>
          <DialogDescription className="sr-only">{t("journal.modal.hint")}</DialogDescription>

          {/* ── La cote du document ────────────────────────── */}
          <header className="jr-at-tete">
            <div className="jr-at-ref">
              <b>{reference}</b>
              <span>{format(dateDoc, "yyyy.MM.dd")}</span>
              <span>{t("journal.words", { count: mots })}</span>
              <span>{t("journal.ed.lecture", { count: minutesDeLecture(mots) })}</span>
              {brouillonRestaure && <em>{t("journal.modal.draftRestored")}</em>}
            </div>

            <div className="jr-at-actions">
              <button
                type="button"
                className="jr-at-icone"
                aria-pressed={correcteur}
                onClick={() => setCorrecteur((v) => !v)}
                title={correcteur ? t("journal.ed.correcteurOn") : t("journal.ed.correcteurOff")}
                aria-label={correcteur ? t("journal.ed.correcteurOn") : t("journal.ed.correcteurOff")}
              >
                <SpellCheck aria-hidden="true" />
              </button>
              <button
                type="button"
                className="jr-at-icone"
                aria-pressed={rail}
                aria-expanded={rail}
                onClick={() => setRail((v) => !v)}
                title={rail ? t("journal.ed.railFermer") : t("journal.ed.railOuvrir")}
                aria-label={rail ? t("journal.ed.railFermer") : t("journal.ed.railOuvrir")}
              >
                {rail ? <PanelRightClose aria-hidden="true" /> : <PanelRightOpen aria-hidden="true" />}
              </button>

              <button type="button" className="jr-bouton est-sobre" onClick={demanderFermeture}>
                {t("journal.modal.close")}
              </button>
              <button type="button" className="jr-bouton" onClick={handleSave} disabled={!canSave || isPending}>
                {isPending ? "…" : t("journal.modal.save")}
              </button>
            </div>
          </header>

          {/* ── La piece et son rail ───────────────────────── */}
          <div className="jr-at-corps">
            <Suspense fallback={<div className="jr-ed-attente">{t("journal.modal.editorLoading")}</div>}>
              <JournalEditor
                contenu={content}
                onContenu={setContent}
                titre={title}
                onTitre={setTitle}
                fontId={fontId}
                sizeId={sizeId}
                alignId={alignId}
                numeros={lineNums}
                moodId={moodId}
                accentEtat={getAccentEtat(accentId)}
                correcteur={correcteur}
                titrePlaceholder={t("journal.modal.titlePlaceholder")}
                corpsPlaceholder={t("journal.modal.bodyPlaceholder")}
                onEnregistrer={handleSave}
              />
            </Suspense>

            {rail && (
              <button
                type="button"
                className="jr-at-voile"
                aria-label={t("journal.ed.railFermer")}
                onClick={() => setRail(false)}
              />
            )}

            <aside className="jr-at-rail" data-ouvert={rail ? "1" : "0"} aria-hidden={!rail}>
              <div className="jr-at-rail-tete">
                <span>{t("journal.ed.reglages")}</span>
                <button
                  type="button"
                  className="jr-at-icone"
                  onClick={() => setRail(false)}
                  aria-label={t("journal.ed.railFermer")}
                >
                  <X aria-hidden="true" />
                </button>
              </div>

              <Section titre={t("journal.modal.font")}>
                <div className="jr-at-col">
                  {FONT_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className="jr-at-opt est-large"
                      aria-pressed={fontId === f.id}
                      onClick={() => setFontId(f.id)}
                      style={{ fontFamily: f.css, fontStyle: f.style }}
                    >
                      {f.label} <span aria-hidden="true">— Aa 01</span>
                    </button>
                  ))}
                </div>
              </Section>

              <Section titre={t("journal.modal.size")}>
                <div className="jr-at-rang">
                  {SIZE_OPTIONS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="jr-at-opt"
                      aria-pressed={sizeId === s.id}
                      onClick={() => setSizeId(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </Section>

              <Section titre={t("journal.modal.align")}>
                <div className="jr-at-rang">
                  {ALIGN_OPTIONS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="jr-at-opt"
                      aria-pressed={alignId === a.id}
                      onClick={() => setAlignId(a.id)}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </Section>

              <Section titre={t("journal.modal.accent")}>
                <p className="jr-at-aide">{t("journal.ed.accentAide")}</p>
                <div className="jr-at-grille">
                  {ACCENT_COLORS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="jr-at-pastille"
                      aria-pressed={accentId === a.id}
                      aria-label={a.label}
                      title={a.label}
                      onClick={() => setAccentId(a.id)}
                      style={{ ["--jr-choix" as string]: `var(--jr-etat-${getAccentEtat(a.id)})` }}
                    >
                      <i aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </Section>

              <Section titre={t("journal.modal.lineNumbers")}>
                <Bascule
                  valeur={lineNums}
                  onChange={setLineNums}
                  label={lineNums ? t("common.on", "ON") : t("common.off", "OFF")}
                />
              </Section>

              <Section titre={t("journal.modal.mood")}>
                <div className="jr-at-col">
                  {MOOD_OPTIONS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className="jr-at-opt est-large est-etat"
                      aria-pressed={moodId === m.id}
                      onClick={() => setMoodId(m.id)}
                      title={t(`journal.moodsDesc.${m.id}`)}
                      style={{ ["--jr-choix" as string]: `var(--jr-etat-${m.id})` }}
                    >
                      <span aria-hidden="true">{m.sym}</span>
                      {t(`journal.moods.${m.id}`, m.label)}
                    </button>
                  ))}
                </div>
              </Section>

              <Section titre={t("journal.modal.valence")}>
                <div className="jr-at-jauge" role="group" aria-label={t("journal.modal.valence")}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={t("journal.modal.scaleValue", { value: i + 1 })}
                      aria-pressed={valence === i + 1}
                      data-plein={i < valence ? "1" : "0"}
                      onClick={() => setValence(i + 1)}
                    />
                  ))}
                </div>
                <p className="jr-at-mesure">
                  <span>{t("journal.modal.negative")}</span>
                  <b>{valence}/10</b>
                  <span>{t("journal.modal.positive")}</span>
                </p>
              </Section>

              <Section titre={t("journal.modal.energy")}>
                <div className="jr-at-jauge" role="group" aria-label={t("journal.modal.energy")}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={t("journal.modal.scaleValue", { value: i + 1 })}
                      aria-pressed={energy === i + 1}
                      data-plein={i < energy ? "1" : "0"}
                      onClick={() => setEnergy(i + 1)}
                    />
                  ))}
                </div>
                <p className="jr-at-mesure">
                  <span>{t("journal.modal.depleted")}</span>
                  <b>{energy}/10</b>
                  <span>{t("journal.modal.charged")}</span>
                </p>
              </Section>

              <Section titre={t("journal.modal.tags")}>
                <div className="jr-at-etiquettes">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setTags((p) => p.filter((x) => x !== tag))}
                      aria-label={t("journal.modal.removeTag", { tag })}
                    >
                      /{tag} ×
                    </button>
                  ))}
                </div>
                <div className="jr-at-ajout">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    aria-label={t("journal.modal.tags")}
                    placeholder="/tag"
                  />
                  <button type="button" onClick={addTag} aria-label={t("journal.modal.addTag")}>+</button>
                </div>
              </Section>

              <Section titre={t("journal.modal.linkedGoal")}>
                <Select value={linkedGoalId ?? "none"} onValueChange={(v) => setLinkedGoalId(v === "none" ? null : v)}>
                  <SelectTrigger className="jr-at-select" aria-label={t("journal.modal.linkedGoal")}>
                    <SelectValue placeholder={t("journal.modal.noGoal")} />
                  </SelectTrigger>
                  <SelectContent className="jr-dlg font-mono text-xs" data-jr={theme}>
                    <SelectItem value="none">{t("journal.modal.noGoal")}</SelectItem>
                    {activeGoals.map((g: Goal) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Section>

              <Section titre={t("journal.modal.context")}>
                <input
                  className="jr-at-champ"
                  value={lifeContext}
                  onChange={(e) => setLifeContext(e.target.value)}
                  aria-label={t("journal.modal.context")}
                  placeholder={t("journal.modal.contextPlaceholder")}
                />
              </Section>

              <Section titre={t("journal.ed.raccourcis")}>
                <dl className="jr-at-raccourcis">
                  <dt>Ctrl B / I / U</dt><dd>{t("journal.ed.gras")} · {t("journal.ed.italique")} · {t("journal.ed.souligne")}</dd>
                  <dt>Ctrl Maj L</dt><dd>{t("journal.ed.lueur")}</dd>
                  <dt>Ctrl Maj H</dt><dd>{t("journal.ed.marque")}</dd>
                  <dt>Ctrl K</dt><dd>{t("journal.ed.lien")}</dd>
                  <dt>/</dt><dd>{t("journal.ed.inserer")}</dd>
                  <dt>Ctrl ⏎</dt><dd>{t("journal.modal.save")}</dd>
                  <dt>Échap</dt><dd>{t("journal.modal.close")}</dd>
                </dl>
              </Section>
            </aside>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ce qui est ecrit ne se jetait pas : il disparaissait. */}
      <AlertDialog open={confirmerFermeture} onOpenChange={setConfirmerFermeture}>
        <AlertDialogContent className="jr-dlg z-[10000]" data-jr={theme}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("journal.modal.discardTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("journal.modal.discardDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("journal.modal.keepWriting")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { oublierBrouillon(); fermer(); }}>
              {t("journal.modal.discard")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
