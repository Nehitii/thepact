/* ═══════════════════════════════════════════════════════════════
   LE GESTIONNAIRE DE NOTIFICATIONS POUSSÉES

   Ce fichier s'appelait « sw.js » — et c'est le nom que le greffon
   PWA donne AUSSI au service worker qu'il génère. Vite recopie
   « public/ » dans « dist/ », puis le greffon écrit son sw.js
   par-dessus : à la construction, ce fichier disparaissait
   entièrement.

   Vérifié dans le paquet livré : zéro « push », zéro
   « notificationclick », zéro « showNotification ». Les
   notifications poussées ne pouvaient donc PAS fonctionner en
   production, et rien ne le disait — l'inscription réussissait, le
   service worker répondait, il n'écoutait simplement pas.

   Il porte maintenant son propre nom, et le service worker généré
   l'importe (voir workbox.importScripts dans vite.config.ts). Les
   deux cohabitent au lieu de s'écraser.
   ═══════════════════════════════════════════════════════════════ */
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  /* L'icône par défaut pointait vers placeholder.svg, le carré gris
     de l'échafaudage : une notification sans icône fournie
     s'affichait avec lui. C'est celle de l'application qu'il faut. */
  let payload = { title: "Overwrite", body: "", url: "/", icon: "/marque/overwrite-violet-192.png" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (_) {
    payload.body = event.data ? event.data.text() : "";
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.icon,
      data: { url: payload.url || "/" },
      tag: payload.tag || "overwrite",
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      for (const c of clientsArr) {
        if ("focus" in c) {
          c.navigate(url).catch(() => {});
          return c.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});