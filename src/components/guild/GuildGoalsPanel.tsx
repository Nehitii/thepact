import { useState } from "react";
import { Plus, Target, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useGuildGoals, useGuilds, type GuildGoal } from "@/hooks/useGuilds";

/* LES OBJECTIFS COLLECTIFS D UNE GUILDE.
 *
 * Le panneau vivait dans components/friends, avec quatre autres
 * morceaux de guilde restes la apres un decoupage. Il rejoint
 * components/guild, ou il aurait du etre.
 *
 * Il n affichait QUE les objectifs actifs — goals.filter(status ===
 * "active") — sans jamais dire qu il en filtrait. Un objectif atteint
 * disparaissait donc de la page au moment meme ou il devenait une
 * reussite. Ils sont maintenant separes en deux : ceux en cours, et
 * ceux qui sont franchis. */

interface Props {
  guildId: string;
  canManage: boolean;
}

function Objectif({
  objectif, guildId, contribuer, occupe,
}: {
  objectif: GuildGoal;
  guildId: string;
  contribuer: (goalId: string, montant: number) => void;
  occupe: boolean;
}) {
  const { t } = useTranslation();
  const [ouvert, setOuvert] = useState(false);
  const [montant, setMontant] = useState("1");

  const part = objectif.target_value > 0
    ? Math.min(100, Math.round((objectif.current_value / objectif.target_value) * 100))
    : 0;
  const franchi = objectif.current_value >= objectif.target_value;

  return (
    <div className="gu-objectif">
      <div className="gu-objectif-tete">
        <span className="co-nom">{objectif.title}</span>
        <span className="gu-objectif-compte">
          {objectif.current_value} / {objectif.target_value}
        </span>
      </div>

      {objectif.description && <p className="gu-mot">{objectif.description}</p>}

      <span className="co-jauge" style={{ marginTop: 8 }} aria-hidden="true">
        <i style={{ width: `${part}%` }} />
      </span>

      {!franchi && (
        ouvert ? (
          <div className="gu-contribuer">
            <input
              type="number"
              min={1}
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              aria-label={t("friends.contribute", "Contribuer")}
            />
            <button
              type="button"
              className="co-bouton"
              disabled={occupe}
              onClick={() => {
                const n = parseInt(montant, 10) || 0;
                if (n <= 0) return;
                contribuer(objectif.id, n);
                setOuvert(false);
                setMontant("1");
              }}
            >
              {t("friends.contribute", "Contribuer")}
            </button>
            <button
              type="button"
              className="co-puce"
              onClick={() => setOuvert(false)}
              aria-label={t("common.cancel", "Annuler")}
            >
              <X aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 8 }}>
            <button type="button" className="co-puce" onClick={() => setOuvert(true)}>
              <Plus aria-hidden="true" />
              {t("friends.contribute", "Contribuer")}
            </button>
          </div>
        )
      )}
    </div>
  );
}

export function GuildGoalsPanel({ guildId, canManage }: Props) {
  const { t } = useTranslation();
  const { data: objectifs = [], isLoading } = useGuildGoals(guildId);
  const { createGuildGoal, contributeToGoal } = useGuilds();

  const [creation, setCreation] = useState(false);
  const [titre, setTitre] = useState("");
  const [cible, setCible] = useState("100");

  const creer = async () => {
    const propre = titre.trim();
    if (!propre) return;
    try {
      await createGuildGoal.mutateAsync({ guildId, title: propre, targetValue: parseInt(cible, 10) || 100 });
      setTitre(""); setCible("100"); setCreation(false);
      toast.success(t("friends.goalCreated", "Objectif créé"));
    } catch {
      toast.error(t("friends.goalCreateFailed", "La création a échoué"));
    }
  };

  const contribuer = async (goalId: string, amount: number) => {
    try {
      await contributeToGoal.mutateAsync({ goalId, amount, guildId });
      toast.success(t("friends.contributionAdded", "Contribution enregistrée"));
    } catch {
      toast.error(t("friends.contributionFailed", "La contribution a échoué"));
    }
  };

  const enCours = objectifs.filter((g) => g.current_value < g.target_value);
  const franchis = objectifs.filter((g) => g.current_value >= g.target_value);

  if (isLoading) {
    return (
      <div aria-busy="true">
        {[0, 1].map((i) => (
          <div className="co-fantome" key={i}>
            <span className="co-os co-os--rond" />
            <span className="co-os" style={{ height: 14, alignSelf: "center" }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {canManage && (
        <>
          <div className="fr-barre">
            <button type="button" className="co-bouton" onClick={() => setCreation((v) => !v)}>
              <Plus aria-hidden="true" />
              {t("friends.createGoal", "Créer un objectif")}
            </button>
          </div>

          {creation && (
            <div className="gu-ecrire">
              <input
                className="gu-champ"
                value={titre}
                maxLength={100}
                onChange={(e) => setTitre(e.target.value)}
                placeholder={t("friends.goalTitle", "Ce que la guilde veut atteindre")}
                aria-label={t("friends.goalTitle", "Ce que la guilde veut atteindre")}
              />
              <div className="gu-contribuer" style={{ marginTop: 0 }}>
                <input
                  type="number"
                  min={1}
                  value={cible}
                  onChange={(e) => setCible(e.target.value)}
                  aria-label={t("friends.targetValue", "Valeur à atteindre")}
                />
                <button
                  type="button"
                  className="co-bouton"
                  onClick={creer}
                  disabled={!titre.trim() || createGuildGoal.isPending}
                >
                  {t("common.create", "Créer")}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {objectifs.length === 0 ? (
        <div className="co-vide">
          <Target aria-hidden="true" />
          <h3>{t("friends.noGoals", "Aucun objectif collectif")}</h3>
          <p>{t("friends.noGoalsDesc", "Un objectif de guilde se remplit des contributions de chacun.")}</p>
        </div>
      ) : (
        <>
          {enCours.length > 0 && (
            <section className="gu-bloc">
              <div className="gu-bloc-tete">
                <h2 className="gu-bloc-titre">{t("guild.goalsOngoing", "En cours")}</h2>
                <span className="gu-bloc-compte">{enCours.length}</span>
              </div>
              <div className="gu-corps">
                {enCours.map((g) => (
                  <Objectif
                    key={g.id}
                    objectif={g}
                    guildId={guildId}
                    contribuer={contribuer}
                    occupe={contributeToGoal.isPending}
                  />
                ))}
              </div>
            </section>
          )}

          {franchis.length > 0 && (
            /* Ils etaient simplement absents : le panneau ne montrait
               que les objectifs « actifs », si bien qu un objectif
               disparaissait de la page a l instant ou il etait
               atteint. */
            <section className="gu-bloc">
              <div className="gu-bloc-tete">
                <h2 className="gu-bloc-titre">{t("guild.goalsDone", "Franchis")}</h2>
                <span className="gu-bloc-compte">{franchis.length}</span>
              </div>
              <div className="gu-corps">
                {franchis.map((g) => (
                  <Objectif
                    key={g.id}
                    objectif={g}
                    guildId={guildId}
                    contribuer={contribuer}
                    occupe={contributeToGoal.isPending}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
