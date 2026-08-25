-- PERDRE SON TÉLÉPHONE, C'ÉTAIT PERDRE SON COMPTE.
--
-- L'enrôlement TOTP est propre — QR fourni par Supabase, facteur non
-- vérifié tant que le code n'est pas confirmé — mais il n'offrait aucun
-- chemin de retour. Et `mfa_aal2_requis` étant restrictive sur
-- `profiles`, la porte était bel et bien close : sans le téléphone, il
-- fallait une intervention administrateur. L'écran de défi le disait
-- lui-même, et renvoyait au tableau de bord Supabase.
--
-- Ces codes sont le chemin de retour. Un code brûlé ne redonne PAS le
-- niveau aal2 — seul `mfa.verify()` le délivre — il retire le facteur.
-- On revient donc à un compte sans second facteur, qu'on peut ouvrir
-- normalement puis ré-enrôler. C'est ce qu'une récupération doit faire :
-- rendre l'accès, pas contourner la vérification.
--
-- La table ne porte que des empreintes. Les codes en clair n'existent
-- qu'une fois, dans la réponse qui les crée.
create table if not exists public.mfa_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- SHA-256 du code. Un code tiré au hasard sur 10 caractères d'un
  -- alphabet de 31 porte environ 50 bits : les tables arc-en-ciel n'ont
  -- pas prise, un sel n'ajouterait rien ici.
  code_hash text not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists mfa_recovery_codes_user_idx
  on public.mfa_recovery_codes (user_id) where used_at is null;

-- AUCUNE POLITIQUE, VOLONTAIREMENT.
--
-- RLS est active et la table n'a pas une seule politique : un client
-- authentifié ne peut donc ni lire ni écrire ici, pas même ses propres
-- lignes. Tout passe par la fonction edge `mfa-recovery`, qui détient
-- le rôle de service. Une empreinte de code de secours n'a aucune
-- raison de descendre dans un navigateur.
alter table public.mfa_recovery_codes enable row level security;

comment on table public.mfa_recovery_codes is
  'Codes de secours du second facteur, en empreinte seule. Aucun accès client : la fonction edge mfa-recovery en est le seul lecteur.';
