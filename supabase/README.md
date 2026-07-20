# Lead-capture backend (Supabase) — setup guide

> ## ✅ STATUS: LIVE
> The form is already deployed and connected to the **`elitelivinginvestmentpartners`**
> Supabase project (ref `lufsivxunblsyvcfbnrj`):
> - `leads` table created, **RLS on**, no public insert policy.
> - `submit-lead` edge function deployed (public / no-JWT, with honeypot +
>   validation + per-IP rate limit).
> - The site posts to
>   `https://lufsivxunblsyvcfbnrj.supabase.co/functions/v1/submit-lead`
>   (set in `js/main.js`).
>
> **Submissions are saving now.** View them in Supabase → **Table Editor → leads**.
>
> **Two things left for EMAIL ALERTS** (leads still save without them) — set these
> secrets in Supabase → **Project Settings → Edge Functions → Secrets**, then
> redeploy the function:
> - `RESEND_API_KEY` — from [resend.com](https://resend.com) (verify your sending domain).
> - `NOTIFY_TO=info@elitelivinginvestmentpartners.com`
> - `IP_HASH_SALT` — any long random string (replaces the insecure default).
>
> The rest of this file documents the setup for reference / rebuilding.

---

The steps below are the original from-scratch guide (already completed above).

> **Why this design?** The public site only ever holds the Supabase URL + anon
> key and calls one small **edge function**. That function validates, rate-limits,
> and inserts each lead using the **service role key** (server-side only). Row
> Level Security is on with **no public insert policy**, so the anon key can't be
> abused to write junk into your database.

---

## 1. Create a brand-new, dedicated Supabase project

This is a **separate company** — create a **fresh** project. Do **not** reuse any
existing/other Supabase project.

1. Go to <https://supabase.com/dashboard> → **New project**.
2. Name it e.g. `elite-living-investment-partners`. Pick a region near your users.
3. Save the database password somewhere safe.

## 2. Create the `leads` table

Open **SQL Editor → New query**, paste the contents of [`schema.sql`](./schema.sql),
and **Run**. This creates the `leads` table, indexes, and enables RLS.

## 3. Deploy the `submit-lead` edge function

Install the [Supabase CLI](https://supabase.com/docs/guides/cli), then from the
repo root:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF      # ref is in your project URL
supabase functions deploy submit-lead --no-verify-jwt
```

`--no-verify-jwt` makes the endpoint public so the website form can call it.
Abuse protection is handled inside the function (honeypot + validation + per-IP
rate limit), not by a JWT.

## 4. Set the function secrets

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are usually injected automatically.
Set the rest:

```bash
supabase secrets set IP_HASH_SALT="$(openssl rand -hex 32)"
supabase secrets set ALLOWED_ORIGIN="https://elitelivinginvestmentpartners.com"
supabase secrets set NOTIFY_TO="OWNER_EMAIL_HERE"
supabase secrets set NOTIFY_FROM="Elite Living <noreply@elitelivinginvestmentpartners.com>"
supabase secrets set RESEND_API_KEY="YOUR_RESEND_KEY"   # optional, for email alerts
```

- **`NOTIFY_TO`** — where new-application emails go (**owner to provide**).
- **`RESEND_API_KEY`** — optional. Sign up at [resend.com](https://resend.com),
  verify your sending domain, and paste the key. Without it, leads are still saved
  to the database; only the email alert is skipped.
- Never put the **service role key** in the website or commit it anywhere.

## 5. Point the website at the function

Copy your function URL (shown after deploy), then either:

**Option A — edit `js/main.js`** (simplest): set

```js
window.ELIP_CONFIG = {
  leadEndpoint: "https://YOUR_PROJECT_REF.supabase.co/functions/v1/submit-lead",
};
```

**Option B — inject before `main.js`** on each page (no edit to `main.js`):

```html
<script>
  window.ELIP_CONFIG = {
    leadEndpoint: "https://YOUR_PROJECT_REF.supabase.co/functions/v1/submit-lead",
  };
</script>
<script src="js/main.js"></script>
```

If `leadEndpoint` is empty, the form runs in **demo mode** (logs to console,
redirects to the thank-you page, saves nothing).

## 6. Test it

1. Open the site, submit the form with real values.
2. Confirm a row appears in **Table Editor → leads**.
3. Confirm the notification email arrives (if Resend is configured).

---

## Optional: autoresponder to the applicant

The handoff asks whether applicants should get an auto-reply. It's **off by
default**. To enable, add a second Resend call in
[`functions/submit-lead/index.ts`](./functions/submit-lead/index.ts) that emails
`email` (the applicant) a short confirmation — or just rely on the on-site
thank-you page. Ask the owner which they prefer.

## Notes

- Raw IP addresses are **never stored** — only a salted SHA-256 hash, used for
  throttling.
- Rate limit defaults: 5 submissions per IP per 10 minutes (tunable at the top
  of the function).
- To view leads later, build a small internal tool or use the Supabase Table
  Editor. Do not add a public SELECT policy to the `leads` table.
