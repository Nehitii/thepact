/* LA PORTE D UNE PAGE DE JOURNAL.
 *
 * L editeur ecrit du HTML, la carte le rend avec `dangerouslySetInnerHTML`.
 * Entre les deux, une seule fonction — et elle n avait pas de test.
 * C est la pire place possible pour un defaut silencieux : un
 * assainissement qui laisse passer ne previent personne.
 *
 * L EMPREINTE, PRISE AVANT LA CORRECTION. Sept entrees en base,
 * toutes commencant par <p>, aucune case a cocher, aucun <label>,
 * aucun lien, rien de suspect, la plus longue de 678 caracteres
 * (lecture seule, 31 aout 2026). La porte n a jamais eu a servir.
 *
 * CE QUI TENAIT DEJA : tout ce qui EXECUTE. <script> n est pas
 * execute, <img onerror> disparait, les href en « javascript: » et
 * « data: » sont retires, <iframe>, <svg>, <form> et <style> ne
 * passent pas, et aucun attribut d evenement ne survit.
 *
 * CE QUI NE TENAIT PAS : ce qui S AFFICHE. `FORBID_CONTENTS` REMPLACE
 * la liste de la bibliotheque au lieu de s y ajouter, et c est cette
 * liste-la qui emporte le TEXTE des balises dont le contenu n est pas
 * de la prose. Ne passer que « label » revenait a la vider : vingt et
 * une balises laissaient fuir leur texte, et
 * « <p>a</p><script>alert(1)</script> » rendait « <p>a</p>alert(1) ».
 * Le code n etait pas execute — il etait AFFICHE.
 */
import { describe, expect, it } from "vitest";
import {
  assainirJournal, compterMots, minutesDeLecture, referenceDe, sansParagrapheFinal, texteNu,
} from "./html";

/* Une balise seule en tete de fragment est analysee comme si elle
   etait dans <head> : elle disparait avec son texte, et la fuite ne
   se voit pas. Il faut du contenu AVANT elle — c est-a-dire un
   collage dans un document deja commence. */
const apresDuTexte = (html: string) => assainirJournal("<p>a</p>" + html);

describe("assainirJournal : ce qui n entre pas", () => {
  it("ne laisse passer aucun code executable", () => {
    for (const html of [
      '<script>alert(1)</script>',
      '<img src=x onerror="alert(1)">',
      '<iframe src="https://x"></iframe>',
      '<svg onload="alert(1)"><circle /></svg>',
      '<form action="/x"><input name="a"></form>',
      '<object data="x"></object>',
      '<style>body{display:none}</style>',
    ]) {
      const sortie = apresDuTexte(html);
      expect(sortie, html).toBe("<p>a</p>");
    }
  });

  it("retire les attributs d evenement sans retirer la balise", () => {
    expect(assainirJournal('<p onclick="alert(1)">a</p>')).toBe("<p>a</p>");
    expect(assainirJournal('<span onmouseover="x()">a</span>')).toBe("<span>a</span>");
  });

  it("retire les adresses qui ne sont pas des adresses", () => {
    /* Le lien reste — c est du texte cliquable qui ne mene nulle part
       plutot qu un texte qui disparait. C est l ADRESSE qui saute. */
    for (const mauvaise of ["javascript:alert(1)", "data:text/html,<script>x</script>", "vbscript:x"]) {
      const sortie = assainirJournal(`<a href="${mauvaise}">clic</a>`);
      expect(sortie, mauvaise).not.toContain("href");
      expect(sortie, mauvaise).toContain("clic");
    }
  });

  it("ne garde des balises hors liste que le texte, sans separateur", () => {
    /* CONSTATE, PAS CORRIGE. Un tableau colle dans le journal se
       reduit a la suite de ses cellules, collees les unes aux autres :
       deux mots deviennent un. Ouvrir <table> serait un choix de
       dessin, pas une correction. */
    expect(assainirJournal("<h1>t</h1><table><tr><td>a</td></tr></table>")).toBe("ta");
    expect(compterMots(assainirJournal("<table><tr><td>lait</td><td>pain</td></tr></table>"))).toBe(1);
  });

  it("ne jette pas sur une entree vide ou absente", () => {
    expect(assainirJournal("")).toBe("");
    expect(assainirJournal(undefined as unknown as string)).toBe("");
    expect(assainirJournal(null as unknown as string)).toBe("");
  });
});

