import type { Metadata } from "next";
import "./admin.css";
import { AdminDashboard } from "@/components/AdminDashboard";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

/** Team dashboard. The page itself is empty to outsiders: every number comes from an admin-only API. */
export default function AdminPage() {
  return <AdminDashboard/>;
}
