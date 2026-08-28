# Brancher un fournisseur OAuth

Ce qui suit ne peut pas être fait depuis le code : il faut créer une
application chez Discord, GitHub ou Google, et récupérer un identifiant
et un secret client. Une fois ça posé dans Supabase, **la tuile apparaît
seule sur l'écran de connexion** — pas de commit, pas de déploiement.
C'est `useFournisseursActifs` qui lit `/auth/v1/settings` au chargement
et n'affiche que ce que le serveur déclare actif.

## L'URL de retour, la même pour les trois

```
https://upfethjdvrgmmfgfvqdo.supabase.co/auth/v1/callback
```

C'est elle qu'on colle dans la console du fournisseur, sous « redirect
URI », « callback URL » ou « URI de redirection autorisé ». Pas l'URL de
l'application : le fournisseur revient d'abord chez Supabase, qui
renvoie ensuite vers l'application.

## Les trois consoles

| Fournisseur | Où | Ce qu'on récupère |
|---|---|---|
| Discord | `discord.com/developers/applications` → New Application → OAuth2 | Client ID, Client Secret |
| GitHub | `github.com/settings/developers` → New OAuth App | Client ID, puis « Generate a new client secret » |
| Google | `console.cloud.google.com` → APIs & Services → Credentials → OAuth client ID (type « Web application ») | Client ID, Client Secret |

Les trois sont gratuits. Google demande en plus de remplir l'écran de
consentement (nom de l'application, adresse de contact) ; tant qu'il est
en mode « Testing », seuls les comptes ajoutés à la liste des testeurs
peuvent se connecter.

## Côté Supabase

Tableau de bord → **Authentication → Sign In / Providers** → le
fournisseur → activer, coller l'identifiant et le secret, enregistrer.

Puis, une seule fois, **Authentication → URL Configuration** :

- **Site URL** : `https://thepact.geoffrey-luzignant.workers.dev`
- **Redirect URLs** : ajouter `http://localhost:8080/**` pour que le
  retour fonctionne aussi en développement.

Le code demande le retour sur `${window.location.origin}/` — donc
`http://localhost:8080/` en local et l'URL Workers en production. Ce qui
n'est pas dans la liste est ignoré par GoTrue, qui renvoie sur la Site
URL sans rien dire.

## Vérifier

```bash
curl -s -H "apikey: $CLE_PUBLIABLE" https://upfethjdvrgmmfgfvqdo.supabase.co/auth/v1/settings | jq .external
```

Le fournisseur activé passe à `true`. Recharger l'écran de connexion :
la tuile est là.

## Ce qu'il faut savoir avant d'en activer un

Un compte créé par Google n'a pas de mot de passe. Le jour où le
fournisseur est retiré, ce compte n'a plus de chemin d'entrée — le
« mot de passe oublié » envoie bien un courriel, mais sur une adresse
qui n'a jamais servi à se connecter ici. C'est la raison pour laquelle
`useFournisseursActifs` montre les trois tuiles quand il n'arrive pas à
joindre le serveur : une tuile morte affiche une erreur, une tuile
absente enferme quelqu'un dehors.