describe("assainirJournal : le contenu emporte avec la balise", () => {
  /* Les vingt et une balises relevees comme fuyantes avant la
     correction. Chacune est verifiee une par une : ce n est plus la
     bibliotheque qui protege, c est la mesure. */
  const EMPORTEES = [
    "script", "style", "title", "noframes", "template", "plaintext",
    "textarea", "xmp", "noembed", "iframe", "object", "form",
    "svg", "math", "annotation-xml", "foreignobject", "desc",
    "video", "audio", "label",
  ];

  it.each(EMPORTEES.map((b) => [b]))("<%s> ne laisse pas son texte derriere", (balise) => {
    expect(apresDuTexte(`<${balise}>FUITE</${balise}>`)).not.toContain("FUITE");
  });

  it("emporte le texte pour lecteurs d ecran des cases a cocher", () => {
    const sortie = assainirJournal(
      '<li data-type="taskItem" data-checked="true"><label>Task item checkbox</label><div>lait</div></li>',
    );
    expect(sortie).not.toContain("checkbox");
    expect(sortie).toBe('<li data-type="taskItem" data-checked="true"><div>lait</div></li>');
  });

  it("trois balises restent hors d atteinte, et ce n est pas la porte", () => {
    /* MESURE, PAS CORRIGE, PARCE QUE C EST L ANALYSEUR. <head>,
       <colgroup> et <thead> ne peuvent pas exister la ou on les
       colle : le parseur les DEMONTE avant que l assainissement voie
       l arbre, et leur texte devient un noeud libre auquel plus
       aucune balise n est attachee. Aucun reglage ne peut le
       rattraper. Ce qui sort est de la prose, jamais du balisage —
       c est ce qui rend la chose supportable. */
    for (const b of ["head", "colgroup", "thead"]) {
      const sortie = apresDuTexte(`<${b}>FUITE</${b}>`);
      expect(sortie, b).toBe("<p>a</p>FUITE");
    }
  });

  it("une balise SEULE en tete echappe aussi a la porte, et sans consequence", () => {
    /* Le pendant du piege : en tete de fragment, <noscript> est lu en
       contexte <head> et son texte s echappe — alors qu apres du
       contenu, il est correctement emporte. Un fragment de journal
       commence toujours par un paragraphe : les sept entrees en base
       le confirment, et c est la position ou la porte tient. */
    expect(assainirJournal("<noscript>FUITE</noscript>")).toBe("FUITE");
    expect(apresDuTexte("<noscript>FUITE</noscript>")).toBe("<p>a</p>");
  });
});

describe("assainirJournal : ce qui entre", () => {
  it("laisse passer ce que l editeur sait produire", () => {
    const html = "<h2>t</h2><h3>s</h3><blockquote>c</blockquote><pre><code>x</code></pre><hr>";
    expect(assainirJournal(html)).toBe(html);
    expect(assainirJournal("<p>a<br><strong>b</strong><em>c</em><u>d</u><s>e</s></p>"))
      .toBe("<p>a<br><strong>b</strong><em>c</em><u>d</u><s>e</s></p>");
    expect(assainirJournal("<ul><li>a</li></ul><ol><li>b</li></ol>"))
      .toBe("<ul><li>a</li></ul><ol><li>b</li></ol>");
  });

  it("garde la classe, qui porte la mise en page", () => {
    expect(assainirJournal('<p class="jr-x">a</p>')).toBe('<p class="jr-x">a</p>');
  });

  it("garde les deux attributs de donnee nommes, et EUX SEULS", () => {
    /* `ALLOW_DATA_ATTR: false` ferme la famille entiere ; les deux
       nommes dans la liste passent quand meme. C est ce qui permet a
       la feuille de style de dessiner la case sans qu un <input>
       cliquable mente dans une page qu on relit. */
    expect(assainirJournal('<li data-type="taskItem" data-checked="false">a</li>'))
      .toBe('<li data-type="taskItem" data-checked="false">a</li>');
    expect(assainirJournal('<p data-secret="x" data-id="1">a</p>')).toBe("<p>a</p>");
  });
});

