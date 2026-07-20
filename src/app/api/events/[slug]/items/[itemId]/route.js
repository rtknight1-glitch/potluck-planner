import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function DELETE(req, { params }) {
    const { slug, itemId } = params;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    const db = supabaseAdmin();
    const { data: event } = await db.from("events").select("id, admin_token").eq("slug", slug).maybeSingle();
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (!token || token !== event.admin_token) {
          return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

    const { error } = await db.from("items").delete().eq("id", itemId).eq("event_id", event.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
