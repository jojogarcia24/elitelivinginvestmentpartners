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
//   supabase secrets set NOTIFY_FROM="Elite Living <noreply@elitelivinginvestmentpartners.com>"
//   supabase secrets set RESEND_API_KEY=...                   (optional, for email)
//   supabase secrets set ALLOWED_ORIGIN=https://elitelivinginvestmentpartners.com
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const IP_HASH_SALT = Deno.env.get("IP_HASH_SALT") ?? "elip-default-salt-change-me";
const NOTIFY_TO = Deno.env.get("NOTIFY_TO") ?? "info@elitelivinginvestmentpartners.com";
const NOTIFY_FROM = Deno.env.get("NOTIFY_FROM") ?? "Elite Living Investment Partners <noreply@elitelivinginvestmentpartners.com>";
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

function esc(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
      const ownerRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: NOTIFY_FROM,
          to: [NOTIFY_TO],
          reply_to: email,
          subject: `New application — ${name}`,
          text:
            `New Elite Living application\n\n` +
            `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "—"}\n` +
            `Vertical: ${vertical || "—"}\nSource: ${source || "—"}\n\n` +
            `Message:\n${message || "—"}\n`,
          html:
            `<div style="font-family:Arial,Helvetica,sans-serif;color:#2c2a24;max-width:560px;margin:0 auto;line-height:1.6;font-size:15px">` +
            `<div style="background:#16150f;padding:18px 22px;margin-bottom:22px">` +
            `<span style="font-family:Georgia,'Times New Roman',serif;color:#f4f1ea;font-size:16px;letter-spacing:2px;text-transform:uppercase">New application</span>` +
            `</div>` +
            `<table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:15px">` +
            `<tr><td style="padding:6px 0;color:#7c7a72;width:110px">Name</td><td style="padding:6px 0;font-weight:bold">${esc(name)}</td></tr>` +
            `<tr><td style="padding:6px 0;color:#7c7a72">Email</td><td style="padding:6px 0"><a href="mailto:${esc(email)}" style="color:#16150f">${esc(email)}</a></td></tr>` +
            `<tr><td style="padding:6px 0;color:#7c7a72">Phone</td><td style="padding:6px 0">${esc(phone) || "—"}</td></tr>` +
            `<tr><td style="padding:6px 0;color:#7c7a72">Vertical</td><td style="padding:6px 0">${esc(vertical) || "—"}</td></tr>` +
            `<tr><td style="padding:6px 0;color:#7c7a72">Source</td><td style="padding:6px 0">${esc(source) || "—"}</td></tr>` +
            `</table>` +
            `<div style="margin-top:18px;padding-top:16px;border-top:1px solid #e4e0d8">` +
            `<div style="color:#7c7a72;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Message</div>` +
            `<div style="white-space:pre-wrap">${message ? esc(message) : "—"}</div>` +
            `</div>` +
            `</div>`,
        }),
      });
      console.log("Owner email -> Resend status:", ownerRes.status, "body:", await ownerRes.text());
    } catch (e) {
      console.error("Notification email failed:", e);
    }
  }

  // --- Auto-responder to the applicant (best-effort) -------------------------
  if (RESEND_API_KEY) {
    const firstName = name.split(/\s+/)[0] || "there";
    try {
      const applicantRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: NOTIFY_FROM,
          to: [email],
          reply_to: NOTIFY_TO,
          subject: "We've received your request — Elite Living Investment Partners",
          text:
            `Hi ${firstName},\n\n` +
            `Thank you for your interest in Elite Living Investment Partners.\n\n` +
            `We've received your request for an invitation, and someone from our team ` +
            `will be in touch personally to continue the conversation.\n\n` +
            `In the meantime, feel free to explore the network at ` +
            `https://elitelivinginvestmentpartners.com.\n\n` +
            `— Elite Living Investment Partners\n` +
            `info@elitelivinginvestmentpartners.com`,
          html:
            `<div style="background:#16150f;padding:28px 24px;text-align:center">` +
            `<div style="font-family:Georgia,'Times New Roman',serif;color:#f4f1ea;font-size:22px;letter-spacing:3px;text-transform:uppercase">Elite Living</div>` +
            `<div style="font-family:Arial,sans-serif;color:#cfcbbf;font-size:10px;letter-spacing:5px;text-transform:uppercase;margin-top:4px">Investment&nbsp;Partners</div>` +
            `</div>` +
            `<div style="font-family:Arial,Helvetica,sans-serif;color:#2c2a24;max-width:560px;margin:0 auto;padding:32px 24px;line-height:1.65;font-size:15px">` +
            `<p>Hi ${esc(firstName)},</p>` +
            `<p>Thank you for your interest in <strong>Elite Living Investment Partners</strong>.</p>` +
            `<p>We've received your request for an invitation, and someone from our team will be in touch personally to continue the conversation.</p>` +
            `<p>In the meantime, feel free to explore the network at ` +
            `<a href="https://elitelivinginvestmentpartners.com" style="color:#16150f">elitelivinginvestmentpartners.com</a>.</p>` +
            `<p style="margin-top:26px;color:#57544c">— Elite Living Investment Partners<br>` +
            `<a href="mailto:info@elitelivinginvestmentpartners.com" style="color:#57544c">info@elitelivinginvestmentpartners.com</a></p>` +
            `</div>`,
        }),
      });
      console.log("Applicant email -> Resend status:", applicantRes.status, "body:", await applicantRes.text());
    } catch (e) {
      console.error("Auto-responder failed:", e);
    }
  }

  return json({ ok: true, id: data.id });
});
