import { Resend } from "resend";

function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = process.env.EMAIL_FROM || "Potluck Planner <onboarding@resend.dev>";

// The Resend SDK resolves (doesn't throw) even when the API rejects a send —
// the failure shows up as `result.error` instead. Log it here so silent
// per-recipient failures (rate limits, sandbox restrictions, bad address,
// etc.) actually show up in the Vercel function logs instead of vanishing.
function logIfFailed(label, result) {
  if (result && result.error) {
    console.error(`[email] ${label} failed:`, JSON.stringify(result.error));
  }
  return result;
}

export async function sendHostSignupNotification({ event, item, signup }) {
  const resend = client();
  if (!resend) return { skipped: true };

  const itemLine = item
    ? `${signup.quantity}x ${item.name}`
    : `${signup.quantity}x (custom item)`;

  const result = await resend.emails.send({
    from: FROM,
    to: event.host_email,
    subject: `New sign-up for ${event.title}: ${signup.guest_name}`,
    text:
      `${signup.guest_name} just signed up to bring ${itemLine} for "${event.title}".\n` +
      (signup.note ? `Note: ${signup.note}\n` : "") +
      `\nView all sign-ups: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/${event.slug}?token=${event.admin_token}`,
  });
  return logIfFailed(`sendHostSignupNotification (to ${event.host_email})`, result);
}

export async function sendEventCreatedEmail({ event }) {
  const resend = client();
  if (!resend) return { skipped: true };

  const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/e/${event.slug}`;
  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/${event.slug}?token=${event.admin_token}`;

  const result = await resend.emails.send({
    from: FROM,
    to: event.host_email,
    subject: `Your potluck "${event.title}" is ready`,
    text:
      `Your potluck page is live.\n\n` +
      `Share this link with guests: ${publicUrl}\n\n` +
      `Your private admin link (bookmark this, it's how you manage the event): ${adminUrl}\n`,
  });
  return logIfFailed(`sendEventCreatedEmail (to ${event.host_email})`, result);
}

export async function sendGuestSignupConfirmation({ event, item, signup }) {
  const resend = client();
  if (!resend) return { skipped: true };
  if (!signup.guest_email) return { skipped: true };

  const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/e/${event.slug}`;
  const when = [event.event_date, event.event_time].filter(Boolean).join(" at ");
  const itemLine = item
    ? `${signup.quantity}x ${item.name}`
    : `${signup.quantity}x ${signup.custom_item_name || "something"}`;

  const result = await resend.emails.send({
    from: FROM,
    to: signup.guest_email,
    subject: `You're confirmed for ${event.title}`,
    text:
      `Hi ${signup.guest_name},\n\n` +
      `You're all set! Here's what you signed up to bring:\n` +
      `${itemLine}\n` +
      (signup.note ? `Note: ${signup.note}\n` : "") +
      `\nEvent details:\n` +
      `${event.title}${event.theme ? ` — ${event.theme}` : ""}\n` +
      (when ? `When: ${when}\n` : "") +
      (event.location ? `Where: ${event.location}\n` : "") +
      `\nSee the full list or change your sign-up anytime: ${publicUrl}\n`,
  });
  return logIfFailed(`sendGuestSignupConfirmation (to ${signup.guest_email})`, result);
}

export async function sendReminderEmail({ event, guestName, guestEmail }) {
  const resend = client();
  if (!resend) return { skipped: true };

  const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/e/${event.slug}`;
  const when = [event.event_date, event.event_time].filter(Boolean).join(" ");

  const result = await resend.emails.send({
    from: FROM,
    to: guestEmail,
    subject: `Reminder: ${event.title} is coming up`,
    text:
      `Hi ${guestName},\n\n` +
      `Just a reminder about "${event.title}"${when ? ` on ${when}` : ""}` +
      `${event.location ? ` at ${event.location}` : ""}.\n\n` +
      `See what's still needed or update your sign-up: ${publicUrl}\n`,
  });
  return logIfFailed(`sendReminderEmail (to ${guestEmail})`, result);
}
