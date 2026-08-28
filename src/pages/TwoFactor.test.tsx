import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Trois défauts sont sortis de cette page le 28/08, en une soirée :

     1. ELLE PLANTAIT AU MONTAGE. « Cannot read properties of undefined
        (reading '5') » — une case lisait le contexte d'`input-otp`,
        que la voie `render` ne fournit pas.
     2. LA PORTE S'OUVRAIT SANS CODE. Une entrée de cache périmée
        disait « aal2 déjà obtenu » et l'effet de redirection partait
        avant que la vérité n'arrive.
     3. ELLE SCINTILLAIT. Le jeton d'accès était dans la clé de
        requête ; chaque réémission montait une requête neuve.

   Les deux premiers se testent ici. Le troisième se voit, et se teste
   par sa cause : la stabilité de la clé, dans useMfa.

   Le second est le seul défaut de SÛRETÉ du lot : le mur reste porté
   par 88 politiques RLS qui exigent aal2, mais une porte qui cesse de
   se montrer laisse entrer dans une application vide sans dire
   pourquoi.
   ═══════════════════════════════════════════════════════════════ */

const naviguer = vi.fn();

vi.mock("react-router-dom", async () => {
  const vrai = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...vrai, useNavigate: () => naviguer };
});

vi.mock("react-i18next", () => ({
  /* `t(cle, repli)` rend le repli : les textes affichés sont ceux du
     code, pas ceux d'un fichier de traduction qu'on ne teste pas ici. */
  useTranslation: () => ({ t: (_cle: string, repli?: string) => repli ?? _cle }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const verifier = vi.fn();
let etatMfa: Record<string, unknown>;

vi.mock("@/hooks/useMfa", () => ({ useMfa: () => etatMfa }));
vi.mock("@/hooks/useCodesDeSecours", () => ({
  useCodesDeSecours: () => ({ utiliser: vi.fn() }),
  motifLisible: (m: string) => m,
}));

import TwoFactor from "./TwoFactor";

const monter = () =>
  render(
    <MemoryRouter>
      <TwoFactor />
    </MemoryRouter>,
  );

beforeEach(() => {
  naviguer.mockClear();
  verifier.mockClear();
  etatMfa = {
    isLoading: false,
    isFetching: false,
    isRequired: true,
    verify: verifier,
    refresh: vi.fn(),
  };
});

describe("la porte s'affiche", () => {
  it("monte sans lever — six cases et un champ de saisie", () => {
    /* Le test du plantage. La version fautive levait ici même. */
    const { container } = monter();
    expect(container.querySelectorAll(".sas-case")).toHaveLength(6);
    expect(container.querySelector('input[autocomplete="one-time-code"]')).not.toBeNull();
  });

  it("le champ annonce un code à usage unique, en six caractères", () => {
    /* `one-time-code` est ce qui permet à un téléphone de proposer le
       code sans qu'on le recopie : ce n'est pas cosmétique. */
    const { container } = monter();
    const champ = container.querySelector('input[autocomplete="one-time-code"]');
    expect(champ?.getAttribute("maxlength")).toBe("6");
  });

  it("les chiffres saisis apparaissent dans les cases", async () => {
    const u = userEvent.setup();
    const { container } = monter();
    const champ = container.querySelector('input[autocomplete="one-time-code"]') as HTMLInputElement;
    await u.type(champ, "4271");
    const cases = [...container.querySelectorAll(".sas-case")].map((c) => c.textContent);
    expect(cases.slice(0, 4)).toEqual(["4", "2", "7", "1"]);
  });

  it("six chiffres déclenchent la vérification sans qu'on valide", async () => {
    const u = userEvent.setup();
    const { container } = monter();
    const champ = container.querySelector('input[autocomplete="one-time-code"]') as HTMLInputElement;
    await u.type(champ, "427193");
    await waitFor(() => expect(verifier).toHaveBeenCalledWith("427193"));
  });
});

describe("la porte ne s'ouvre pas toute seule", () => {
  it("ne laisse pas partir tant que la requête n'a pas répondu", () => {
    /* `isLoading` : aucune donnée. On affiche l'attente, on ne
       redirige pas. */
    etatMfa = { ...etatMfa, isLoading: true, isRequired: false };
    monter();
    expect(naviguer).not.toHaveBeenCalled();
  });

  it("ne laisse pas partir sur une donnée en cours de vérification", () => {
    /* LE DÉFAUT DE SÛRETÉ. `isLoading` tombe à faux dès qu'une donnée
       existe en cache, fût-elle celle de la session précédente.
       `isFetching` dit qu'on est en train de la revérifier : tant
       qu'elle n'est pas posée, on ne quitte pas la porte. */
    etatMfa = { ...etatMfa, isLoading: false, isFetching: true, isRequired: false };
    monter();
    expect(naviguer).not.toHaveBeenCalled();
  });

  it("laisse partir quand le second facteur n'est vraiment plus attendu", () => {
    etatMfa = { ...etatMfa, isLoading: false, isFetching: false, isRequired: false };
    monter();
    expect(naviguer).toHaveBeenCalledWith("/", { replace: true });
  });
});

describe("le code de secours", () => {
  it("s'atteint depuis la porte, et prévient de ce qu'il fait", async () => {
    const u = userEvent.setup();
    monter();
    await u.click(screen.getByRole("button", { name: /code de secours/i }));
    /* Il RETIRE le second facteur au lieu de le vérifier. Le dire est
       la moitié du travail de cet écran. */
    expect(screen.getByText(/retire ton second facteur/i)).toBeTruthy();
  });
});
