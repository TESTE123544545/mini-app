/**
 * Bridges the account to the browser's password manager (Credential Management API).
 *
 * Clearing browsing history wipes the session cookie like on any site, but saved passwords
 * survive it. After a login we hand the credential to the password manager; when someone comes
 * back without a session we ask for it again and sign them straight back in — silently, or with
 * the browser's one-tap "Entrar como…" chooser. Chromium only (Android Chrome, the app's main
 * audience); elsewhere these are no-ops and the regular login form with autofill still works.
 */
type StoredPassword = Credential & { password?: string };
type PasswordCredentialConstructor = new (data: { id: string; password: string; name?: string }) => Credential;

function passwordCredentialApi() {
  if (typeof window === "undefined" || !navigator.credentials) return null;
  const ctor = (window as unknown as { PasswordCredential?: PasswordCredentialConstructor }).PasswordCredential;
  return ctor ?? null;
}

export async function rememberLogin(email: string, password: string) {
  const PasswordCredential = passwordCredentialApi();
  if (!PasswordCredential) return;
  try { await navigator.credentials.store(new PasswordCredential({ id: email, password, name: email })); } catch { /* the person declined or the browser refused */ }
}

export async function recallLogin(): Promise<{ email: string; password: string } | null> {
  if (!passwordCredentialApi()) return null;
  try {
    // `password` is not in the TypeScript DOM typings any more, but Chromium still honours it.
    const credential = await navigator.credentials.get({ password: true, mediation: "optional" } as CredentialRequestOptions) as StoredPassword | null;
    if (credential?.type === "password" && credential.password) return { email: credential.id, password: credential.password };
  } catch { /* no stored credential, or the chooser was dismissed */ }
  return null;
}

/** After an explicit "Sair", the next visit must not sign the person back in on its own. */
export function stopSilentLogin() {
  if (typeof navigator === "undefined" || !navigator.credentials?.preventSilentAccess) return;
  navigator.credentials.preventSilentAccess().catch(() => { /* not supported */ });
}
