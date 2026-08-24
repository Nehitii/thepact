import { cn } from "@/lib/utils";

interface BandeBoutiqueProps {
  children: React.ReactNode;
  /* La bande mord sur les marges de page et occupe toute la largeur.
     On annule exactement `page-px` — 1 / 1,5 / 2 rem — plutot que de
     recourir a `w-screen`, qui rouvrirait le debordement horizontal
     corrige sur la bande d onglets. */
  pleineLargeur?: boolean;
  /* Le ton du fond dit de quelle nature est la section : ce qui expire
     ne se lit pas comme ce qui reste en rayon. */
  ton?: "neutre" | "urgent" | "creux";
  className?: string;
}

const FONDS = {
  neutre: "transparent",
  urgent:
    "linear-gradient(180deg, hsl(45 100% 60% / 0.045), hsl(45 100% 60% / 0.012) 55%, transparent)",
  creux: "hsl(var(--card) / 0.35)",
} as const;

/* LA PAGE EMPILAIT QUATRE BLOCS DE MEME FORME.
 *
 * Vedette, offres du jour, lots et catalogue se suivaient dans un
 * `space-y-10`, tous poses sur le meme fond, tous larges pareil : rien
 * ne disait qu on changeait de nature en descendant. Une bande donne a
 * chaque section sa propre assise — une respiration, un ton, et pour
 * les offres du jour une largeur qui deborde des marges. */
export function BandeBoutique({
  children,
  pleineLargeur = false,
  ton = "neutre",
  className,
}: BandeBoutiqueProps) {
  return (
    <section
      className={cn(
        pleineLargeur && "-mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8",
        ton !== "neutre" && "py-7 rounded-2xl",
        ton !== "neutre" && pleineLargeur && "rounded-none",
        className,
      )}
      style={{
        background: FONDS[ton],
        borderTop: ton === "urgent" ? "1px solid hsl(45 100% 60% / 0.12)" : undefined,
        borderBottom: ton === "urgent" ? "1px solid hsl(45 100% 60% / 0.08)" : undefined,
      }}
    >
      {children}
    </section>
  );
}
