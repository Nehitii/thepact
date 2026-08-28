import { Mark, mergeAttributes } from "@tiptap/core";

/* LES MARQUES DE LA MAISON
 *
 * Trois marques que TipTap ne fournit pas et qui appartiennent a
 * cette application. Elles ne portent aucune couleur en dur : elles
 * posent une classe, et la feuille de style du journal decide de ce
 * que la classe veut dire — en laque comme sur papier.
 *
 * C est ce qui garantit que la carte du journal les rend exactement
 * comme l editeur : meme classe, meme regle, un seul endroit ou la
 * couleur est ecrite.
 *
 * La couleur d etat est portee par la classe elle meme et non par un
 * attribut : une classe traverse tous les assainisseurs, un attribut
 * maison n en a pas la garantie.
 */

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    marquesJournal: {
      /** Le passage prend la lumiere. */
      toggleLueur: () => ReturnType;
      /** Le passage est surligne. */
      toggleMarque: () => ReturnType;
      /** Le texte prend l encre d un etat. */
      setEncre: (etat: string) => ReturnType;
      /** Le texte revient a l encre du document. */
      unsetEncre: () => ReturnType;
    };
  }
}

/** Les seules encres possibles : la palette reste tenue. */
export const ETATS_ENCRE = ["flow", "tension", "static", "signal", "void", "surge"] as const;
export type EtatEncre = (typeof ETATS_ENCRE)[number];

const estEtat = (v: string | null | undefined): v is EtatEncre =>
  !!v && (ETATS_ENCRE as readonly string[]).includes(v);

export const Lueur = Mark.create({
  name: "lueur",

  parseHTML() {
    return [{ tag: "span.jr-lueur" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "jr-lueur" }), 0];
  },

  addCommands() {
    return {
      toggleLueur: () => ({ commands }) => commands.toggleMark(this.name),
    };
  },

  addKeyboardShortcuts() {
    return { "Mod-Shift-l": () => this.editor.commands.toggleLueur() };
  },
});

export const Marque = Mark.create({
  name: "marque",

  parseHTML() {
    return [{ tag: "span.jr-marque" }, { tag: "mark" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "jr-marque" }), 0];
  },

  addCommands() {
    return {
      toggleMarque: () => ({ commands }) => commands.toggleMark(this.name),
    };
  },

  addKeyboardShortcuts() {
    return { "Mod-Shift-h": () => this.editor.commands.toggleMarque() };
  },
});

export const EncreEtat = Mark.create({
  name: "encre",

  addAttributes() {
    return {
      etat: {
        default: "flow" as EtatEncre,
        parseHTML: (element) => {
          const trouve = element.className.match(/jr-encre-([a-z]+)/)?.[1];
          return estEtat(trouve) ? trouve : "flow";
        },
        renderHTML: (attributs) => {
          const etat = estEtat(attributs.etat as string) ? attributs.etat : "flow";
          return { class: `jr-encre jr-encre-${etat}` };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "span.jr-encre" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setEncre: (etat: string) => ({ commands }) => {
        if (!estEtat(etat)) return false;
        return commands.setMark(this.name, { etat });
      },
      unsetEncre: () => ({ commands }) => commands.unsetMark(this.name),
    };
  },
});
