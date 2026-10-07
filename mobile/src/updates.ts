import { AppState } from "react-native";
import * as Updates from "expo-updates";

const MIN_GAP_MS = 10 * 60_000;
let lastCheck = 0;

/** Looks for a newer version of the app's JavaScript (served by our site) and restarts into it. */
async function check() {
  if (__DEV__ || !Updates.isEnabled || Date.now() - lastCheck < MIN_GAP_MS) return;
  lastCheck = Date.now();
  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) return;
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  } catch { /* offline or server busy: try again the next time the app comes to the front */ }
}

/** The app also checks on every launch (expo-updates ON_LOAD); this covers phones that keep it open for days. */
export function watchForUpdates() {
  const subscription = AppState.addEventListener("change", (state) => { if (state === "active") void check(); });
  return () => subscription.remove();
}
