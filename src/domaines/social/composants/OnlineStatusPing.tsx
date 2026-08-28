import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/**
 * Le pointage de presence, monte une fois sous AuthProvider.
 *
 * LA CADENCE VIT DANS LE CROCHET, PAS ICI. Elle etait ecrite aux deux
 * endroits : le crochet disait soixante secondes par defaut, ce montage
 * repassait soixante secondes par-dessus, et son commentaire les
 * annoncait une troisieme fois. Trois sources pour un nombre, c est
 * trois occasions de les voir diverger.
 */
export function OnlineStatusPing() {
  useOnlineStatus();
  return null;
}
