import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import EventClient from "./EventClient";

export const dynamic = "force-dynamic";

async function loadEvent(slug) {
  const db = supabaseAdmin();
    const { data: event } = await db.from("events").select("*").eq("slug", slug).maybeSingle();
      if (!event) return null;

        const { data: items } = await db
            .from("items")
                .select("*")
                    .eq("event_id", event.id)
                        .order("sort_order", { ascending: true });

                          const { data: signups } = await db
                              .from("signups")
                                  .select("*")
                                      .eq("event_id", event.id)
                                          .order("created_at", { ascending: true });

                                            return { event, items: items || [], signups: signups || [] };
                                            }

                                            export default async function EventPage({ params }) {
                                              const data = await loadEvent(params.slug);
                                                if (!data) return notFound();
                                                  return <EventClient event={data.event} items={data.items} signups={data.signups} />;
                                                  }
                                                  
