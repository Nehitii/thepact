import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE : LA CLÉ DE REQUÊTE

   Elle valait ["mfa", user.id, session.access_token]. Deux défauts en
   sont sortis le 28/08, en sens opposés — et c'est ce qui rend cet
   endroit piégeux : les deux corrections se contredisent si on n'y
   prend pas garde.

     LE JETON DANS LA CLÉ → SCINTILLEMENT. Le jeton change pour des
     raisons étrangères au second facteur : rafraîchissement
     automatique, réémission après vérification, retour d'onglet. À
     chaque changement, React Query monte une requête neuve et
     `isLoading` repasse à vrai. La page clignotait.

     LE JETON HORS DE LA CLÉ → PORTE OUVERTE. Après une déconnexion
     suivie d'une reconnexion du même compte, la clé redevient
     identique et l'entrée de la session précédente — « aal2 déjà
     obtenu » — est servie instantanément. Le second facteur cessait
     d'être demandé.

   La sortie n'est pas dans la clé : c'est AuthContext qui vide le
   cache à la déconnexion. Les deux tests ci-dessous tiennent les deux
   bouts, pour qu'on ne puisse plus corriger l'un en rouvrant l'autre.
   ═══════════════════════════════════════════════════════════════ */

const listFactors = vi.fn();
const getAal = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      mfa: {
        listFactors: () => listFactors(),
        getAuthenticatorAssuranceLevel: () => getAal(),
      },
    },
  },
}));

let session: { access_token: string } | null;
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u-1" }, session }),
}));

import { useMfa } from "./useMfa";

const enveloppe = (client: QueryClient) =>
  function Enveloppe({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };

const neuf = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

beforeEach(() => {
  listFactors.mockReset();
  getAal.mockReset();
  session = { access_token: "jeton-1" };
  listFactors.mockResolvedValue({
    data: { all: [{ id: "f-1", factor_type: "totp", status: "verified", friendly_name: "A" }] },
    error: null,
  });
  getAal.mockResolvedValue({
    data: { currentLevel: "aal1", nextLevel: "aal2" },
    error: null,
  });
});

describe("le jeton n'est pas dans la clé", () => {
  it("un rafraîchissement de jeton ne relance pas la requête", async () => {
    const client = neuf();
    const { result, rerender } = renderHook(() => useMfa(), { wrapper: enveloppe(client) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(listFactors).toHaveBeenCalledTimes(1);

    /* Le jeton change — c'est ce que fait supabase-js tout seul, toutes
       les heures. La clé ne doit pas bouger avec lui. */
    session = { access_token: "jeton-2" };
    rerender();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(listFactors).toHaveBeenCalledTimes(1);
    /* Et surtout : on n'est jamais repassé par un état de chargement,
       qui est ce que la page affichait en clignotant. */
    expect(result.current.isLoading).toBe(false);
  });

  it("le second facteur est réclamé tant que le jeton n'est pas en aal2", async () => {
    const client = neuf();
    const { result } = renderHook(() => useMfa(), { wrapper: enveloppe(client) });
    await waitFor(() => expect(result.current.isRequired).toBe(true));
  });

  it("une fois le code fourni, il ne l'est plus", async () => {
    getAal.mockResolvedValue({ data: { currentLevel: "aal2", nextLevel: "aal2" }, error: null });
    const client = neuf();
    const { result } = renderHook(() => useMfa(), { wrapper: enveloppe(client) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isRequired).toBe(false);
  });
});

describe("le cache d'une session finie n'a pas le droit de répondre", () => {
  it("vidé, il fait repartir la requête et le facteur redevient dû", async () => {
    /* Reconstitution de la séquence qui avait ouvert la porte :
       session vérifiée (aal2), puis déconnexion, puis reconnexion du
       MÊME compte — donc même clé. Sans le vidage, l'entrée « aal2 »
       serait servie et `isRequired` resterait faux. */
    getAal.mockResolvedValue({ data: { currentLevel: "aal2", nextLevel: "aal2" }, error: null });
    const client = neuf();
    const { result, rerender } = renderHook(() => useMfa(), { wrapper: enveloppe(client) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isRequired).toBe(false);

    /* Ce que fait AuthContext sur SIGNED_OUT. */
    client.clear();
    /* La nouvelle session repart en aal1 : le mot de passe seul. */
    getAal.mockResolvedValue({ data: { currentLevel: "aal1", nextLevel: "aal2" }, error: null });
    rerender();

    await waitFor(() => expect(result.current.isRequired).toBe(true));
  });
});
