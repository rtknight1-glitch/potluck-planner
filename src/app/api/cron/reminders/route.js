import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendReminderEmail } from "@/lib/email";

function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

function daysBetween(a, b) {
    const ms = new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z");
    return Math.round(ms / (1000 * 60 * 60 * 24));
  }

// Vercel Cron calls this once a day (see vercel.json). It also accepts a
// manual GET with the correct Authorization header for testing.
export async function GET(req) {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
          return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

    const db = supabaseAdmin();
    const today = todayISO();

    const { data: events, error } = await db
      .from("events")
      .select("*")
      .gte("event_date", today);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const results = [];

    for (const event of events || []) {
          if (event.reminder_start_days === null || event.reminder_start_days === undefined) continue;
          const daysUntilEvent = daysBetween(today, event.event_date);
          if (daysUntilEvent > event.reminder_start_days) continue;
          if (daysUntilEvent < 0) continue;

          const lastSent = event.last_reminder_sent_on;
          let shouldSend = false;
          if (!lastSent) {
                  shouldSend = true;
                } else if (event.reminder_repeat_days) {
                  shouldSend = daysBetween(lastSent, today) >= event.reminder_repeat_days;
                } else {
                  shouldSend = false;
                }

          if (!shouldSend) continue;

          const { data: signups } = await db
            .from("signups")
            .select("guest_name, guest_email")
            .eq("event_id", event.id)
            .not("guest_email", "is", null);

          let sent = 0;
          for (const s of signups || []) {
                  if (!s.guest_email) continue;
                  try {
                            await sendReminderEmail({ event, guestName: s.guest_name, guestEmail: s.guest_email });
                            sent++;
                          } catch (e) {
                            // continue sending to others even if one fails
                          }
                }

          await db.from("events").update({ last_reminder_sent_on: today }).eq("id", event.id);
          results.push({ event: event.slug, remindersSent: sent });
        }

    return NextResponse.json({ ok: true, checked: (events || []).length, results });
  }
