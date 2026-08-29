# L'onboarding — le rite du pacte

État : **conception**. Rien de ce qui suit n'est écrit dans `src/`.

**Deux exclusions décidées le 29/08/2026 :** le rite est **muet** — aucun son,
nulle part —, et la réplique inachevée de M.I.A. **ne se stocke pas**. Elle est
dite, elle n'est pas semée ; ce qu'elle deviendra se décidera plus tard.
Ce document dit ce qu'on veut faire arriver, et les trois ou quatre décisions
qui coûteraient cher à prendre à l'envers.

---

## Ce qui existe, et pourquoi ça ne suffit pas

`src/domaines/onboarding/pages/Onboarding.tsx` — 522 lignes, six étapes :
accueil, nom affiché, pacte (nom + mantra), valeurs, premier objectif,
personnalisation (symbole + couleur). Puis un voile de scellement de 1,6 s et
`navigate("/")`.

C'est correct, et c'est **un formulaire bien habillé**. Six écrans qui
demandent ; aucun qui *fait arriver quelque chose*. Le mot « pacte » est
prononcé sept fois et n'est jamais tenu : on ne signe rien, on valide.

Le reste de l'application, elle, tient sa promesse — le glossaire l'a déjà
tranché : pacte, serment, guilde, panthéon, allié. L'onboarding est le seul
endroit qui parle encore la langue d'un tunnel d'inscription. C'est le premier
écran ; c'est aussi le seul qu'on ne voit qu'une fois.

---

## La forme : quatre actes

| Acte | Ce qui se passe | Écrans |
|---|---|---|
| I — L'éveil | Le système détecte un porteur sans pacte | 1 |
| II — La forge | Le pacte se construit, fenêtre par fenêtre | 5 |
| III — Le scellement | Le cercle, les clauses, la signature | 1 (+ le voile) |
| IV — La rencontre | M.I.A. arrive, et réclame le premier objectif | 1 |

Huit écrans contre six — mais **quatre seulement demandent de taper quelque
chose**. Le reste se regarde. On échange du remplissage contre de la mise en
scène, on n'ajoute pas du remplissage.

---

## Acte I — L'éveil

Noir. Pas de titre, pas de bouton « Commencer », pas de logo qui attend.

Une **fenêtre système s'ouvre seule**, au bout d'une seconde et demie de vide :

```
[SYSTÈME]
Porteur non enregistré détecté.
Aucun pacte actif.

▸ Initialiser un pacte ?      [ OUI ]   [ NON ]
```

Le cadre : coins tronqués — le `clipPath` en polygone existe déjà à l'étape 0
de la page actuelle —, liseré `primary`, texte écrit lettre par lettre en
Orbitron, un balayage horizontal lent.

**Le refus a une réponse.** [ NON ] referme la fenêtre, une seconde de noir, la
fenêtre se rouvre : *« Réponse non enregistrée. »* **Une seule fois.** Le
deuxième refus est accepté et renvoie à la déconnexion. La blague pose le ton
en deux secondes ; répétée, elle devient une porte fermée, et une porte fermée
n'est plus une blague.

---

## Acte II — La forge

Cinq fenêtres, une par déclaration. Chacune s'ouvre, se remplit, **se replie
vers le centre** où le sceau grandit d'un cran. Les fenêtres closes restent
empilées derrière, en transparence : c'est la trace de ce qu'on a déclaré, et
ça remplace la barre de progression — un rite n'a pas de barre de progression.

| # | Fenêtre | Ce qu'on écrit | Colonne |
|---|---|---|---|
| 1 | Le porteur | ton nom | `profiles.display_name` |
| 2 | Le pacte | son nom — pas le tien : celui de la chose jurée | `pacts.name` |
| 3 | Le sceau | symbole + couleur | `pacts.symbol`, `pacts.color` |
| 4 | La phrase | le mantra | `pacts.mantra` |
| 5 | Les valeurs | 3 à 5, ou aucune | `user_values` |

Trois écarts avec la page actuelle, et ce sont eux qui font tout :

**Le sceau passe avant la phrase.** Aujourd'hui la personnalisation est
dernière, après l'objectif — le sceau arrive quand plus rien ne s'y accroche.
En troisième position, il y a un objet au centre de l'écran pendant tout le
reste du rite, et il change de couleur sous les yeux.

