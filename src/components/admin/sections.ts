import type React from "react";
import {
  Shield, ShieldCheck, Palette, Coins, Puzzle, Ticket, Bell, FlaskConical,
} from "lucide-react";

/* LES SECTIONS DE L'ADMINISTRATION, DANS UN FICHIER À ELLES.
   Elles vivaient dans AdminPageShell, qui exportait donc à la fois un
   composant et une constante — ce qui coupe le rafraîchissement à
   chaud sur ce fichier. Elles servent au rail ET au centre : elles
   n'appartiennent à aucun des deux. */

export interface SectionAdmin {
  cle: string;
  libelle: string;
  href: string;
  icone: React.ComponentType<{ className?: string }>;
  /** Ce que la section fait, en une ligne, pour le centre. */
  quoi: string;
}

/* L'ordre est celui de l'usage, pas de l'alphabet : le centre, puis
   qui détient les clés, puis ce qu'on écrit à tout le monde, puis le
   catalogue, et l'atelier d'essai en dernier. */
export const SECTIONS_ADMIN: SectionAdmin[] = [
  { cle: "centre",    libelle: "Centre",       href: "/admin",               icone: Shield,       quoi: "Ce qui appelle une décision" },
  { cle: "acces",     libelle: "Accès",        href: "/admin/acces",         icone: ShieldCheck,  quoi: "Qui détient les clés, et depuis quand chacun n'est venu" },
  { cle: "diffusion", libelle: "Diffusion",    href: "/admin/notifications", icone: Bell,         quoi: "Écrire à tout le monde, ou à une personne" },
  { cle: "cosmetics", libelle: "Cosmétiques",  href: "/admin/cosmetics",     icone: Palette,      quoi: "Cadres, bannières et titres" },
  { cle: "modules",   libelle: "Modules",      href: "/admin/modules",       icone: Puzzle,       quoi: "Ce que la boutique vend" },
  { cle: "money",     libelle: "Monnaie",      href: "/admin/money",         icone: Coins,        quoi: "Lots de Bonds et offres spéciales" },
  { cle: "promos",    libelle: "Codes",        href: "/admin/promo-codes",   icone: Ticket,       quoi: "Codes promotionnels" },
  { cle: "essai",     libelle: "Banc d'essai", href: "/admin/mode",          icone: FlaskConical, quoi: "Se débloquer de quoi essayer, sur son propre compte" },
];
