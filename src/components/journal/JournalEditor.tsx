import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import type { ChainedCommands } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";
import { useTranslation } from "react-i18next";
import {
  Bold, Italic, Underline, Strikethrough, Undo2, Redo2, Heading2, Heading3,
  List, ListOrdered, ListChecks, Quote, Minus, Code, Link2, Sparkles,
  Highlighter, RemoveFormatting, Droplet, Check, X, type LucideIcon,
} from "lucide-react";
import { EncreEtat, Lueur, Marque } from "./marquesJournal";
import { MOOD_OPTIONS, getAlign, getFont, getSize } from "@/types/journal";

/* LA FEUILLE
 *
 * L editeur ne ressemblait pas a la page : il ecrivait en « prose
 * invert », largeur libre, police fixe, pendant que la carte du
 * journal rendait le meme texte avec la police, la taille,
 * l alignement et les numeros de ligne choisis pour l entree. On
 * ecrivait dans une lumiere et on relisait dans une autre.
 *
 * Il n y a plus d apercu, parce qu il n y a plus rien a prevoir :
 * la zone d ecriture EST la piece de dossier. Meme classe
 * « jr-html », memes jetons de papier, memes reglages appliques
 * sous le curseur. Ce qui change dans le rail change la feuille.
 *
 * Le titre est la premiere ligne du document et non un champ pose
 * au-dessus : on tape, on passe a la ligne, on ecrit.
 */

export interface JournalEditorProps {
  contenu: string;
  onContenu: (html: string) => void;
  titre: string;
  onTitre: (v: string) => void;
  /** Les reglages du document : ils s appliquent en direct. */
  fontId: string;
  sizeId: string;
  alignId: string;
  numeros: boolean;
  /** L etat de l entree : il donne sa teinte a la lueur. */
  moodId: string;
  /** L accent habille le mobilier du document : numeros et traits. */
  accentEtat: string;
  correcteur: boolean;
  titrePlaceholder?: string;
  corpsPlaceholder?: string;
  /** Ctrl+Entree enregistre sans lever les mains du clavier. */
  onEnregistrer?: () => void;
}

type Commande = {
  id: string;
  icone: LucideIcon;
  cles: string;
  raccourci?: string;
  lancer: (chaine: ChainedCommands) => ChainedCommands;
};

type EtatSlash = {
  requete: string; depuis: number; jusqu: number;
  x: number; y: number; versLeHaut: boolean;
};

const HAUTEUR_SLASH = 264;

/* ── Un outil de la barre ──────────────────────────────────── */
function Outil({
  actif, dispo = true, sur, titre, children,
}: {
  actif?: boolean;
  dispo?: boolean;
  sur: () => void;
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="jr-outil"
      aria-pressed={actif}
      disabled={!dispo}
      onClick={sur}
      title={titre}
      aria-label={titre}
    >
      {children}
    </button>
  );
}

const Filet = () => <span className="jr-barre-filet" aria-hidden="true" />;

