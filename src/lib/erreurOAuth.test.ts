import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* Le module capture à l'import. Chaque cas doit donc poser l'URL AVANT
   d'importer, et repartir d'un module neuf — d'où `resetModules` et
   l'import dynamique. */

async function chargerAvec(url: string) {
  window.history.replaceState({}, "", url);
  vi.resetModules();
  return import("./erreurOAuth");
}

describe("erreurOAuth", () => {
  const depart = window.location.href;
  beforeEach(() => vi.resetModules());
  afterEach(() => window.history.replaceState({}, "", depart));

  it("lit l'erreur laissée dans le fragment", async () => {
    const m = await chargerAvec(
      "/#error=access_denied&error_code=provider_email_needs_verification&error_description=Unverified+email+with+google",
    );
    expect(m.consommerErreurOAuth()).toEqual({
      code: "provider_email_needs_verification",
      description: "Unverified email with google",
    });
  });

  it("lit aussi l'erreur laissée en paramètres de requête", async () => {
    const m = await chargerAvec("/auth?error=access_denied&error_description=refus");
    expect(m.consommerErreurOAuth()).toEqual({ code: "access_denied", description: "refus" });
  });

  it("efface l'erreur de l'URL, pour qu'elle ne se rejoue pas au rechargement", async () => {
    await chargerAvec("/auth?garde=moi&error=access_denied&error_description=refus");
    expect(window.location.search).not.toContain("error");
    expect(window.location.search).toContain("garde=moi");
  });

  it("NE TOUCHE PAS un fragment qui porte un jeton — c'est une connexion en train de réussir", async () => {
    const jeton = "#access_token=abc.def.ghi&expires_in=3600&token_type=bearer";
    const m = await chargerAvec("/" + jeton);
    expect(m.consommerErreurOAuth()).toBeNull();
    expect(window.location.hash).toBe(jeton);
  });

  it("ne rend rien quand l'URL est ordinaire", async () => {
    const m = await chargerAvec("/auth");
    expect(m.consommerErreurOAuth()).toBeNull();
  });

  it("se consomme une seule fois", async () => {
    const m = await chargerAvec("/#error_code=access_denied&error_description=x");
    expect(m.consommerErreurOAuth()).not.toBeNull();
    expect(m.consommerErreurOAuth()).toBeNull();
  });

  it("traduit les codes que les fournisseurs renvoient vraiment", async () => {
    const m = await chargerAvec("/auth");
    expect(m.messageDErreurOAuth({ code: "access_denied", description: "" })).toMatch(/refusée/i);
    expect(m.messageDErreurOAuth({ code: "provider_email_needs_verification", description: "" })).toMatch(
      /vérifiée/i,
    );
  });

  it("retombe sur la description brute pour un code inconnu", async () => {
    const m = await chargerAvec("/auth");
    expect(m.messageDErreurOAuth({ code: "quelque_chose_de_neuf", description: "Something broke" })).toBe(
      "Something broke",
    );
  });
});