describe("assainirJournal : le lien s ouvre ailleurs", () => {
  it("pose la cible et la relation sur tout lien", () => {
    expect(assainirJournal('<a href="https://exemple.fr">clic</a>'))
      .toBe('<a href="https://exemple.fr" target="_blank" rel="noopener noreferrer nofollow">clic</a>');
  });

  it("remplace une cible et une relation deja posees", () => {
    /* Un lien colle peut arriver avec « target="_self" » ou sans
       « noopener » : on n herite pas de ce qu on n a pas ecrit. */
    const sortie = assainirJournal('<a href="https://x.fr" target="_self" rel="opener">clic</a>');
    expect(sortie).toContain('target="_blank"');
    expect(sortie).toContain('rel="noopener noreferrer nofollow"');
    expect(sortie).not.toContain("_self");
  });

  it("pose la relation meme quand l adresse a ete retiree", () => {
    expect(assainirJournal('<a href="javascript:x">clic</a>'))
      .toBe('<a target="_blank" rel="noopener noreferrer nofollow">clic</a>');
  });

  it("rend la meme chose au centieme appel qu au premier", () => {
    /* BALAYAGE : lever le verrou qui n installe le crochet qu une
       fois SURVIT, et c est juste — `addHook` empile, mais poser deux
       fois les memes attributs donne le meme resultat. Le verrou
       protege d une pile qui grandirait sans fin a chaque rendu,
       jamais du texte rendu : aucune sortie ne peut le montrer. On
       verifie donc ce qui EST observable — que rien ne derive. */
    const attendu = assainirJournal('<a href="https://x.fr">clic</a>');
    for (let i = 0; i < 100; i++)
      expect(assainirJournal('<a href="https://x.fr">clic</a>')).toBe(attendu);
  });
});

describe("texteNu et compterMots", () => {
  it("reduit le balisage a des espaces et compte les mots", () => {
    expect(texteNu("<p>un deux trois</p>")).toBe("un deux trois");
    expect(compterMots("<p>un deux trois</p>")).toBe(3);
    expect(texteNu("<p>a</p><p>b</p>")).toBe("a b");
    expect(compterMots("<p>a</p><p>b</p>")).toBe(2);
  });

  it("traite l espace insecable comme une espace", () => {
    expect(texteNu("<p>a&nbsp;b</p>")).toBe("a b");
    expect(compterMots("<p>a&nbsp;b</p>")).toBe(2);
  });

  it("rend une chaine vide pour du vide, et zero mot", () => {
    for (const h of ["", "   ", "<p></p>", undefined as unknown as string]) {
      expect(texteNu(h), String(h)).toBe("");
      expect(compterMots(h), String(h)).toBe(0);
    }
  });

  it("ne decode pas les autres entites : elles comptent pour un mot", () => {
    /* CONSTATE. « &amp; » reste tel quel et pese un mot. Pour un
       compteur de mots affiche a cote d un editeur, l ecart est sans
       consequence ; le corriger demanderait un vrai analyseur. */
    expect(texteNu("<p>&amp; &lt;</p>")).toBe("&amp; &lt;");
    expect(compterMots("<p>&amp; &lt;</p>")).toBe(2);
  });

  it("n est pas un analyseur : un chevron dans un attribut le trompe", () => {
    /* CONSTATE. La regex s arrete au premier « > ». Sur du HTML
       d editeur, le cas ne se presente pas ; sur du HTML colle, il
       fausse le compte d un mot ou deux. C est un compteur, pas un
       rendu — et ce qui est AFFICHE passe, lui, par un vrai
       analyseur. */
    expect(texteNu('<a href="a>b">x</a>')).toBe('b">x');
  });
});

