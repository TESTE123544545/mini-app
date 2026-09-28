import type { Metadata } from "next";
import { headers } from "next/headers";
import "./admin.css";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminLogin } from "@/components/AdminLogin";
import { adminFromCookieHeader } from "@/lib/adminAuth";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

/**
 * Developer-only. Without an admin session (lib/adminAuth.ts) this renders only the developer
 * login — separate from the app's login; app accounts get nothing here, admin or not.
 */
export default async function AdminPage() {
  const admin = await adminFromCookieHeader((await headers()).get("cookie"));
  return admin ? <AdminDashboard adminEmail={admin.email}/> : <AdminLogin/>;
}
