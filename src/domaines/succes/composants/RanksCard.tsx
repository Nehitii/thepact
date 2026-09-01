import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Trophy, Plus } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Bouton } from "@/socle/ds/console-ui";
import { supabase } from "@/socle/supabase/client";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/socle/ui/alert-dialog";
import { DataPanel } from "@/socle/ds/settings-ui";
import { EchelleDesPaliers } from "@/domaines/succes/composants/EchelleDesPaliers";
import { RankEditor } from "@/domaines/succes/composants/RankEditor";
import { retirerLEmbleme } from "@/domaines/succes/hooks/useEmblemeDePalier";
import { useRankXP } from "@/domaines/succes/hooks/useRankXP";
import { niveauDuRang } from "@/domaines/succes/logique/rang";
import { lueurDeLaTeinte, normaliserTeinte } from "@/domaines/succes/logique/teinte";
import type { Rank } from "@/domaines/succes/types";
import { usePact } from "@/domaines/objectifs";

interface RanksCardProps {
  userId: string;
}

/**
 * LE PANNEAU DES PALIERS, REFAIT AUTOUR DU NOYAU.
 *
 * ═══ CE QU IL MONTRAIT, ET POURQUOI C ETAIT ILLISIBLE ═══
 *
 * TROIS representations du meme fait : une carte du palier courant en
 * tete, une « ligne d XP » decoupee en segments, et une liste de lignes
 * a pastille carree. Trois dessins pour une seule question — ou en
 * suis-je — et le lecteur devait les rapprocher lui-meme. Ce n etait
 * pas son style qui le rendait illisible, c etait leur nombre.
 *
 * Une seule reste : L ECHELLE. Elle se lit en montant, la position
 * courante y est marquee, et le plafond atteignable en est le haut —
 * un palier pose au-dessus se voit hors de portee au lieu d etre refuse
 * par une notification apres coup.
 *
 * `RankCard` a disparu avec elles : le noyau tient les deux roles, dans
 * un troisieme cran de taille.
 *
 * ═══ ET L EDITION SE FAIT SUR LE BARREAU ═══
 *
 * L editeur s ouvrait en TETE du panneau. Modifier un palier du bas
 * obligeait a remonter, et le palier — son embleme compris — sortait
 * de l ecran : on le modifiait a l aveugle. Il descend dans l echelle,
 * SOUS le barreau qu il modifie, qui devient son apercu.
 */
