/* LA BARRE DE LA LISTE — chercher, trier, choisir l affichage.
 *
 * Quarante-neuf lignes sorties de `pages/Wishlist.tsx`. Sa frontiere
 * est celle d un controle : trois valeurs, trois setters, et la vue
 * courante — parce que le choix vitrine/registre ne s offre pas dans
 * toutes les vues.
 *
 * Elle ne connait ni les articles, ni les comptes, ni les mutations.
 * C est ce qui la rend lisible seule : tout ce qu elle peut faire est
 * dans sa signature.
 */
import { useTranslation } from "react-i18next";
import type { Vue, Tri } from "@/domaines/souhaits/types";
import { Grid2X2, Rows3, Search } from "lucide-react";
import { Input } from "@/socle/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/socle/ui/select";

export function BarreListe({
  vue, recherche, setRecherche, tri, setTri, affichage, setAffichage,
}: {
  vue: Vue;
  recherche: string;
  setRecherche: (v: string) => void;
  tri: Tri;
  setTri: (v: Tri) => void;
  affichage: "vitrine" | "registre";
  setAffichage: (v: "vitrine" | "registre") => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="wl-barre">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={t("wishlist.barre.chercher", "Chercher un article, un objectif, une note…")}
          className="pl-9 bg-transparent border-[var(--wl-trait)] font-rajdhani"
        />
      </div>
      {vue !== "pacte" && (
        <>
          <button type="button" className="wl-tri" aria-pressed={tri === "visuel"} onClick={() => setTri("visuel")}>
            {t("wishlist.tri.visuel", "Visuel")}
          </button>
          <button type="button" className="wl-tri" aria-pressed={tri === "recent"} onClick={() => setTri("recent")}>
            {t("wishlist.tri.recent", "Récent")}
          </button>
          <button type="button" className="wl-tri" aria-pressed={tri === "cher"} onClick={() => setTri("cher")}>
            {t("wishlist.tri.cher", "Prix ↓")}
          </button>
          <button type="button" className="wl-tri" aria-pressed={tri === "abordable"} onClick={() => setTri("abordable")}>
            {t("wishlist.tri.abordable", "Prix ↑")}
          </button>
    
          {/* La bascule d affichage se tient a part des tris :
              trier change l ORDRE, celle-ci change la FORME. Les
              melanger ferait croire a un cinquieme tri. */}
          <div className="wl-formes" role="group" aria-label={t("wishlist.forme.aria", "Forme de la liste")}>
            {([
              ["vitrine", Grid2X2, t("wishlist.forme.vitrine", "Vitrine")],
              ["registre", Rows3, t("wishlist.forme.registre", "Registre")],
            ] as const).map(([id, Icone, libelle]) => (
              <button
                key={id}
                type="button"
                className="wl-forme"
                aria-pressed={affichage === id}
                onClick={() => setAffichage(id)}
                title={libelle}
              >
                <Icone aria-hidden="true" />
                <span className="sr-only">{libelle}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
