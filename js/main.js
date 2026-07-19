/* =============================================================================
   Elite Living Investment Partners — site behaviour
   -----------------------------------------------------------------------------
   Plain, dependency-free JS. Handles:
     1. Sticky header state on scroll
     2. Mobile navigation drawer
     3. Reveal-on-scroll animations
     4. Lead-form submission (to the Supabase edge function — see /supabase)
     5. Footer year stamp
   Edit the CONFIG block below to connect the form to your backend.
   ============================================================================= */

/* ---------------------------------------------------------------------------
   CONFIG — set this after creating your Supabase project (see /supabase/README.md)
   --------------------------------------------------------------------------- */
window.ELIP_CONFIG = window.ELIP_CONFIG || {
  // The public URL of your deployed "submit-lead" edge function.
  // Example: "https://YOUR-PROJECT-ref.supabase.co/functions/v1/submit-lead"
  // Leave empty ("") to run the form in DEMO mode (no network call).
  leadEndpoint: "",
};

(function () {
  "use strict";

  /* --- 1. Sticky header ---------------------------------------------------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 24) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* --- 2. Mobile nav drawer ------------------------------------------------ */
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.querySelector(".nav__menu");
  var scrim = document.querySelector(".nav__scrim");

  function closeMenu() {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open");
    if (scrim) scrim.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  }
  function openMenu() {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", "true");
    menu.classList.add("is-open");
    if (scrim) scrim.classList.add("is-open");
    document.body.classList.add("menu-open");
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      open ? closeMenu() : openMenu();
    });
    if (scrim) scrim.addEventListener("click", closeMenu);
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* --- 3. Reveal-on-scroll ------------------------------------------------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* --- 4. Lead form -------------------------------------------------------- */
  var form = document.querySelector("#lead-form");
  if (form) {
    var statusEl = form.querySelector(".form__status");
    var submitBtn = form.querySelector('[type="submit"]');

    var setStatus = function (msg, kind) {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.className = "form__status" + (kind ? " is-" + kind : "");
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot: if filled, silently pretend success (likely a bot).
      var hp = form.querySelector('[name="company_website"]');
      if (hp && hp.value.trim() !== "") {
        window.location.href = "thank-you.html";
        return;
      }

      var data = {
        name: (form.name && form.name.value || "").trim(),
        email: (form.email && form.email.value || "").trim(),
        phone: (form.phone && form.phone.value || "").trim(),
        vertical: (form.vertical && form.vertical.value || "").trim(),
        message: (form.message && form.message.value || "").trim(),
        source: window.location.pathname,
      };

      if (!data.name || !data.email) {
        setStatus("Please add your name and email so we can reach you.", "error");
        return;
      }

      var endpoint = (window.ELIP_CONFIG && window.ELIP_CONFIG.leadEndpoint) || "";

      // DEMO mode — no backend configured yet.
      if (!endpoint) {
        setStatus("Demo mode: form not yet connected to Supabase. See /supabase/README.md.", "ok");
        console.info("[ELIP] Lead captured (demo mode, not sent):", data);
        window.setTimeout(function () { window.location.href = "thank-you.html"; }, 900);
        return;
      }

      if (submitBtn) { submitBtn.disabled = true; }
      setStatus("Sending…", "");

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed: " + res.status);
          return res.json().catch(function () { return {}; });
        })
        .then(function () {
          window.location.href = "thank-you.html";
        })
        .catch(function (err) {
          console.error("[ELIP] Lead submit error:", err);
          setStatus("Something went wrong. Please try again or email us directly.", "error");
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  /* --- 5. Footer year ------------------------------------------------------ */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
