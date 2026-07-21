import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendHostSignupNotification, sendGuestSignupConfirmation } from "@/lib/email";

export async function POST(req, { params }) {
  const { slug } = params;
  const body = await req.json();
  const { guestName, guestEmail, itemId, customItemName, quantity, note } = body;

  if (!guestName || (!itemId && !customItemName)) {
    return NextResponse.json({ error: "Missing name or item" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: event } = await db.from("events").select("*").eq("slug", slug).maybeSingle();
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  let item = null;
  if (itemId) {
    const { data: itemRow } = await db.from("items").select("*").eq("id", itemId).eq("event_id", event.id).maybeSingle();
    if (!itemRow) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    item = itemRow;
  }

  const { data: signup, error } = await db
    .from("signups")
    .insert({
      event_id: event.id,
      item_id: item ? item.id : null,
      custom_item_name: item ? null : customItemName,
      guest_name: guestName,
      guest_email: guestEmail || null,
      quantity: quantity || 1,
      note: note || "",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Awaited (not fire-and-forget): on Vercel, a serverless function can freeze
  // as soon as the response is returned, which silently kills any unawaited
  // async work (like these email sends) before it ever reaches the network.
  // Sent one after another (not concurrently) to avoid tripping Resend's
  // per-second rate limit, which would otherwise silently drop the second
  // send. Each helper logs its own failure, so a problem with one email
  // never blocks or hides a problem with the other.
  try {
    await sendHostSignupNotification({ event, item, signup });
  } catch (e) {
    console.error("[email] sendHostSignupNotification threw:", e);
  }
  try {
    await sendGuestSignupConfirmation({ event, item, signup });
  } catch (e) {
    console.error("[email] sendGuestSignupConfirmation threw:", e);
  }

  return NextResponse.json({ signup });
}

export async function GET(req, { params }) {
  const { slug } = params;
  const db = supabaseAdmin();
  const { data: event } = await db.from("events").select("id").eq("slug", slug).maybeSingle();
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const { data: signups } = await db
    .from("signups")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ signups: signups || [] });
}
