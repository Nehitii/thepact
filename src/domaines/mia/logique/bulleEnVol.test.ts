/* LES QUATRE CHEMINS, ET CE QUI LES REUNIT.
 *
 * On tapait, le champ se vidait, et il ne se passait plus rien jusqu a
 * la reponse. Sur le chemin du modele, la question est ecrite COTE
 * SERVEUR : entre la frappe et les premiers en-tetes, elle n existe ni
 * en base, ni dans le cache, ni a l ecran.
 *
 * Ce module tient la seule decision delicate de la correction : QUAND
 * la bulle provisoire s efface. Trop tot, la question disparait avant
 * de revenir ; trop tard, elle double la vraie.
 */
import { describe, expect, it } from "vitest";
import { aAtterri, combienDeFois, prendreLeVol } from "./bulleEnVol";
import type { MessageMia } from "@/domaines/mia/types";

const msg = (role: string, content: string, i = 0): MessageMia => ({
  id: role + i,
  conversation_id: "fil",
  role,
  content,
  created_at: new Date(1788000000000 + i).toISOString(),
} as MessageMia);

describe("prendreLeVol : ce qu on retient au depart", () => {
  it("retient le texte et zero quand le fil ne l a jamais porte", () => {
    expect(prendreLeVol([msg("user", "bonjour"), msg("assistant", "salut")], "ou j en suis"))
      .toEqual({ texte: "ou j en suis", dejaLa: 0 });
  });

  it("retient combien de fois la question a deja ete posee", () => {
    const fil = [msg("user", "resume", 1), msg("assistant", "…", 2), msg("user", "resume", 3)];
    expect(prendreLeVol(fil, "resume")).toEqual({ texte: "resume", dejaLa: 2 });
  });

  it("compte zero sur un fil qui n existe pas encore", () => {
    /* LE PREMIER MESSAGE SANS FIL. La liste est vide — voire absente —
       puisque la conversation n est pas creee. */
    expect(prendreLeVol(undefined, "premier")).toEqual({ texte: "premier", dejaLa: 0 });
    expect(prendreLeVol([], "premier")).toEqual({ texte: "premier", dejaLa: 0 });
  });

  it("ne compte que les questions, jamais les reponses", () => {
    /* M.I.A. peut citer la question dans sa reponse ; cela ne la fait
       pas atterrir. */
    expect(combienDeFois([msg("assistant", "ou j en suis")], "ou j en suis")).toBe(0);
  });
});

describe("aAtterri : les quatre chemins", () => {
  const enVol = prendreLeVol([], "ou j en suis");

  it("le REFLEXE — la ligne parait dans le cache avant la base", () => {
    /* `ecrireEchange` pose les deux lignes d un coup ; la question
       suffit a faire atterrir. */
    expect(aAtterri([], enVol)).toBe(false);
    expect(aAtterri([msg("user", "ou j en suis")], enVol)).toBe(true);
  });

  it("le GESTE — meme chemin que le reflexe", () => {
    expect(aAtterri(
      [msg("user", "ou j en suis"), msg("assistant", "C est fait.", 1)], enVol,
    )).toBe(true);
  });

  it("le MODELE — la ligne arrive par l invalidation qui suit la reponse", () => {
    /* Le serveur ecrit la question, puis la reponse ; le client
       invalide. Les deux paraissent donc ensemble. */
    expect(aAtterri(
      [msg("user", "ou j en suis"), msg("assistant", "Tu en es a…", 1)], enVol,
    )).toBe(true);
  });

  it("le PREMIER MESSAGE SANS FIL — la liste change de fil sous la bulle", () => {
    /* On part de rien, on cree la conversation, et la liste devient
       celle du fil neuf. Le compte de depart valait zero : la premiere
       question qui parait fait atterrir. */
    const neuf = prendreLeVol(undefined, "premier");
    expect(aAtterri(undefined, neuf)).toBe(false);
    expect(aAtterri([], neuf)).toBe(false);
    expect(aAtterri([msg("user", "premier")], neuf)).toBe(true);
  });

  it("l ECHEC — l excuse rattrape la question si le serveur ne l a pas ecrite", () => {
    const fil = [msg("user", "ou j en suis"), msg("assistant", "Je ne peux pas.", 1)];
    expect(aAtterri(fil, enVol)).toBe(true);
  });
});

describe("aAtterri : ce qui ne doit PAS la faire atterrir", () => {
  it("une question deja au fil, posee avant l envoi", () => {
    /* LE PIEGE DU DOUBLE ENVOI. Renvoyer la meme phrase effacerait la
       seconde bulle sur la vue de la premiere si l on se contentait de
       chercher le texte. */
    const fil = [msg("user", "resume", 1), msg("assistant", "…", 2)];
    const enVol = prendreLeVol(fil, "resume");
    expect(aAtterri(fil, enVol)).toBe(false);
    expect(aAtterri([...fil, msg("user", "resume", 3)], enVol)).toBe(true);
  });

  it("une autre question", () => {
    const enVol = prendreLeVol([], "ou j en suis");
    expect(aAtterri([msg("user", "mes taches")], enVol)).toBe(false);
  });

  it("rien du tout", () => {
    expect(aAtterri([msg("user", "x")], null)).toBe(false);
    expect(aAtterri(undefined, null)).toBe(false);
  });

  it("un fil qui perd des messages ne la fait pas atterrir", () => {
    /* Changer de fil en cours de vol ramene un compte plus bas, pas
       plus haut : la bulle reste, et c est ce qu on veut — la question
       n a toujours pas paru. */
    const fil = [msg("user", "resume", 1), msg("user", "resume", 2)];
    const enVol = prendreLeVol(fil, "resume");
    expect(aAtterri([], enVol)).toBe(false);
  });
});
