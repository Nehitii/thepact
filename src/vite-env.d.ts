/// <reference types="vite/client" />

/**
 * CE QUE LES NAVIGATEURS ONT EN PLUS DE LA NORME.
 *
 * `(window as any).webkitAudioContext` marchait, mais il éteignait le
 * typage sur TOUT l'objet window à cet endroit : une faute de frappe sur
 * n'importe quelle autre propriété serait passée sans un mot. Déclarer
 * l'exception une fois vaut mieux que renoncer au typage à chaque usage.
 */
declare global {
  interface Window {
    /** Safari < 14.1 : l'API audio n'a jamais perdu son préfixe. */
    webkitAudioContext?: typeof AudioContext;
  }
}

export {};