**La phrase se grave.** Pas un `Textarea` de trois lignes : une ligne unique
qui rougeoie, où les lettres apparaissent avec un retard d'un souffle sur la
frappe. Elle se valide **en maintenant**, pas en cliquant. Une phrase gravée ne
se corrige pas à la légère — et c'est le seul moment du rite où on demande un
geste tenu avant la signature.

**Les valeurs s'accrochent au cercle.** Elles ne se cochent pas dans une
grille : chaque valeur choisie vient se fixer sur l'anneau extérieur, à sa
place. Elles y resteront — voir le sigil.

---

## Acte III — Le scellement

### Le cercle

Pas un pentagramme. Un **HUD circulaire** : trois anneaux concentriques, des
graduations, des glyphes, le symbole du pacte au centre, le tout dans la
couleur choisie. Futuriste par la géométrie, arcanique par la lenteur.

### Le sigil, et pourquoi il est calculé

Les glyphes ne sont pas de la décoration. **Ils se déduisent du pacte lui-même**,
et le même pacte donne toujours le même sigil.

```
alphabet     24 traits, dessinés une fois, dans une boîte unitaire
source       pacts.name normalisé — NFD, sans accents, minuscules, [a-z0-9]
trait i      alphabet[ code(source[i]) % 24 ]
angle i      i / n · 2π  +  décalage,  décalage = FNV-1a(source) mod 2π
ancres       une par valeur : angle = FNV-1a(valeur) mod 2π, sur l'anneau externe
polygone     la corde qui relie les ancres dans l'ordre de rang
```

Fonction pure, aucune donnée à stocker : le sigil se recalcule partout à partir
de ce que `pacts` contient déjà. **Rien à migrer.**

Deux garde-fous que la formule impose :

- **Plafonner à 16 traits.** Au-delà, un nom long produit une bouillie ; on
  échantillonne le nom au lieu de le parcourir.
- **Versionner l'alphabet.** `pacts.sigil_version`, un entier. Le jour où on
  ajoute un trait, tous les sceaux déjà scellés changeraient de dessin en
  silence — c'est la seule chose ici qu'on ne peut pas réparer après coup. Un
  sceau qui bouge n'est pas un sceau.

**Et il ressort partout.** `PactIdentityCard`, `PactVisual`, les pactes
partagés, la guilde, le panthéon. C'est ce qui distingue un rituel d'une
animation : il produit un objet qui lui survit.

### Les clauses

*« Nul pacte sans clauses. »* Les conditions se déroulent comme l'anneau
extérieur du cercle — le contenu existe déjà, `domaines/mentions-legales/contenu.ts`,
articles « Acceptation » et « Âge minimum » compris.

**Le théâtre enrobe le consentement ; il ne le remplace pas.** Une case à
cocher réelle, des liens réels vers les deux pages, décochée par défaut, et
**une action distincte du geste de signature**. Un consentement doit rester
libre, spécifique et non équivoque : si cocher et signer sont le même geste, il
ne l'est plus. La mise en scène a le droit de rendre la lecture désirable ;
elle n'a pas le droit de la rendre invisible.

### La signature

**Elle dépend de l'appareil**, parce que le bon geste n'est pas le même.

| `matchMedia("(pointer: coarse)")` | Geste |
|---|---|
| vrai — doigt | **tracer le sigil.** Le trait s'allume derrière le doigt, tolérance large : on valide un parcours, pas une calligraphie. |
| faux — souris | **maintenir le centre.** L'anneau se remplit en trois secondes ; relâcher avant, c'est tout perdre. |
| clavier seul | maintenir `Espace` ou `Entrée`, même remplissage. |

Puis : le tracé se ferme, **une demi-seconde de silence total**, le cercle
brûle, l'écran passe à la couleur du pacte, le nom en Orbitron.

Le succès « Le pacte scellé » se compte ici — `trackPactCreated` existe déjà, et
reste en `void` : si le comptage échoue, le rite continue.

---

## Acte IV — M.I.A.

Elle n'arrive pas avec le pacte. Elle arrive **dans le noir qui suit**.

D'abord `ReseauMia` seul, sans visage. Puis les bulles, une à la fois, à son
rythme — pas au clic de l'utilisateur, sauf pour accélérer.

