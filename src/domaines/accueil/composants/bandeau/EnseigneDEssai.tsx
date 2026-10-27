import { useState } from "react";
import { Enseigne } from "@/domaines/accueil/composants/bandeau/Enseigne";
import { ECUSSON_D_ESSAI } from "@/domaines/accueil/logique/choixDuBancDuBandeau";
import { jourDecale } from "@/socle/outils/jour";
import type { MesureProgression } from "@/domaines/accueil/types";

/* L ENSEIGNE D UN PACTE FEINT, pour les bancs qui regardent ce qui vit
 * dessous — la rue d enseignes, les ordres du jour. Ananta, niveau 12,
 * palier Architecte : les memes chiffres partout, pour que deux bancs
 * se comparent. Le cordon bascule pour de vrai ; rien n est ecrit. */
export function EnseigneDEssai() {
  const [mesure, setMesure] = useState<MesureProgression>("goals");
  return (
    <Enseigne
      progression={mesure === "steps" ? 73 : 62}
      mesure={mesure}
      onChangerMesure={() => setMesure((m) => (m === "goals" ? "steps" : "goals"))}
      level={12}
      totalMissions={47}
      activeDays={91}
      pactName="Ananta"
      pactMantra="Tenir ce qui est juré"
      pactSymbol="flame"
      valeurs={["Liberté", "Discipline", "Création"]}
      sigilVersion={4}
      titleFont="orbitron"
      titleEffect="none"
      enCours={2}
      rankName="Architecte"
      rankLogoUrl={ECUSSON_D_ESSAI}
      rankTeinte="#f5b93a"
      rankProgress={64}
      rankXP={3200}
      rankXPTarget={5000}
      nextRankName="Bâtisseur"
      teinte="violet"
      jureLe={jourDecale(-91)}
      terme="2027-06-30"
    />
  );
}
