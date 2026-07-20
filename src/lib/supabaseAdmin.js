import { createClient } from "@supabase/supabase-js";

// Server-only client using the service_role key. Never import this file
// from a "use client" component.
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) {
          throw new Error(
                "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
                    );
                      }
                        return createClient(url, key, {
                            auth: { persistSession: false },
                              });
                              }
                              
