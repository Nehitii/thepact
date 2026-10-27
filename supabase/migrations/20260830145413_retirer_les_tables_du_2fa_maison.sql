-- Le 2FA maison a ete retire du code le 30/08/2026 (commit 10e8afb9),
-- remplace par le MFA de Supabase. Il restait ses trois tables et les
-- deux fonctions qui les lisent : plus une ligne de code ne les touche,
-- et les types generes etaient leur dernier point d attache.
--
-- MESURE AVANT SUPPRESSION : user_recovery_codes et user_trusted_devices
-- sont VIDES ; user_2fa_settings porte UNE ligne, dont totp_enabled et
-- email_2fa_enabled sont faux et totp_secret est nul. Rien d actif n est
-- detruit.

drop function if exists public.get_own_2fa_status();
drop function if exists public.get_user_2fa_status(p_user_id uuid);

drop table if exists public.user_recovery_codes;
drop table if exists public.user_trusted_devices;
drop table if exists public.user_2fa_settings;
