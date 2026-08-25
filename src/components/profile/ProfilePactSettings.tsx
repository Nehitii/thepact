/* Seize imports en desservaient trois : le code de verrouillage et la
   reinitialisation sont partis avec les leurs. */
import { useTranslation } from "react-i18next";
import { ProjectTimelineCard } from "./ProjectTimelineCard";
import { CustomDifficultyCard } from "./CustomDifficultyCard";
import { RanksCard } from "./RanksCard";
import { PactIdentityCard } from "./PactIdentityCard";

/* CINQ ECRANS DANS UNE SEULE SECTION, C EST TROP.
   L identite du pacte est un editeur a elle seule — 1 282 px — et les
   rangs 780. On coupe donc en deux : ce que le pacte EST d un cote,
   ce qu il EXIGE de l autre. Le meme composant sert les deux volets,
   pour qu il n y ait qu un endroit ou brancher les donnees. */
type VoletPacte = "identite" | "exigence";

interface ProfilePactSettingsProps {
  volet?: VoletPacte;
  userId: string;
  pactId: string | null;
  pactName: string;
  pactMantra: string;
  pactSymbol: string;
  titleFont: string;
  titleEffect: string;
  onPactNameChange: (value: string) => void;
  onPactMantraChange: (value: string) => void;
  onPactSymbolChange: (value: string) => void;
  onTitleFontChange: (value: string) => void;
  onTitleEffectChange: (value: string) => void;
  onSavePactIdentity: () => Promise<void>;
  isSavingIdentity?: boolean;
  projectStartDate: Date | undefined;
  projectEndDate: Date | undefined;
  onProjectStartDateChange: (date: Date | undefined) => void;
  onProjectEndDateChange: (date: Date | undefined) => void;
  customDifficultyName: string;
  customDifficultyActive: boolean;
  customDifficultyColor: string;
  onCustomDifficultyNameChange: (value: string) => void;
  onCustomDifficultyActiveChange: (value: boolean) => void;
  onCustomDifficultyColorChange: (value: string) => void;
}

export function ProfilePactSettings({
  volet = "identite",
  userId,
  pactId,
  pactName,
  pactMantra,
  pactSymbol,
  titleFont,
  titleEffect,
  onPactNameChange,
  onPactMantraChange,
  onPactSymbolChange,
  onTitleFontChange,
  onTitleEffectChange,
  onSavePactIdentity,
  isSavingIdentity,
  projectStartDate,
  projectEndDate,
  onProjectStartDateChange,
  onProjectEndDateChange,
  customDifficultyName,
  customDifficultyActive,
  customDifficultyColor,
  onCustomDifficultyNameChange,
  onCustomDifficultyActiveChange,
  onCustomDifficultyColorChange,
}: ProfilePactSettingsProps) {
  const { t } = useTranslation();
  /* L ETAT DU CODE DE VERROUILLAGE ET DE LA REINITIALISATION EST
     PARTI AVEC EUX. Restaient ici : deux etats de saisie, deux
     gestionnaires, un journal de terminal en anglais — et
     `useResetPact`, dont plus personne n avait besoin. */

  if (volet === "identite") {
    return (
      <>
        {/* LA VUE D ENSEMBLE EST PARTIE DANS « MES DONNEES ».
            Quatre chiffres ouvraient cette section, quatre autres
            ouvraient « Mes donnees » — dont deux les memes. Aucune des
            deux n est un reglage : une console de reglages ne commence
            pas par un tableau de bord, encore moins deux fois. Les deux
            valeurs qui n existaient qu ici — scelle le, jours tenus —
            ont rejoint l autre table. */}
        <PactIdentityCard
          pactId={pactId}
          pactName={pactName}
          pactMantra={pactMantra}
          pactSymbol={pactSymbol}
          titleFont={titleFont}
          titleEffect={titleEffect}
          onPactNameChange={onPactNameChange}
          onPactMantraChange={onPactMantraChange}
          onPactSymbolChange={onPactSymbolChange}
          onTitleFontChange={onTitleFontChange}
          onTitleEffectChange={onTitleEffectChange}
          onSave={onSavePactIdentity}
          isSaving={isSavingIdentity}
        />
      </>
    );
  }

  return (
    <>
      <ProjectTimelineCard
        pactId={pactId}
        projectStartDate={projectStartDate}
        projectEndDate={projectEndDate}
        onProjectStartDateChange={onProjectStartDateChange}
        onProjectEndDateChange={onProjectEndDateChange}
      />

      <CustomDifficultyCard
        userId={userId}
        customDifficultyName={customDifficultyName}
        customDifficultyActive={customDifficultyActive}
        customDifficultyColor={customDifficultyColor}
        onCustomDifficultyNameChange={onCustomDifficultyNameChange}
        onCustomDifficultyActiveChange={onCustomDifficultyActiveChange}
        onCustomDifficultyColorChange={onCustomDifficultyColorChange}
      />

      <RanksCard userId={userId} />

      {/* Le code de verrouillage est parti dans « Securite » : il
          masque le contenu d un objectif a qui regarde l ecran, ce qui
          ne regle rien du pacte. */}

      {/* LA REINITIALISATION A REJOINT LES DEUX AUTRES DESTRUCTIONS,
          dans « Mes donnees ». Deux panneaux nommes « Zone sensible »
          coexistaient dans le rail, avec des contenus differents.

          Et le journal de terminal qui suivait — « SYSTEM LOG // », en
          anglais — etait le dernier reliquat de l ancien kit : la
          refonte epuree l a retire partout ailleurs. */}
      <div className="h-8" />
    </>
  );
}
