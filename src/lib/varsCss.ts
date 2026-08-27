import type { CSSProperties } from "react";

/**
 * UN STYLE QUI PORTE DES VARIABLES CSS.
 *
 * `React.CSSProperties` ne connaît que les propriétés normalisées : poser
 * `--ds-current-accent` dans un `style={{}}` est une erreur de type. Le
 * réflexe était `["--ds-current-accent" as any]`, qui éteint le typage de
 * TOUT l'objet de style — la faute de frappe d'à côté passait sans un mot.
 *
 * Ce type ajoute les variables, et rien d'autre :
 *
 *   style={{ "--ds-current-accent": ACCENT_VAR[accent] } as StyleAvecVariables}
 *
 * Un cast, oui — mais vers un type EXACT, pas vers `any`. La différence
 * n'est pas cosmétique : `padding: "8px"` mal orthographié en `pading`
 * reste refusé ici, alors que `as any` l'aurait laissé passer.
 *
 * (`satisfies` ne convient pas : le type attendu par `style` est
 * `CSSProperties`, et le contrôle des propriétés en trop se déclenche
 * avant que `satisfies` n'ait élargi quoi que ce soit.)
 */
export type StyleAvecVariables = CSSProperties & Record<`--${string}`, string | number>;
