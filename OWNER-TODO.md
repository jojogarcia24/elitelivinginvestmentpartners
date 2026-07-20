# Owner To-Do — before launch

Everything the site is ready for, but still needs **you** to provide or approve.
Grouped by priority.

## 1. Legal (required before publishing)
- [ ] Have your **attorney review all marketing copy** and the Privacy & Terms
      pages. Copy is drafted conservatively but is **not** a substitute for counsel.
- [ ] Finalize the **footer disclaimer** (currently placeholder, on every page).
- [ ] Approve how **standalone** ELIP appears (currently presented independently;
      no operating brokerage or partner brand is named). Confirm which vertical
      brand names, if any, may be shown publicly.

## 2. Lead form backend
- [x] ~~Create Supabase project + connect the form~~ — **DONE.** Live on the
      `elitelivinginvestmentpartners` project; submissions save to the `leads`
      table now (view them in Supabase → Table Editor → leads).
- [x] ~~Email alerts~~ — **ON.** RESEND_API_KEY is set; new applications email
      info@elitelivinginvestmentpartners.com, and applicants get an auto-reply.
- [x] ~~Applicant **autoresponder**~~ — **ON.** Every applicant now gets a branded confirmation email from noreply@elitelivinginvestmentpartners.com.

## 3. Brand assets & content
- [ ] **Hero photograph** — a strong, editorial architectural/lifestyle image.
      Drop it in per the README ("Add the hero photograph"). Big visual impact.
- [ ] **Section photography** for the About page and Home "what it is" block
      (the grey `split__media` placeholders).
- [ ] Approve the **logo** (wordmark "ELITE LIVING / INVESTMENT PARTNERS") and the
      favicon, or request tweaks. SVG lockups are in `assets/`.
- [ ] Real **testimonials/quotes** for the social-proof band (keep them about
      *experience/community*, never income — see compliance notes).

## 4. Contact & social details (currently placeholders)
- [x] ~~Contact email~~ — set to `info@elitelivinginvestmentpartners.com` (mailbox still needs to be created, e.g. via Google Workspace).
- [ ] **Phone number** — placeholder `(000) 000-0000` on the Contact page.
- [ ] **Social profile URLs** — Instagram / LinkedIn / Facebook icons in the
      footer currently link to `#`.
- [ ] Confirm the **"Enter Portal"** link target `https://www.backbossai.com/`.

## 5. SEO & analytics
- [ ] **Analytics ID** — analytics is wired; just paste your GA4 Measurement ID
      into `gaId` in `js/main.js`. Get it from
      [analytics.google.com](https://analytics.google.com) → Admin → Data streams
      → your web stream → **Measurement ID** (`G-XXXXXXXXXX`). Empty = disabled.
- [ ] Confirm the **domain** and update any absolute URLs if it changes
      (they currently use `https://elitelivinginvestmentpartners.com`). These appear in:
      each page's canonical/OG tags, `sitemap.xml`, and `robots.txt`.
- [ ] After deploy, submit `sitemap.xml` in Google Search Console.

## 6. Deploy
- [ ] Choose a host (Netlify / Vercel / Cloudflare Pages — see README).
- [ ] Point `elitelivinginvestmentpartners.com` DNS at the host (Netlify — external DNS via GoDaddy recommended so website + email DNS stay together).

---

### Where each placeholder lives (quick reference)
| Item | File(s) |
|------|---------|
| Contact email | all pages (footer), `contact.html` |
| Phone number | `contact.html` |
| Social links (`#`) | all pages (footer) |
| Footer disclaimer | all pages (footer) |
| Hero image | `index.html` (`.hero`) |
| Section images | `about.html`, `index.html` (`.split__media`) |
| Form endpoint | `js/main.js` (`ELIP_CONFIG.leadEndpoint`) |
| Analytics | before `</head>` in every page |
