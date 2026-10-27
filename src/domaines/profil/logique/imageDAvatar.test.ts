import { describe, it, expect } from "vitest";
import { refuserLImage, antiCache, extensionDe, POIDS_MAX } from "./imageDAvatar";
import { niveauDuRang } from "@/domaines/succes";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   UN FILTRE QUI LAISSE TOUT PASSER NE SE VOIT PAS. Le dépôt réussit, la
   fiche s'affiche — et c'est trois mois plus tard, sur une connexion
   lente, que le poids se remarque.

   Et une règle qui était écrite DEUX FOIS : le niveau, calculé
   identiquement sur le hub et sur la fiche publique. Le commentaire de
   la seconde le disait — « le hub le calcule de la même façon » — et
   personne ne les avait réunies.
   ═══════════════════════════════════════════════════════════════ */

const fichier = (type: string, size = 1000) => ({ type, size });

describe("ce qu'on accepte comme avatar", () => {
  it("laisse passer les quatre formats qu'un navigateur affiche", () => {
    for (const t of ["image/jpeg", "image/png", "image/webp", "image/gif"]) {
      expect(refuserLImage(fichier(t)), t).toBeNull();
    }
  });

  it("refuse ce qu'un navigateur n'affiche pas seul", () => {
    for (const t of ["image/tiff", "application/pdf", "image/svg+xml", "", "text/plain"]) {
      expect(refuserLImage(fichier(t)), t).toBe("format");
    }
  });

  it("accepte EXACTEMENT cinq mégaoctets", () => {
    /* Le message dit « 5 Mo au maximum ». Refuser à la limite le ferait
       mentir — et c'est le genre d'écart qu'on ne comprend pas quand on
       le subit. */
    expect(refuserLImage(fichier("image/png", POIDS_MAX))).toBeNull();
    expect(refuserLImage(fichier("image/png", POIDS_MAX + 1))).toBe("poids");
  });

  it("regarde le format AVANT le poids", () => {
    /* Un PDF de dix mégaoctets est refusé pour ce qu'il est, pas pour
       sa taille : le message doit dire la bonne raison. */
    expect(refuserLImage(fichier("application/pdf", POIDS_MAX * 2))).toBe("format");
  });

  it("ne refuse rien quand il n'y a pas de fichier", () => {
    /* Annuler le sélecteur ne doit pas afficher une erreur. */
    expect(refuserLImage(null)).toBeNull();
    expect(refuserLImage(undefined)).toBeNull();
  });
});

describe("forcer le navigateur à relire l'image", () => {
  it("colle le paramètre selon que l'adresse porte déjà une requête", () => {
    /* L'adresse signée ne change pas quand l'image derrière change : le
       navigateur réaffiche l'ancienne, et on croit que le dépôt a
       échoué. Un « & » là où il faut un « ? » casse l'adresse. */
    expect(antiCache("https://x/a.webp", 42)).toBe("https://x/a.webp?t=42");
    expect(antiCache("https://x/a.webp?token=abc", 42)).toBe("https://x/a.webp?token=abc&t=42");
  });
});

describe("l'extension du fichier optimisé", () => {
  it("garde le GIF, convertit tout le reste en WEBP", () => {
    /* Un GIF anime perdrait son animation en devenant WEBP statique. */
    expect(extensionDe("image/gif")).toBe("gif");
    for (const t of ["image/jpeg", "image/png", "image/webp"]) expect(extensionDe(t)).toBe("webp");
  });
});

describe("le niveau, qui est un rang dans une liste", () => {
  const paliers = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("compte à partir de un, pas de zéro", () => {
    expect(niveauDuRang({ currentRank: { id: "a" }, ranks: paliers })).toBe(1);
    expect(niveauDuRang({ currentRank: { id: "c" }, ranks: paliers })).toBe(3);
  });

  it("rend le premier niveau quand le palier est introuvable", () => {
    /* La liste a pu changer sous le palier enregistré, et « niveau 0 »
       ne veut rien dire pour qui le lit. */
    expect(niveauDuRang({ currentRank: { id: "disparu" }, ranks: paliers })).toBe(1);
  });

  it("rend le premier niveau sur une lecture vide", () => {
    expect(niveauDuRang(null)).toBe(1);
    expect(niveauDuRang({ currentRank: null, ranks: paliers })).toBe(1);
    expect(niveauDuRang({ currentRank: { id: "a" }, ranks: [] })).toBe(1);
  });
});
