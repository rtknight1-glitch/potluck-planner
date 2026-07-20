import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function requireHost(db, slug, token) {
    const { data: event } = await db.from("events").select("*").eq("slug", slug).maybeSingle();
    if (!event) return { error: NextResponse.json({ error: "Event not found" }, { status: 404 }) };
    if (!token || token !== event.admin_token) {
          return { error: NextResponse.json({ error: "Not authorized" }, { status: 403 }) };
        }
    return { event };
  }

export async function PATCH(req, { params }) {
    const { slug } = params;
    const body = await req.json();
    const { token, ...fields } = body;
    const db = supabaseAdmin();
    const { event, error } = await requireHost(db, slug, token);
    if (error) return error;

    const allowed = [
          "title",
          "description",
          "event_date",
          "event_time",
          "location",
          "theme",
          "primary_color",
          "banner_emoji",
          "host_name",
          "host_email",
          "reminder_start_days",
          "reminder_repeat_days",
        ];
    const update = {};
    for (const key of allowed) {
          if (key in fields) update[key] = fields[key];
        }

    const { data: updated, error: updateError } = await db
      .from("events")
      .update(update)
      .eq("id", event.id)
      .select()
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    return NextResponse.json({ event: updated });
  }
