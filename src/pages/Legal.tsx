import { ArrowLeft, AlertTriangle, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DSPageShell, DSBackground } from "@/components/ds";
import { Panneau, Bouton } from "@/components/profile/console-ui";
import {
  SECTIONS, EDITEUR, HEBERGEUR, VERSION, MISE_A_JOUR, PRODUIT, CHAMPS_REQUIS,
  type Article,
} from "@/content/mentions-legales";
import "@/styles/reglages.css";
import "@/styles/legal.css";

/* ═══════════════════════════════════════════════════════════════
   CONDITIONS ET MENTIONS LÉGALES

   Cette page portait UN SECOND CHEMIN DE SUPPRESSION DE COMPTE,
   écrit en clair, qui ne passait pas par la fonction durcie.

   Il vidait quinze tables nommées à la main. La base en compte
   SOIXANTE-DIX qui portent un `user_id` — santé, messages de M.I.A,
   souvenirs vectorisés, abonnements aux notifications, réglages du
   second facteur, publications, guildes : rien de tout cela n'était
   touché. Et il ne supprimait jamais l'utilisateur lui-même, faute
   d'avoir les droits pour le faire depuis un navigateur.

   Les quinze suppressions réussissaient donc — chaque table a bien
   une politique le permettant —, l'écran annonçait « Account deleted
   successfully », et la personne pouvait se reconnecter sur une
   coquille pleine de données orphelines. Le tout sans second facteur,
   là où l'autre chemin l'exige, et en contredisant mot pour mot
   l'article de cette même page qui promet un compte « définitivement
   supprimé ».

   La suppression vit désormais à un seul endroit : la Zone sensible
   de « Mes données », qui appelle `delete-account` — second facteur
   exigé, puis effacement en cascade depuis le serveur. Cette page y
   renvoie.

   Le texte, lui, est parti dans `content/mentions-legales.ts` : il se
   modifie sans toucher à une balise, et se traduira sans tout
   recopier.
   ═══════════════════════════════════════════════════════════════ */

/* L'éditeur doit fournir ce que SON RÉGIME exige, et on le dit tant que
   ce n'est pas fait.

   Le calcul portait auparavant sur tous les champs, ce qui affichait un
   avertissement permanent alors qu'un éditeur non professionnel a le
   DROIT de taire son nom et son adresse (LCEN 6-III-2). Un manque
   signalé vaut mieux qu'un manque discret ; un faux manque signalé ne
   vaut rien du tout — il apprend à ignorer l'avertissement.

   `CHAMPS_REQUIS` vient du régime déclaré dans le contenu. Le jour où
   il passe à « professionnel », les cinq autres champs redeviennent
   obligatoires et l'avertissement revient de lui-même. */
const CHAMPS_MANQUANTS = CHAMPS_REQUIS.filter((c) => !EDITEUR[c].trim());

const ETIQUETTES: Record<string, string> = {
  nom: "raison sociale ou nom",
  forme: "forme juridique",
  adresse: "adresse postale",
  immatriculation: "immatriculation",
  directeur: "directeur de la publication",
  courriel: "adresse de contact",
};

function CorpsArticle({ article }: { article: Article }) {
  return (
    <div className="lg-article">
      <h3 className="lg-article-titre">
        <span className="lg-article-num">{String(article.n).padStart(2, "0")}</span>
        {article.titre}
      </h3>
      {article.corps.map((bloc, i) =>
        Array.isArray(bloc) ? (
          <ul key={i} className="lg-liste">
            {bloc.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p key={i} className="lg-para">{bloc}</p>
        ),
      )}
      {article.souligne && <p className="lg-souligne">{article.souligne}</p>}
      {article.alerte && (
        <p className="lg-alerte">
          <AlertTriangle aria-hidden="true" />
          {article.alerte}
        </p>
      )}
    </div>
  );
}

export default function Legal() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const revenir = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/profile/data");
  };

  return (
    <DSPageShell width="md" padding="tight" background={<DSBackground variant="cyber" />}>
      <div className="rg-volet lg-volet">
        <button type="button" className="lg-retour" onClick={revenir}>
          <ArrowLeft aria-hidden="true" />
          {t("common.retour", "Retour")}
        </button>

        <header className="rg-volet-tete">
          <h1 className="rg-volet-titre">{t("legal.titre", "Conditions et mentions légales")}</h1>
          <p className="rg-volet-note">
            {t("legal.sous", "Ce que {{produit}} enregistre, où ça va, et ce que tu peux exiger.", { produit: PRODUIT })}
          </p>
        </header>

        {/* L IDENTITE DE L EDITEUR NE SE DEDUIT PAS DU CODE.
            Tant qu elle manque, la page le dit — un manque signalé vaut
            mieux qu un manque discret, et publier des mentions légales
            sans éditeur est précisément ce qu elles servent à éviter. */}
        {CHAMPS_MANQUANTS.length > 0 && (
          <div className="lg-manque" role="status">
            <AlertTriangle aria-hidden="true" />
            <div>
              <b>{t("legal.incompletTitre", "Document incomplet.")}</b>{" "}
              {t("legal.incompletDetail", "L’identité de l’éditeur reste à renseigner dans {{fichier}} :", {
                fichier: "src/content/mentions-legales.ts",
              })}{" "}
              {CHAMPS_MANQUANTS.map((c) => ETIQUETTES[c] ?? c).join(", ")}.
            </div>
          </div>
        )}

        <div className="rg-grille">
          {SECTIONS.map((section) => {
            const Icone = section.icone;
            return (
              <Panneau
                key={section.code}
                code={section.code}
                ton={section.ton}
                etat={section.etat}
                taille="pleine"
              >
                <div className="lg-section">
                  {section.intro && (
                    <p className="lg-intro">
                      <Icone aria-hidden="true" />
                      {section.intro}
                    </p>
                  )}

                  {/* L identité et le contact sont des VALEURS, pas de la
                      prose : elles se lisent en tableau, et l on voit d un
                      coup d oeil ce qui manque. */}
                  {section.code === "Éditeur et hébergeur" && (
                    <dl className="lg-fiche">
                      {Object.entries(EDITEUR).map(([cle, valeur]) => (
                        <div key={cle}>
                          <dt>{ETIQUETTES[cle] ?? cle}</dt>
                          <dd data-vide={valeur.trim() ? undefined : ""}>
                            {valeur.trim() || t("legal.aRenseigner", "à renseigner")}
                          </dd>
                        </div>
                      ))}
                      <div>
                        <dt>{t("legal.hebergeur", "hébergeur")}</dt>
                        <dd>{HEBERGEUR.nom}</dd>
                      </div>
                    </dl>
                  )}

                  {section.articles.map((a) => (
                    <CorpsArticle key={a.n} article={a} />
                  ))}

                  {/* LA SUPPRESSION N EST PLUS ICI. Elle vit au seul endroit
                      qui la fait correctement : second facteur, puis
                      effacement en cascade côté serveur. */}
                  {section.code === "Suppression du compte" && (
                    <div className="lg-vers-suppression">
                      <Bouton role="danger" onClick={() => navigate("/profile/data")}>
                        <Trash2 /> {t("legal.zoneSensible", "Aller à la zone sensible")}
                      </Bouton>
                    </div>
                  )}
                </div>
              </Panneau>
            );
          })}
        </div>

        <footer className="lg-pied">
          <span>Version {VERSION}</span>
          <span aria-hidden="true">·</span>
          <span>Mise à jour le {MISE_A_JOUR}</span>
        </footer>
      </div>
    </DSPageShell>
  );
}
