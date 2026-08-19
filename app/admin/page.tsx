import type { Metadata } from "next";
import { headers } from "next/headers";
import { hasAdminSession } from "@/lib/admin-auth";
import { getEditableInvitation } from "@/lib/invitation-store";
import AdminEditor from "./admin-editor";
import "./admin.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "მოსაწვევის მართვა",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const requestHeaders = await headers();
  const authenticated = await hasAdminSession(requestHeaders.get("cookie"));
  const content = authenticated
    ? await getEditableInvitation().catch(() => null)
    : null;
  return (
    <AdminEditor
      initiallyAuthenticated={authenticated}
      initialContent={content}
    />
  );
}
