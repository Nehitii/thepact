import { CarteProfilPublic } from "@/components/profile/CarteProfilPublic";
import type { CarteProfil } from "@/hooks/useCarteProfil";
import type { CosmeticBanner } from "@/hooks/useShop";

interface Props {
  /* La carte reelle du porteur : son avatar, son cadre, son titre,
     son rang. On n en change que le fond. */
  carte: CarteProfil | null | undefined;
  fond: CosmeticBanner;
}

/* UNE BANNIERE NE SE JUGE PAS EN BANDEAU DETACHE.
 *
 * La boutique la montrait comme une bande de seize pixels, posee
 * nulle part. Or ce n est pas une banniere au sens d un en-tete : dans
 * l application, cette image est le FOND DE LA CARTE DE PROFIL — celle
 * des reglages « Profil public », celle qu on voit en survolant
 * quelqu un. Detachee de la carte, elle ne veut rien dire, et l on
 * comprend qu on ait pu la croire inutile.
 *
 * On rend donc la vraie carte, avec le fond candidat dessus, reduite
 * pour tenir dans la vignette. Ce qu on achete est ce qu on voit. */
export function ApercuFondCarte({ carte, fond }: Props) {
  const substitut: CarteProfil | null = carte
    ? {
        ...carte,
        banniere: {
          image: fond.banner_url ?? null,
          debut: fond.gradient_start ?? null,
          fin: fond.gradient_end ?? null,
          rarete: fond.rarity ?? null,
        },
      }
    : null;

  /* Tant que la carte n est pas chargee, le degrade seul : c est
     exactement ce que la boutique montrait avant, donc rien ne
     regresse pendant l attente. */
  if (!substitut) {
    return (
      <div
        className="w-full h-20 rounded-lg"
        style={{
          background: fond.banner_url
            ? `url(${fond.banner_url}) center/cover`
            : `linear-gradient(135deg, ${fond.gradient_start || "#0a0a12"}, ${fond.gradient_end || "#1a1a2e"})`,
        }}
      />
    );
  }

  /* La carte compacte fait 280 px de large ; la vignette en offre
     environ 170. On la reduit plutot que de la reconstruire en petit :
     une seule carte a maintenir, et l apercu ne peut pas mentir sur le
     rendu final.

     On ne montre que le haut : c est la que vit le fond, qui est ce
     qu on vend — a 0,52 il n occupait qu un tiers de la vignette et la
     carte se coupait net en bas. Le degrade de masque fait de la
     troncature un choix plutot qu un accident.
     `pointer-events-none` parce qu on regarde, on ne manipule pas. */
  const voile = "linear-gradient(to bottom, #000 0, #000 74%, transparent 100%)";

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 150, maskImage: voile, WebkitMaskImage: voile }}
      aria-hidden="true"
    >
      <div
        className="absolute left-1/2 top-0 pointer-events-none"
        style={{ transform: "translateX(-50%) scale(0.62)", transformOrigin: "top center" }}
      >
        <CarteProfilPublic carte={substitut} compacte />
      </div>
    </div>
  );
}
