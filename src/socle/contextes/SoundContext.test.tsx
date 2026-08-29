import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";

import { SoundProvider } from "./SoundContext";
import { jouerSon, publierJoueurDeSon } from "@/socle/outils/son";

/* ═══════════════════════════════════════════════════════════════
   LE MAILLON QUE LES TESTS DU BOUTON NE COUVRENT PAS.

   `button.test.tsx` prouve qu'un primitif demande un son au rang 1, et
   qu'il n'a plus besoin de fournisseur pour se rendre. Il ne prouve pas
   l'autre bout : que `SoundProvider` PUBLIE bien son joueur en montant.

   Ce maillon-là ne se voit ni au typecheck ni dans les gardes — un
   `useEffect` oublié rendrait toute l'application muette sans qu'une
   seule ligne rougisse. Et il ne se vérifie pas non plus au navigateur
   sur les pages publiques : `/auth`, `/legal` et la page 404 dessinent
   leurs boutons à la main, aucune n'utilise le `Button` du système de
   design. Le seul endroit où la chaîne complète est observable est ici.

   La preuve passe par le seul effet de bord mesurable de `playTone` :
   il crée un `AudioContext`, paresseusement, au premier son.
   ═══════════════════════════════════════════════════════════════ */

const parametre = () => ({
  value: 0,
  setValueAtTime: () => {},
  exponentialRampToValueAtTime: () => {},
});

/* Un nœud audio suffisant : `connect` rend sa cible pour que les
   chaînages `a.connect(b).connect(c)` du synthétiseur tiennent. */
const noeud = (): Record<string, unknown> => ({
  connect: (cible: unknown) => cible,
  disconnect: () => {},
  start: () => {},
  stop: () => {},
  gain: parametre(),
  frequency: parametre(),
  type: "",
  buffer: null,
});

class FauxContexteAudio {
  static creations = 0;
  state = "running";
  currentTime = 0;
  destination = noeud();
  constructor() {
    FauxContexteAudio.creations++;
  }
  resume = async () => {};
  suspend = async () => {};
  createGain = noeud;
  createOscillator = noeud;
  createBiquadFilter = noeud;
  createBufferSource = noeud;
  decodeAudioData = async () => null;
}

type Fenetre = typeof window & { webkitAudioContext?: unknown };

beforeEach(() => {
  FauxContexteAudio.creations = 0;
  vi.stubGlobal("AudioContext", FauxContexteAudio);
  (window as Fenetre).webkitAudioContext = undefined;
  /* Le préchargement du MP3 n'a rien à faire ici : on mesure la
     publication, pas le réseau. */
  vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("hors ligne"))));
});

afterEach(() => {
  vi.unstubAllGlobals();
  publierJoueurDeSon(() => {})();
});

describe("le fournisseur publie son joueur vers le bas", () => {
  it("sans fournisseur monté, demander un son ne fait rien", () => {
    jouerSon("ui", "soft");
    expect(FauxContexteAudio.creations).toBe(0);
  });

  it("fournisseur monté, la demande atteint le vrai joueur", () => {
    render(
      <SoundProvider>
        <span>rien</span>
      </SoundProvider>,
    );
    jouerSon("ui", "soft");
    expect(FauxContexteAudio.creations).toBe(1);
  });

  it("le fournisseur démonté, le silence revient", () => {
    const { unmount } = render(
      <SoundProvider>
        <span>rien</span>
      </SoundProvider>,
    );
    unmount();
    jouerSon("ui", "soft");
    expect(FauxContexteAudio.creations).toBe(0);
  });
});
