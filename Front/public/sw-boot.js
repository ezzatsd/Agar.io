if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((registration) => {
      console.log("Service Worker enregistré avec succès:");
    })
    .catch((error) => {
      console.log("Échec de l'enregistrement du Service Worker:", error);
    });
}
