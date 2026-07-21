import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateSlug, generateAdminToken } from "@/lib/slug";

// Duplicates an event: same details, theme, and items, but a fresh slug,
// a fresh admin token, and zero sign-ups. Lets a host reuse a potluck that
// worked well before without carrying over last time's RSVPs.
export async function POST(req, { params }) {
  const { slug } = params;
  const body = await req.json().catch(() => ({}));
  const { token } = body;

  const db = supabaseAdmin();
  const { data: source } = await db.from("events").select("*").eq("slug", slug).maybeSingle();
  if (!source) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  if (!token || token !== source.admin_token) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { data: sourceItems } = await db
    .from("items")
    .select("*")
    .eq("event_id", source.id)
    .order("sort_order", { ascending: true });

  let newSlug = generateSlug();
  const newAdminToken = generateAdminToken();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await db.from("events").select("id").eq("slug", newSlug).maybeSingle();
    if (!existing) break;
    newSlug = generateSlug();
  }

  const { data: newEvent, error } = await db
    .from("events")
    .insert({
      slug: newSlug,
      admin_token: newAdminToken,
      title: `${source.title} (Copy)`,
      description: source.description,
      event_date: source.event_date,
      event_time: source.event_time,
      location: source.location,
      theme: source.theme,
      primary_color: source.primary_color,
      banner_emoji: source.banner_emoji,
      host_name: source.host_name,
      host_email: source.host_email,
      reminder_start_days: source.reminder_start_days,
      reminder_repeat_days: source.reminder_repeat_days,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (sourceItems && sourceItems.length) {
    const newItems = sourceItems.map((it) => ({
      event_id: newEvent.id,
      name: it.name,
      category: it.category,
      needed_qty: it.needed_qty,
      sort_order: it.sort_order,
    }));
    const { error: itemsError } = await db.from("items").insert(newItems);
    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }
  }

  // Note: signups are intentionally not copied.
  return NextResponse.json({ slug: newEvent.slug, adminToken: newEvent.admin_token });
}
