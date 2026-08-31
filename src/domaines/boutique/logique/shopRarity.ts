import { useTranslation } from "react-i18next";

// Unified rarity design system for the entire Shop
export const rarityConfig = {
  common: {
    accent: "hsl(215 20% 55%)",
    glow: "hsl(215 20% 55% / 0.12)",
    glowStrong: "hsl(215 20% 55% / 0.25)",
    border: "hsl(215 20% 55% / 0.3)",
    bg: "bg-slate-500/5",
    text: "text-slate-400",
    badgeBg: "bg-slate-500/15",
    badgeText: "text-slate-400",
    badgeBorder: "border-slate-500/30",
    animated: false,
  },
  rare: {
    accent: "hsl(212 90% 55%)",
    glow: "hsl(212 90% 55% / 0.12)",
    glowStrong: "hsl(212 90% 55% / 0.3)",
    border: "hsl(212 90% 55% / 0.35)",
    bg: "bg-blue-500/5",
    text: "text-blue-400",
    badgeBg: "bg-blue-500/15",
    badgeText: "text-blue-400",
    badgeBorder: "border-blue-500/30",
    animated: false,
  },
  epic: {
    accent: "hsl(270 80% 60%)",
    glow: "hsl(270 80% 60% / 0.15)",
    glowStrong: "hsl(270 80% 60% / 0.35)",
    border: "hsl(270 80% 60% / 0.4)",
    bg: "bg-purple-500/5",
    text: "text-purple-400",
    badgeBg: "bg-purple-500/15",
    badgeText: "text-purple-400",
    badgeBorder: "border-purple-500/30",
    animated: true,
  },
  legendary: {
    accent: "hsl(45 100% 60%)",
    glow: "hsl(45 100% 60% / 0.15)",
    glowStrong: "hsl(45 100% 60% / 0.4)",
    border: "hsl(45 100% 60% / 0.45)",
    bg: "bg-amber-500/5",
    text: "text-amber-400",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-400",
    badgeBorder: "border-amber-500/30",
    animated: true,
  },
} as const;

/* -- LES MEMES QUATRE RARETES, SUR DU PAPIER --

   Ces accents sont poses en style INLINE sur les cartes, donc hors de
   portee de theme-clair.css. Ce sont des couleurs d ecran : l or de
   legendaire, hsl(45 100% 60%), tombe a 1,51:1 sur du papier — c est
   lui qui ecrit les prix, les etiquettes de rarete et le libelle du
   bouton d achat, soit l essentiel de ce qu on lit dans la boutique.
   Aucun des quatre ne passe le seuil AA sur le fond clair.

   La TEINTE de chaque rarete est conservee a trois degres pres :
   commun reste ardoise, rare reste bleu, epique reste violet,
   legendaire reste or. C est la clarte qui descend.

   LES LISERES MONTENT, LES LAVIS DESCENDENT — et non l inverse, comme
   ce commentaire l a longtemps dit. Mesure : lisere 0,30 -> 0,42 pour
   le commun, jusqu a 0,45 -> 0,55 pour le legendaire ; lavis 0,12 ->
   0,10 et lavis fort 0,25 -> 0,20. La raison est que l encre claire
   est bien plus SOMBRE que l accent d ecran : a opacite egale, son
   voile se voit davantage, donc il en faut moins.

   Les classes Tailwind (bg, text, badge*) ne changent pas : elles
   sont deja rattachees aux signaux du theme dans index.css.

   MESURE DU 30/08/2026, accents sur les fonds que declare index.css :

     sur `hsl(210 100% 2%)`    commun 5,66  rare 5,59  epique 4,34
                               legendaire 13,58
     sur `hsl(210 50% 96%)`    commun 6,81  rare 8,11  epique 7,89
                               legendaire 6,82

   L EPIQUE EST SOUS LE SEUIL AA EN THEME SOMBRE, qui est le theme par
   defaut. Constate, non corrige : en changer la teinte change ce que
   l ecran affiche. */
const rarityConfigClair = {
  common: {
    accent: "hsl(212 12% 34%)",
    glow: "hsl(212 12% 34% / 0.1)",
    glowStrong: "hsl(212 12% 34% / 0.2)",
    border: "hsl(212 12% 34% / 0.42)",
  },
  rare: {
    accent: "hsl(212 100% 30%)",
    glow: "hsl(212 100% 30% / 0.1)",
    glowStrong: "hsl(212 100% 30% / 0.24)",
    border: "hsl(212 100% 30% / 0.5)",
  },
  epic: {
    accent: "hsl(272 66% 40%)",
    glow: "hsl(272 66% 40% / 0.12)",
    glowStrong: "hsl(272 66% 40% / 0.28)",
    border: "hsl(272 66% 40% / 0.52)",
  },
  legendary: {
    accent: "hsl(42 100% 22%)",
    glow: "hsl(42 100% 22% / 0.09)",
    glowStrong: "hsl(42 100% 22% / 0.22)",
    border: "hsl(42 100% 22% / 0.55)",
  },
} as const;

export type RarityKey = keyof typeof rarityConfig;

export function getRarity(rarity: string) {
  const cle = (rarity as RarityKey) in rarityConfig ? (rarity as RarityKey) : "common";
  const base = rarityConfig[cle];
  /* Le theme est lu a l appel plutot que passe en parametre : les
     dix appelants n auraient rien a en faire, et basculer le theme
     rejoue de toute facon le rendu de la page. */
  const sombre = typeof document === "undefined"
    || document.documentElement.classList.contains("dark");
  return sombre ? base : { ...base, ...rarityConfigClair[cle] };
}

/* LE NOM DE LA RARETE S AFFICHAIT BRUT.
 *
 * Huit endroits rendaient directement la valeur de la base — « epic »,
 * « legendary » — au milieu d une interface francaise. Les libelles
 * `shop.rarity.*` existaient pourtant deja dans les deux langues. Ce
 * crochet les relie ; il vit ici pour que la couleur et le mot d une
 * rarete restent decides au meme endroit. */
export function useRarityLabel() {
  const { t } = useTranslation();
  return (rarity: string) =>
    t(`shop.rarity.${rarity}`, { defaultValue: rarity });
}
