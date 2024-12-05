/* eslint-disable no-restricted-globals */
// service-worker.js

// Installe le service worker
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installé");
  // Pré-caching de ressources (si nécessaire)
});

// Active le service worker
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activé");
});

self.addEventListener("push", function (event) {
  console.log("notification sent");
  // Vérifiez si des données sont disponibles dans l'événement
  const notificationData = event.data
    ? event.data.json()
    : { title: "Notification sans titre", body: "Aucune donnée fournie." };

  console.log("notification sent", notificationData);
  const options = {
    body: notificationData.body || "Ceci est un message par défaut.",
  };

  event.waitUntil(self.registration.showNotification("Notification", options));
});

self.addEventListener("message", async (event) => {
  console.log("message sent");
  if (event.data.type === "REGISTER") {
    console.log(event);

    event.source.postMessage({
      type: "RESPONSE",
      message: "Page ciblée spécifiquement",
    });
  }
});

// Intercepte les requêtes réseau
// self.addEventListener("fetch", (event) => {
//   console.log("Service Worker: Interception de", event.request.url);
// });
