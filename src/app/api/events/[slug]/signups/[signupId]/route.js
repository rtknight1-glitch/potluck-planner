import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function DELETE(req, { params }) {
    const { slug, signupId } = params;
    const db = supabaseAdmin();
    const { data: event } = await db.from("events").select("id").eq("slug", slug).maybeSingle();
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const { error } = await db.from("signups").delete().eq("id", signupId).eq("event_id", event.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  }
