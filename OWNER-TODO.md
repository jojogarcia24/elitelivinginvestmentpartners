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

## 2. Lead form backend (required for the form to save leads)
- [ ] Create the dedicated **Supabase project** and connect the form —
      full steps in [`supabase/README.md`](supabase/README.md).
- [ ] Provide the **lead-notification email** (where new applications are sent).
- [ ] Decide: send applicants an **autoresponder**? (Off by default.)

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
- [ ] **Contact email** — currently `hello@vossriskadvisors.com`. Confirm/replace.
- [ ] **Phone number** — placeholder `(000) 000-0000` on the Contact page.
- [ ] **Social profile URLs** — Instagram / LinkedIn / Facebook icons in the
      footer currently link to `#`.
- [ ] Confirm the **"Enter Portal"** link target `https://www.backbossai.com/`.

## 5. SEO & analytics
- [ ] **Analytics ID** — paste your GA4 or Plausible snippet before `</head>`
      on each page.
- [ ] Confirm the **domain** and update any absolute URLs if it changes
      (they currently use `https://www.vossriskadvisors.com`). These appear in:
      each page's canonical/OG tags, `sitemap.xml`, and `robots.txt`.
- [ ] After deploy, submit `sitemap.xml` in Google Search Console.

## 6. Deploy
- [ ] Choose a host (Netlify / Vercel / Cloudflare Pages — see README).
- [ ] Point `www.vossriskadvisors.com` DNS at the host.

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
