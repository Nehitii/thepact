/**
 * LE TYPE DU CLIENT, ÉPINGLÉ AU MÊME ENDROIT QUE TOUT LE RESTE.
 *
 * Deux fichiers qui importent `@supabase/supabase-js` sur deux versions
 * différentes obtiennent deux types `SupabaseClient` structurellement
 * incompatibles, et le passage de l'un à l'autre échoue au contrôle de
 * types. C'est exactement ce qui est arrivé à `scrape-product` : il
 * importait `@2` — la dernière 2.x du jour, qui bouge toute seule — alors
 * que `_shared/quota.ts` épingle 2.58.0.
 *
 * Le jour où on monte de version, ce fichier et `quota.ts` bougent
 * ensemble, et rien d'autre.
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

/** Le client tel que les fonctions internes le reçoivent. */
export type ClientSupabase = SupabaseClient;
