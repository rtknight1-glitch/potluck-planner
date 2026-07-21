import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get("email") || "").trim();
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: events, error } = await db
    .from("events")
    .select("slug, admin_token, title, event_date, event_time, location, banner_emoji, primary_color, created_at")
    .ilike("host_email", email)
    .order("event_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ events: events || [] });
}
