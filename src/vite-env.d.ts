/// <reference types="vite/client" />

/**
 * CE QUE LES NAVIGATEURS ONT EN PLUS — OU EN MOINS — DE LA NORME.
 *
 * `(window as any).webkitAudioContext` marchait, mais il éteignait le
 * typage sur TOUT l'objet à cet endroit : une faute de frappe sur
 * n'importe quelle autre propriété serait passée sans un mot. Déclarer
 * l'exception une fois vaut mieux que renoncer au typage à chaque usage.
 */
declare global {
  interface Window {
    /** Safari < 14.1 : l'API audio n'a jamais perdu son préfixe. */
    webkitAudioContext?: typeof AudioContext;
  }

  /**
   * L'API Network Information n'est implémentée que par les navigateurs
   * Chromium, et ne figure dans aucune norme aboutie : `navigator.connection`
   * est absent partout ailleurs. On ne lit que ce qui sert à décider de
   * précharger ou non.
   */
  interface NavigatorConnexion {
    saveData?: boolean;
    effectiveType?: string;
  }
  interface Navigator {
    connection?: NavigatorConnexion;
  }
}

export {};
