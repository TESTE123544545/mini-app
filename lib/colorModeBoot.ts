export const COLOR_MODE_STORAGE_KEY = "vds-mode";

/**
 * Runs inline in <head> before the first paint, so a dark-mode visitor never sees a light flash.
 * Kept as a string because it must not wait for the JS bundle.
 */
export const COLOR_MODE_BOOT = `(function(){try{var m=localStorage.getItem("${COLOR_MODE_STORAGE_KEY}")||"light";var d=m==="dark"||(m==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.mode=d?"dark":"light"}catch(e){document.documentElement.dataset.mode="light"}})();`;
