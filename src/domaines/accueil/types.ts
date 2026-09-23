/* LES FORMES DU DOMAINE ACCUEIL. */

/* Venues de « NexusHeroBanner.tsx », qui les declarait sans les exporter :
 * un type inerte n a pas a vivre dans le fichier qui le rend. */
/** Ce que compte le pourcentage de progression. */
export type MesureProgression = "goals" | "steps";

/* Venues de « NexusHeroBanner.tsx », qui les declarait sans les exporter :
 * un type inerte n a pas a vivre dans le fichier qui le rend. */
export interface NexusHeroBannerProps {
  progression: number;
  /** Objectifs atteints, ou etapes franchies. */
  mesure?: MesureProgression;
  /** Bascule d une mesure a l autre. Absent : la valeur n est pas cliquable. */
  onChangerMesure?: () => void;
  level: number;
  totalMissions: number;
  activeDays: number;
  pactName?: string;
  pactMantra?: string;
  pactSymbol?: string;
  /* LE SCEAU A BESOIN DES DEUX. Les valeurs, DANS LEUR ORDRE DE RANG,
     placent ses medaillons ; la version dit sous quel alphabet ce
     pacte a ete jure — sans elle, un pacte de la v1 se redessinerait
     en v2 au premier chargement. */
  valeurs?: readonly string[];
  sigilVersion?: number;
  titleFont?: string | null;
  titleEffect?: string | null;
  /** Rang, integre dans un coin du bandeau plutot que dans un panneau
   *  separe : il repetait le niveau deja affiche dans les statistiques,
   *  et son nom trois fois dans ses propres 355px. */
  rankName?: string;
  /* L IMAGE ET LA TEINTE DU PALIER. Le noyau savait deja les afficher
     — la carte publique les lui passait — mais le bandeau ne lui
     donnait que le nom : le tableau de bord montrait donc un numero de
     niveau la ou l utilisateur avait choisi un embleme. */
  rankLogoUrl?: string | null;
  rankTeinte?: string | null;
  nextRankName?: string | null;
  rankProgress?: number;
  rankXP?: number;
  rankXPTarget?: number;
  /** Combien d objectifs sont reellement en cours. Le logo bat avec. */
  enCours?: number;
}

/* CE QUE LES VARIANTES DU BANDEAU LISENT EN PLUS. Trois colonnes de
 * « pacts » que l ancien bandeau n affichait pas : la couleur choisie au
 * rite, le jour du serment et l echeance. La piece d identite les
 * imprime, la stele grave la date, le plan large l affiche en salle.
 * Facultatives : l enseigne, en service sur l accueil depuis le 23/09,
 * les recoit de la page ; les autres variantes ne vivent qu au banc. */
export interface ProprietesDuBandeau extends NexusHeroBannerProps {
  /** « pacts.color » : amber, rose, emerald, sky, violet ou cyan. */
  teinte?: string | null;
  /** Jours civils « AAAA-MM-JJ » : « project_start_date », « project_end_date ». */
  jureLe?: string | null;
  terme?: string | null;
  /** Le modele d interrupteur de mesure de l enseigne : le cordon, sauf au banc. */
  interrupteur?: string | null;
}

/* CE QUE RECOIT UNE BARRE D ACCES RAPIDE — l actuelle et ses refontes.
 * Les modules achetes decident des verrous ; les deux rappels ouvrent
 * les outils de la page (la revue, le tirage). */
export interface ProprietesAccesRapide {
  ownedModules: {
    "todo-list": boolean;
    journal: boolean;
    "track-health": boolean;
  };
  onWeeklyReview?: () => void;
  onMissionRandomizer?: () => void;
  missionRandomizerOuvert?: boolean;
  missionRandomizerDisponible?: boolean;
  /** Au banc seulement : ou l acces aurait mene, au lieu d y aller. */
  onNaviguer?: (route: string) => void;
  className?: string;
}
