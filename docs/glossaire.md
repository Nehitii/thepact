# Le glossaire

Ce dépôt parle deux langues, et **ce n'est pas un désordre à corriger**. Cette
page dit laquelle parle où, et donne le nom de chaque concept dans les trois
endroits où on le rencontre : la base, le code, l'interface.

`scripts/glossaire.json` en est la version machine, vérifiée par
`npm run langue:check`.

---

## La règle, en trois clauses

**1. Un mot que nomme une bibliothèque reste dans sa langue.**
`onSuccess`, `queryKey`, `mutationFn`, `useState`, `session`. Les traduire,
c'est mentir sur ce qu'on appelle.

**2. Un mot que nomme la base reste comme la base le nomme.**

C'est la clause qu'on a failli écrire à l'envers. Le plan de masse annonçait
« un mot du métier est en français ». On a compté avant d'appliquer :

| mot anglais | apparitions dans les noms de tables et colonnes |
|---|---|
| `user` | 85 |
| `goal` | 58 |
| `guild` | 26 |
| `completed` | 22 |
| `status` | 17 |

Sur les **39 mots anglais du domaine** relevés dans les identifiants, **un seul —
`phase` — n'existe pas en base.** Appeler `objectifs` la variable qui sort de
`from("goals")` ajouterait une traduction à chaque lecture, pour rien.

**3. Tout ce que le projet invente est en français.**
La variable locale, l'aide, le concept dérivé, le commentaire, et surtout le
texte affiché. C'est déjà le cas : `apresEcriture`, `useFournisseursActifs`,
`moisAffiche`, `PanneauAllies`.

**Et on ne renomme rien en masse.** Le stock existant se résorbe quand on ouvre
un fichier pour une autre raison. Renommer 170 fichiers d'un coup coûterait
trois jours et ne ferait trouver aucun fichier plus vite — c'est le rangement
par domaine qui fait ça, pas le vocabulaire.

---

## Les concepts

| concept | la base dit | le projet dit | à ne pas confondre avec |
|---|---|---|---|
| objectif | `goals` | objectif | — |
| pacte | `pacts` | pacte | le **contrat**, qui porte sur un seul objectif |
| contrat d'objectif | `goal_contracts` | contrat | le **pacte**, qui porte sur tous |
| étape | `steps` | étape | le **palier**, voir ci-dessous |
| palier | `ranks`, `guild_ranks` | palier | l'**étape**, voir ci-dessous |
| pièce chiffrée | `goal_cost_items` | pièce | — |
| liste de souhaits | `wishlist_items` | souhaits | jamais écrite par un geste : fabriquée depuis les pièces |
| succès | `user_achievements` | succès | le **trophée**, voir ci-dessous |
| trophée | — | trophée | le **succès**, voir ci-dessous |
| guilde | `guilds` | guilde | — |
| allié | `friendships` | allié | — |
| classement | *(aucune table)* | classement | le **palmarès du mois**, qui est une vue de finance |
| panthéon | `hall_of_fame` | panthéon | — |
| tâche | `todo_tasks` | tâche | — |
| habitude | `habit_logs` | habitude | — |
| dépense récurrente | `recurring_expenses` | dépense | — |
| revenu récurrent | `recurring_income` | revenu | — |
| validation mensuelle | `monthly_finance_validations` | mois validé | — |
| boutique | `shop_modules` | boutique | — |
| cosmétique | `cosmetic_frames` | cosmétique | — |
| récompense de saison | `season_rewards` | récompense | — |
| entrée de journal | `journal_entries` | entrée | — |
| séance | `focus_sessions` | séance | `session`, mot de Supabase |
| événement | `calendar_events` | événement | — |
| série | `health_streaks` | série | — |
| réglages | `profiles` | réglage | il n'y a **pas** de table `finance_settings` |
| membre | `profiles` | membre | `user`, mot de Supabase |

### Trois distinctions que la garde a forcé à écrire

**Succès ≠ trophée.** Un **succès** récompense une condition franchie ; un
**trophée** récompense une **catégorie entièrement** franchie. `useSucces` et
`useTrophees` sont deux hooks distincts, sur la même page. J'ai failli aplatir
la distinction en trente secondes de lecture — d'où cette ligne.

**Étape ≠ palier.** La garde a signalé « palier » cinquante fois avant qu'on
regarde. `useEtapes.ts` dit : *« le palier de l'objectif d'où vient l'étape »*.
Un palier est un rang de progression ; une étape en descend. Deux concepts.

**Succès ≠ réussite.** `settings.display.soundSuccess` dit « Sons de réussite »
et se décrit comme « Achèvement de tâches et objectifs ». C'est le son joué
quand on achève quelque chose, pas un son de la page Succès. Le mot garde son
sens ordinaire, et n'est donc pas interdit.

---

## Ce que la garde vérifie

`npm run langue:check` ne devine rien. Il vérifie deux choses certaines.

**(a) Le glossaire ne ment pas sur le schéma.** Chaque table déclarée existe
dans `src/integrations/supabase/types.ts`, qui est le schéma checké dans le
dépôt. Un glossaire qui dérive de la base est pire que pas de glossaire — et la
première version en déclarait **quatre qui n'existent pas** : `goal_steps`,
`achievements`, `todos`, `habits`. Les vrais noms sont `steps`,
`user_achievements`, `todo_tasks`, `habit_logs`.

**(b) Aucun synonyme refusé ne reprend pied**, dans un identifiant, dans un
texte affiché, ou dans `fr.json`. Les commentaires sont exemptés : ce sont de la
prose, et « un rituel » dans une phrase n'est pas un deuxième nom pour
« habitude ».

### Ce que ça a coûté d'y arriver

La première version du glossaire refusait 38 synonymes choisis au jugé. Elle a
produit **182 signalements**, et la garde avait raison sur les 182 : `session`
est le mot de Supabase, `article` désigne les articles des mentions légales,
`note` a dix sens, et j'avais refusé `contrat` tout en le déclarant deux entrées
plus haut comme le mot juste. Un mot déjà employé ailleurs pour autre chose
n'est pas un synonyme fautif.

Les listes `refuses` ne contiennent donc plus que des mots **vérifiés absents du
dépôt** : ils gardent l'avenir, pas le passé.

---

## Le seul vrai désaccord trouvé

Au 28/08/2026, l'application disait les deux : **13 chaînes « allié » contre 15
« ami »**, pour le même concept, dans la même interface.

« Allié » a été retenu — c'est le registre du reste (pacte, guilde, serment,
panthéon), et « Amis » était le reste de l'échafaudage d'origine. Les quinze
chaînes ont été réécrites **une par une, pas par substitution** :

> « Retirer de mes amis » → « **Rompre l'alliance** »
> « Veut être ami(e) » → « **Veut devenir ton allié** »

Une règle mécanique aurait produit « Retirer de mes alliés », qui est du
français bancal. Plus `demandesAmis` → `demandesAllies` dans la barre latérale,
et trois chaînes dans le code.

L'anglais n'a pas été touché : `en.json` est une traduction, et ce glossaire ne
gouverne que le français.
