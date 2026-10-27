import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VERSION_ALPHABET } from "@/domaines/objectifs";
import { AlphabetDuSceau } from "./AlphabetDuSceau";

/* REFONDRE UN SCEAU N EST PAS UN REGLAGE.
 *
 * « pacts.sigil_version » a ete ajoutee avec « default 1 » : tous les
 * pactes anterieurs sont restes en v1, et rien ne les en sortait.
 * Le porteur voyait donc l ancien alphabet sur la derniere version du
 * code, sans qu aucun ecran ne lui dise pourquoi.
 *
 * Ce que ce test tient :
 *   — le panneau se tait quand il n a rien a proposer ;
 *   — il MONTRE les deux figures avant de demander ;
 *   — il demande, et n ecrit qu apres un oui.
 */

const maj = vi.fn();
vi.mock("@/domaines/objectifs/hooks/usePactMutation", () => ({
  usePactMutation: () => ({ updatePact: maj, isUpdating: false }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function poser(version: number | undefined, onRefondu = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    onRefondu,
    ...render(
      <QueryClientProvider client={client}>
        <AlphabetDuSceau
          userId="u1"
          pactId="p1"
          nom="Ananta"
          valeurs={["Excellence", "Apprentissage", "Développement personnel"]}
          version={version}
          onRefondu={onRefondu}
        />
      </QueryClientProvider>,
    ),
  };
}

/** Les sceaux dessines, dans l ordre du document. */
function sceaux(): SVGElement[] {
  return Array.from(document.querySelectorAll("svg.sceau-anime"));
}

describe("L alphabet du sceau", () => {
  beforeEach(() => {
    maj.mockReset();
    maj.mockResolvedValue(undefined);
    document.body.innerHTML = "";
  });

  it("ne dit rien tant qu on ne sait pas sous quelle version le pacte a ete jure", () => {
    /* Annoncer « a jour » puis se dedire une seconde plus tard est pire
       que se taire. */
    const { container } = poser(undefined);
    expect(container.innerHTML).toBe("");
  });

  it("ne propose pas de refonte a un pacte deja a jour", () => {
    poser(VERSION_ALPHABET);
    expect(screen.queryByRole("button", { name: /refondre/i })).toBeNull();
    expect(sceaux()).toHaveLength(0);
  });

  it("MONTRE LES DEUX FIGURES avant de proposer quoi que ce soit", () => {
    /* Un bouton « refondre » sans montrer ce qu on perd demanderait de
       signer a l aveugle : ce qui change n est pas un reglage, c est la
       figure entiere. */
    poser(1);
    const dessins = sceaux();
    expect(dessins).toHaveLength(2);
    /* Et ce sont bien deux figures DIFFERENTES : meme squelette, pas un
       signe en commun. */
    expect(dessins[0].innerHTML).not.toBe(dessins[1].innerHTML);
    expect(dessins[0].getAttribute("aria-label")).toContain("Ananta");
  });

  it("demande avant d ecrire, et n ecrit rien si l on se retire", async () => {
    const u = userEvent.setup();
    poser(1);
    await u.click(screen.getByRole("button", { name: /refondre le sceau/i }));
    expect(screen.getByText(/Refondre le sceau de/)).toBeTruthy();
    expect(maj).not.toHaveBeenCalled();

    await u.click(screen.getByRole("button", { name: /annuler/i }));
    expect(maj).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /refondre le sceau/i })).toBeTruthy();
  });

  it("ECRIT LA VERSION COURANTE, et la rend a la page", async () => {
    const u = userEvent.setup();
    const onRefondu = vi.fn();
    poser(1, onRefondu);
    await u.click(screen.getByRole("button", { name: /refondre le sceau/i }));
    await u.click(screen.getByRole("button", { name: /oui, refondre/i }));

    await waitFor(() => expect(maj).toHaveBeenCalledWith({ sigil_version: VERSION_ALPHABET }));
    /* La page relit la version qu elle vient de faire ecrire : sans ce
       retour, le panneau proposerait encore une refonte deja faite. */
    expect(onRefondu).toHaveBeenCalledWith(VERSION_ALPHABET);
  });
});
