import { describe, it, expect, afterEach } from "vitest";
import { Editor, mergeAttributes } from "@tiptap/core";
import { extensionsDuJournal } from "@/domaines/journal/logique/extensions";

/* L EDITEUR, MONTE SANS REACT.
 *
 * L editeur du journal est derriere la session, la double
 * authentification et l ouverture d une fenetre : personne ne le
 * regarde a chaque montee de TipTap. Ici on construit le meme editeur
 * sur un simple <div> de jsdom, avec la liste exacte de ses
 * extensions, et on lui fait ecrire ce que la carte du journal doit
 * savoir relire. */

const ouverts: Editor[] = [];

function editeur(contenu = "<p></p>") {
  const e = new Editor({ extensions: extensionsDuJournal(), content: contenu });
  ouverts.push(e);
  return e;
}

afterEach(() => {
  while (ouverts.length) ouverts.pop()?.destroy();
});

describe("le schema du journal", () => {
  it("se construit avec les trois marques de la maison et les cases a cocher", () => {
    const e = editeur();
    expect(Object.keys(e.schema.marks)).toEqual(expect.arrayContaining(["lueur", "marque", "encre"]));
    expect(Object.keys(e.schema.nodes)).toEqual(expect.arrayContaining(["taskList", "taskItem", "heading"]));
  });

  it("ne connait que les titres de niveau 2 et 3", () => {
    const e = editeur("<p>titre</p>");
    e.commands.selectAll();
    expect(e.commands.toggleHeading({ level: 1 })).toBe(false);
    expect(e.commands.toggleHeading({ level: 2 })).toBe(true);
    expect(e.getHTML()).toContain("<h2>");
  });

  it("garde les cases a cocher a plat", () => {
    const e = editeur();
    const cases = e.extensionManager.extensions.find((x) => x.name === "taskItem");
    expect(cases?.options.nested).toBe(false);
  });
});

describe("ce que l editeur ecrit et relit", () => {
  it("fait l aller-retour des trois marques par leur classe", () => {
    const e = editeur(
      '<p><span class="jr-lueur">a</span> <span class="jr-marque">b</span> <span class="jr-encre jr-encre-tension">c</span></p>',
    );
    const html = e.getHTML();
    expect(html).toContain('<span class="jr-lueur">a</span>');
    expect(html).toContain('<span class="jr-marque">b</span>');
    expect(html).toContain('<span class="jr-encre jr-encre-tension">c</span>');
  });

  it("relit un <mark> venu d ailleurs comme une marque de la maison", () => {
    const e = editeur("<p><mark>b</mark></p>");
    expect(e.getHTML()).toContain('<span class="jr-marque">b</span>');
  });

  it("ramene une encre hors palette a l encre du document", () => {
    const e = editeur('<p><span class="jr-encre jr-encre-fuchsia">c</span></p>');
    expect(e.getHTML()).toContain("jr-encre-flow");
    expect(e.getHTML()).not.toContain("fuchsia");
  });

  it("pose et retire une encre par ses commandes, et refuse ce qui n est pas dans la palette", () => {
    const e = editeur("<p>texte</p>");
    e.commands.selectAll();
    expect(e.commands.setEncre("fuchsia")).toBe(false);
    expect(e.getHTML()).not.toContain("jr-encre");
    expect(e.commands.setEncre("surge")).toBe(true);
    expect(e.getHTML()).toContain('class="jr-encre jr-encre-surge"');
    expect(e.commands.unsetEncre()).toBe(true);
    expect(e.getHTML()).toBe("<p>texte</p>");
  });

  it("sort chaque lien avec rel et target, sans jamais l ouvrir au clic", () => {
    const e = editeur('<p><a href="https://exemple.test/x">lien</a></p>');
    const html = e.getHTML();
    expect(html).toContain('rel="noopener noreferrer nofollow"');
    expect(html).toContain('target="_blank"');
    const lien = e.extensionManager.extensions.find((x) => x.name === "link");
    expect(lien?.options.openOnClick).toBe(false);
  });
});

describe("mergeAttributes, la fonction qui a fait monter TipTap", () => {
  /* GHSA-cp6q-959q-f8rh : avant 3.30.4, une cle « __proto__ » venue
     d un document hostile devenait le prototype de l objet fusionne,
     et ses membres — « onclick », par exemple — se retrouvaient poses
     sur l element comme des attributs herites. */
  it("ne laisse pas une cle __proto__ changer le prototype des attributs", () => {
    const hostile = JSON.parse('{"__proto__":{"onclick":"alert(1)"}}') as Record<string, unknown>;
    const fusion = mergeAttributes(hostile, { class: "jr-lueur" });
    expect(Object.getPrototypeOf(fusion)).toBe(Object.prototype);
    expect("onclick" in fusion).toBe(false);
    expect(fusion.class).toBe("jr-lueur");
  });

  it("fusionne les classes sans doublon, comme nos marques s y attendent", () => {
    expect(mergeAttributes({ class: "jr-encre jr-encre-flow" }, { class: "jr-encre" }).class).toBe("jr-encre jr-encre-flow");
  });
});
