-- Exige un second facteur valide pour acceder aux donnees personnelles.
--
-- Portee : les tables de public qui portent une colonne user_id (75 au
-- moment de l'ecriture). Les referentiels — rangs, cosmetiques, boutique —
-- restent lisibles, ils ne contiennent aucune donnee personnelle.
--
-- Historique : une premiere version interrogeait auth.mfa_factors
-- directement, comme le montre la documentation Supabase. Mais le role
-- authenticated n'a pas SELECT sur cette table : l'evaluation de la
-- politique levait "permission denied" (42501) avant meme de filtrer, et
-- PostgREST traduisait en 403. Toutes les lectures echouaient, y compris
-- celle du pacte, ce qui renvoyait l'utilisateur vers l'onboarding.
--
-- On passe donc par une fonction SECURITY DEFINER. L'alternative —
-- GRANT SELECT ON auth.mfa_factors TO authenticated — exposerait les
-- facteurs de tous les comptes a n'importe quel utilisateur connecte.

CREATE OR REPLACE FUNCTION public.a_un_second_facteur()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.mfa_factors f
    WHERE f.user_id = (SELECT auth.uid())
      AND f.status = 'verified'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.a_un_second_facteur() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.a_un_second_facteur() TO authenticated;

-- La boucle porte sur les tables, pas sur les politiques existantes : la
-- migration doit pouvoir reconstruire l'etat complet sur une base neuve.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'user_id'
      AND t.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "mfa_aal2_requis" ON public.%I', r.table_name);
    -- RESTRICTIVE : la politique s'applique par-dessus toutes les autres,
    -- aucune permissive ne peut la contourner.
    --
    -- Le premier terme laisse passer les comptes sans second facteur, sans
    -- quoi tout utilisateur non enrole perdrait l'acces.
    --
    -- service_role contourne les RLS : Edge Functions et jobs cron ne sont
    -- pas affectes.
    EXECUTE format($p$
      CREATE POLICY "mfa_aal2_requis" ON public.%I
        AS RESTRICTIVE
        TO authenticated
        USING (
          NOT public.a_un_second_facteur()
          OR (SELECT auth.jwt() ->> 'aal') = 'aal2'
        )
    $p$, r.table_name);
  END LOOP;
END $$;
