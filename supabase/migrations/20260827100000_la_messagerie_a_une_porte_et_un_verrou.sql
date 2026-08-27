-- ═══════════════════════════════════════════════════════════════
-- LA MESSAGERIE PRIVÉE : UNE PORTE, UN VERROU, ET LE DIRECT
--
-- RELEVÉ AVANT MIGRATION : 0 message envoyé, jamais, par personne,
-- depuis la création de la table. Ce n'est pas un désintérêt : c'est
-- qu'il n'existe AUCUN chemin vers l'écriture d'un message. Le seul
-- lien vers un fil part de la liste des conversations, et cette liste
-- se construit à partir des messages existants. Une boucle fermée
-- sans entrée. Personne n'aurait pu commencer même en le voulant.
--
-- Cette migration prépare l'ouverture de la porte côté client. Elle
-- pose donc les deux choses qui manquaient AVANT qu'on l'ouvre.
--
-- ═══ 1. LE VERROU : ON N'ÉCRIT PAS À N'IMPORTE QUI ═══
--
-- La politique d'insertion disait « auth.uid() = sender_id » et rien
-- d'autre. Traduction : n'importe qui pouvait écrire à n'importe quel
-- identifiant, et le blocage n'y changeait rien — la table des
-- blocages n'était consultée nulle part. Ouvrir la porte sans poser
-- ce verrou aurait créé un canal de harcèlement, pas une messagerie.
--
-- La règle retenue : ON ÉCRIT À SES ALLIÉS. L'application a déjà un
-- système d'amitié avec demande et acceptation ; c'est lui qui décide
-- qui peut vous joindre. Le consentement est donné une fois, à
-- l'ajout, plutôt que réclamé après coup par un blocage. Et le
-- blocage reste souverain : il coupe même entre alliés, dans les deux
-- sens — celui qui bloque n'écrit plus non plus, sinon bloquer
-- reviendrait à s'offrir le dernier mot.
--
-- ═══ 2. LE DIRECT : LA TABLE N'ÉTAIT PAS PUBLIÉE ═══
--
-- La page du fil s'abonnait à « postgres_changes » sur
-- private_messages. Cet abonnement n'a jamais rien reçu : la table ne
-- figure pas dans la publication « supabase_realtime ». guild_messages
-- y est, private_messages non. L'abonnement était du code mort qui
-- avait l'air vivant — le pire genre.
--
-- ═══ 3. LA TABLE DE BLOCAGE EN DOUBLE ═══
--
-- Il en existe DEUX : « blocked_users », branchée à l'écran de vie
-- privée et remplie par lui, et « user_blocks », vide, sans écran, et
-- lue par un hook que personne n'importait. Un futur développeur qui
-- brancherait la seconde croirait avoir posé un verrou. On la marque.
-- Elle n'est pas supprimée ici : une suppression de table se demande.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Le droit d'écrire, calculé côté serveur ─────────────────
--
-- SECURITY DEFINER est indispensable : une politique RLS s'exécute
-- avec les droits de l'appelant, et « blocked_users » ne laisse voir
-- que ses propres lignes. Sans cela, la sous-requête ne verrait jamais
-- le blocage posé par l'autre — le verrou serait décoratif.
--
-- STABLE, pas VOLATILE : le planificateur peut alors l'évaluer une
-- seule fois par instruction.

create or replace function public.peut_ecrire_a(p_destinataire uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    -- On ne s'écrit pas à soi-même : le fil serait un mémo, et l'écran
    -- n'est pas construit pour ça.
    p_destinataire is not null
    and p_destinataire <> auth.uid()

    -- Alliés, et l'amitié acceptée dans un sens vaut dans l'autre.
    and exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.sender_id = auth.uid() and f.receiver_id = p_destinataire)
          or (f.receiver_id = auth.uid() and f.sender_id = p_destinataire))
    )

    -- Aucun blocage, dans aucun sens.
    and not exists (
      select 1 from public.blocked_users b
      where (b.user_id = p_destinataire and b.blocked_user_id = auth.uid())
         or (b.user_id = auth.uid() and b.blocked_user_id = p_destinataire)
    );
$$;

comment on function public.peut_ecrire_a(uuid) is
  'Vrai si l''utilisateur courant peut écrire à ce destinataire : allié accepté, et aucun blocage dans aucun sens. Appelée par la politique d''insertion de private_messages.';

revoke all on function public.peut_ecrire_a(uuid) from public;
grant execute on function public.peut_ecrire_a(uuid) to authenticated;

-- ── 2. La politique d'insertion ────────────────────────────────

drop policy if exists "Users can send messages" on public.private_messages;

create policy "Users can send messages"
  on public.private_messages
  for insert
  with check (auth.uid() = sender_id and public.peut_ecrire_a(receiver_id));

-- La lecture ne change pas : les messages déjà reçus restent lisibles
-- même après un blocage ou une rupture d'alliance. Effacer le passé
-- n'est pas au programme d'un blocage — il coupe la suite.

-- ── 3. Le direct ───────────────────────────────────────────────
--
-- « add table » échoue si la table y est déjà : on regarde d'abord.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'private_messages'
  ) then
    alter publication supabase_realtime add table public.private_messages;
  end if;
end $$;

-- Sans identité complète, un UPDATE ne transporte que la clé primaire :
-- le passage de is_read à vrai n'apprendrait rien à qui écoute.
alter table public.private_messages replica identity full;

-- ── 4. La table en double, signalée ────────────────────────────

comment on table public.user_blocks is
  'OBSOLÈTE — ne rien y brancher. Le blocage effectif vit dans blocked_users, qui est remplie par l''écran de vie privée et consultée par peut_ecrire_a(). Cette table-ci est vide, n''est lue par aucune politique, et n''est câblée à aucun écran. À supprimer.';

-- ── 5. Vérification dans la transaction ────────────────────────

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'private_messages'
      and cmd = 'INSERT' and with_check like '%peut_ecrire_a%'
  ) then
    raise exception 'La politique d''insertion ne consulte pas peut_ecrire_a().';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'private_messages'
  ) then
    raise exception 'private_messages n''est toujours pas publiée en direct.';
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════
-- POUR ANNULER — à exécuter à la main :
--
--   drop policy "Users can send messages" on public.private_messages;
--   create policy "Users can send messages" on public.private_messages
--     for insert with check (auth.uid() = sender_id);
--   alter publication supabase_realtime drop table public.private_messages;
--   drop function public.peut_ecrire_a(uuid);
--
-- Revenir en arrière rouvre l'écriture à tout identifiant connu, sans
-- égard pour les blocages. Ne le faire que pour diagnostiquer.
-- ═══════════════════════════════════════════════════════════════
