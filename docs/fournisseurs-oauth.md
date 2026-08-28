# Brancher un fournisseur OAuth

Ce qui suit ne peut pas être fait depuis le code : il faut créer une
application chez Discord, GitHub ou Google, et récupérer un identifiant
et un secret client. Une fois ça posé dans Supabase, **la tuile apparaît
seule sur l'écran de connexion** — pas de commit, pas de déploiement.
C'est [`useFournisseursActifs`](../src/hooks/useFournisseursActifs.ts)
qui lit `/auth/v1/settings` au chargement et n'affiche que ce que le
serveur déclare actif.

Version suivable, avec les liens directs et l'avancement coché :
**[Les trois consoles](https://claude.ai/code/artifact/ef6c3780-b87e-4d33-bb27-262ae75d6ade)**.

## L'URL de retour, la même pour les trois

```
https://upfethjdvrgmmfgfvqdo.supabase.co/auth/v1/callback
```

C'est elle qu'on colle dans la console du fournisseur, sous « redirect
URI », « callback URL » ou « URI de redirection autorisé ». **Pas l'URL
de l'application** : le fournisseur revient d'abord chez Supabase, qui
échange le code contre une session avant de renvoyer vers Overwrite.
Coller l'adresse Workers ici est l'erreur la plus fréquente.

## Discord — ≈ 4 min

<https://discord.com/developers/applications>

1. **New Application** en haut à droite, nommer, **Create**.
2. Panneau de gauche : **OAuth2**.
3. **Redirects → Add Redirect** → coller l'URL de retour → **Save
   Changes** (barre en bas de page).
4. Sous **Client information** : copier le **Client ID**. Le **Client
   Secret** est masqué ; **Reset Secret** en génère un nouveau et
   invalide l'ancien.

Discord redemande l'autorisation à chaque connexion, même à quelqu'un
déjà connecté à Discord. C'est le comportement de leur écran de
consentement, pas un réglage manqué.

## GitHub — ≈ 3 min

<https://github.com/settings/applications/new> (la liste est sur
<https://github.com/settings/developers>)

1. **Application name** : `Overwrite`.
2. **Homepage URL** : `https://thepact.geoffrey-luzignant.workers.dev`
3. **Authorization callback URL** : l'URL de retour.
4. **Enable Device Flow** décoché, puis **Register application**.
5. Copier le **Client ID**, puis **Generate a new client secret** — il
   n'est affiché qu'une fois.

## Google — ≈ 12 min

Attention : **l'écran de consentement ne vit plus sous
_APIs & Services_**, il a sa propre section, **Google Auth Platform**.
Tous les tutoriels antérieurs indiquent l'ancien chemin.

1. Un **projet Google Cloud** est nécessaire :
   <https://console.cloud.google.com/home/dashboard>
2. **Audience** — <https://console.cloud.google.com/auth/audience> :
   nom de l'application, adresse de contact. Tant que l'état est
   **Testing**, seuls les comptes listés en testeurs peuvent se
   connecter ; **Publish app** ouvre à tous.
3. **Data Access (Scopes)** —
   <https://console.cloud.google.com/auth/scopes> : `openid` **est à
   ajouter à la main**, `userinfo.email` et `userinfo.profile` y sont
   par défaut. Ne rien ajouter d'autre : une autorisation sensible
   déclenche une vérification Google qui se compte en semaines.
4. **Clients → Create client** —
   <https://console.cloud.google.com/auth/clients/create>, type **Web
   application**.
5. **Authorized JavaScript origins** :
   `https://thepact.geoffrey-luzignant.workers.dev` et
   `http://localhost:8080`
6. **Authorized redirect URIs** : l'URL de retour.
7. **Create** → copier Client ID et Client Secret.
8. Facultatif : **Branding** —
   <https://console.cloud.google.com/auth/branding>. Sans logo ni nom,
   la fenêtre Google annonce `upfethjdvrgmmfgfvqdo.supabase.co`, ce qui
   a exactement la forme d'une tentative d'hameçonnage. La vérification
   de marque prend quelques jours ouvrés.

## Côté Supabase — ≈ 2 min

[Sign In / Providers](https://supabase.com/dashboard/project/upfethjdvrgmmfgfvqdo/auth/providers) :
déplier le fournisseur, **Enabled** à ON, coller identifiant et secret,
**Save**.

Puis, une seule fois pour tout le projet,
[URL Configuration](https://supabase.com/dashboard/project/upfethjdvrgmmfgfvqdo/auth/url-configuration) :

- **Site URL** : `https://thepact.geoffrey-luzignant.workers.dev`
- **Redirect URLs** : ajouter `http://localhost:8080/**`

Le code demande le retour sur `${window.location.origin}/`. Ce qui n'est
pas dans cette liste n'est pas refusé avec un message : GoTrue renvoie
sur la Site URL sans rien dire, et en développement on croit alors que
la connexion a échoué alors qu'elle a réussi ailleurs.

## Vérifier

```bash
KEY=$(grep -E "^VITE_SUPABASE_PUBLISHABLE_KEY=" .env | cut -d= -f2- | tr -d '"\r')
curl -s -H "apikey: $KEY" https://upfethjdvrgmmfgfvqdo.supabase.co/auth/v1/settings | jq .external
```

Le fournisseur activé passe à `true`. Recharger l'écran de connexion :
la tuile est là — l'application lit exactement cette réponse.

## Deux choses à savoir avant d'en activer un

**Les secrets ne quittent pas Supabase.** Overwrite est une application
de navigateur : tout ce qui entre dans `.env` finit dans le paquet
servi. Le Client Secret se colle dans le tableau de bord Supabase, et
nulle part ailleurs.

**Un compte créé par Google n'a pas de mot de passe.** Le jour où le
fournisseur est retiré, ce compte n'a plus de chemin d'entrée — le
« mot de passe oublié » envoie bien un courriel, mais sur une adresse
qui n'a jamais servi à se connecter ici. C'est la raison pour laquelle
`useFournisseursActifs` montre les trois tuiles quand il n'arrive pas à
joindre le serveur : une tuile morte affiche une erreur, une tuile
absente enferme quelqu'un dehors.