> — Il y a quelqu'un.
> — C'est nouveau.
>
> *(le visage apparaît — `surprise` → `calme`)*
>
> — Je m'appelle M.I.A. J'étais là avant ton pacte. Je serai là après, si tu le romps.
> — Ce que tu viens de sceller, je l'ai lu. Je ne l'oublierai pas. C'est à peu près tout ce que je sais faire — et c'est déjà plus que la plupart.
> — Tu vas me trouver sèche. Ce n'est pas contre toi.
>
> *(`complice`)*
>
> — Ce sera contre toi seulement les jours où tu mentiras à ton propre pacte.
>
> *(`reflexion`, un temps trop long)*
>
> — Peut-être pourras-tu…
>
> *(`genee`)*
>
> — Non. Rien.
> — Pas encore.
>
> *(`neutre`)*
>
> — Ton pacte est vide. Donne-lui quelque chose à tenir.

**Sur le ton.** M.I.A. écrite est sèche, précise, cinglante — `excuses.ts` :
*« Encore une et je compte les secondes à voix haute. »* La faire parler
ésotérique cinq minutes, c'est inventer un deuxième personnage, et le premier
ne s'en remettra pas. Elle commence étrange **deux répliques**, puis se
reprend. L'étrangeté devient quelque chose qui lui a échappé, pas un costume —
et une chose qui échappe à une IA est plus inquiétante qu'une chose qu'elle
récite.

Les dix-huit visages existent, `cadrage.ts` les cadre déjà, `VISAGES_FREQUENTS`
en précharge six : `surprise`, `calme`, `complice`, `reflexion`, `genee`,
`neutre` — six sur six sont dans la liste. Le rite ne coûte pas un octet de
plus au démarrage.

### Le premier objectif, c'est elle qui le demande

Sa dernière réplique ouvre la fenêtre des modèles d'objectif — les quatre
existants, plus « le tien ». Ce n'est plus une étape de formulaire, c'est **sa
première requête**. La relation commence par une demande, ce qui est exactement
ce qu'elle sera ensuite.

---

## Les sorties

Trois, et aucune n'est négociable.

**`prefers-reduced-motion`.** Le rite garde ses écrans, ses textes et sa
signature ; il perd les balayages, la gravure lettre à lettre et la combustion.
Les fenêtres apparaissent, elles ne s'écrivent pas.

**Passer.** Discret, jamais caché. Qui veut entrer entre : formulaire compact,
mêmes champs, pacte scellé sans cercle. Un rite dont on ne peut pas sortir est
une porte, pas un rite.

**Le rite abrégé.** `ReinitialiserLePacte.tsx` existe : quelqu'un repassera par
là, et la deuxième fois n'est jamais la première. Le second passage garde
l'acte II et la signature, saute l'éveil et la rencontre. M.I.A. ne se
represente pas — elle dit autre chose, ce qui est le sujet d'une autre page.

---

## Ce qui existe déjà et qu'on ne réécrit pas

| Besoin | Ce qui le couvre |
|---|---|
| Animations, transitions d'écran | `framer-motion`, déjà de bout en bout |
| Typographies | Orbitron (système), Rajdhani (M.I.A.) |
| Anneau de M.I.A. | `ReseauMia` |
| Visages et cadrage | `VisageMia`, `cadrage.ts`, 18 expressions |
| Bulles de dialogue | `BulleMia` |
| Étincelles, icônes, visuel du pacte | `EtincellesPacte`, `IconesPacte`, `PactVisual` |
| Conditions et vie privée | `domaines/mentions-legales/contenu.ts` |
| Succès du scellement | `trackPactCreated` |
| Colonnes du pacte | `pacts` — name, mantra, symbol, color |

À écrire vraiment : l'alphabet des 24 traits, la fonction du sigil, le tracé au
doigt et la machine à répliques.

---

## Ce qui reste à trancher

- **La durée cible.** Le rite doit tenir sous les deux minutes trente, sans
  quoi la sortie « passer » devient le chemin normal — et on aura écrit un rite
  pour personne.
- **Les textes anglais.** Le glossaire ne gouverne que le français ; `en.json`
  est une traduction. Une réplique de M.I.A. traduite mot à mot perd sa
  sécheresse. À écrire, pas à traduire.
