import { describe, expect, it } from "vitest";
import { ACCES, etatDAcces } from "./accesRapides";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Les refontes de l'Accès rapide ne décident rien elles-mêmes : le
   verrou d'un module, l'état du tirage et ce que dit le bouton
   viennent d'ici. Une erreur ferait ouvrir une page payante à qui ne
   l'a pas achetée, ou tirer une deuxième mission par-dessus la
   première.
   ═══════════════════════════════════════════════════════════════ */

const tout = { "todo-list": true, journal: true, "track-health": true } as const;
const rien = { "todo-list": false, journal: false, "track-health": false } as const;
const libre = { ouvert: false, disponible: true };
const acces = (id: string) => ACCES.find((a) => a.id === id)!;

describe("les accès rapides", () => {
  it("ne mènent qu'une fois à chaque page", () => {
    const routes = ACCES.map((a) => a.route).filter(Boolean);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it("verrouillent un module qui n'est pas acheté", () => {
    expect(etatDAcces(acces("journal"), rien, libre).verrouille).toBe(true);
    expect(etatDAcces(acces("journal"), tout, libre).verrouille).toBe(false);
    expect(etatDAcces(acces("journal"), rien, libre).titre).toContain("boutique");
  });

  it("ne verrouillent jamais un accès sans module", () => {
    expect(etatDAcces(acces("objectif"), rien, libre).verrouille).toBe(false);
    expect(etatDAcces(acces("revue"), rien, libre).verrouille).toBe(false);
  });

  it("rendent le tirage indisponible pendant une mission, et jamais ouvert alors", () => {
    const e = etatDAcces(acces("tirage"), tout, { ouvert: true, disponible: false });
    expect(e.indisponible).toBe(true);
    expect(e.ouvert).toBe(false);
    expect(e.titre).toBe("Une mission est déjà en cours");
  });

  it("disent ce que fera l'appui sur le tirage", () => {
    expect(etatDAcces(acces("tirage"), tout, libre).titre).toBe("Ouvrir le tirage de mission");
    expect(etatDAcces(acces("tirage"), tout, { ouvert: true, disponible: true }).titre)
      .toBe("Fermer le tirage de mission");
  });
});
