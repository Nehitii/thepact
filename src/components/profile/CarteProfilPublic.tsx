import { Crown, Shield, Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AvatarFrame } from "@/components/ui/avatar-frame";
import { nombre, type CarteProfil } from "@/hooks/useCarteProfil";

/* LA CARTE PORTE SA FEUILLE DE STYLE.
 *
 * Elle ne l importait pas : `SurvolProfil`, son unique appelant, s en
 * chargeait. Le jour ou la boutique l a reutilisee pour montrer les
 * fonds de carte, elle s est rendue toute nue — 117 px de large au
 * lieu de 280, un fond de hauteur nulle, et le texte retombant sous
 * l avatar. Un composant qui depend d une feuille que son appelant
 * doit penser a charger finit toujours par etre appele ailleurs. */
import "@/styles/carte-profil.css";

/* LA CARTE DE PROFIL PUBLIC.
 *
 * Le meme objet que dans les reglages « Profil public » — banniere,
 * avatar encadre, nom, titre, rang — mais rendu a partir de DONNEES,
 * et non de l etat d un formulaire d edition.
 *
 * Elle y etait soudee : les cosmetiques venaient de six requetes et de
 * six useState, l avatar etait un bouton qui ouvrait une boite de
 * dialogue, et un calque de survol proposait d en changer. Rien de
 * tout cela n a de sens quand la carte montre QUELQU UN D AUTRE.
 *
 * Ici : aucune commande, aucune modification, rien qu on puisse
 * cliquer par erreur. Une carte se regarde. */

interface Props {
  carte: CarteProfil;
  /* Le survol la veut compacte ; une page peut la vouloir entiere. */
  compacte?: boolean;
}

export function CarteProfilPublic({ carte, compacte = false }: Props) {
  const { t } = useTranslation();

  const accent = carte.rang?.couleur || carte.accent || "#5bb4ff";
  const fond = carte.banniere?.debut || "#0a0a12";
  const fondFin = carte.banniere?.fin || "#1a1a2e";

  /* La progression dans le palier. Sans palier suivant, on est au
     sommet : la barre est pleine, ce qui est la verite. */
  const bas = carte.rang?.seuil ?? 0;
  const haut = carte.rangSuivant?.seuil ?? null;
  const part = haut && haut > bas
    ? Math.min(100, Math.max(0, ((carte.xp - bas) / (haut - bas)) * 100))
    : 100;

  return (
    <article className="cp" data-compacte={compacte ? "" : undefined}>
      <div
        className="cp-fond"
        style={{ background: `linear-gradient(160deg, ${fond}, ${fondFin})` }}
      >
        {carte.banniere?.image && (
          <img src={carte.banniere.image} alt="" aria-hidden="true" loading="lazy" />
        )}
        <span className="cp-voile" aria-hidden="true" />
      </div>

      {carte.pacte && (
        <span className="cp-pacte" aria-hidden="true">{carte.pacte}</span>
      )}

      <div className="cp-corps">
        <span className="cp-lueur" aria-hidden="true" style={{ background: carte.cadre?.lueur || accent }} />
        <AvatarFrame
          avatarUrl={carte.avatar}
          fallback={carte.nom?.[0]?.toUpperCase() || "?"}
          size={compacte ? "lg" : "2xl"}
          frameImage={carte.cadre?.image ?? undefined}
          borderColor={carte.cadre?.bordure || accent}
          glowColor={carte.cadre?.lueur || "transparent"}
          frameScale={nombre(carte.cadre?.echelle, 1)}
          frameOffsetX={nombre(carte.cadre?.decalageX, 0)}
          frameOffsetY={nombre(carte.cadre?.decalageY, 0)}
          showBorder={carte.cadre?.montrerBordure !== false}
        />

        <h3 className="cp-nom">{carte.nom || t("friends.unknownAgent", "Agent Inconnu")}</h3>

        {carte.titre?.texte && (
          <span
            className="cp-titre"
            style={{
              color: carte.titre.couleur || accent,
              borderColor: `${carte.titre.couleur || accent}40`,
              background: `linear-gradient(90deg, ${carte.titre.couleur || accent}18, transparent)`,
            }}
          >
            <Crown aria-hidden="true" />
            {carte.titre.texte}
          </span>
        )}

        {carte.phrase && <p className="cp-phrase">« {carte.phrase} »</p>}

        <div className="cp-pied">
          <span className="cp-rang" style={{ color: accent }}>
            <Shield aria-hidden="true" />
            {carte.rang?.nom || t("guild.unranked", "Sans rang")}
          </span>
          <span className="cp-faits">
            <span className="cp-chiffre">
              {carte.xp.toLocaleString()} <small>{t("leaderboard.xp", "XP")}</small>
            </span>
            <span className="cp-chiffre">
              <Target aria-hidden="true" />
              {carte.objectifs}
            </span>
          </span>
        </div>

        <span className="cp-jauge" aria-hidden="true">
          <i style={{ width: `${part}%`, background: accent }} />
        </span>
        {carte.rangSuivant?.nom && (
          <span className="cp-suivant">
            {t("guild.toNextRank", "{{n}} XP avant {{rang}}", {
              n: Math.max(0, (carte.rangSuivant.seuil ?? 0) - carte.xp).toLocaleString(),
              rang: carte.rangSuivant.nom,
            })}
          </span>
        )}
      </div>
    </article>
  );
}
