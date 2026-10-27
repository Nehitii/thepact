import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "@/socle/contextes/AuthContext";
import { useUserShop } from "@/domaines/boutique";
import { useCreatePactWishlistItem } from "@/domaines/souhaits";

/** Ce qu il faut d une piece pour l envoyer — et rien de plus.
 *
 *  Le type complet vit dans « composants/CostItemsEditor » : l
 *  importer d ici ferait descendre un crochet chercher chez un
 *  composant, ce que la garde des couches refuse a juste titre. Les
 *  trois champs suffisent, et l editeur les porte tous.
 */
interface PieceAEnvoyer {
  name?: string | null;
  price?: number | string | null;
  category?: string | null;
}

/**
 * ENVOYER UNE PIECE CHIFFREE VERS LES SOUHAITS.
 *
 * Le geste n existe que si le module est achete : rendre `undefined`
 * plutot qu une fonction inerte laisse l appelant ne pas dessiner le
 * bouton du tout, au lieu d en montrer un qui ne fait rien.
 *
 * UNE PIECE SANS NOM NE PART PAS. La liste des souhaits se lit par
 * nom ; une piece chiffree peut n en avoir pas encore, et l y envoyer
 * creerait une ligne vide impossible a retrouver.
 *
 * Sorti de « pages/GoalDetail.tsx », qui portait ces neuf lignes
 * d action au milieu de son rendu — le cliquet de taille l a demande,
 * et c etait de toute facon le mauvais endroit.
 */
export function useEnvoiVersSouhaits(objectif: { id: string; type?: string | null } | null) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isModulePurchased } = useUserShop(user?.id);
  const creer = useCreatePactWishlistItem();
  const ouvert = isModulePurchased("wishlist");
  const idUtilisateur = user?.id;

  const envoyer = useCallback(
    (item: PieceAEnvoyer) => {
      if (!idUtilisateur || !objectif) return;
      const nom = (item.name || "").trim();
      if (!nom) {
        toast.error(t("goals.detail.nameRequiredTitle", "Nom manquant"), {
          description: t("goals.detail.nameRequiredBody", "Donnez d'abord un nom à cette pièce chiffrée."),
        });
        return;
      }
      creer.mutate({
        userId: idUtilisateur,
        name: nom,
        estimatedCost: Number(item.price) || 0,
        itemType: "required",
        category: item.category ?? objectif.type ?? null,
        goalId: objectif.id,
      });
    },
    [idUtilisateur, objectif, creer, t],
  );

  return ouvert ? envoyer : undefined;
}
