"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // A new service worker activating (after skipWaiting) doesn't retroactively
    // update the page already running under the old one — reload once so the
    // fresh build's own scripts and styles actually take over.
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });

    const register = () => {
      navigator.serviceWorker.register("/sw.js").then((registration) => {
        registration.update().catch(() => {});
        // Reopening the installed app (from the home screen, or switching back
        // to the tab) is the moment to check for a newer deploy.
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") registration.update().catch(() => {});
        });
      }).catch(() => {
        // The app remains fully usable online if registration is unavailable.
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
