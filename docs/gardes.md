# Les gardes

Sept scripts qui **échouent** au lieu de prévenir. Ils existent parce que le
dépôt a été réorganisé domaine par domaine (voir le plan de masse) et qu'on ne
déplace pas 516 fichiers sans instrument.

```bash
npm run verifier
```

enchaîne, dans cet ordre : `couches:check`, `taille:check`, `domaines:check`,
`langue:check`, `chemins:check`, `orphelines:check`, `i18n:check`, `typecheck`,
`lint`, `test`. La chaîne s'arrête au premier échec — les gardes passent en
moins d'une seconde, elles sont donc en tête.

**Quatre des sept ont été écrites après le défaut qu'elles auraient empêché**, et
le dire est le point : `langue` après 182 écarts de vocabulaire, `chemins` après
que deux gardes eurent perdu leurs fichiers en silence, `orphelines` après la
deuxième feuille de style disparue de `dist/`. Une garde qu'on écrit d'avance
protège de ce qu'on imagine ; une garde qu'on écrit après protège de ce qui
arrive vraiment.

---

## 1. `npm run couches:check` — le sens des dépendances

Une couche basse ne doit pas appeler une couche haute. L'échelle :

| rang | ce qui s'y trouve |
|---|---|
| 0 | `styles/` `assets/` `*.css` `integrations/` `types/` `content/` `i18n/` |
| 1 | `lib/` — logique pure, sans React |
| 2 | `components/ui/` `components/ds/` |
| 3 | `contexts/` |
| 4 | `hooks/` |
| 5 | `components/` `domaines/` |
| 6 | `pages/` |
| 7 | `App.tsx` `main.tsx` |

On n'importe que vers un rang inférieur ou égal au sien.

**Deux choses que cette garde a apprises en étant mise à l'épreuve.**

Une première version rangeait `styles/` au rang le plus haut, parce que le
dossier vit à la racine de `src/`. Elle signalait **57 fausses inversions** —
chaque `import "@/styles/focus.css"` d'une page en était une. Une feuille de
style est une ressource inerte : le rang suit la nature du fichier, pas son
adresse.

Une deuxième version mettait `lib/` et `components/ui/` au même rang, les deux
étant « du socle ». On lui a soumis
`import { Button } from "@/components/ui/button"` ajouté dans `lib/currency.ts`
et **elle a dit oui**. De la logique pure qui importe un composant React cesse
d'être testable sans DOM. `lib/` est donc seul, en dessous.

**L'état du jour : 56 inversions, dans 25 fichiers.** Toutes inscrites dans
`TOLERE`, chacune avec sa raison et l'étape qui la fera disparaître. Une
tolérance qui ne correspond plus à rien fait échouer le script : une garde qui
traîne des exceptions périmées ne garde plus rien.

- 22 d'entre elles sont `lib/prefetchRoutes.ts` seul, qui pointe vers les pages.
  Elles disparaissent quand le fichier rejoint `app/` — c'est sa vraie place.
- Les 34 autres sont de vraies erreurs de sens et se corrigent à l'étape 3.

---

## 2. `npm run taille:check` — le cliquet

Aucun fichier neuf au-dessus de **400 lignes**. Les 55 qui les dépassent déjà
sont dans `scripts/taille-plafonds.json` avec leur taille du jour, et cette
taille est un **plafond** : le fichier peut maigrir, jamais grossir.

Ce n'est pas une liste d'exceptions. Une liste d'exceptions se contente
d'exister ; un cliquet descend.

```bash
npm run taille:abaisser   # après un découpage : réécrit les plafonds
```

`--abaisser` retire aussi les plafonds qui ne désignent plus rien (fichier
supprimé, renommé, ou redescendu sous le seuil). Sans ce nettoyage, la liste
grossirait en silence pendant que le dépôt maigrit.

