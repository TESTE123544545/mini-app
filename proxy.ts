import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLoopbackHost } from "@/lib/hosts";

// Scripts run only from this origin or when they carry this request's nonce: no inline script
// an attacker manages to inject can execute. vinext reads the nonce from this header and stamps
// it on its own bootstrap scripts; the layout stamps it on the colour-mode script.
//
// The public content pages (signs, daily horoscope) also carry Google AdSense. Only those pages get the
// wider policy below: a script with the nonce may load the scripts it needs (strict-dynamic), and Google's
// ad frames, images and beacons are allowed. The signed-in app keeps the strict policy and never loads ads.
const ADS_PAGES = /^\/(signos|horoscopo-do-dia)(\/|$)/;
const GOOGLE_ADS_HOSTS = "https://*.google.com https://*.google.com.br https://*.googlesyndication.com https://*.doubleclick.net https://*.googleadservices.com https://*.adtrafficquality.google https://*.googletagservices.com";

const contentSecurityPolicy = (nonce: string, ads: boolean) => [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  ads ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:` : `script-src 'self' 'nonce-${nonce}'`,
  "style-src 'self' 'unsafe-inline'",
  ads ? "img-src 'self' data: blob: https:" : "img-src 'self' data: blob:",
  "font-src 'self' data:",
  ads ? `connect-src 'self' ${GOOGLE_ADS_HOSTS}` : "connect-src 'self'",
  ...(ads ? [`frame-src ${GOOGLE_ADS_HOSTS}`] : []),
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

export function proxy(request: NextRequest) {
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  const hostname = request.nextUrl.hostname.toLowerCase();
  const requestHost = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  // Only a loopback host may stay on plain HTTP; a missing proxy header is not proof of a local request.
  const isLocal = isLoopbackHost(hostname) && isLoopbackHost(requestHost || hostname);
  if ((!isLocal && (forwardedProtocol === "http" || request.nextUrl.protocol === "http:")) || hostname === "www.veiasdasintonia.com.br") {
    const destination = request.nextUrl.clone();
    destination.protocol = "https:";
    if (hostname === "www.veiasdasintonia.com.br") destination.hostname = "veiasdasintonia.com.br";
    return NextResponse.redirect(destination, 308);
  }

  const nonce = btoa(crypto.randomUUID());
  const ads = ADS_PAGES.test(request.nextUrl.pathname) && request.method === "GET";
  const csp = contentSecurityPolicy(nonce, ads);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.delete("x-ads");
  if (ads) requestHeaders.set("x-ads", "1");
  requestHeaders.set("content-security-policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Strict-Transport-Security", "max-age=31536000");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=(), payment=(self)");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  if (request.nextUrl.pathname.startsWith("/api/")) response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.svg|favicon.png|apple-touch-icon.png|app-icon-).*)"],
};
