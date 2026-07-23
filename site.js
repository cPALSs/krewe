(() => {
  const EMAIL = "krewe@cpalss.com";

  function mailto(subject, body) {
    return `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function fillTemplate(template, vars) {
    return template.replace(/\{(\w+)\}/g, (_, key) =>
      vars[key] != null ? String(vars[key]) : ""
    );
  }

  function tribeLabel(tribes, id) {
    const t = tribes.find((x) => x.id === id);
    return t ? `${t.id} · ${t.name}` : id;
  }

  async function loadJson(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    return res.json();
  }

  function renderEvent(site) {
    const e = site.event;
    const pitch = site.pitch;
    document.getElementById("gh-pitch-headline").textContent = pitch.headline;
    document.getElementById("gh-pitch-body").textContent = pitch.body;

    const facts = document.getElementById("event-facts");
    const rows = [
      ["Event", `${e.edition} ${e.name}`],
      ["When", `${e.dateDisplay} · ${e.timeNote}`],
      ["Where", e.venue],
      ["Theme", e.theme],
    ];
    facts.innerHTML = rows
      .map(
        ([dt, dd]) =>
          `<div><dt>${dt}</dt><dd>${dd}</dd></div>`
      )
      .join("");

    const url = document.getElementById("gh-url");
    url.href = e.url;
    const reg = document.getElementById("gh-reg");
    if (reg && e.registrationUrl) reg.href = e.registrationUrl;
  }

  function championByTribe(participants) {
    return Object.fromEntries(
      (participants?.champions || []).map((c) => [c.tribe, c])
    );
  }

  function isChampionFilled(c) {
    if (!c) return false;
    return (
      c.status === "filled" || (c.name && String(c.name).trim().length > 0)
    );
  }

  function renderChampions(site, participants) {
    const ask = site.championAsk;
    document.getElementById("champions-title").textContent = ask.headline;
    document.getElementById("champions-body").textContent = ask.body;
    document.getElementById("champions-when").textContent = ask.when;

    const byTribe = championByTribe(participants);

    const list = document.getElementById("tribe-list");
    const mt = site.mailto;
    const tribeCards = site.tribes.map((tribe, i) => {
      const c = byTribe[tribe.id];
      const filled = isChampionFilled(c);
      const subject = fillTemplate(mt.championSubject, {
        tribe: `${tribe.id} · ${tribe.name}`,
        tribeId: tribe.id,
        tribeName: tribe.name,
      });
      const body = fillTemplate(mt.championBody, {
        tribeId: tribe.id,
        tribeName: tribe.name,
      });
      const href = mailto(subject, body);
      const confirmed = filled
        ? `<p class="tribe-confirmed">Champion: ${[c.name, c.org]
            .filter(Boolean)
            .join(" · ")}</p>`
        : "";
      const ctaLabel = filled
        ? `Volunteer as second · Tribe ${tribe.id}`
        : `Volunteer for Tribe ${tribe.id}`;
      return `
          <li class="tribe-item" style="animation-delay: ${0.05 * i}s">
            <span class="tribe-id">Tribe ${tribe.id}${tribe.block === "vehicle" ? " · vehicle block" : ""}</span>
            <h3 class="tribe-name">${tribe.name}</h3>
            <p class="tribe-peers">${tribe.peers}</p>
            <p class="tribe-profile"><span class="tribe-looking">Looking for:</span> ${tribe.championProfile}</p>
            ${confirmed}
            <a class="btn btn-tribe" href="${href}">${ctaLabel}</a>
          </li>`;
    });

    const ctaCard = ask.ctaCard;
    if (ctaCard) {
      const href = mailto(
        mt.championGeneralSubject || mt.championSubject,
        mt.championGeneralBody || mt.championBody
      );
      const i = tribeCards.length;
      tribeCards.push(`
          <li class="tribe-item tribe-item-cta" style="animation-delay: ${0.05 * i}s">
            <span class="tribe-id">${ctaCard.kicker || "Open seat"}</span>
            <h3 class="tribe-name">${ctaCard.title}</h3>
            ${ctaCard.body ? `<p class="tribe-peers">${ctaCard.body}</p>` : ""}
            <a class="btn btn-tribe" href="${href}">${ctaCard.button || "Email to volunteer"}</a>
          </li>`);
    }

    list.innerHTML = tribeCards.join("");
  }

  function renderWishlist(site) {
    const wl = site.wishlist;
    if (!wl) return;
    document.getElementById("wishlist-title").textContent = wl.headline;
    document.getElementById("wishlist-body").textContent = wl.body;

    const list = document.getElementById("wishlist-list");
    const mt = site.mailto;
    const items = wl.items || [];
    if (!items.length) {
      list.innerHTML =
        '<li class="roster-empty">No open wishlist items yet.</li>';
      return;
    }

    list.innerHTML = items
      .map((item, i) => {
        const status = (item.status || "open").toLowerCase();
        const slotsTotal =
          typeof item.slots === "number" ? item.slots : null;
        const slotsFilled =
          typeof item.slotsFilled === "number" ? item.slotsFilled : 0;
        const slotsOpen =
          slotsTotal != null ? Math.max(0, slotsTotal - slotsFilled) : null;
        const fullyFunded =
          status === "fulfilled" ||
          (slotsOpen != null && slotsOpen === 0);
        const amount =
          typeof item.amount === "number"
            ? `$${item.amount.toLocaleString("en-US")}`
            : item.amount
              ? String(item.amount)
              : "";
        const slotsLabel =
          slotsTotal != null
            ? slotsTotal === 1
              ? "1 slot"
              : `${slotsTotal} slots`
            : "";
        const kickerParts = [amount, slotsLabel].filter(Boolean);
        const subject = fillTemplate(mt.wishlistSubject, { need: item.need });
        const body = fillTemplate(mt.wishlistBody, {
          need: item.need,
          amount: amount || "see packet",
        });
        const href = mailto(subject, body);
        const cta = fullyFunded
          ? `<span class="btn btn-tribe is-filled">Fully funded</span>`
          : `<a class="btn btn-tribe" href="${href}">Sponsor this gift</a>`;
        return `
          <li class="wishlist-item" style="animation-delay: ${0.05 * i}s">
            ${kickerParts.length ? `<span class="wishlist-kicker">${kickerParts.join(" · ")}</span>` : ""}
            <h3 class="wishlist-need">${item.need}</h3>
            ${item.detail ? `<p class="wishlist-detail">${item.detail}</p>` : ""}
            ${cta}
          </li>`;
      })
      .join("");
  }

  function renderTransit(site) {
    const t = site.transit;
    if (!t) return;
    document.getElementById("transit-title").textContent = t.headline;
    document.getElementById("transit-intro").textContent = t.intro;
    document.getElementById("transit-path-title").textContent = t.pathTitle;
    document.getElementById("transit-agency").textContent = t.agencyNote;

    const stagingTitle = document.getElementById("transit-staging-title");
    const stagingEl = document.getElementById("transit-staging");
    if (t.staging && t.staging.length) {
      stagingTitle.textContent = t.stagingTitle || "Staging";
      stagingTitle.hidden = false;
      stagingEl.hidden = false;
      stagingEl.innerHTML = t.staging
        .map(
          ([dt, dd]) =>
            `<div><dt>${dt}</dt><dd>${dd}</dd></div>`
        )
        .join("");
    } else {
      stagingTitle.hidden = true;
      stagingEl.hidden = true;
      stagingEl.innerHTML = "";
    }

    document.getElementById("transit-steps").innerHTML = (t.steps || [])
      .map((step) => `<li>${step}</li>`)
      .join("");

    const parkingTitle = document.getElementById("transit-parking-title");
    const parkingLead = document.getElementById("transit-parking-lead");
    const parkingEl = document.getElementById("transit-parking");
    const parkingRates = document.getElementById("transit-parking-rates");
    if (t.parking && t.parking.length) {
      parkingTitle.textContent = t.parkingTitle || "Parking";
      parkingTitle.hidden = false;
      parkingLead.textContent = t.parkingLead || "";
      parkingLead.hidden = !t.parkingLead;
      parkingEl.hidden = false;
      parkingEl.innerHTML = t.parking
        .map((row) => {
          const [dt, place, rates] = row;
          const dd = rates
            ? `${place}<span class="parking-meta">${rates}</span>`
            : place;
          return `<div><dt>${dt}</dt><dd>${dd}</dd></div>`;
        })
        .join("");
      parkingRates.textContent = t.parkingRates || "";
      parkingRates.hidden = !t.parkingRates;
    } else {
      parkingTitle.hidden = true;
      parkingLead.hidden = true;
      parkingEl.hidden = true;
      parkingRates.hidden = true;
    }

    const map = t.map;
    const mapEl = document.getElementById("transit-map");
    if (map && map.embedUrl) {
      mapEl.hidden = false;
      document.getElementById("transit-map-iframe").src = map.embedUrl;
      document.getElementById("transit-map-title").textContent =
        map.title || "Route map";
      const open = document.getElementById("transit-map-open");
      open.href = map.openUrl || map.embedUrl;
    } else {
      mapEl.hidden = true;
    }

    document.getElementById("transit-notes").innerHTML = (t.notes || [])
      .map((note) => `<li>${note}</li>`)
      .join("");

    document.getElementById("transit-links").innerHTML = (t.links || [])
      .map((link, i) => {
        const sep = i > 0 ? ' <span aria-hidden="true"> · </span> ' : "";
        return `${sep}<a href="${link.url}" rel="noopener noreferrer">${link.label}</a>`;
      })
      .join("");
  }

  function renderMarchMailto(site) {
    const mt = site.mailto;
    const a = document.getElementById("march-mailto");
    a.href = mailto(mt.marchSubject, mt.marchBody);
  }

  function renderRoster(site, participants) {
    const tribes = site.tribes;
    const interested = participants.marchers.filter(
      (m) => m.status === "interested"
    );
    const confirmed = participants.marchers.filter(
      (m) => m.status === "confirmed"
    );

    function renderList(el, items) {
      if (!items.length) {
        el.innerHTML =
          '<li class="roster-empty">Gathering interest — be the first.</li>';
        return;
      }
      el.innerHTML = items
        .map((m, i) => {
          const meta = [
            m.tribe ? tribeLabel(tribes, m.tribe) : null,
            m.note || null,
          ]
            .filter(Boolean)
            .join(" · ");
          return `
            <li style="animation-delay: ${0.06 * i}s">
              <span class="roster-org">${m.org}</span>
              ${meta ? `<span class="roster-meta">${meta}</span>` : ""}
            </li>`;
        })
        .join("");
    }

    renderList(document.getElementById("roster-interested"), interested);
    renderList(document.getElementById("roster-confirmed"), confirmed);
  }

  function observeReveal(selector) {
    const nodes = document.querySelectorAll(selector);
    if (!nodes.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach((n) => n.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    nodes.forEach((n) => io.observe(n));
  }

  function initNav() {
    const header = document.querySelector(".site-header");
    const toggle = document.getElementById("nav-toggle");
    const nav = document.getElementById("site-nav");
    if (!header || !toggle || !nav) return;

    function setOpen(open) {
      header.classList.toggle("is-nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    toggle.addEventListener("click", () => {
      setOpen(!header.classList.contains("is-nav-open"));
    });

    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    return { setOpen, header, toggle };
  }

  function initPastHero(navApi) {
    const hero = document.querySelector(".hero");
    if (!hero) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        const past = !entry.isIntersecting;
        document.body.classList.toggle("is-past-hero", past);
        if (!past && navApi) navApi.setOpen(false);
      },
      { threshold: 0, rootMargin: "0px" }
    );
    io.observe(hero);
  }

  function initDocScroll() {
    if (!window.DocScroll?.init) return;
    window.DocScroll.init({
      tocLinkSelector: ".toc [data-toc-target]",
      sectionSelector: "[data-doc-section]",
      mainSelector: ".doc-main",
      headingSelector: ".doc-main .no-heading-anchors",
      getScrollSpyOffsetPx() {
        const pastHero = document.body.classList.contains("is-past-hero");
        const narrow = window.matchMedia("(max-width: 1099px)").matches;
        const header = document.querySelector(".site-header");
        const navHeight =
          pastHero && narrow && header
            ? header.getBoundingClientRect().height || 52
            : 0;
        const rem =
          parseFloat(getComputedStyle(document.documentElement).fontSize) ||
          16;
        return navHeight + rem;
      },
    });
  }

  async function init() {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    document.querySelector(".hero")?.classList.add("is-ready");
    const navApi = initNav();
    initPastHero(navApi);

    // Hash scroll must wait until dynamic sections (transit, champions, wishlist)
    // have real height — otherwise #champions lands on a short page and transit
    // growth pushes the target out of view (looks like #transit).
    try {
      const [site, participants] = await Promise.all([
        loadJson("data/site.json"),
        loadJson("data/participants.json"),
      ]);
      renderEvent(site);
      renderWishlist(site);
      renderTransit(site);
      renderChampions(site, participants);
      renderMarchMailto(site);
      renderRoster(site, participants);
      observeReveal(".tribe-item, .roster-list li, .wishlist-item");
    } catch (err) {
      console.error(err);
      document.getElementById("gh-pitch-body").textContent =
        "Could not load site data. Please refresh, or email krewe@cpalss.com.";
    }

    initDocScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
