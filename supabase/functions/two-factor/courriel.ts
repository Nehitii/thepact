/* LE COURRIEL QUI PORTE LE CODE.
 *
 * Ce qui est envoye a quelqu un ne se relit pas apres coup : une fois
 * parti, il est parti. Le message vivait au milieu de l appel reseau,
 * ou personne ne le lisait — et il ANNONCAIT UN DELAI EN TOUTES
 * LETTRES, « expires in 5 minutes », a cote d une constante qui decide
 * du vrai delai sans savoir que la phrase existe.
 */
import { DUREE_DU_CODE_MS } from "./totp.ts";

/* LA PHRASE EST DERIVEE DU DELAI, PAS RECOPIEE A COTE.
 *
 * Les deux s accordent aujourd hui — cinq minutes des deux cotes. Rien
 * ne les tenait ensemble : changer `DUREE_DU_CODE_MS` pour dix minutes
 * laissait le courriel promettre cinq, et la personne qui aurait
 * attendu six minutes se serait crue expiree alors que son code valait
 * encore. */
export const MS_PAR_MINUTE = 60 * 1000;
export const MINUTES_DU_CODE = DUREE_DU_CODE_MS / MS_PAR_MINUTE;

/* L EXPEDITEUR DE SECOURS. C est `||` et non `??` : une variable
   d environnement posee mais VIDE — le cas ordinaire d un `.env` ou la
   ligne existe sans valeur — retombe sur le defaut, la ou `??` aurait
   laisse partir un courriel sans expediteur. */
export const EXPEDITEUR_PAR_DEFAUT = "Pacte <onboarding@resend.dev>";

export function expediteur(configure: string | null | undefined): string {
  return configure || EXPEDITEUR_PAR_DEFAUT;
}

/* LE CODE EST DANS L OBJET DU MESSAGE, ET C EST VOULU : il se lit dans
   la notification, sans ouvrir le courriel. Le prix est qu il s affiche
   sur un ecran verrouille — un compromis deja pris, pas une trouvaille
   de ce decoupage. */
export function sujetDuCourriel(code: string): string {
  return `${code} — Your Pacte verification code`;
}

/* LE CODE EST INSERE DANS DU HTML SANS ETRE ECHAPPE.
 *
 * C est sans danger, mais pas par hasard : `generate6DigitCode` ne rend
 * que des chiffres, et l appelant n en fabrique pas d autre. Le jour ou
 * un code viendrait d ailleurs — d un corps de requete, par exemple —
 * il faudrait echapper ici. Le test le dit, pour que ce ne soit pas une
 * chose qu on redecouvre.
 *
 * LE MESSAGE EST EN ANGLAIS alors que l application parle francais.
 * C etait deja le cas ; le traduire changerait ce que quelqu un
 * recoit, et cela ne se decide pas dans un decoupage. */
export function corpsDuCourriel(code: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #1a1a2e; font-size: 24px; margin: 0;">Pacte</h1>
        <p style="color: #666; font-size: 14px; margin-top: 8px;">Two-Factor Authentication</p>
      </div>
      <div style="background: #f8f9fa; border-radius: 12px; padding: 32px; text-align: center;">
        <p style="color: #333; font-size: 16px; margin: 0 0 24px;">Your verification code is:</p>
        <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1a1a2e; font-family: monospace; background: white; border-radius: 8px; padding: 16px; border: 2px solid #e2e8f0;">
          ${code}
        </div>
        <p style="color: #888; font-size: 13px; margin-top: 24px;">This code expires in ${MINUTES_DU_CODE} minutes.<br/>If you didn't request this, you can safely ignore it.</p>
      </div>
    </div>
  `;
}