describe("sansParagrapheFinal", () => {
  it("retire le paragraphe vide que l editeur garde pour la main", () => {
    for (const vide of ["<p></p>", "<p> </p>", "<p>&nbsp;</p>", "<p><br></p>", "<p><br/></p>"])
      expect(sansParagrapheFinal("<p>a</p>" + vide), vide).toBe("<p>a</p>");
  });

  it("en retire plusieurs a la suite", () => {
    expect(sansParagrapheFinal("<p>a</p><p></p><p><br></p><p>&nbsp;</p>")).toBe("<p>a</p>");
  });

  it("ne touche a rien d autre", () => {
    expect(sansParagrapheFinal("<p>a</p>")).toBe("<p>a</p>");
    expect(sansParagrapheFinal("<p></p><p>a</p>")).toBe("<p></p><p>a</p>");
    expect(sansParagrapheFinal("")).toBe("");
    expect(sansParagrapheFinal(undefined as unknown as string)).toBe("");
  });

  it("laisse un document entierement vide devenir vide", () => {
    expect(sansParagrapheFinal("<p></p>")).toBe("");
  });

  it("ne reconnait qu un <p> nu, et rien apres lui", () => {
    /* CONSTATE, PAS CORRIGE. Un paragraphe final portant une classe,
       ou suivi d une espace, n est pas retire — la regex exige « <p> »
       sans attribut et l ancre en fin de chaine. Elargir reviendrait
       a risquer d emporter un paragraphe qui compte ; l editeur emet
       des <p> nus, et les sept entrees en base le confirment. */
    expect(sansParagrapheFinal("<p>a</p><p class='x'></p>")).toBe("<p>a</p><p class='x'></p>");
    expect(sansParagrapheFinal("<p>a</p><p></p> ")).toBe("<p>a</p><p></p> ");
  });

  it("ne se laisse pas berner par une balise en majuscules", () => {
    /* BALAYAGE : retirer le drapeau d insensibilite a la casse
       survivait. L editeur emet des balises minuscules, mais un
       collage venu d ailleurs peut arriver en majuscules — et un
       paragraphe vide y serait aussi vide. */
    expect(sansParagrapheFinal("<P>a</P><P></P>")).toBe("<P>a</P>");
    expect(sansParagrapheFinal("<p>a</p><P><BR></P>")).toBe("<p>a</p>");
  });
});

describe("referenceDe : la cote de la piece rangee", () => {
  it("prend les quatre derniers signes hexadecimaux, en majuscules", () => {
    expect(referenceDe("3f2a1b9c-1234-5678-9abc-def012345678")).toBe("REF·5678");
    expect(referenceDe("AB-cd")).toBe("REF·ABCD");
    expect(referenceDe("0000")).toBe("REF·0000");
  });

  it("ne garde que l hexadecimal", () => {
    expect(referenceDe("zzzz")).toBe("REF·");
    expect(referenceDe("z1z2z3z4z5")).toBe("REF·2345");
  });

  it("rend une cote courte plutot que de completer", () => {
    expect(referenceDe("abc")).toBe("REF·ABC");
    expect(referenceDe("1")).toBe("REF·1");
    expect(referenceDe("")).toBe("REF·");
  });
});

describe("minutesDeLecture : deux cents mots la minute", () => {
  it("arrondit au plus proche", () => {
    expect(minutesDeLecture(200)).toBe(1);
    expect(minutesDeLecture(299)).toBe(1);
    expect(minutesDeLecture(300)).toBe(2);
    expect(minutesDeLecture(500)).toBe(3);
    expect(minutesDeLecture(1000)).toBe(5);
  });

  it("ne descend jamais sous la minute", () => {
    /* Une page de trois mots se lit en une minute affichee : « 0 min »
       dirait qu il n y a rien a lire. */
    for (const m of [0, 1, 50, 99]) expect(minutesDeLecture(m), String(m)).toBe(1);
  });
});
