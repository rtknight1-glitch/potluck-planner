import { Resend } from "resend";

function client() {
  const key = process.env.RESEND_API_KEY;
    if (!key) return null;
      return new Resend(key);
      }

      const FROM = process.env.EMAIL_FROM || "Potluck Planner <onboarding@resend.dev>";

      export async function sendHostSignupNotification({ event, item, signup }) {
        const resend = client();
          if (!resend) return { skipped: true };

            const itemLine = item
                ? `${signup.quantity}x ${item.name}`
                    : `${signup.quantity}x (custom item)`;

                      return resend.emails.send({
                          from: FROM,
                              to: event.host_email,
                                  subject: `New sign-up for ${event.title}: ${signup.guest_name}`,
                                      text:
                                            `${signup.guest_name} just signed up to bring ${itemLine} for "${event.title}".\n` +
                                                  (signup.note ? `Note: ${signup.note}\n` : "") +
                                                        `\nView all sign-ups: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/${event.slug}?token=${event.admin_token}`,
                                                          });
                                                          }

                                                          export async function sendEventCreatedEmail({ event }) {
                                                            const resend = client();
                                                              if (!resend) return { skipped: true };

                                                                const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/e/${event.slug}`;
                                                                  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/${event.slug}?token=${event.admin_token}`;

                                                                    return resend.emails.send({
                                                                        from: FROM,
                                                                            to: event.host_email,
                                                                                subject: `Your potluck "${event.title}" is ready`,
                                                                                    text:
                                                                                          `Your potluck page is live.\n\n` +
                                                                                                `Share this link with guests: ${publicUrl}\n\n` +
                                                                                                      `Your private admin link (bookmark this, it's how you manage the event): ${adminUrl}\n`,
                                                                                                        });
                                                                                                        }
                                                                                                        
                                                                                                        export async function sendReminderEmail({ event, guestName, guestEmail }) {
                                                                                                          const resend = client();
                                                                                                            if (!resend) return { skipped: true };
                                                                                                            
                                                                                                              const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/e/${event.slug}`;
                                                                                                                const when = [event.event_date, event.event_time].filter(Boolean).join(" ");
                                                                                                                
                                                                                                                  return resend.emails.send({
                                                                                                                      from: FROM,
                                                                                                                          to: guestEmail,
                                                                                                                              subject: `Reminder: ${event.title} is coming up`,
                                                                                                                                  text:
                                                                                                                                        `Hi ${guestName},\n\n` +
                                                                                                                                              `Just a reminder about "${event.title}"${when ? ` on ${when}` : ""}` +
                                                                                                                                                    `${event.location ? ` at ${event.location}` : ""}.\n\n` +
                                                                                                                                                          `See what's still needed or update your sign-up: ${publicUrl}\n`,
                                                                                                                                                            });
                                                                                                                                                            }
                                                                                                                                                            
