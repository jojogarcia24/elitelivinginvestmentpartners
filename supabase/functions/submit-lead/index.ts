// =============================================================================
// Elite Living Investment Partners — "submit-lead" edge function
// -----------------------------------------------------------------------------
// Public (no JWT) endpoint that the website posts the application form to.
// It validates + rate-limits the request, then inserts the lead using the
// SERVICE ROLE key (server-side only), so the public site never touches the DB
// directly and the anon key can't be abused.
//
// Deploy (no-JWT so the public form can call it):
//   supabase functions deploy submit-lead --no-verify-jwt
//
// Required project secrets (Project Settings → Edge Functions → Secrets, or CLI):
//   supabase secrets set SUPABASE_URL=...           (auto-provided in most setups)
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
//   supabase secrets set IP_HASH_SALT=<any-long-random-string>
//   supabase secrets set NOTIFY_TO=owner@example.com          (lead notifications)
//   supabase secrets set NOTIFY_FROM="Elite Living <noreply@vossriskadvisors.com>"
//   supabase secrets set RESEND_API_KEY=...                   (optional, for email)
//   supabase secrets set ALLOWED_ORIGIN=https://www.vossriskadvisors.com
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const IP_HASH_SALT = Deno.env.get("IP_HASH_SALT") ?? "change-me";
const NOTIFY_TO = Deno.env.get("NOTIFY_TO") ?? "";
const NOTIFY_FROM = Deno.env.get("NOTIFY_FROM") ?? "Elite Living <onboarding@resend.dev>";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";

// Simple per-IP throttle: max submissions within the window.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MIN = 10;

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function clean(v: unknown, max = 2000): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  // Honeypot — if the hidden field is filled, silently accept and drop it.
  if (clean(payload.company_website)) return json({ ok: true });

  const name = clean(payload.name, 200);
  const email = clean(payload.email, 320);
  const phone = clean(payload.phone, 60);
  const vertical = clean(payload.vertical, 120);
  const message = clean(payload.message, 4000);
  const source = clean(payload.source, 300);
  const userAgent = clean(req.headers.get("user-agent"), 500);

  if (!name || !email) return json({ error: "Name and email are required." }, 422);
  if (!isValidEmail(email)) return json({ error: "Please enter a valid email." }, 422);

  // Hash the caller IP (never store it raw) for throttling + abuse tracking.
  const ipRaw =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";
  const ipHash = await sha256Hex(`${IP_HASH_SALT}:${ipRaw}`);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  // --- Rate limit: count recent submissions from this IP hash ----------------
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MIN * 60_000).toISOString();
  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", windowStart);

  if ((count ?? 0) >= RATE_LIMIT_MAX) {
    return json({ error: "Too many requests. Please try again later." }, 429);
  }

  // --- Insert ----------------------------------------------------------------
  const { data, error } = await supabase
    .from("leads")
    .insert({ name, email, phone, vertical, message, source, user_agent: userAgent, ip_hash: ipHash })
    .select("id")
    .single();

  if (error) {
    console.error("Insert error:", error);
    return json({ error: "Could not save your request." }, 500);
  }

  // --- Notify the owner (best-effort; never blocks the response) -------------
  if (RESEND_API_KEY && NOTIFY_TO) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: NOTIFY_FROM,
          to: [NOTIFY_TO],
          subject: `New application — ${name}`,
          text:
            `New Elite Living application\n\n` +
            `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "—"}\n` +
            `Vertical: ${vertical || "—"}\nSource: ${source || "—"}\n\n` +
            `Message:\n${message || "—"}\n`,
        }),
      });
    } catch (e) {
      console.error("Notification email failed:", e);
    }
  }

  return json({ ok: true, id: data.id });
});
