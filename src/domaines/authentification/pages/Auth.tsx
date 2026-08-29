import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/socle/supabase/client";
import { messageDErreur } from "@/socle/outils/erreurs";
import { consommerErreurOAuth, messageDErreurOAuth } from "@/socle/outils/erreurOAuth";
import { useFournisseursActifs, type Fournisseur } from "@/domaines/authentification/hooks/useFournisseursActifs";
import { MARQUES } from "@/domaines/authentification/composants/marquesFournisseurs";
import "@/domaines/authentification/authentification.css";
import type { Mode } from "@/domaines/authentification/types";

/**
 * OVERWRITE — l'écran d'authentification.
 *
 * Repris du handoff « Overwrite — Sign in ». Ce qui relève du dessin est
 * dans `domaines/authentification/authentification.css`, avec les trois écarts assumés et leurs
 * raisons. Ce fichier ne porte que ce que l'écran FAIT.
 *
 * ═══ CE QU'IL FAIT, ET QUE LA MAQUETTE NE POUVAIT PAS DIRE ═══
 *
 * — LE MOT DE PASSE OUBLIÉ EXISTE ENFIN. La maquette pose le lien ;
 *   l'application n'avait aucun chemin de réinitialisation, pas une
 *   ligne. Quelqu'un qui oubliait son mot de passe était dehors. Le lien
 *   envoie maintenant un courriel de réinitialisation.
 *
 * — LES FOURNISSEURS N'APPARAISSENT QUE S'ILS RÉPONDENT. Ils étaient
 *   trois, écrits en dur, et aucun n'était configuré : le serveur
 *   renvoyait « provider is not enabled » à qui cliquait. La liste vient
 *   maintenant de `/auth/v1/settings` (voir `useFournisseursActifs`) —
 *   configurer Discord, GitHub ou Google dans le tableau de bord
 *   Supabase les fait apparaître seuls, sans toucher à ce fichier. Le
 *   message d'erreur reste, pour le cas où l'un s'éteint entre le
 *   chargement de l'écran et le clic.
 *
 * — LES CONDITIONS RESTENT SUR L'INSCRIPTION. Leur article 5 pose
 *   l'acceptation à la création du compte. La maquette ne les mentionne
 *   pas ; les retirer aurait été une régression juridique, pas une
 *   simplification de dessin.
 */

