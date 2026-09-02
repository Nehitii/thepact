import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Repeat2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/socle/ui/dialog";
import { useCreatePost } from "@/domaines/social/hooks/usePublications";
import { PublicationCitee } from "@/domaines/social/composants/PublicationCitee";
import type { CommunityPost } from "@/domaines/social/types";

interface Props {
  ouvert: boolean;
  onFermer: () => void;
  /** La publication qu on cite. */
  originale: CommunityPost;
}

/**
 * REPARTAGER, AVEC OU SANS UN MOT.
 *
 * Le repartage est une publication a part entiere : elle porte le
 * texte de celui qui repartage, et montre l originale dessous. Le
 * texte est FACULTATIF — repartager sans rien ajouter est le geste le
 * plus courant, et exiger un commentaire le rendrait plus lourd que
 * de ne rien faire.
 *
 * L APERCU MONTRE EXACTEMENT CE QUI SERA PUBLIE. La meme carte citee
 * que le fil rendra, non interactive ici comme la-bas : on ne decouvre
 * pas apres coup ce qu on vient de partager.
 */
export function RepartagerDialog({ ouvert, onFermer, originale }: Props) {
  const { t } = useTranslation();
  const [mot, setMot] = useState("");
  const creer = useCreatePost();

  const envoyer = () => {
    creer.mutate(
      { content: mot.trim(), shared_post_id: originale.id },
      { onSuccess: () => { setMot(""); onFermer(); } },
    );
  };

  return (
    <Dialog open={ouvert} onOpenChange={(v) => { if (!v) onFermer(); }}>
      <DialogContent className="co">
        <DialogHeader>
          <DialogTitle>
            <Repeat2 aria-hidden="true" /> {t("community.repartage.titre", "Repartager")}
          </DialogTitle>
        </DialogHeader>

        <textarea
          className="co-repartage-mot"
          value={mot}
          onChange={(e) => setMot(e.target.value)}
          rows={3}
          placeholder={t("community.repartage.motPlaceholder", "Ajouter un mot (facultatif)…")}
          aria-label={t("community.repartage.mot", "Votre mot")}
        />

        <PublicationCitee citee={originale} disparue={false} />

        <DialogFooter>
          <button type="button" className="co-bouton co-bouton--discret" onClick={onFermer}>
            {t("common.cancel", "Annuler")}
          </button>
          <button
            type="button"
            className="co-bouton"
            onClick={envoyer}
            disabled={creer.isPending}
          >
            {t("community.repartage.action", "Repartager")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
