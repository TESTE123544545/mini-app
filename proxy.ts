import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

export function proxy(request: NextRequest) {
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  const hostname = request.nextUrl.hostname.toLowerCase();
  const requestHost = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const isLocal = !request.headers.has("cf-ray") || [hostname, requestHost].some((value) => value === "localhost" || value === "127.0.0.1");
  if ((!isLocal && (forwardedProtocol === "http" || request.nextUrl.protocol === "http:")) || hostname === "www.veiasdasintonia.com.br") {
    const destination = request.nextUrl.clone();
    destination.protocol = "https:";
    if (hostname === "www.veiasdasintonia.com.br") destination.hostname = "veiasdasintonia.com.br";
    return NextResponse.redirect(destination, 308);
  }

  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
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
  matcher: ["/((?!_next/static|_next/image|favicon.svg|app-icon-).*)"],
};