/* Un lien de journal ne fait qu emmener ailleurs. */
function normaliserUrl(brut: string): string | null {
  const v = brut.trim();
  if (!v) return null;
  const avecSchema = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(avecSchema);
    if (!["http:", "https:", "mailto:"].includes(u.protocol)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function JournalEditor({
  contenu, onContenu, titre, onTitre,
  fontId, sizeId, alignId, numeros, moodId, accentEtat, correcteur,
  titrePlaceholder, corpsPlaceholder, onEnregistrer,
}: JournalEditorProps) {
  const { t, i18n } = useTranslation();

  const [boiteLien, setBoiteLien] = useState(false);
  const [urlLien, setUrlLien] = useState("");
  const [palette, setPalette] = useState(false);
  const [slash, setSlash] = useState<EtatSlash | null>(null);
  const [slashIdx, setSlashIdx] = useState(0);

  const champLien = useRef<HTMLInputElement | null>(null);
  const champTitre = useRef<HTMLTextAreaElement | null>(null);
  /* Echap ecartait le menu, que la barre oblique rouvrait aussitot :
     on retient l endroit ecarte jusqu a ce que le curseur en parte. */
  const ecarte = useRef<number | null>(null);
  const clavier = useRef<{
    slashOuvert: boolean;
    bouger: (d: number) => void;
    valider: () => void;
    fermer: () => void;
    lien: () => void;
    enregistrer?: () => void;
  }>({ slashOuvert: false, bouger: () => {}, valider: () => {}, fermer: () => {}, lien: () => {} });

  const police = getFont(fontId);
  const taille = getSize(sizeId);
  const alignement = getAlign(alignId);

  const COMMANDES = useMemo<Commande[]>(() => [
    { id: "titre2", icone: Heading2, cles: "titre section heading h2", lancer: (c) => c.toggleHeading({ level: 2 }) },
    { id: "titre3", icone: Heading3, cles: "sous titre heading h3", lancer: (c) => c.toggleHeading({ level: 3 }) },
    { id: "puces", icone: List, cles: "liste puces bullet", raccourci: "- ", lancer: (c) => c.toggleBulletList() },
    { id: "numerotee", icone: ListOrdered, cles: "liste numerotee ordered", raccourci: "1. ", lancer: (c) => c.toggleOrderedList() },
    { id: "cases", icone: ListChecks, cles: "cases cocher taches todo", raccourci: "[] ", lancer: (c) => c.toggleTaskList() },
    { id: "citation", icone: Quote, cles: "citation quote", raccourci: "> ", lancer: (c) => c.toggleBlockquote() },
    { id: "trait", icone: Minus, cles: "trait separation ligne", raccourci: "---", lancer: (c) => c.setHorizontalRule() },
    { id: "code", icone: Code, cles: "code bloc", raccourci: "```", lancer: (c) => c.toggleCodeBlock() },
  ], []);

  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      },
    }),
    TextStyle,
    TaskList,
    TaskItem.configure({ nested: false }),
    Lueur,
    Marque,
    EncreEtat,
  ], []);

  /* Le menu d insertion vit dans React : le clavier passe par un
     relais pour ne jamais lire un etat perime. */
  const surTouche = useCallback((_vue: EditorView, evenement: KeyboardEvent) => {
    const c = clavier.current;
    const mod = evenement.ctrlKey || evenement.metaKey;

    if (mod && evenement.key === "Enter") {
      evenement.preventDefault();
      c.enregistrer?.();
      return true;
    }
    if (mod && (evenement.key === "k" || evenement.key === "K")) {
      evenement.preventDefault();
      c.lien();
      return true;
    }
    if (!c.slashOuvert) return false;
    if (evenement.key === "ArrowDown") { evenement.preventDefault(); c.bouger(1); return true; }
    if (evenement.key === "ArrowUp") { evenement.preventDefault(); c.bouger(-1); return true; }
    if (evenement.key === "Enter" || evenement.key === "Tab") { evenement.preventDefault(); c.valider(); return true; }
    /* Echap n arrive jamais ici : la fenetre le capte sur le document
       avant que l editeur le voie. Il est traite plus haut. */
    return false;
  }, []);

  /* Les reglages du document voyagent avec les options de l editeur.
     Les poser apres coup ne tenait pas : « useEditor » recompare ses
     options a chaque rendu et reappliquait celles du depart. */
  const proprietes = useMemo(() => ({
    attributes: {
      class: "jr-html",
      "data-lignes": numeros ? "1" : "0",
      spellcheck: correcteur ? "true" : "false",
      lang: i18n.language || "fr",
      style: `font-family:${police.css};font-style:${police.style};font-size:${taille.px}px;`
        + `text-align:${alignement.val};--jr-fs:${taille.px}px;`,
    },
    handleKeyDown: surTouche,
  }), [numeros, correcteur, i18n.language, police.css, police.style, taille.px, alignement.val, surTouche]);

  const editor = useEditor({
    immediatelyRender: true,
    extensions,
    content: contenu,
    editorProps: proprietes,
  });

  /* ── Ce que la barre doit savoir ─────────────────────────── */
  const marques = useEditorState({
    editor,
    selector: ({ editor: e }) => e
      ? {
        gras: e.isActive("bold"), italique: e.isActive("italic"),
        souligne: e.isActive("underline"), barre: e.isActive("strike"),
        lueur: e.isActive("lueur"), marque: e.isActive("marque"),
        encre: e.isActive("encre"), lien: e.isActive("link"),
        t2: e.isActive("heading", { level: 2 }), t3: e.isActive("heading", { level: 3 }),
        puces: e.isActive("bulletList"), numerotee: e.isActive("orderedList"),
        cases: e.isActive("taskList"), citation: e.isActive("blockquote"),
        code: e.isActive("codeBlock"),
        peutAnnuler: e.can().undo(), peutRefaire: e.can().redo(),
        vide: e.isEmpty,
      }
      : null,
  });

  /* ── Le contenu venu de l exterieur (brouillon, edition) ─── */
  useEffect(() => {
    if (!editor) return;
    if (contenu !== editor.getHTML()) {
      editor.commands.setContent(contenu, { emitUpdate: false });
    }
  }, [contenu, editor]);

  /* ── Les ecoutes : liees une fois, toujours a jour ───────── */
  const relais = useRef({ onContenu });
  relais.current = { onContenu };

  useEffect(() => {
    if (!editor) return;

    /* Le menu d insertion s ouvre sur une barre oblique posee en
       debut de bloc — jamais au milieu d une phrase, ou elle veut
       simplement dire « ou ». */
    const detecter = () => {
      const { $from, empty } = editor.state.selection;
      if (!empty || !$from.parent.isTextblock || editor.isActive("codeBlock")) {
        ecarte.current = null;
        setSlash(null);
        return;
      }
      const avant = $from.parent.textBetween(0, $from.parentOffset, "\n", "￼");
      const trouve = /^\/([\p{L}\p{N}]*)$/u.exec(avant);
      if (!trouve) {
        ecarte.current = null;
        setSlash(null);
        return;
      }
      const depuis = $from.pos - trouve[0].length;
      if (ecarte.current === depuis) {
        setSlash(null);
        return;
      }
      const boite = editor.view.coordsAtPos(depuis);
      const versLeHaut = boite.bottom + HAUTEUR_SLASH > window.innerHeight;
      setSlash({
        requete: trouve[1],
        depuis,
        jusqu: $from.pos,
        x: boite.left,
        y: versLeHaut ? boite.top : boite.bottom,
        versLeHaut,
      });
      setSlashIdx(0);
    };

    const surMaj = () => { relais.current.onContenu(editor.getHTML()); detecter(); };
    const surSelection = () => { detecter(); setPalette(false); };

    editor.on("update", surMaj);
    editor.on("selectionUpdate", surSelection);
    return () => { editor.off("update", surMaj); editor.off("selectionUpdate", surSelection); };
  }, [editor]);

  const items = useMemo(() => {
    if (!slash) return [];
    const q = slash.requete.toLowerCase();
    if (!q) return COMMANDES;
    return COMMANDES.filter((c) => `${t(`journal.ed.${c.id}`)} ${c.cles}`.toLowerCase().includes(q));
  }, [slash, COMMANDES, t]);

  const idx = items.length ? Math.min(slashIdx, items.length - 1) : 0;

  const choisir = useCallback((i: number) => {
    if (!editor || !slash) return;
    const cmd = items[i];
    if (!cmd) return;
    cmd.lancer(editor.chain().focus().deleteRange({ from: slash.depuis, to: slash.jusqu })).run();
    setSlash(null);
  }, [editor, slash, items]);

  const ouvrirLien = useCallback(() => {
    if (!editor) return;
    setPalette(false);
    setUrlLien((editor.getAttributes("link").href as string) ?? "");
    setBoiteLien(true);
    window.setTimeout(() => champLien.current?.focus(), 20);
  }, [editor]);

  clavier.current = {
    slashOuvert: !!slash && items.length > 0,
    bouger: (d) => setSlashIdx((v) => {
      const n = items.length;
      if (!n) return 0;
      return (Math.min(v, n - 1) + d + n) % n;
    }),
    valider: () => choisir(idx),
    fermer: () => { ecarte.current = slash?.depuis ?? null; setSlash(null); },
    lien: ouvrirLien,
    enregistrer: onEnregistrer,
  };

  /* Echap, quand le menu est ouvert, ne doit fermer que le menu. La
     fenetre ecoute cette touche sur le document, en capture : elle la
     recevrait avant l editeur et se refermerait. On se place un cran
     au-dessus — la fenetre du navigateur — pour la prendre en premier. */
  useEffect(() => {
    if (!slash) return;
    const surEchap = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      ecarte.current = slash.depuis;
      setSlash(null);
    };
    window.addEventListener("keydown", surEchap, true);
    return () => window.removeEventListener("keydown", surEchap, true);
  }, [slash]);

  const appliquerLien = useCallback(() => {
    if (!editor) return;
    const url = normaliserUrl(urlLien);
    if (!url) return;
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent({
        type: "text",
        text: url,
        marks: [{ type: "link", attrs: { href: url } }],
      }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setBoiteLien(false);
  }, [editor, urlLien]);

  const retirerLien = useCallback(() => {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    setBoiteLien(false);
  }, [editor]);

  /* Le titre grandit avec ce qu on y met. */
  const ajusterTitre = useCallback(() => {
    const el = champTitre.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);
  useEffect(() => { ajusterTitre(); }, [titre, sizeId, ajusterTitre]);

  if (!editor || !marques) {
    return <div className="jr-ed-attente">{t("journal.modal.editorLoading")}</div>;
  }

  return (
    <div className="jr-ed">
      {/* ── La barre ─────────────────────────────────────── */}
      <div className="jr-barre" role="toolbar" aria-label={t("journal.ed.outils")}>
        <Outil sur={() => editor.chain().focus().undo().run()} dispo={marques.peutAnnuler} titre={`${t("journal.ed.annuler")} (Ctrl+Z)`}>
          <Undo2 aria-hidden="true" />
        </Outil>
        <Outil sur={() => editor.chain().focus().redo().run()} dispo={marques.peutRefaire} titre={`${t("journal.ed.refaire")} (Ctrl+Y)`}>
          <Redo2 aria-hidden="true" />
        </Outil>

        <Filet />

        <Outil actif={marques.gras} sur={() => editor.chain().focus().toggleBold().run()} titre={`${t("journal.ed.gras")} (Ctrl+B)`}>
          <Bold aria-hidden="true" />
        </Outil>
        <Outil actif={marques.italique} sur={() => editor.chain().focus().toggleItalic().run()} titre={`${t("journal.ed.italique")} (Ctrl+I)`}>
          <Italic aria-hidden="true" />
        </Outil>
        <Outil actif={marques.souligne} sur={() => editor.chain().focus().toggleUnderline().run()} titre={`${t("journal.ed.souligne")} (Ctrl+U)`}>
          <Underline aria-hidden="true" />
        </Outil>
        <Outil actif={marques.barre} sur={() => editor.chain().focus().toggleStrike().run()} titre={t("journal.ed.barre")}>
          <Strikethrough aria-hidden="true" />
        </Outil>

        <Filet />

        <Outil actif={marques.t2} sur={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} titre={t("journal.ed.titre2")}>
          <Heading2 aria-hidden="true" />
        </Outil>
        <Outil actif={marques.t3} sur={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} titre={t("journal.ed.titre3")}>
          <Heading3 aria-hidden="true" />
        </Outil>
        <Outil actif={marques.puces} sur={() => editor.chain().focus().toggleBulletList().run()} titre={t("journal.ed.puces")}>
          <List aria-hidden="true" />
        </Outil>
        <Outil actif={marques.numerotee} sur={() => editor.chain().focus().toggleOrderedList().run()} titre={t("journal.ed.numerotee")}>
          <ListOrdered aria-hidden="true" />
        </Outil>
        <Outil actif={marques.cases} sur={() => editor.chain().focus().toggleTaskList().run()} titre={t("journal.ed.cases")}>
          <ListChecks aria-hidden="true" />
        </Outil>
        <Outil actif={marques.citation} sur={() => editor.chain().focus().toggleBlockquote().run()} titre={t("journal.ed.citation")}>
          <Quote aria-hidden="true" />
        </Outil>
        <Outil sur={() => editor.chain().focus().setHorizontalRule().run()} titre={t("journal.ed.trait")}>
          <Minus aria-hidden="true" />
        </Outil>
        <Outil actif={marques.code} sur={() => editor.chain().focus().toggleCodeBlock().run()} titre={t("journal.ed.code")}>
          <Code aria-hidden="true" />
        </Outil>

        <Filet />

        <Outil actif={marques.lien || boiteLien} sur={ouvrirLien} titre={`${t("journal.ed.lien")} (Ctrl+K)`}>
          <Link2 aria-hidden="true" />
        </Outil>
        <Outil actif={marques.lueur} sur={() => editor.chain().focus().toggleLueur().run()} titre={`${t("journal.ed.lueur")} (Ctrl+Maj+L)`}>
          <Sparkles aria-hidden="true" />
        </Outil>
        <Outil actif={marques.marque} sur={() => editor.chain().focus().toggleMarque().run()} titre={`${t("journal.ed.marque")} (Ctrl+Maj+H)`}>
          <Highlighter aria-hidden="true" />
        </Outil>
        <Outil actif={marques.encre || palette} sur={() => { setBoiteLien(false); setPalette((v) => !v); }} titre={t("journal.ed.encre")}>
          <Droplet aria-hidden="true" />
        </Outil>

        <Filet />

        <Outil sur={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} titre={t("journal.ed.effacer")}>
          <RemoveFormatting aria-hidden="true" />
        </Outil>
      </div>

      {/* ── La rangee contextuelle ───────────────────────── */}
      {boiteLien && (
        <div className="jr-barre-2">
          <label className="jr-barre-2-champ">
            <Link2 aria-hidden="true" />
            <input
              ref={champLien}
              value={urlLien}
              onChange={(e) => setUrlLien(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); appliquerLien(); }
                if (e.key === "Escape") {
                  /* Echap referme la rangee, pas la fenetre. */
                  e.preventDefault(); e.stopPropagation();
                  setBoiteLien(false); editor.commands.focus();
                }
              }}
              placeholder={t("journal.ed.lienPlaceholder")}
              aria-label={t("journal.ed.lienUrl")}
              inputMode="url"
            />
          </label>
          <button type="button" className="jr-barre-2-ok" onClick={appliquerLien} disabled={!normaliserUrl(urlLien)}>
            <Check aria-hidden="true" /> {t("journal.ed.lienAppliquer")}
          </button>
          {marques.lien && (
            <button type="button" className="jr-barre-2-non" onClick={retirerLien}>
              {t("journal.ed.lienRetirer")}
            </button>
          )}
          <button
            type="button"
            className="jr-barre-2-fermer"
            onClick={() => { setBoiteLien(false); editor.commands.focus(); }}
            aria-label={t("journal.ed.fermerRangee")}
          >
            <X aria-hidden="true" />
          </button>
        </div>
      )}

      {palette && (
        <div className="jr-barre-2" role="group" aria-label={t("journal.ed.encre")}>
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m.id}
              type="button"
              className="jr-encre-choix"
              style={{ ["--jr-choix" as string]: `var(--jr-etat-${m.id})` }}
              onClick={() => { editor.chain().focus().setEncre(m.id).run(); setPalette(false); }}
            >
              <span aria-hidden="true">{m.sym}</span>
              {t(`journal.moods.${m.id}`, m.label)}
            </button>
          ))}
          <button
            type="button"
            className="jr-barre-2-non"
            onClick={() => { editor.chain().focus().unsetEncre().run(); setPalette(false); }}
          >
            {t("journal.ed.encreAucune")}
          </button>
          <button
            type="button"
            className="jr-barre-2-fermer"
            onClick={() => { setPalette(false); editor.commands.focus(); }}
            aria-label={t("journal.ed.fermerRangee")}
          >
            <X aria-hidden="true" />
          </button>
        </div>
      )}

      {/* ── La feuille ───────────────────────────────────── */}
      <div className="jr-ed-defile">
        <div
          className="jr-feuille"
          style={{
            ["--jr-teinte" as string]: `var(--jr-etat-${moodId})`,
            ["--jr-accent" as string]: `var(--jr-etat-${accentEtat})`,
          }}
        >
          <textarea
            ref={champTitre}
            className="jr-feuille-titre"
            value={titre}
            rows={1}
            onChange={(e) => { onTitre(e.target.value.replace(/\n/g, "")); ajusterTitre(); }}
            onKeyDown={(e) => {
              const versLeBas = e.key === "ArrowDown" && e.currentTarget.selectionStart === titre.length;
              if (e.key === "Enter" || versLeBas) {
                e.preventDefault();
                editor.commands.focus("start");
              }
            }}
            placeholder={titrePlaceholder}
            aria-label={titrePlaceholder}
            spellCheck={correcteur}
            lang={i18n.language || "fr"}
            style={{ textAlign: alignement.val }}
          />

          <div className="jr-feuille-corps">
            <EditorContent editor={editor} />
            {marques.vide && corpsPlaceholder && (
              <p
                className="jr-feuille-amorce"
                aria-hidden="true"
                style={{
                  fontFamily: police.css, fontStyle: police.style,
                  fontSize: `${taille.px}px`, textAlign: alignement.val,
                  paddingLeft: numeros ? "3.5ch" : undefined,
                }}
              >
                {corpsPlaceholder}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Le menu sur la selection ─────────────────────── */}
      <BubbleMenu
        editor={editor}
        className="jr-bulle"
        shouldShow={({ editor: e, from, to }) => from !== to && !e.isActive("codeBlock") && !boiteLien}
      >
        <Outil actif={marques.gras} sur={() => editor.chain().focus().toggleBold().run()} titre={t("journal.ed.gras")}>
          <Bold aria-hidden="true" />
        </Outil>
        <Outil actif={marques.italique} sur={() => editor.chain().focus().toggleItalic().run()} titre={t("journal.ed.italique")}>
          <Italic aria-hidden="true" />
        </Outil>
        <Outil actif={marques.souligne} sur={() => editor.chain().focus().toggleUnderline().run()} titre={t("journal.ed.souligne")}>
          <Underline aria-hidden="true" />
        </Outil>
        <Filet />
        <Outil actif={marques.lueur} sur={() => editor.chain().focus().toggleLueur().run()} titre={t("journal.ed.lueur")}>
          <Sparkles aria-hidden="true" />
        </Outil>
        <Outil actif={marques.marque} sur={() => editor.chain().focus().toggleMarque().run()} titre={t("journal.ed.marque")}>
          <Highlighter aria-hidden="true" />
        </Outil>
        <Outil actif={marques.lien} sur={ouvrirLien} titre={t("journal.ed.lien")}>
          <Link2 aria-hidden="true" />
        </Outil>
      </BubbleMenu>

      {/* ── Le menu d insertion ──────────────────────────── */}
      {/* Il sort de la fenetre : celle-ci porte une transformation,
          qui ancre les positions fixes sur elle et rogne ce qui
          depasse. Pose sur le corps du document, il retrouve les
          coordonnees que « coordsAtPos » lui donne. */}
      {slash && items.length > 0 && createPortal(
        <div
          className="jr-slash"
          role="listbox"
          aria-label={t("journal.ed.inserer")}
          style={{
            left: Math.max(8, Math.min(slash.x, window.innerWidth - 268)),
            top: slash.versLeHaut ? undefined : slash.y + 6,
            bottom: slash.versLeHaut ? window.innerHeight - slash.y + 6 : undefined,
          }}
        >
          <div className="jr-slash-tete">{t("journal.ed.inserer")}</div>
          {items.map((c, i) => {
            const Icone = c.icone;
            return (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={i === idx}
                className="jr-slash-item"
                data-actif={i === idx ? "1" : "0"}
                onMouseEnter={() => setSlashIdx(i)}
                onMouseDown={(e) => { e.preventDefault(); choisir(i); }}
              >
                <Icone aria-hidden="true" />
                <span>{t(`journal.ed.${c.id}`)}</span>
                {c.raccourci && <b>{c.raccourci}</b>}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
