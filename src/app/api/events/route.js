import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateSlug, generateAdminToken } from "@/lib/slug";
import { sendEventCreatedEmail } from "@/lib/email";

export async function POST(req) {
    const body = await req.json();
    const {
          title,
          hostName,
          hostEmail,
          description,
          eventDate,
          eventTime,
          location,
          theme,
          emoji,
          color,
          items,
          reminderStartDays,
          reminderRepeatDays,
        } = body;

    if (!title || !hostName || !hostEmail || !eventDate) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

    const db = supabaseAdmin();
    let slug = generateSlug();
    const adminToken = generateAdminToken();

    for (let attempt = 0; attempt < 5; attempt++) {
          const { data: existing } = await db.from("events").select("id").eq("slug", slug).maybeSingle();
          if (!existing) break;
          slug = generateSlug();
        }

    const { data: event, error } = await db
      .from("events")
      .insert({
              slug,
              admin_token: adminToken,
              title,
              description: description || "",
              event_date: eventDate,
              event_time: eventTime || "",
              location: location || "",
              theme: theme || "",
              primary_color: color || "#e07a3f",
              banner_emoji: emoji || "🍲",
              host_name: hostName,
              host_email: hostEmail,
              reminder_start_days: reminderStartDays ?? 7,
              reminder_repeat_days: reminderRepeatDays ?? null,
            })
      .select()
      .single();

    if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

    const itemRows = (items || [])
      .filter((n) => n && n.trim())
      .map((name, i) => ({ event_id: event.id, name: name.trim(), sort_order: i }));

    if (itemRows.length) {
          const { error: itemsError } = await db.from("items").insert(itemRows);
          if (itemsError) {
                  return NextResponse.json({ error: itemsError.message }, { status: 500 });
                }
        }

    sendEventCreatedEmail({ event }).catch(() => {});

    return NextResponse.json({ slug: event.slug, adminToken: event.admin_token });
  }
