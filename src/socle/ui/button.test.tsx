import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Button } from "./button";
import { jouerSon, publierJoueurDeSon } from "@/socle/outils/son";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   Le bouton allait chercher son clic sonore dans `SoundContext`, un
   contexte de rang 3 appelé depuis le rang 2. La garde des couches le
   signalait sous une tolérance qui annonçait « arbitrage à rendre ».

   L'arbitrage rendu, deux défauts sont tombés avec l'inversion — et
   aucun des deux ne se voyait dans le graphe des dépendances :

     1. `useSound()` LÈVE sans fournisseur. La brique la plus réutilisée
        de l'application ne pouvait donc pas être rendue seule. Le
        premier test ci-dessous aurait échoué avant le 29/08, sur
        « useSound must be used within SoundProvider ».
     2. `play` dépendait de `settings` : bouger la glissière de volume
        changeait son identité et re-rendait tous les abonnés. Ça ne se
        teste pas ici — ça se lit dans le fait que le bouton ne
        s'abonne plus à rien.

   Le troisième test garde le piège du remontage : en développement,
   React monte, démonte et remonte les effets. Un retrait aveugle
   rendrait l'application muette après le remontage.
   ═══════════════════════════════════════════════════════════════ */

afterEach(() => {
  /* L'état est un module, pas un composant : il survit aux tests. On le
     rend au silence explicitement. */
  publierJoueurDeSon(() => {})();
});

describe("le bouton n'a plus besoin de fournisseur", () => {
  it("se rend sans SoundProvider — c'est le défaut corrigé", () => {
    render(<Button>Valider</Button>);
    expect(screen.getByRole("button", { name: "Valider" })).toBeTruthy();
  });

  it("un clic sans joueur publié ne lève pas, et appelle bien onClick", async () => {
    const u = userEvent.setup();
    const clique = vi.fn();
    render(<Button onClick={clique}>Valider</Button>);
    await u.click(screen.getByRole("button"));
    expect(clique).toHaveBeenCalledTimes(1);
  });
});

describe("la demande de son part quand même", () => {
  it("un clic demande un son doux à qui écoute", async () => {
    const joueur = vi.fn();
    publierJoueurDeSon(joueur);
    const u = userEvent.setup();
    render(<Button>Valider</Button>);
    await u.click(screen.getByRole("button"));
    expect(joueur).toHaveBeenCalledWith("ui", "soft");
  });

  it('`data-sound="off"` fait taire ce bouton-là, sans toucher aux autres', async () => {
    const joueur = vi.fn();
    publierJoueurDeSon(joueur);
    const u = userEvent.setup();
    render(
      <>
        <Button data-sound="off">Muet</Button>
        <Button>Sonore</Button>
      </>,
    );
    await u.click(screen.getByRole("button", { name: "Muet" }));
    expect(joueur).not.toHaveBeenCalled();
    await u.click(screen.getByRole("button", { name: "Sonore" }));
    expect(joueur).toHaveBeenCalledTimes(1);
  });

  it("un bouton désactivé ne demande rien", async () => {
    const joueur = vi.fn();
    publierJoueurDeSon(joueur);
    const u = userEvent.setup();
    render(<Button disabled>Valider</Button>);
    await u.click(screen.getByRole("button"));
    expect(joueur).not.toHaveBeenCalled();
  });
});

describe("le retrait ne coupe que son propre joueur", () => {
  it("un remontage ne rend pas l'application muette", () => {
    const premier = vi.fn();
    const second = vi.fn();

    /* Le fournisseur monte, republie (settings changent), puis l'effet
       précédent se retire — dans cet ordre, c'est ce que fait React. */
    const retirerPremier = publierJoueurDeSon(premier);
    publierJoueurDeSon(second);
    retirerPremier();

    jouerSon("ui", "soft");
    expect(second).toHaveBeenCalledWith("ui", "soft");
    expect(premier).not.toHaveBeenCalled();
  });

  it("le retrait du dernier joueur ramène le silence, sans lever", () => {
    const joueur = vi.fn();
    publierJoueurDeSon(joueur)();
    expect(() => jouerSon("ui", "soft")).not.toThrow();
    expect(joueur).not.toHaveBeenCalled();
  });
});
