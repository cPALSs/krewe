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
    reg.href = e.registrationUrl;
  }

  function renderChampions(site) {
    const ask = site.championAsk;
    document.getElementById("champions-title").textContent = ask.headline;
    document.getElementById("champions-body").textContent = ask.body;
    document.getElementById("champions-when").textContent = ask.when;

    const list = document.getElementById("tribe-list");
    const mt = site.mailto;
    list.innerHTML = site.tribes
      .map((tribe, i) => {
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
        return `
          <li class="tribe-item" style="animation-delay: ${0.05 * i}s">
            <span class="tribe-id">Tribe ${tribe.id}</span>
            <h3 class="tribe-name">${tribe.name}</h3>
            <p class="tribe-peers">${tribe.peers}</p>
            <p class="tribe-profile">${tribe.championProfile}</p>
            <a class="btn btn-tribe" href="${href}">Champion Tribe ${tribe.id}</a>
          </li>`;
      })
      .join("");
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
        const open = status === "open";
        const statusLabel =
          status === "fulfilled"
            ? "Fulfilled"
            : status === "pledged"
              ? "Pledged"
              : "Open";
        const subject = fillTemplate(mt.wishlistSubject, { need: item.need });
        const body = fillTemplate(mt.wishlistBody, { need: item.need });
        const href = mailto(subject, body);
        const cta = open
          ? `<a class="btn btn-tribe" href="${href}">Pledge this need</a>`
          : `<span class="wishlist-status-badge">${statusLabel}</span>`;
        return `
          <li class="wishlist-item" style="animation-delay: ${0.05 * i}s">
            <span class="wishlist-kicker">${statusLabel}${item.for ? ` · ${item.for}` : ""}</span>
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

    document.getElementById("transit-steps").innerHTML = (t.steps || [])
      .map((step) => `<li>${step}</li>`)
      .join("");

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

    const slots = document.getElementById("champion-slots");
    const byTribe = Object.fromEntries(
      (participants.champions || []).map((c) => [c.tribe, c])
    );
    slots.innerHTML = site.tribes
      .map((tribe, i) => {
        const c = byTribe[tribe.id] || { status: "open" };
        const filled =
          c.status === "filled" || (c.name && c.name.trim().length > 0);
        const statusText = filled
          ? [c.name, c.org].filter(Boolean).join(" · ") || "Filled"
          : "Open";
        return `
          <li style="animation-delay: ${0.05 * i}s">
            <span class="slot-tribe">Tribe ${tribe.id} · ${tribe.name}</span>
            <span class="slot-status ${filled ? "is-filled" : "is-open"}">${statusText}</span>
          </li>`;
      })
      .join("");
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

  async function init() {
    document.querySelector(".hero")?.classList.add("is-ready");

    try {
      const [site, participants] = await Promise.all([
        loadJson("data/site.json"),
        loadJson("data/participants.json"),
      ]);
      renderEvent(site);
      renderWishlist(site);
      renderTransit(site);
      renderChampions(site);
      renderMarchMailto(site);
      renderRoster(site, participants);
      observeReveal(
        ".tribe-item, .roster-list li, .slot-list li, .wishlist-item"
      );
    } catch (err) {
      console.error(err);
      document.getElementById("gh-pitch-body").textContent =
        "Could not load site data. Please refresh, or email krewe@cpalss.com.";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
