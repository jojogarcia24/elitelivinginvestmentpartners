# Elite Living Investment Partners — Website

A fast, static marketing site for **Elite Living Investment Partners (ELIP)** — a
private members' partnership for entrepreneurs across lending, insurance, title,
and real estate.

- **Design:** clean, editorial, black-and-white luxury ("Vogue" / fashion-house
  feel) — high-contrast Playfair Display serif, generous white space, thin
  hairline rules, squared outlined controls, photography-forward.
- **Stack:** plain HTML + CSS + vanilla JS. **No build step.** Edit the `.html`
  files directly and refresh the browser.
- **Displayed brand:** "Elite Living Investment Partners." **Domain:**
  `elitelivinginvestmentpartners.com`.

> **All marketing copy is DRAFT and requires legal review before publishing.**
> See [`COMPLIANCE-NOTES`](#compliance--legal) below.

---

## Project structure

```
.
├── index.html          # Home (one-page scroll)
├── about.html          # About / mission
├── membership.html     # How membership works (two paths)
├── verticals.html      # Lending · Insurance · Title · Real Estate
├── contact.html        # Apply / lead-capture form + contact details
├── thank-you.html      # Post-submit confirmation (noindex)
├── privacy.html        # Privacy Policy (placeholder, noindex)
├── terms.html          # Terms of Use (placeholder, noindex)
├── 404.html            # Not-found page
├── css/styles.css      # The entire design system (all colors/fonts are here)
├── js/main.js          # Nav, scroll effects, reveal, form submit, form CONFIG
├── assets/
│   ├── favicon.svg           # Cream serif "E" on near-black
│   ├── monogram.svg          # Monochrome "E" mark (currentColor)
│   ├── logo-lockup-dark.svg  # Wordmark, ink — for LIGHT backgrounds/print
│   ├── logo-lockup-light.svg # Wordmark, cream — for DARK backgrounds
│   └── og-image.png          # 1200×630 social share image
├── supabase/           # Lead-capture backend (see supabase/README.md)
├── robots.txt · sitemap.xml · site.webmanifest
└── OWNER-TODO.md       # Everything you still need to drop in
```

---

## Editing the site

### Change copy
Open any `.html` file and edit the text between the tags. The header and footer
are repeated in each page — if you change a nav label or footer link, update it
in **every** file (they're identical blocks, easy to find-and-replace).

### Change colors or fonts
Everything is defined once at the top of [`css/styles.css`](css/styles.css) under
`:root`. For example, to warm up the background, change `--paper`. The palette is
intentionally monochrome (black / white / warm greys) — photography is meant to
supply the only color.

### Change the hero photograph
The home hero uses `assets/hero.webp`. To swap it, either replace that file, or
point the `hero__media` layer at a different image in `index.html`:

```html
<div class="hero__media" style="background-image:url('assets/hero.webp')" aria-hidden="true"></div>
```

A dark scrim (`.hero__bg` in the CSS) keeps the white serif type legible over any
image — if a photo reads too bright, deepen the scrim's opacity values there.
If the image is ever missing, the hero falls back to a neutral charcoal gradient.

### Add section photography
Any `<div class="split__media">` (About page, Home "what it is") is image-ready.
Point it at a file:

```html
<div class="split__media" style="--img:url('assets/story.jpg')"></div>
```

Optimize images before adding them (aim < 300 KB; use `.webp`/`.jpg`).

### Swap the logo / favicon
The brand is a pure wordmark ("ELITE LIVING" + "INVESTMENT PARTNERS"), rendered
live in the header — no image needed. Standalone SVG lockups for email/print live
in `assets/`. The favicon is `assets/favicon.svg`.

---

## The lead form

The application form (Home + Contact pages) is **live** — connected to the
dedicated `elitelivinginvestmentpartners` Supabase project. Submissions save to
the `leads` table (view them in Supabase → Table Editor → leads).

- Endpoint is set in [`js/main.js`](js/main.js) (`ELIP_CONFIG.leadEndpoint`).
- For **email alerts** on each submission, add a `RESEND_API_KEY` secret in
  Supabase — see [`supabase/README.md`](supabase/README.md).
- Spam protection: hidden honeypot field, server-side validation, and a per-IP
  rate limit in the edge function.

## Analytics

Google Analytics is wired but off until you add an ID: paste your GA4 Measurement
ID (`G-XXXXXXXXXX`) into `gaId` in [`js/main.js`](js/main.js).

---

## Deploying

This is a static site — host it anywhere. Easiest options (all free tier, all
support drag-and-drop or Git deploys):

- **Netlify** — drag the folder onto <https://app.netlify.com/drop>, or connect
  the repo.
- **Vercel** — `vercel` CLI, or import the repo.
- **Cloudflare Pages** — connect the repo; build command: *(none)*, output dir: `/`.

Then point `elitelivinginvestmentpartners.com` at the host per their DNS instructions.
Add analytics by pasting your GA/Plausible snippet before `</head>` in each page.

---

## Compliance & legal

The copy is written conservatively to avoid securities / referral-fee framing
(no "returns," "ROI," "passive income," per-referral bounties, or dollar figures).
**Before launch:**

1. Have your attorney review **all** marketing copy and the Privacy/Terms pages.
2. Finalize the footer disclaimer (present on every page).
3. Confirm which vertical/partner brand names, if any, may appear publicly
   (currently none are named — ELIP is presented standalone).

See [`OWNER-TODO.md`](OWNER-TODO.md) for the full checklist of what still needs
your input.