export function RanksCard({ userId }: RanksCardProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: pact } = usePact(userId);
  const { data: rankData } = useRankXP(userId, pact?.id);

  const [selectedRank, setSelectedRank] = useState<Rank | null>(null);
  const [isNewRank, setIsNewRank] = useState(false);
  const [rankToDelete, setRankToDelete] = useState<Rank | null>(null);

  /* La liste vient du hook, sans copie locale : l ancien `useState` +
     `useEffect` recopiait `rankData.ranks` a chaque rendu et pouvait
     montrer une liste d un tour en retard. */
  const paliers = rankData?.ranks ?? [];
  const totalMaxXP = rankData?.totalMaxXP ?? 0;
  const currentXP = rankData?.currentXP ?? 0;

  /* ═══ L ECHELLE VOIT CE QU ON EST EN TRAIN DE TAPER ═══
     L editeur est CONTROLE par ce panneau : le palier en cours vit ici,
     et l echelle recoit la liste avec lui dedans. Un seuil qu on tape y
     fait donc glisser le barreau a sa nouvelle place, en direct — ce
     qu une fenetre modale posee par-dessus n aurait pas permis de
     voir. */
  /* Echap ferme, comme partout ailleurs dans l application. */
  useEffect(() => {
    if (!selectedRank) return;
    const surTouche = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedRank(null); };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [selectedRank]);

  const paliersProjetes = selectedRank
    ? [...paliers.filter((p) => p.id !== selectedRank.id), selectedRank]
    : paliers;

  const ajouter = () => {
    const dernier = paliers[paliers.length - 1];
    setSelectedRank({
      id: "new",
      name: "",
      min_points: dernier ? dernier.min_points + 500 : 0,
      frame_color: "#5bb4ff",
      glow_color: lueurDeLaTeinte("#5bb4ff"),
    });
    setIsNewRank(true);
  };

  const enregistrer = async (palier: Rank) => {
    if (!palier.name.trim()) {
      toast.error(t("ranks.toast.nomManquant"), { description: t("ranks.toast.nomManquantAide") });
      throw new Error("nom_manquant");
    }
    /* LA TEINTE EST NORMALISEE AVANT D ETRE ECRITE, et la lueur en
       descend. Une seule valeur decide, deux colonnes la portent —
       `glow_color` reste ecrite pour ne rien casser de ce qui la lit. */
    const teinte = normaliserTeinte(palier.frame_color);
    const champs = {
      min_points: palier.min_points,
      max_points: palier.max_points || null,
      name: palier.name.trim(),
      logo_url: palier.logo_url,
      background_url: palier.background_url,
      background_opacity: palier.background_opacity,
      frame_color: teinte,
      glow_color: lueurDeLaTeinte(teinte),
      quote: palier.quote,
    };

    const { error } = isNewRank
      ? await supabase.from("ranks").insert({ user_id: userId, ...champs })
      : await supabase.from("ranks").update(champs).eq("id", palier.id);
    if (error) {
      toast.error(t("ranks.toast.erreur"), { description: error.message });
      throw error;
    }
    toast.success(t(isNewRank ? "ranks.toast.cree" : "ranks.toast.modifie"), {
      description: t(isNewRank ? "ranks.toast.creeAide" : "ranks.toast.modifieAide", { nom: palier.name }),
    });
    queryClient.invalidateQueries({ queryKey: ["rank-xp"] });
  };

  const confirmerLaSuppression = async () => {
    if (!rankToDelete) return;
    const { error } = await supabase.from("ranks").delete().eq("id", rankToDelete.id);
    if (error) {
      toast.error(t("ranks.toast.erreur"), { description: error.message });
    } else {
      /* L EMBLEME PART AVEC LE PALIER. Il n est retire que s il vient de
         notre depot — une adresse collee ailleurs ne nous appartient
         pas. Sans cela, chaque essai laisserait un fichier que personne
         ne nettoiera jamais. */
      await retirerLEmbleme(rankToDelete.logo_url);
      toast.success(t("ranks.toast.supprime"), {
        description: t("ranks.toast.supprimeAide", { nom: rankToDelete.name }),
      });
      queryClient.invalidateQueries({ queryKey: ["rank-xp"] });
    }
    setRankToDelete(null);
  };

  return (
    <DataPanel
      code="MODULE_05"
      title={t("ranks.titre")}
      statusText={<span className="text-muted-foreground">{t("ranks.compte", { count: paliers.length })}</span>}
      footerLeft={
        <span>{t("ranks.actuel")} : <b className="text-primary">{rankData?.currentRank?.name || "—"}</b></span>
      }
      footerRight={
        <span>{t("ranks.xp")} : <b className="text-primary">{currentXP.toLocaleString("fr-FR")}</b></span>
      }
    >
      <div className="space-y-4 py-4">
        {/* Le plafond, une fois, en tete de l echelle dont il est le haut. */}
        {totalMaxXP > 0 && (
          <div className="flex items-center justify-between border border-primary/15 bg-primary/[0.02] px-2.5 py-2">
            <span className="ds-t-label font-mono uppercase tracking-[0.15em] text-primary/40">
              {t("ranks.plafond")}
            </span>
            <span className="font-mono text-xs font-bold tabular-nums text-primary">
              {t("ranks.seuil", { n: totalMaxXP.toLocaleString("fr-FR") })}
            </span>
          </div>
        )}

        {/* L etat vide regarde la liste PROJETEE : un palier tout neuf
            se voit sur l echelle des qu on commence a le decrire. */}
        {paliersProjetes.length === 0 ? (
          <div className="border border-dashed border-primary/20 bg-primary/[0.02] py-8 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-primary/30" />
            <p className="font-orbitron text-sm uppercase tracking-wider text-primary/70">
              {t("ranks.vide.titre")}
            </p>
            <p className="mx-auto mt-1 max-w-[280px] font-rajdhani text-xs text-muted-foreground">
              {t("ranks.vide.aide", { xp: totalMaxXP.toLocaleString("fr-FR") })}
            </p>
          </div>
        ) : (
          <EchelleDesPaliers
            paliers={paliersProjetes}
            currentXP={currentXP}
            totalMaxXP={totalMaxXP}
            niveau={niveauDuRang(rankData)}
            enEdition={selectedRank?.id ?? null}
            editeur={selectedRank && (
              <RankEditor
                rank={selectedRank}
                onChange={setSelectedRank}
                onClose={() => setSelectedRank(null)}
                onSave={enregistrer}
                isNew={isNewRank}
                paliers={paliers}
                globalMaxXP={totalMaxXP}
              />
            )}
            onModifier={(p) => { setSelectedRank(p); setIsNewRank(false); }}
            onSupprimer={setRankToDelete}
          />
        )}

        <Bouton onClick={ajouter} pleine><Plus />{t("ranks.ajouter")}</Bouton>

        <AlertDialog open={!!rankToDelete} onOpenChange={(o) => !o && setRankToDelete(null)}>
          <AlertDialogContent className="border-primary/30 bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                {t("ranks.suppression.titre", { nom: rankToDelete?.name ?? "" })}
              </AlertDialogTitle>
              <AlertDialogDescription>{t("ranks.suppression.corps")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-primary/30">{t("ranks.annuler")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmerLaSuppression}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t("ranks.supprimer")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DataPanel>
  );
}
