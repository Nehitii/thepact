import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFournisseursActifs } from "./useFournisseursActifs";

/* ═══════════════════════════════════════════════════════════════
   Ce que ces tests tiennent, c'est le compromis du repli.

   La tentation, en écrivant ce crochet, est de masquer les tuiles dès
   que quelque chose se passe mal — ça a l'air prudent. Ça enferme
   dehors quiconque n'a QUE Google. Le test « le réseau tombe » existe
   pour qu'on ne puisse pas resserrer ça sans le voir.
   ═══════════════════════════════════════════════════════════════ */

const repond = (charge: unknown, ok = true) =>
  vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => charge,
  } as unknown as Response);

describe("useFournisseursActifs", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", repond({ external: {} }));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("ne montre rien tant que le serveur n'a pas répondu", () => {
    /* Une réponse qui n'arrive jamais : c'est l'instant du chargement
       qu'on regarde, pas ce qui suit. */
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));
    const { result } = renderHook(() => useFournisseursActifs());
    expect(result.current).toEqual([]);
  });

  it("ne montre rien quand le serveur n'en déclare aucun", async () => {
    vi.stubGlobal("fetch", repond({ external: { discord: false, github: false, google: false } }));
    const { result } = renderHook(() => useFournisseursActifs());
    await waitFor(() => expect(result.current).toEqual([]));
  });

  it("ne montre que ceux que le serveur déclare actifs", async () => {
    vi.stubGlobal("fetch", repond({ external: { discord: false, github: true, google: true } }));
    const { result } = renderHook(() => useFournisseursActifs());
    await waitFor(() => expect(result.current).toEqual(["github", "google"]));
  });

  it("ignore les fournisseurs qu'on ne sait pas afficher", async () => {
    /* GoTrue en liste une vingtaine. On n'a le dessin que de trois. */
    vi.stubGlobal("fetch", repond({ external: { apple: true, azure: true, google: true } }));
    const { result } = renderHook(() => useFournisseursActifs());
    await waitFor(() => expect(result.current).toEqual(["google"]));
  });

  it("les montre tous quand le réseau tombe — sortir quelqu'un de son compte est pire qu'une tuile morte", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const { result } = renderHook(() => useFournisseursActifs());
    await waitFor(() => expect(result.current).toEqual(["discord", "github", "google"]));
  });

  it("les montre tous quand le serveur répond en erreur", async () => {
    vi.stubGlobal("fetch", repond({}, false));
    const { result } = renderHook(() => useFournisseursActifs());
    await waitFor(() => expect(result.current).toEqual(["discord", "github", "google"]));
  });

  it("interroge /auth/v1/settings avec la clé publiable", async () => {
    const appel = repond({ external: { discord: true } });
    vi.stubGlobal("fetch", appel);
    const { result } = renderHook(() => useFournisseursActifs());
    await waitFor(() => expect(result.current).toEqual(["discord"]));

    const [url, options] = appel.mock.calls[0];
    expect(String(url)).toMatch(/\/auth\/v1\/settings$/);
    expect((options as RequestInit).headers).toHaveProperty("apikey");
  });

  it("abandonne la requête si l'écran est quitté avant la réponse", () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, o: RequestInit) => {
        signal = o.signal ?? undefined;
        return new Promise<Response>(() => {});
      }),
    );
    const { unmount } = renderHook(() => useFournisseursActifs());
    expect(signal?.aborted).toBe(false);
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});
