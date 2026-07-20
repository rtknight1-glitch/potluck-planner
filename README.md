# Potluck Planner

A reusable, shareable potluck/event sign-up site. Create an event, customize its
look, share the link, and let guests claim items (with quantities). You get an
email whenever someone signs up, and guests get automatic reminder emails on
whatever schedule you choose.

## How it works

- **Create** (`/create`): host fills in event details, theme/colors, and a
  starting item list. Creates a unique public link and a private admin link.
  - **Public page** (`/e/[slug]`): guests view details and sign up for items
    (existing or their own custom item), with quantities. Multiple people can
      claim the same item.
      - **Admin page** (`/admin/[slug]?token=...`): edit event details, manage
        items, view all sign-ups, set the reminder schedule. Only accessible with
          the secret token from the admin link -- bookmark it, there's no login.
          - **Notifications**: the host gets an email the instant someone signs up.
          - **Reminders**: a daily scheduled job (Vercel Cron) emails guests who left
            an email address, starting N days before the event, optionally repeating
              every N days -- both configurable per event in the admin page.

              Data lives in Supabase (Postgres). Email is sent via Resend. Hosting is
              Vercel, all on free tiers.

              ## One-time setup

              ### 1. Supabase (database)
              In the Supabase dashboard, go to SQL Editor -> New query, paste the
              contents of `supabase/schema.sql`, and run it once. This creates the
              `events`, `items`, and `signups` tables.

              ### 2. Resend (email)
              Free at resend.com, no credit card. After signing up:
              - Go to API Keys -> Create API Key, copy it.
              - You can send immediately from `onboarding@resend.dev` (no setup) -- fine to
                start with. For a more professional "from" address, verify your own domain
                  under Domains later and update `EMAIL_FROM`.

                  ### 3. Deploy to Vercel
                  In Vercel: Add New -> Project -> import this GitHub repo. Before deploying,
                  open Environment Variables and add:
                  - `SUPABASE_URL`
                  - `SUPABASE_SERVICE_ROLE_KEY`
                  - `RESEND_API_KEY`
                  - `EMAIL_FROM`
                  - `CRON_SECRET` (any random string you make up)
                  - `NEXT_PUBLIC_SITE_URL` (your Vercel URL, set after first deploy, then redeploy once)

                  Vercel automatically picks up `vercel.json`, which schedules
                  `/api/cron/reminders` to run once daily.

                  ### Test the reminder job manually
                  ```
                  curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-app.vercel.app/api/cron/reminders
                  ```

                  ## Reusing it
                  Nothing to redeploy for each new event -- just visit `/create` again anytime.
                  Every event gets its own shareable link and admin link. One deployment
                  serves unlimited potlucks (or any other item-sign-up event).
                  
