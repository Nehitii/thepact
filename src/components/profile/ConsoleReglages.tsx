import { ReactNode, useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { User, ShieldCheck, IdCard, Target, Gauge, SlidersHorizontal, Bell, Shield, Database, HeartPulse } from "lucide-react";
import { DSPageShell, DSBackground } from "@/components/ds";
import "@/styles/reglages.css";

/* LA CONSOLE DE REGLAGES.
 *
 * Sept ecrans, sept en-tetes. Chacun ouvrait sur un halo circulaire,
 * un sur-titre espace et un titre massif — cent cinquante pixels de
 * ceremonial avant le premier interrupteur, et aucun sommaire nulle
 * part : on ne pouvait passer d une section a l autre que par la
 * barre laterale de l application.
 *
 * Les sept tiennent maintenant dans une console : un rail a gauche,
 * le volet a droite, un seul en-tete. Les adresses ne changent pas —
 * `/profile/notifications` reste `/profile/notifications` — parce
 * qu un reglage se partage, se met en favori, et se retrouve dans
 * l historique. Le rail est fait de `NavLink`, donc chaque section
 * garde son entree d historique et son bouton retour. */

export const SECTIONS = [
  { chemin: "/profile", code: "ACCT", libelle: "Compte", icone: User, exact: true },
  { chemin: "/profile/security", code: "SECU", libelle: "Sécurité", icone: ShieldCheck },
  { chemin: "/profile/bounded", code: "IDNT", libelle: "Profil public", icone: IdCard },
  { chemin: "/profile/pact-settings", code: "PACT", libelle: "Mon pacte", icone: Target },
  { chemin: "/profile/pact-rules", code: "RULE", libelle: "Règles du pacte", icone: Gauge },
  { chemin: "/profile/display-sound", code: "DISP", libelle: "Apparence & sons", icone: SlidersHorizontal },
  { chemin: "/profile/notifications", code: "ALRT", libelle: "Notifications", icone: Bell },
  { chemin: "/profile/health", code: "HLTH", libelle: "Santé", icone: HeartPulse },
  { chemin: "/profile/privacy", code: "PRIV", libelle: "Confidentialité", icone: Shield },
  { chemin: "/profile/data", code: "DATA", libelle: "Mes données", icone: Database },
] as const;

interface Props {
  /* LE TITRE VIENT DU RAIL, PAS DE LA PAGE.
     Les deux se contredisaient : le rail disait « Compte » et la page
     « Profil », le rail « Mes donnees » et la page « Donnees &
     Portabilite ». Deux sources pour un meme nom finissent toujours
     par diverger. La section le porte une fois ; on ne le passe ici
     que pour l ecran de chargement, avant que la route soit connue. */
  titre?: string;
  /* Une phrase qui dit ce qu on regle ici, pas ce que c est. */
  note?: string;
  children: ReactNode;
  /* Elements poses au-dessus du fond (surcouches fixes). */
  flottant?: ReactNode;
}

export function ConsoleReglages({ titre, note, children, flottant }: Props) {
  const { pathname } = useLocation();
  const section = SECTIONS.find((s) => s.chemin === pathname);
  const nom = section?.libelle ?? titre ?? "";
  const rail = useRef<HTMLElement>(null);
  const [resteADroite, setResteADroite] = useState(false);

  /* EN FENETRE ETROITE, LE RAIL DEVIENT UNE BANDE QUI DEFILE.
     Sept sections n y tiennent pas, et la barre de defilement est
     masquee : sans repere, rien ne dit qu il en reste. On mesure
     plutot que de deviner — un voile pose en permanence mentirait
     des que la bande tient. */
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const jauger = () => setResteADroite(el.scrollWidth - el.clientWidth - el.scrollLeft > 8);
    jauger();
    el.addEventListener("scroll", jauger, { passive: true });
    const obs = new ResizeObserver(jauger);
    obs.observe(el);
    return () => {
      el.removeEventListener("scroll", jauger);
      obs.disconnect();
    };
  }, []);

  return (
    <DSPageShell
      width="full"
      padding="tight"
      className="selection:bg-primary/30 !p-0"
      background={
        <>
          {/* Le sol descend d un cran. Une plaque ne se leve que si le
              fond est plus bas qu elle : a #03060A, la difference avec la
              surface des panneaux ne se voyait pas. */}
          <div className="absolute inset-0" style={{ background: "#000409" }} />
          <DSBackground variant="cyber" />
        </>
      }
    >
      {/* DE L AIR EN HAUT.

          Le premier mot de la page — SYS.CONFIG et le titre de section —
          tombait a 38 px du bord. C etait tout ce qu il y avait : ce
          conteneur donnait pt-10 et rien ne le precede.

          Il appartient a la console, pas au shell partage : l aerer ici
          ne deplace aucune des dix autres pages qui emploient DSPageShell. */}
      <div className="page-px pt-9 md:pt-16 pb-16 max-w-6xl mx-auto">
        <div className="rg">
          <div className="rg-rail-boite">
          {resteADroite && <span className="rg-rail-voile" aria-hidden="true" />}
          <nav className="rg-rail" ref={rail} aria-label="Sections des réglages">
            <p className="rg-rail-tete">
              <span>SYS.CONFIG</span>
              <span>{SECTIONS.length}</span>
            </p>

            {/* `NavLink` pose lui-meme `aria-current="page"` sur la
                section ouverte ; la feuille de style s y accroche.
                `end` n est vrai que pour « /profile », sans quoi il
                resterait allume sur toutes ses sous-routes. */}
            {SECTIONS.map((s) => {
              const Icone = s.icone;
              return (
                <NavLink
                  key={s.chemin}
                  to={s.chemin}
                  end={s.chemin === "/profile"}
                  className="rg-onglet"
                >
                  <Icone aria-hidden="true" />
                  {s.libelle}
                  <span className="rg-onglet-code">{s.code}</span>
                </NavLink>
              );
            })}
          </nav>
          </div>

          <div className="rg-volet">
            <header className="rg-volet-tete">
              <h1 className="rg-volet-titre">{nom}</h1>
              {note && <p className="rg-volet-note">{note}</p>}
            </header>
            <div className="rg-grille">{children}</div>
          </div>
        </div>
      </div>

      {flottant}
    </DSPageShell>
  );
}
