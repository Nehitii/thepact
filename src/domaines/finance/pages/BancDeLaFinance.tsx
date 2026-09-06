import { useEffect, useState } from "react";
import Finance from "@/domaines/finance/pages/Finance";
import "@/socle/ds/banc.css";

/* LE BANC DE LA FINANCE.
 *
 * L onglet est derriere la session, la double authentification et un
 * pacte deja jure. Pour regarder ses trois ecrans il fallait donc se
 * connecter — ce qui suffit a ne pas les regarder, et ce qu on ne
 * regarde pas, on ne le corrige pas. C est le raisonnement des deux
 * bancs qui existent deja.
 *
 * IL EST LA POUR LE THEME CLAIR. La finance porte 3 436 lignes de CSS
 * et n avait pas une seule regle « .light » : en clair, elle rendait
 * un tableau de bord de nuit pose sur du papier. Ecrire son jumeau de
 * jour sans le voir n aurait rien valu.
 *
 * IL NE LIT RIEN. Sans session, les sept crochets de donnees rendent
 * vide et la page montre ses etats a zero. C est assez pour juger les
 * surfaces, les traits et les encres — pas les chiffres.
 */
export default function BancDeLaFinance() {
  const [clair, setClair] = useState(true);

  /* La bascule agit sur la racine, comme le vrai selecteur de theme. */
  useEffect(() => {
    const racine = document.documentElement;
    const avant = { clair: racine.classList.contains("light"), sombre: racine.classList.contains("dark") };
    racine.classList.toggle("light", clair);
    racine.classList.toggle("dark", !clair);
    return () => {
      racine.classList.toggle("light", avant.clair);
      racine.classList.toggle("dark", avant.sombre);
    };
  }, [clair]);

  return (
    <div className="banc banc--large">
      <aside className="banc-pupitre">
        <h1>Banc de la finance</h1>
        <p className="banc-note">
          Rien n est lu en base : sans session, la page montre ses etats a zero.
          Assez pour juger les surfaces, pas les chiffres.
        </p>
        <label className="banc-bascule">
          <input type="checkbox" checked={clair} onChange={(e) => setClair(e.target.checked)} />
          <span>Theme clair</span>
        </label>
        <p className="banc-note">
          Les trois ecrans sont dans la navette de la page : pacte, arbitrage,
          mois.
        </p>
      </aside>

      <div className="banc-scene">
        <Finance />
      </div>
    </div>
  );
}
