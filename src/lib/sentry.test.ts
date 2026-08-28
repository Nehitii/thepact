import { beforeEach, describe, expect, it, vi } from "vitest";
import { attacher, captureException, setUser, _reinitialiser, _enAttente } from "./sentry";

/* ═══════════════════════════════════════════════════════════════
   Ce que ces tests protègent : la file d'attente.

   Le relais n'existe que pour garder Sentry hors du premier
   chargement. Le prix de ce report, c'est un intervalle pendant lequel
   les appels n'ont personne à qui parler. S'ils étaient perdus, on
   troquerait 159 Ko contre des erreurs invisibles au démarrage —
   précisément le moment où elles comptent le plus.

   Et si la file n'avait pas de borne, une erreur en boucle avant le
   chargement ferait grossir un tableau que personne ne vide : on aurait
   remplacé une lenteur par une fuite.
   ═══════════════════════════════════════════════════════════════ */

describe("relais Sentry", () => {
  beforeEach(() => _reinitialiser());

  it("met les appels de côté tant que Sentry n'est pas là", () => {
    setUser({ id: "abc" });
    captureException(new Error("tôt"));
    expect(_enAttente()).toBe(2);
  });

  it("rejoue la file dans l'ordre au moment du branchement", () => {
    const vus: string[] = [];
    setUser({ id: "abc" });
    captureException(new Error("tôt"));
    setUser(null);

    attacher({
      setUser: (u) => vus.push("setUser:" + (u?.id ?? "null")),
      captureException: (e) => vus.push("capture:" + (e as Error).message),
    });

    expect(vus).toEqual(["setUser:abc", "capture:tôt", "setUser:null"]);
    expect(_enAttente()).toBe(0);
  });

  it("passe les appels suivants en direct, sans les mettre en file", () => {
    const vus: string[] = [];
    attacher({
      setUser: (u) => vus.push("setUser:" + (u?.id ?? "null")),
      captureException: (e) => vus.push("capture:" + (e as Error).message),
    });

    setUser({ id: "xyz" });
    captureException(new Error("tard"));

    expect(vus).toEqual(["setUser:xyz", "capture:tard"]);
    expect(_enAttente()).toBe(0);
  });

  it("borne la file : une erreur en boucle ne fait pas gonfler la mémoire", () => {
    for (let i = 0; i < 500; i++) captureException(new Error("boucle " + i));
    expect(_enAttente()).toBe(20);
  });

  it("ne laisse pas un rapport d'erreur casser l'application", () => {
    captureException(new Error("un"));
    captureException(new Error("deux"));
    const vus: string[] = [];
    expect(() =>
      attacher({
        setUser: () => {},
        captureException: (e) => {
          if ((e as Error).message === "un") throw new Error("Sentry est tombé");
          vus.push((e as Error).message);
        },
      }),
    ).not.toThrow();
    /* Le second passe quand même : un échec n'interrompt pas la file. */
    expect(vus).toEqual(["deux"]);
  });

  it("n'appelle rien si Sentry n'arrive jamais — et ne jette pas", () => {
    expect(() => {
      setUser({ id: "abc" });
      captureException(new Error("jamais rapportée"));
    }).not.toThrow();
  });
});

/* Le garde-fou qui compte vraiment : personne ne doit réintroduire un
   import statique de @sentry/react, sous peine de ramener les 159 Ko
   dans le chemin critique sans que rien ne le signale. */
describe("le paquet de démarrage", () => {
  it("ne contient aucun import statique de @sentry/react hors de main.tsx", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const racine = path.resolve(__dirname, "..");
    const coupables: string[] = [];

    (function parcourir(d: string) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) parcourir(p);
        else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name)) {
          const contenu = fs.readFileSync(p, "utf8");
          const statique = /^\s*import[^\n]*from\s+["']@sentry\/react["']/m.test(contenu);
          if (statique && !p.endsWith("main.tsx")) coupables.push(path.relative(racine, p));
        }
      }
    })(racine);

    expect(coupables).toEqual([]);
  });
});
