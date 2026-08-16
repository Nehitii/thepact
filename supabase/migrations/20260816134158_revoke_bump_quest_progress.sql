-- _bump_quest_progress est un helper interne appele uniquement par les
-- triggers _tg_quest_on_*. Ceux-ci s'executent avec les droits du
-- proprietaire de la table et ne dependent donc pas de ce GRANT.
--
-- Le droit EXECUTE etait accorde a anon, ce qui la rendait joignable via
-- POST /rest/v1/rpc/_bump_quest_progress avec la seule cle publiable.
-- Contrairement aux 58 autres fonctions SECURITY DEFINER exposees, elle ne
-- verifie pas auth.uid() : elle agit sur le _user_id qu'on lui transmet.
-- Un appelant anonyme pouvait donc faire progresser — ou reculer, _delta
-- acceptant une valeur negative — les quetes de n'importe quel compte.

REVOKE EXECUTE ON FUNCTION public._bump_quest_progress(uuid, text, integer)
  FROM anon, authenticated, PUBLIC;