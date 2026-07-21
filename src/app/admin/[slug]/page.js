import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

async function loadEvent(slug) {
  const db = supabaseAdmin();
  const { data: event } = await db.from("events").select("*").eq("slug", slug).maybeSingle();
  if (!event) return null;

  const { data: items } = await db
    .from("items")
    .select("*")
    .eq("event_id", event.id)
    .order("sort_order", { ascending: true });

  const { data: signups } = await db
    .from("signups")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at", { ascending: true });

  return { event, items: items || [], signups: signups || [] };
}

export default async function AdminPage({ params, searchParams }) {
  const data = await loadEvent(params.slug);
  if (!data) return notFound();

  const token = searchParams.token;
  if (!token || token !== data.event.admin_token) {
    return (
      <div className="center">
        <h1>Not authorized</h1>
        <p className="subtitle">
          This admin page needs the private link that was emailed to you when you created the event.
        </p>
      </div>
    );
  }

  return (
    <AdminClient
      event={data.event}
      items={data.items}
      signups={data.signups}
      token={token}
      isNew={searchParams.new === "1"}
      isDuplicated={searchParams.duplicated === "1"}
    />
  );
}
