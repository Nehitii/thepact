import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { EncreEtat, Lueur, Marque } from "@/domaines/journal/logique/marques";

/* CE QUE L EDITEUR SAIT ECRIRE
 *
 * La liste vivait dans le composant, et rien ne la montait hors du
 * navigateur : aucun test ne verifiait que le schema se construit,
 * que les trois marques de la maison cohabitent avec le kit de
 * depart, ni que « mergeAttributes » — la fonction qu une faille du
 * 15/09 a fait monter TipTap de 3.30 a 3.31 — rend toujours nos
 * classes.
 *
 * La liste est ici pour etre montee deux fois : par l editeur, et par
 * son test. C est une fonction et non une constante parce que TipTap
 * garde de l etat dans une extension configuree ; deux editeurs ne
 * doivent pas se partager la meme instance.
 */
export function extensionsDuJournal() {
  return [
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
  ];
}
