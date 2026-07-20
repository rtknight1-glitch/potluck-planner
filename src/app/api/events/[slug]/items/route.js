import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req, { params }) {
    const { slug } = params;
    const body = await req.json();
    const { token, name, category, neededQty } = body;

    if (!name || !name.trim()) {
          return NextResponse.json({ error: "Item name required" }, { status: 400 });
        }

    const db = supabaseAdmin();
    const { data: event } = await db.from("events").select("*").eq("slug", slug).maybeSingle();
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (!token || token !== event.admin_token) {
          return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

    const { count } = await db
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id);

    const { data: item, error } = await db
      .from("items")
      .insert({
              event_id: event.id,
              name: name.trim(),
              category: category || "",
              needed_qty: neededQty || null,
              sort_order: count || 0,
            })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item });
  }
