-- ═══════════════════════════════════════════════════════════════
-- LES 63 CLÉS ÉTRANGÈRES PRENNENT LEUR INDEX
--
-- 238 index existent déjà, mais pas là où les jointures les cherchent :
-- 63 clés étrangères n'ont aucun index couvrant. PostgreSQL n'en crée
-- pas automatiquement — il en crée un pour les clés PRIMAIRES et les
-- contraintes UNIQUE, jamais pour les clés étrangères.
--
-- ═══ POURQUOI TOUTES, ET PAS SEULEMENT CELLES QUI ONT DES LIGNES ═══
--
-- Trente-quatre portent sur des tables peuplées, vingt-neuf sur des
-- tables vides. La tentation était de s'arrêter aux premières : un
-- index coûte à l'écriture, et indexer le vide ressemble à de
-- l'anticipation gratuite.
--
-- UN ARGUMENT TRANCHE POUR LES PRENDRE TOUTES, et il n'est pas
-- théorique. Supprimer une ligne parente oblige PostgreSQL à vérifier
-- CHAQUE table enfant pour savoir si elle y est référencée. Sans index
-- couvrant, cette vérification est un parcours complet de la table
-- enfant. Or l'application a `delete-account` et `delete-all-data` :
-- supprimer un compte traverse une soixantaine de tables d'un coup.
--
-- C'est le droit à l'effacement du RGPD qui est au bout. Une
-- suppression de compte qui expire n'est pas une lenteur, c'est une
-- obligation non tenue — et elle se manifestera exactement quand les
-- tables aujourd'hui vides ne le seront plus.
--
-- LE COÛT EST NÉGLIGEABLE ICI : la plus grosse table compte 182 lignes,
-- l'écriture y est rare, et un index sur une table vide occupe
-- quelques kilo-octets. On paie aujourd'hui ce qui coûterait cher plus
-- tard.
--
-- ═══ CE QUE CETTE MIGRATION NE FAIT PAS ═══
--
-- Elle ne touche pas aux 41 index signalés « jamais utilisés ». Sur une
-- base à quatre comptes, « jamais utilisé » veut souvent dire « le
-- chemin n'a pas encore été emprunté ». Les supprimer demanderait de
-- vérifier qu'aucun écran ne les justifie — c'est un autre travail,
-- avec un autre risque.
--
-- Les index sont créés SANS `concurrently` : la commande serait
-- interdite dans une transaction, et sur des tables de cette taille le
-- verrou dure quelques microsecondes. L'atomicité vaut mieux ici.
-- ═══════════════════════════════════════════════════════════════

begin;

do $$
declare
  r record;
  nom text;
  faits int := 0;
begin
  for r in
    with fk as (
      select c.conrelid as oid_tbl,
             c.conrelid::regclass::text as tbl,
             (select array_agg(a.attname order by k.ord)
                from unnest(c.conkey) with ordinality k(att, ord)
                join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.att) as cols
      from pg_constraint c
      join pg_namespace n on n.oid = c.connamespace
      where c.contype = 'f' and n.nspname = 'public'
    )
    select * from fk
    where not exists (
      select 1 from pg_index i
      where i.indrelid = fk.oid_tbl
        and (select array_agg(a.attname order by k.ord)
               from unnest(i.indkey::int[]) with ordinality k(att, ord)
               join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.att
              where k.ord <= array_length(fk.cols, 1))
            = fk.cols
    )
  loop
    nom := left('idx_' || replace(r.tbl, 'public.', '') || '_' || array_to_string(r.cols, '_'), 63);
    execute format('create index if not exists %I on %s (%s)',
                   nom, r.tbl,
                   (select string_agg(quote_ident(c), ', ') from unnest(r.cols) c));
    faits := faits + 1;
  end loop;
  raise notice '% index créés', faits;
end $$;

do $$
declare n int; liste text;
begin
  -- Plus aucune clé étrangère sans index couvrant.
  with fk as (
    select c.conrelid as oid_tbl, c.conrelid::regclass::text as tbl,
           (select array_agg(a.attname order by k.ord)
              from unnest(c.conkey) with ordinality k(att, ord)
              join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.att) as cols
    from pg_constraint c
    join pg_namespace ns on ns.oid = c.connamespace
    where c.contype = 'f' and ns.nspname = 'public'
  )
  select count(*), coalesce(string_agg(tbl || '(' || array_to_string(cols, ',') || ')', ', '), '—')
    into n, liste
  from fk
  where not exists (
    select 1 from pg_index i
    where i.indrelid = fk.oid_tbl
      and (select array_agg(a.attname order by k.ord)
             from unnest(i.indkey::int[]) with ordinality k(att, ord)
             join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.att
            where k.ord <= array_length(fk.cols, 1))
          = fk.cols
  );
  if n <> 0 then
    raise exception 'il reste % clé(s) étrangère(s) sans index : %', n, liste;
  end if;

  -- Rien d'autre n'a bougé : les politiques sont intactes.
  select count(*) into n from pg_policies where schemaname = 'public';
  if n <> 405 then
    raise exception 'le nombre de politiques a changé : %', n;
  end if;
end $$;

commit;