**400 n'est pas une règle de style.** C'est le seuil au-delà duquel, dans ce
dépôt, un fichier a cessé de se lire d'une traite. Et le seuil ne mesure pas la
complexité : un fichier de 380 lignes peut être pire qu'un de 420. Le nombre de
lignes est simplement la seule grandeur qu'on puisse compter sans se tromper.

---

## 3. `npm run domaines:check` — les portes

**Ne garde encore rien** : `src/domaines/` n'existe pas. Elle est écrite et
éprouvée d'avance, parce que l'étape 2 en aura besoin le jour où elle commence.

La règle, une fois les domaines en place : depuis un autre domaine, on n'importe
qu'un chemin de la forme `@/domaines/<nom>` ou `@/domaines/<nom>/index`. Tout ce
qu'un domaine veut offrir, il le réexporte depuis son index ; le reste lui
appartient.

Deuxième règle : `socle/` ne nomme aucun domaine. Le socle est ce qui sert à
tous ; s'il en nomme un, il n'est plus le socle.

```bash
node scripts/verifier-domaines.mjs --racine chemin/vers/un/decor
```

`--racine` existe pour que la garde soit éprouvable sur un décor fabriqué. Elle
l'a été sur quatre cas avant d'être posée : passage par la porte (accepté),
entrée par la fenêtre (refusé), socle qui nomme un domaine (refusé), domaine qui
circule chez lui (accepté).

---

## 7. `npm run orphelines:check` — les feuilles que personne ne lit

**Écrite le 29/08, après le défaut qu'elle aurait empêché.**

Un fichier TypeScript qu'on cesse d'importer fait échouer le typecheck, ou au
pire le build. **Une feuille de style qu'on cesse d'importer ne fait rien
échouer du tout** : elle sort du paquet, l'écran perd ses règles, et les six
autres gardes restent vertes.

C'est arrivé deux fois. `boutique.css`, en rangeant la boutique — orpheline
pendant toute une chaîne verte, repérée à l'œil. Puis `revue.css` : en la
faisant descendre de `main.tsx` vers le domaine de la revue, l'import global a
été retiré sans qu'un import local soit posé. Typecheck, six gardes et 81 tests
sont passés. C'est le **build** qui a parlé — plus une seule règle `.rv-` dans
`dist/`, cinquante sélecteurs évaporés.

Deux fois le même défaut, dont une **après l'avoir déjà vu** : ce n'est plus une
inattention, c'est un angle mort de l'outillage.

La garde vérifie les deux sens :

1. toute feuille de `src/` est citée par au moins un import (TS ou `@import`) ;
2. tout chemin `.css` cité pointe vers un fichier qui existe.

La deuxième moitié double `chemins:check`, qui ne regarde que les chemins cités
dans `scripts/` — pas ceux que le code s'adresse à lui-même.

---

## Ce qui a été fait pour croire ces gardes

Chacune a été **mise en échec sur un cas fabriqué avant d'être déclarée bonne** :

| garde | cas soumis | verdict attendu |
|---|---|---|
| couches | `lib/currency.ts` importe un composant `ui` | refus |
| couches | `hooks/useSouffle.ts` importe `pages/Focus` | refus |
| couches | une tolérance qui ne correspond à rien | refus |
| taille | un fichier déjà trop gros qui gagne 3 lignes | refus |
| taille | un fichier neuf de 402 lignes | refus |
| taille | le même fichier ramené à 398 lignes | passage |
| taille | un plafond désignant un fichier absent | refus |
| domaines | import par la porte / par la fenêtre / socle / interne | 2 refus, 2 passages |
| orphelines | l'import de `revue.css` retiré du modal | refus |
| orphelines | un import vers `inexistante.css` | refus |
| orphelines | l'état réel du dépôt | passage |

Et la chaîne complète a été vérifiée sur son point le plus fragile : avec une
inversion introduite exprès, `npm run verifier` s'arrête à la première garde et
ne lance pas les suivantes.

Une garde qu'on n'a jamais vue refuser ne prouve rien.