/* Les marques, sorties du corps de l'écran : la liste est décidée par le
   serveur, le dessin de chacune n'a plus à être recopié à côté d'un
   `if`. `nom` sert d'`aria-label` — les logos n'ont pas de texte. */

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [devoile, setDevoile] = useState(false);
  const [enCours, setEnCours] = useState(false);

  /* ═══ LE VERROU DOIT SAUTER AU RETOUR ═══
     `parFournisseur` pose `enCours` puis laisse `signInWithOAuth`
     remplacer la page. Il n'y a donc aucun chemin de succès qui le
     relâche — et il n'y en a pas besoin, tant que la page est vraiment
     détruite. Elle ne l'est pas toujours : au retour du fournisseur,
     ou sur un simple « précédent », le navigateur restaure la page
     depuis son cache arrière avec l'état React intact. Tous les
     champs et tous les boutons reviennent alors `disabled`, et l'écran
     paraît planté alors qu'il est seulement verrouillé.

     `pageshow` se déclenche dans les deux cas — chargement normal ET
     restauration — donc on relâche sans condition. */
  useEffect(() => {
    const relacher = () => setEnCours(false);
    window.addEventListener("pageshow", relacher);
    return () => window.removeEventListener("pageshow", relacher);
  }, []);

  /* L'erreur laissée par un fournisseur, capturée avant le rendu par
     `lib/erreurOAuth` parce que le rebond « / » → « /auth » perd le
     fragment. On la consomme une fois, ici, où elle a un sens. */
  useEffect(() => {
    const e = consommerErreurOAuth();
    if (e) toast.error(t("auth.oauthFailed", "Connexion refusée"), { description: messageDErreurOAuth(e) });
  }, [t]);
  const [faute, setFaute] = useState<{ champ: "email" | "motDePasse"; texte: string } | null>(null);
  const fournisseurs = useFournisseursActifs();

  const inscription = mode === "inscription";

  const schema = z.object({
    email: z.string().email(t("auth.invalidEmail", "Adresse email invalide")),
    motDePasse: z.string().min(6, t("auth.passwordMin", "Le mot de passe doit contenir au moins 6 caractères")),
  });

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setFaute(null);

    const controle = schema.safeParse({ email, motDePasse });
    if (!controle.success) {
      const premiere = controle.error.errors[0];
      setFaute({ champ: premiere.path[0] === "email" ? "email" : "motDePasse", texte: premiere.message });
      return;
    }

    setEnCours(true);
    try {
      if (inscription) {
        const { error } = await supabase.auth.signUp({
          email,
          password: motDePasse,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success(t("auth.accountCreated", "Compte créé. Tu peux maintenant te connecter."));
        setMode("connexion");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
        if (error) throw error;
        navigate("/");
      }
    } catch (err: unknown) {
      toast.error(
        inscription
          ? t("auth.signupFailed", "Inscription impossible")
          : t("auth.loginFailed", "Connexion échouée"),
        { description: messageDErreur(err) },
      );
    } finally {
      setEnCours(false);
    }
  };

  /* Le courriel part vers /auth : Supabase y rouvre une session de
     récupération, et l'écran de profil laisse alors poser un nouveau
     mot de passe. Sans adresse valide on ne tente rien — le serveur
     répondrait la même chose, mais plus tard et moins clairement. */
  const motDePasseOublie = async () => {
    const adresse = z.string().email().safeParse(email);
    if (!adresse.success) {
      setFaute({
        champ: "email",
        texte: t("auth.resetNeedsEmail", "Saisis d’abord ton adresse : c’est là que part le lien."),
      });
      return;
    }

    setEnCours(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast.success(t("auth.resetSent", "Lien envoyé"), {
        description: t("auth.resetSentDetail", "Regarde ta boîte : le lien ouvre une session le temps de changer ton mot de passe."),
      });
    } catch (err: unknown) {
      toast.error(t("auth.resetFailed", "Envoi impossible"), { description: messageDErreur(err) });
    } finally {
      setEnCours(false);
    }
  };

  const parFournisseur = async (fournisseur: Fournisseur) => {
    setEnCours(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: fournisseur,
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
      /* Pas de navigation ici : signInWithOAuth remplace la page. */
    } catch (err: unknown) {
      toast.error(t("auth.oauthFailed", "Connexion refusée"), { description: messageDErreur(err) });
      setEnCours(false);
    }
  };

  return (
    <div className="auth">
      {/* LE PLATEAU. La composition est bornée et centrée : elle ne
          s étale pas jusqu aux bords de la fenêtre, on la voit
          entière, avec de l air autour. */}
      <div className="auth-plateau">
      {/* ── Le panneau visuel ─────────────────────────────────
          Entièrement décoratif : `aria-hidden`, et rien à
          l'intérieur n'est atteignable au clavier. Le lockup porte
          quand même son texte de remplacement pour le mode « lire
          les images » de certains navigateurs. */}
      <div className="auth-visuel" aria-hidden="true">
        <div className="auth-cadre" />
        <div className="auth-coin" data-ou="haut" />
        <div className="auth-coin" data-ou="bas" />
        <div className="auth-equerre" data-ou="haut" />
        <div className="auth-equerre" data-ou="bas" />

        <div className="auth-ticks" data-ou="haut">
          <i style={{ width: 46 }} />
          <i style={{ width: 14, background: "rgba(139,92,246,.55)" }} />
          <i style={{ width: 8, background: "rgba(139,92,246,.35)" }} />
          <i style={{ width: 26, background: "rgba(139,92,246,.55)" }} />
        </div>
        <div className="auth-ticks" data-ou="bas">
          <i style={{ width: 20, background: "rgba(139,92,246,.35)" }} />
          <i style={{ width: 10, background: "rgba(139,92,246,.6)" }} />
          <i style={{ width: 54 }} />
        </div>

        <div className="auth-tirets">
          <div className="auth-tete-tirets">
            <b />
            <i style={{ width: 26, background: "rgba(139,92,246,.5)" }} />
            <i style={{ width: 10, background: "rgba(139,92,246,.3)" }} />
          </div>
          <i style={{ width: 16, background: "rgba(139,92,246,.45)" }} />
          <i style={{ width: 22, background: "rgba(139,92,246,.3)" }} />
          <i style={{ width: 12, background: "rgba(139,92,246,.45)" }} />
          <i style={{ width: 18, background: "rgba(139,92,246,.25)" }} />
          <i style={{ width: 26, background: "rgba(139,92,246,.4)" }} />
          <i style={{ width: 8, background: "rgba(139,92,246,.5)" }} />
        </div>

        <div className="auth-onglet" />
        <div className="auth-arete" />
        <div className="auth-noeud">SEC//NODE-07</div>

        <div className="auth-scene">
          <div className="auth-ville" />
          <div className="auth-voile" />
          <div className="auth-grille" />
          <div className="auth-reticule">
            <div className="r-grand" />
            <div className="r-petit" />
            <div className="r-h" />
            <div className="r-v" />
            <div className="r-m1" />
            <div className="r-m2" />
          </div>
          <div className="auth-assombri" />
          <div className="auth-marque">
            <img className="m-symbole" src="/marque/overwrite-symbole.svg" alt="" />
            <img className="m-lockup" src="/marque/overwrite-lockup.svg" alt="Overwrite — Rewrite your default" />
          </div>
          <div className="auth-fondu" />
        </div>

        <div className="auth-pastille">
          <span>SYSTEM ONLINE</span>
          <i />
        </div>
      </div>

      {/* ── La carte ──────────────────────────────────────────── */}
      <form className="auth-carte" onSubmit={soumettre} noValidate>
        <div className="auth-entete">
          <svg width="17" height="19" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <rect x="4" y="10.5" width="16" height="11" rx="2.5" fill="#8b5cf6" stroke="none" />
            <path d="M8 10.5V7a4 4 0 018 0v3.5" />
          </svg>
          <b>{t("auth.hud", "AUTHENTIFICATION")}</b>
          <span className="filet" />
          <span className="barre" />
        </div>

        <h1 className="auth-titre">
          {inscription ? t("auth.titreInscription", "FORGE TON PACTE") : t("auth.titreConnexion", "BON RETOUR")}
        </h1>
        <p className="auth-sous">
          {inscription
            ? t("auth.sousInscription", "Crée ton compte Overwrite.")
            : t("auth.sousConnexion", "Connecte-toi à ton compte Overwrite.")}
        </p>

        <label className="auth-etiquette" htmlFor="auth-email">{t("auth.email", "EMAIL")}</label>
        <div className="auth-champ" data-faute={faute?.champ === "email" ? "" : undefined}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="8" r="3.6" />
            <path d="M5.5 20c0-3.6 2.9-5.6 6.5-5.6s6.5 2 6.5 5.6" />
          </svg>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            placeholder={t("auth.emailPlaceholder", "toi@email.com")}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setFaute(null); }}
            disabled={enCours}
            aria-invalid={faute?.champ === "email" || undefined}
            aria-describedby={faute?.champ === "email" ? "auth-faute" : undefined}
          />
        </div>

        <label className="auth-etiquette" data-second htmlFor="auth-motdepasse">{t("auth.motDePasse", "MOT DE PASSE")}</label>
        <div className="auth-champ" data-secret data-faute={faute?.champ === "motDePasse" ? "" : undefined}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
            <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.4" />
            <path d="M8 10.5V7.2a4 4 0 018 0v3.3" />
          </svg>
          <input
            id="auth-motdepasse"
            type={devoile ? "text" : "password"}
            autoComplete={inscription ? "new-password" : "current-password"}
            value={motDePasse}
            onChange={(e) => { setMotDePasse(e.target.value); setFaute(null); }}
            disabled={enCours}
            aria-invalid={faute?.champ === "motDePasse" || undefined}
            aria-describedby={faute?.champ === "motDePasse" ? "auth-faute" : undefined}
          />
          <button
            type="button"
            className="auth-oeil"
            onClick={() => setDevoile((v) => !v)}
            aria-label={devoile ? t("auth.masquer", "Masquer le mot de passe") : t("auth.montrer", "Montrer le mot de passe")}
            aria-pressed={devoile}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
              <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" />
              <circle cx="12" cy="12" r="3.1" />
              <path d="M3.5 20.5L20.5 3.5" style={{ opacity: devoile ? 0 : 1 }} />
            </svg>
          </button>
        </div>

        {faute && <p className="auth-faute" id="auth-faute" role="alert">{faute.texte}</p>}

        {!inscription && (
          <button type="button" className="auth-oubli" onClick={motDePasseOublie} disabled={enCours}>
            {t("auth.motDePasseOublie", "Mot de passe oublié ?")}
          </button>
        )}

        <button type="submit" className="auth-valider" disabled={enCours}>
          {enCours ? (
            <span className="auth-tourne" role="status" aria-label={t("auth.processing", "Traitement…")} />
          ) : (
            <>
              <span>{inscription ? t("auth.forger", "FORGER") : t("auth.seConnecter", "SE CONNECTER")}</span>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 12h15" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </>
          )}
        </button>

        {inscription && (
          <p className="auth-legal">
            {t("auth.legalAvant", "En forgeant ton pacte, tu acceptes les")}{" "}
            <Link to="/legal">{t("auth.legalLien", "conditions et mentions légales")}</Link>.
          </p>
        )}

        {/* Le séparateur part avec les tuiles : « OU CONTINUER AVEC »
            au-dessus de rien annoncerait un choix qui n'existe pas. */}
        {fournisseurs.length > 0 && (
          <>
            <div className="auth-ou">
              <i />
              <span>{t("auth.ouAvec", "OU CONTINUER AVEC")}</span>
              <i />
            </div>

            <div className="auth-fournisseurs">
              {fournisseurs.map((f) => (
                <button
                  key={f}
                  type="button"
                  className="auth-fournisseur"
                  onClick={() => parFournisseur(f)}
                  disabled={enCours}
                  aria-label={MARQUES[f].nom}
                >
                  {MARQUES[f].dessin}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="auth-pied">
          <span>
            {inscription
              ? t("auth.dejaUnCompte", "Déjà un compte ?")
              : t("auth.pasDeCompte", "Pas encore de compte ?")}
          </span>
          <button type="button" onClick={() => { setMode(inscription ? "connexion" : "inscription"); setFaute(null); }}>
            {inscription ? t("auth.seConnecterLien", "Se connecter") : t("auth.enCreerUn", "En créer un")}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
