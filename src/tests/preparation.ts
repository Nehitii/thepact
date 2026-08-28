/* ═══════════════════════════════════════════════════════════════
   CE QUE JSDOM N'A PAS

   jsdom implémente une grande partie du DOM, pas tout. Ce fichier
   comble les manques que nos dépendances supposent présents — et
   seulement ceux-là : chaque ajout est une petite fiction, et une
   fiction de trop finit par faire passer un test qui devrait échouer.
   ═══════════════════════════════════════════════════════════════ */

/* `input-otp` cherche à repérer le badge d'un gestionnaire de mots de
   passe posé par-dessus le champ. Il interroge pour cela
   `document.elementFromPoint`, absent de jsdom : la minuterie levait
   après la fin du test, hors de toute assertion — trois exceptions
   non rattrapées pour un comportement qui ne nous intéresse pas ici.

   On rend `null` : « rien à cet endroit », ce qui est vrai dans un
   DOM sans mise en page. */
if (typeof document !== "undefined" && !document.elementFromPoint) {
  document.elementFromPoint = () => null;
}
