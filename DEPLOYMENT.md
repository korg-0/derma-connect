# Personal deployment setup

This guide keeps the current Next.js application as the web app and builds the separate Android wrapper in `mobile/` against the deployed HTTPS site.

## Free hosting layout

- **Vercel Hobby** hosts the Next.js app. Its functions are pinned to Mumbai (`bom1`) in `vercel.json`, close to the database and users in India.
- **Supabase Free** hosts Postgres, Auth, Realtime, and the private `skin-images` bucket.
- **Namecheap DNS** points `dermaconnect.me` to the Vercel project. Vercel supplies HTTPS for the domain.

Free plans have quotas and are not an uptime guarantee. Supabase can pause inactive free projects. Vercel Hobby is for personal, non-commercial use; check current provider terms before using the app for a business or offering consultations to others.

## Supabase region

The app's existing compliance notes specify India data residency. The active deployment project is now in **South Asia (Mumbai), `ap-south-1`**. The earlier Seoul project remains separate and empty; do not point the live app at it. Supabase binds a project to its selected region, and changing regions requires a new project and migration. The Mumbai project's API URL is `https://cbdozdpdulxapkcniwjz.supabase.co`.

The initial schema migration, `supabase/migrations/20261021000000_initial_schema.sql`, was run successfully in the empty Mumbai project on 2026-10-22. Do not run it again. It contains schema and access configuration only; it does not contain local table data. It creates the auth profile trigger, private image bucket and participant access policies, and the five-minute expired-request cleanup job.

## Vercel environment variables

Set these for Production and Preview in the Vercel project settings:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Mumbai project's HTTPS API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Mumbai project's public anon/publishable key |
| `NEXT_PUBLIC_SITE_URL` | `https://dermaconnect.me` |
| `RESEND_API_KEY` | Resend API key, if email notifications are enabled |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID, if Meet integration is enabled |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret, if Meet integration is enabled |
| `GOOGLE_REDIRECT_URI` | `https://dermaconnect.me/api/google/callback` |

Enter secret values directly in the provider dashboard; never commit them or paste them into chat. The Supabase service-role key is not required by this app's current server client and must not be used as a public key.

## Domain and authentication

1. Import the GitHub repository into Vercel and set the root directory to the repository root.
2. Add `dermaconnect.me` in Vercel's Domains settings, then apply the DNS records Vercel shows in Namecheap. DNS targets can vary, so use the records displayed for this project.
3. In Supabase Auth URL Configuration, set the Site URL to `https://dermaconnect.me` and add the production callback/redirect URLs shown by the app and Supabase.
4. In Google Cloud OAuth settings, add `https://dermaconnect.me/api/google/callback` as an authorized redirect URI if Meet integration is needed.
5. Build the web app, review the preview deployment, then publish the production deployment. After the site is stable, build the APK with `DERMA_CONNECT_WEB_URL=https://dermaconnect.me`.

The local `.env.local` remains local and is not copied to the cloud automatically.
