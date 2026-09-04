(() => {
  const EMAIL = "krewe@cpalss.com";
  const HOME_HASH_REDIRECTS = {
    wishlist: "/fund/",
    "golden-harvest": "/golden-harvest/",
    history: "/history/",
    media: "/history/",
    faq: "/golden-harvest/#faq",
    timeline: "/golden-harvest/#timeline",
    waivers: "/golden-harvest/#timeline",
    march: "/golden-harvest/#timeline",
    registration: "/golden-harvest/#timeline",
    transit: "/golden-harvest/#transit",
    champions: "/golden-harvest/#champions",
    joining: "/golden-harvest/#champions",
  };

  function pageName() {
    return document.body?.dataset.page || "";
  }

  function redirectLegacyHashes() {
    const page = pageName();
    const raw = location.hash.slice(1);
    if (!raw) return;
    const id = decodeURIComponent(raw);
    if (page === "home") {
      const dest = HOME_HASH_REDIRECTS[id];
      if (dest) location.replace(dest);
      return;
    }
    if (page === "officers" && id === "joining") {
      location.replace("#champions");
    }
  }

  redirectLegacyHashes();
  window.addEventListener("hashchange", redirectLegacyHashes);

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

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function loadJson(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    return res.json();
  }

  function renderHome(site) {
    const tagline = document.getElementById("hero-tagline");
    const def = document.getElementById("hero-def");
    if (tagline) tagline.textContent = site.tagline || "";
    if (def) def.textContent = site.definition || "";

    const story = site.story;
    if (story?.krewe) {
      const t = document.getElementById("krewe-title");
      const b = document.getElementById("krewe-body");
      if (t) t.textContent = story.krewe.headline;
      if (b) b.textContent = story.krewe.body;
    }

    const chaptersEl = document.getElementById("story-chapters");
    if (chaptersEl && story?.chapters?.length) {
      chaptersEl.innerHTML = story.chapters
        .map((ch, i) => {
          const media = renderStoryMedia(ch);
          const cta = (() => {
            if (!ch.href || !ch.cta) return "";
            const external =
              ch.external === true || /^https?:\/\//i.test(ch.href);
            const cls = external ? "btn btn-ghost" : "btn btn-primary";
            const extra = external
              ? ' rel="noopener noreferrer" target="_blank"'
              : "";
            return `<p><a class="${cls}" href="${escapeHtml(ch.href)}"${extra}>${escapeHtml(ch.cta)}</a></p>`;
          })();
          return `
            <article class="story-chapter ${i % 2 ? "" : "is-flip"}">
              ${media}
              <div class="story-copy">
                ${ch.kicker ? `<p class="story-kicker">${escapeHtml(ch.kicker)}</p>` : ""}
                <h3>${escapeHtml(ch.headline)}</h3>
                <p>${escapeHtml(ch.body)}</p>
                ${cta}
              </div>
            </article>`;
        })
        .join("");
    }

    initCarousel(site.hero?.slides || []);
  }

  function youtubeId(value) {
    if (!value) return "";
    const s = String(value);
    const m = s.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
    if (m) return m[1];
    return /^[\w-]{11}$/.test(s) ? s : "";
  }

  function renderLinks(entry) {
    const links = entry?.links;
    if (!links?.length) return "";
    const sep = entry.linksSep ?? ' <span aria-hidden="true"> · </span> ';
    const lead = entry.linksLead ? `${escapeHtml(entry.linksLead)} ` : "";
    return `<p class="event-links">${lead}${links
      .map((link, i) => {
        const extra = /^https?:\/\//i.test(link.href)
          ? ' rel="noopener noreferrer" target="_blank"'
          : "";
        return `${i > 0 ? sep : ""}<a href="${escapeHtml(link.href)}"${extra}>${escapeHtml(link.label)}</a>`;
      })
      .join("")}</p>`;
  }

  function historyPhotoItems(entry) {
    if (Array.isArray(entry.images) && entry.images.length) {
      return entry.images
        .map((item) => {
          if (typeof item === "string") {
            return { src: item, alt: entry.imageAlt || "", title: "" };
          }
          const src = item.src || item.image;
          if (!src) return null;
          return {
            src,
            alt: item.alt || entry.imageAlt || "",
            title: item.title || item.caption || "",
          };
        })
        .filter(Boolean);
    }
    if (entry.image) {
      return [{ src: entry.image, alt: entry.imageAlt || "", title: "" }];
    }
    return [];
  }

  function renderHistoryPhotoCarousel(items, groupTitle) {
    const carouselId = `history-carousel-${++historyCarouselSeq}`;
    const slides = items
      .map((item, index) => {
        const title = item.title || item.alt || "";
        return `
        <div class="video-carousel-slide${index === 0 ? " is-active" : ""}" data-slide="${index}" data-slide-title="${escapeHtml(title)}" ${index === 0 ? "" : "hidden"}>
          <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt || "")}" loading="lazy" />
        </div>`;
      })
      .join("");
    const dots = items
      .map(
        (_, index) =>
          `<button type="button" class="video-carousel-dot${index === 0 ? " is-active" : ""}" data-slide-to="${index}" aria-label="Show photo ${index + 1} of ${items.length}" aria-selected="${index === 0 ? "true" : "false"}"></button>`,
      )
      .join("");
    const firstTitle = items[0].title || items[0].alt || "";
    const caption = firstTitle
      ? `<span class="video-carousel-count" data-carousel-count>1 / ${items.length}</span>&nbsp;<span data-carousel-title>${escapeHtml(firstTitle)}</span>`
      : `<span class="video-carousel-count" data-carousel-count>1 / ${items.length}</span><span data-carousel-title hidden></span>`;
    return `
      <figure class="video-card video-card--carousel history-photo-carousel" data-video-carousel id="${escapeHtml(carouselId)}" tabindex="0">
        <div class="video-carousel">
          <div class="video-carousel-viewport">
            ${slides}
          </div>
          <div class="video-carousel-chrome">
            <button type="button" class="video-carousel-nav video-carousel-prev" aria-label="Previous photo" aria-controls="${escapeHtml(carouselId)}">
              ${historyCarouselChevron("prev")}
            </button>
            <div class="video-carousel-dots" role="tablist" aria-label="${escapeHtml(groupTitle)}">${dots}</div>
            <button type="button" class="video-carousel-nav video-carousel-next" aria-label="Next photo" aria-controls="${escapeHtml(carouselId)}">
              ${historyCarouselChevron("next")}
            </button>
          </div>
        </div>
        <figcaption class="video-caption">${caption}</figcaption>
      </figure>`;
  }

  function renderHistoryPhoto(entry) {
    const items = historyPhotoItems(entry);
    if (!items.length) return "";
    if (items.length === 1) {
      return `<figure class="history-photo"><img src="${escapeHtml(items[0].src)}" alt="${escapeHtml(items[0].alt || "")}" loading="lazy" /></figure>`;
    }
    return renderHistoryPhotoCarousel(items, entry.headline || "Parade photos");
  }

  function historyYoutubeItems(entry) {
    if (Array.isArray(entry.youtube)) {
      return entry.youtube
        .map((item) => {
          if (typeof item === "string") {
            const id = youtubeId(item);
            return id ? { id, title: entry.youtubeTitle || entry.headline || "YouTube" } : null;
          }
          const id = youtubeId(item.id || item.youtubeId);
          if (!id) return null;
          return { id, title: item.title || entry.youtubeTitle || entry.headline || "YouTube" };
        })
        .filter(Boolean);
    }
    const id = youtubeId(entry.youtube);
    return id ? [{ id, title: entry.youtubeTitle || entry.headline || "YouTube" }] : [];
  }

  function renderYoutubeFrame(id, title) {
    return `<div class="yt-wrap"><iframe src="https://www.youtube-nocookie.com/embed/${escapeHtml(id)}" title="${escapeHtml(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div>`;
  }

  function renderStoryMedia(ch) {
    const id = youtubeId(ch.youtube);
    if (id) {
      const title = ch.youtubeTitle || ch.headline || "YouTube";
      return `<figure class="story-figure story-figure--video">${renderYoutubeFrame(id, title)}</figure>`;
    }
    if (ch.image) {
      return `<figure class="story-figure"><img src="${escapeHtml(ch.image)}" alt="${escapeHtml(ch.imageAlt || "")}" loading="lazy" /></figure>`;
    }
    return "";
  }

  function historyCarouselChevron(dir) {
    const d = dir === "prev" ? "M10.5 4 L6.5 8 L10.5 12" : "M5.5 4 L9.5 8 L5.5 12";
    return `<svg class="video-carousel-chevron" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  let historyCarouselSeq = 0;

  function renderHistoryCarousel(items, groupTitle) {
    const carouselId = `history-carousel-${++historyCarouselSeq}`;
    const slides = items
      .map((item, index) => {
        return `
        <div class="video-carousel-slide${index === 0 ? " is-active" : ""}" data-slide="${index}" data-slide-title="${escapeHtml(item.title)}" ${index === 0 ? "" : "hidden"}>
          ${renderYoutubeFrame(item.id, item.title)}
        </div>`;
      })
      .join("");
    const dots = items
      .map(
        (item, index) =>
          `<button type="button" class="video-carousel-dot${index === 0 ? " is-active" : ""}" data-slide-to="${index}" aria-label="Show video ${index + 1} of ${items.length}" aria-selected="${index === 0 ? "true" : "false"}"></button>`,
      )
      .join("");
    return `
      <figure class="video-card video-card--carousel" data-video-carousel id="${escapeHtml(carouselId)}" tabindex="0">
        <div class="video-carousel">
          <div class="video-carousel-viewport">
            ${slides}
          </div>
          <div class="video-carousel-chrome">
            <button type="button" class="video-carousel-nav video-carousel-prev" aria-label="Previous video" aria-controls="${escapeHtml(carouselId)}">
              ${historyCarouselChevron("prev")}
            </button>
            <div class="video-carousel-dots" role="tablist" aria-label="${escapeHtml(groupTitle)}">${dots}</div>
            <button type="button" class="video-carousel-nav video-carousel-next" aria-label="Next video" aria-controls="${escapeHtml(carouselId)}">
              ${historyCarouselChevron("next")}
            </button>
          </div>
        </div>
        <figcaption class="video-caption"><span class="video-carousel-count" data-carousel-count>1 / ${items.length}</span>&nbsp;<span data-carousel-title>${escapeHtml(items[0].title)}</span></figcaption>
      </figure>`;
  }

  function renderHistoryVideo(entry) {
    const items = historyYoutubeItems(entry);
    if (!items.length) return "";
    if (items.length === 1) return renderYoutubeFrame(items[0].id, items[0].title);
    return renderHistoryCarousel(items, entry.youtubeTitle || entry.headline || "Parade videos");
  }

  function initHistoryCarousels(root = document) {
    root.querySelectorAll("[data-video-carousel]").forEach((card) => {
      if (card.dataset.carouselBound === "1") return;
      card.dataset.carouselBound = "1";
      const slides = [...card.querySelectorAll(".video-carousel-slide")];
      const dots = [...card.querySelectorAll(".video-carousel-dot")];
      const titleEl = card.querySelector("[data-carousel-title]");
      const countEl = card.querySelector("[data-carousel-count]");
      if (slides.length < 2) return;
      let index = 0;

      function setSlide(nextIndex) {
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach((slide, i) => {
          const active = i === index;
          slide.classList.toggle("is-active", active);
          slide.hidden = !active;
          const iframe = slide.querySelector("iframe");
          if (iframe) {
            const src = iframe.getAttribute("src") || iframe.dataset.src || "";
            if (src) iframe.dataset.src = src;
            if (!active && iframe.getAttribute("src")) iframe.removeAttribute("src");
            if (active && !iframe.getAttribute("src") && iframe.dataset.src) {
              iframe.setAttribute("src", iframe.dataset.src);
            }
          }
        });
        dots.forEach((dot, i) => {
          const active = i === index;
          dot.classList.toggle("is-active", active);
          dot.setAttribute("aria-selected", active ? "true" : "false");
        });
        const title = slides[index].getAttribute("data-slide-title") || "";
        if (titleEl) {
          titleEl.textContent = title;
          titleEl.hidden = !title;
        }
        if (countEl) countEl.textContent = `${index + 1} / ${slides.length}`;
      }

      card.querySelector(".video-carousel-prev")?.addEventListener("click", () => setSlide(index - 1));
      card.querySelector(".video-carousel-next")?.addEventListener("click", () => setSlide(index + 1));
      dots.forEach((dot) => {
        dot.addEventListener("click", () => {
          const to = Number(dot.getAttribute("data-slide-to"));
          if (!Number.isNaN(to)) setSlide(to);
        });
      });
      card.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          setSlide(index - 1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          setSlide(index + 1);
        }
      });
    });
  }

  function renderHistoryEntry(entry) {
    const photo = renderHistoryPhoto(entry);
    const video = renderHistoryVideo(entry);
    const copy = `<div class="history-year-copy">
        <p class="story-kicker">${escapeHtml(entry.kicker || entry.year || "")}</p>
        <h3>${escapeHtml(entry.headline)}</h3>
        <p>${escapeHtml(entry.body)}</p>
        ${renderLinks(entry)}
      </div>`;
    /* EGLNY-style: copy | single media. Photo + video → copy | photo, video next row. */
    if (photo && video) {
      return `
      <article class="history-card">
        <div class="history-year-grid">
          ${copy}
          ${photo}
        </div>
        <div class="history-media-row">${video}</div>
      </article>`;
    }
    if (photo || video) {
      return `
      <article class="history-card">
        <div class="history-year-grid">
          ${copy}
          ${photo || video}
        </div>
      </article>`;
    }
    return `
      <article class="history-card">
        ${copy}
      </article>`;
  }

  function renderHistory(history) {
    const kicker = document.getElementById("history-kicker");
    const headline = document.getElementById("history-headline");
    const lead = document.getElementById("history-lead");
    const vi = document.getElementById("history-vi");
    const note = document.getElementById("history-note");
    if (kicker) kicker.textContent = history.kicker || "";
    if (headline) headline.textContent = history.headline || "Parade history";
    if (lead) lead.textContent = history.lead || "";
    if (vi) {
      vi.textContent = history.viLead || "";
      vi.hidden = !history.viLead;
    }
    if (note) {
      note.textContent = history.note || "";
      note.hidden = !history.note;
    }

    const bucketsEl = document.getElementById("history-buckets");
    if (bucketsEl && history.buckets?.length) {
      bucketsEl.innerHTML = history.buckets
        .map(
          (b) => `
        <article class="history-bucket">
          <p class="story-kicker">${escapeHtml(b.label)}</p>
          ${b.vi ? `<p class="history-vi-label" lang="vi">${escapeHtml(b.vi)}</p>` : ""}
          <p>${escapeHtml(b.blurb)}</p>
        </article>`
        )
        .join("");
    }

    const hostEl = document.getElementById("history-host");
    const marchEl = document.getElementById("history-march");
    const entries = history.entries || [];
    if (hostEl) {
      hostEl.innerHTML = entries
        .filter((e) => e.bucket === "host")
        .map(renderHistoryEntry)
        .join("");
    }
    if (marchEl) {
      marchEl.innerHTML = entries
        .filter((e) => e.bucket === "march")
        .map(renderHistoryEntry)
        .join("");
    }
  }

  function initCarousel(slides) {
    const root = document.getElementById("hero-slides");
    const controls = document.getElementById("hero-controls");
    const dotsEl = document.getElementById("hero-dots");
    const prev = document.getElementById("hero-prev");
    const next = document.getElementById("hero-next");
    if (!root || !slides.length) return;

    root.innerHTML = slides
      .map(
        (s, i) => `
      <div class="hero-slide${i === 0 ? " is-active" : ""}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${slides.length}">
        <img src="${escapeHtml(s.src)}" alt="${escapeHtml(s.alt || "")}" ${i === 0 ? "" : 'loading="lazy"'} />
      </div>`
      )
      .join("");

    if (slides.length < 2 || !controls || !dotsEl) return;

    controls.hidden = false;
    dotsEl.innerHTML = slides
      .map(
        (_, i) =>
          `<button type="button" class="hero-dot${i === 0 ? " is-active" : ""}" aria-label="Show photo ${i + 1}" data-slide="${i}"></button>`
      )
      .join("");

    let index = 0;
    let timer = null;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hero = document.querySelector(".hero-carousel");

    function go(to) {
      const slidesEls = root.querySelectorAll(".hero-slide");
      const dots = dotsEl.querySelectorAll(".hero-dot");
      index = (to + slides.length) % slides.length;
      slidesEls.forEach((el, i) => el.classList.toggle("is-active", i === index));
      dots.forEach((el, i) => el.classList.toggle("is-active", i === index));
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function start() {
      if (reduce) return;
      stop();
      timer = setInterval(() => go(index + 1), 6000);
    }

    prev?.addEventListener("click", () => {
      go(index - 1);
      start();
    });
    next?.addEventListener("click", () => {
      go(index + 1);
      start();
    });
    dotsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-slide]");
      if (!btn) return;
      go(Number(btn.dataset.slide));
      start();
    });

    hero?.addEventListener("mouseenter", stop);
    hero?.addEventListener("mouseleave", start);
    hero?.addEventListener("focusin", stop);
    hero?.addEventListener("focusout", (e) => {
      if (!hero.contains(e.relatedTarget)) start();
    });

    hero?.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(index - 1);
        start();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(index + 1);
        start();
      }
    });

    start();
  }

  function renderEvent(site) {
    const e = site.event;
    const pitch = site.officerPitch || site.pitch;
    const headline = document.getElementById("gh-pitch-headline");
    const body = document.getElementById("gh-pitch-body");
    if (headline) headline.textContent = pitch?.headline || "";
    if (body) body.textContent = pitch?.body || "";

    const kicker = document.getElementById("page-kicker");
    if (kicker && e) {
      kicker.textContent = `${e.dateDisplay} · ${e.venue}`;
    }

    const facts = document.getElementById("event-facts");
    if (!facts || !e) return;
    const rows = [
      ["Event", `${e.edition} ${e.name}`],
      ["When", `${e.dateDisplay} · ${e.timeNote}`],
      ["Where", e.venue],
      ["Theme", e.theme],
    ];
    facts.innerHTML = rows
      .map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`)
      .join("");

    const url = document.getElementById("gh-url");
    if (url) url.href = e.url;
    const reg = document.getElementById("gh-reg");
    if (reg && e.registrationUrl) reg.href = e.registrationUrl;
  }

  function renderPortal(site) {
    const p = site.portal;
    if (!p) return;
    const title = document.getElementById("waivers-title");
    const body = document.getElementById("waivers-body");
    const cutoff = document.getElementById("waivers-cutoff");
    const link = document.getElementById("portal-link");
    if (title) title.textContent = p.headline;
    if (body) body.textContent = p.body;
    if (cutoff) cutoff.textContent = p.cutoff || "";
    if (link) {
      link.href = site.portalUrl || "https://portal.cpalss.com";
      if (p.button) link.textContent = p.button;
    }
  }

  function championsByTribe(participants) {
    const max =
      Number(participants?.maxChampionsPerTribe) > 0
        ? Number(participants.maxChampionsPerTribe)
        : 3;
    const map = {};
    for (const c of participants?.champions || []) {
      if (!c?.tribe) continue;
      if (!map[c.tribe]) map[c.tribe] = [];
      if (isChampionFilled(c) && map[c.tribe].length < max) {
        map[c.tribe].push(c);
      }
    }
    return { map, max };
  }

  function isChampionFilled(c) {
    if (!c) return false;
    return (
      c.status === "filled" || (c.name && String(c.name).trim().length > 0)
    );
  }

  function formatChampionLine(c) {
    return [c.name, c.role, c.org].filter(Boolean).join(" · ");
  }

  function championCtaLabel(tribeId, filledCount, max) {
    if (filledCount >= max) return null;
    return `Volunteer to host Tribe ${tribeId}`;
  }

  function renderChampions(site, participants) {
    const ask = site.championAsk;
    const title = document.getElementById("champions-title");
    if (!title || !ask) return;
    title.textContent = ask.headline;
    document.getElementById("champions-body").textContent = ask.body;
    document.getElementById("champions-when").textContent = ask.when;

    const { map: byTribe, max } = championsByTribe(participants);

    const list = document.getElementById("tribe-list");
    const mt = site.mailto;
    const tribeCards = site.tribes.map((tribe, i) => {
      const champs = byTribe[tribe.id] || [];
      const filledCount = champs.length;
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
      const confirmed =
        filledCount > 0
          ? `<div class="tribe-hosts">
            <p class="tribe-hosts-label">Champions</p>
            <ul class="tribe-champions">${champs
              .map(
                (c) =>
                  `<li class="tribe-confirmed">${escapeHtml(formatChampionLine(c))}</li>`
              )
              .join("")}</ul>
          </div>`
          : "";
      const filled = filledCount >= max;
      const ctaLabel = championCtaLabel(tribe.id, filledCount, max);
      const lookingFor =
        !filled && tribe.championProfile
          ? `<div class="tribe-open">
            <p class="tribe-profile"><span class="tribe-looking">Looking for champion:</span> ${escapeHtml(tribe.championProfile)}</p>
            ${
              ctaLabel
                ? `<a class="btn btn-tribe-sm" href="${href}" aria-label="${escapeHtml(ctaLabel)}">Volunteer</a>`
                : ""
            }
          </div>`
          : "";
      const joiners = renderTribeJoiners(groupsByTribe(site.joining?.groups, tribe.id));
      return `
          <li class="tribe-item" style="animation-delay: ${0.05 * i}s">
            <span class="tribe-id">Tribe ${escapeHtml(tribe.id)}${tribe.block === "vehicle" ? " · vehicle block" : ""}</span>
            <h3 class="tribe-name">${escapeHtml(tribe.name)}</h3>
            <p class="tribe-peers">${escapeHtml(tribe.peers)}</p>
            ${confirmed}
            ${lookingFor}
            ${joiners}
          </li>`;
    });

    list.innerHTML = tribeCards.join("");
  }

  function renderWishlist(site) {
    const wl = site.wishlist;
    if (!wl) return;
    const title = document.getElementById("wishlist-title");
    const body = document.getElementById("wishlist-body");
    if (title) title.textContent = wl.headline;
    if (body) body.textContent = wl.body;

    const pdf = document.getElementById("packet-pdf");
    if (pdf && site.packetPdfUrl) pdf.href = site.packetPdfUrl;

    const payee = document.getElementById("fund-payee");
    if (payee) {
      const rows = [
        ["Payable to", wl.payee || "cPALSs"],
        ["Memo", wl.memo || "LSK 2026"],
        ["EIN", wl.ein || "47-1100695"],
      ];
      payee.innerHTML = rows
        .map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${escapeHtml(dd)}</dd></div>`)
        .join("");
    }

    const list = document.getElementById("wishlist-list");
    if (!list) return;
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
        const mailBody = fillTemplate(mt.wishlistBody, {
          need: item.need,
          amount: amount || "see packet",
        });
        const href = mailto(subject, mailBody);
        const cta = fullyFunded
          ? `<span class="btn btn-tribe is-filled">Fully funded</span>`
          : `<a class="btn btn-tribe" href="${href}">Sponsor this gift</a>`;
        return `
          <li class="wishlist-item" style="animation-delay: ${0.05 * i}s">
            ${kickerParts.length ? `<span class="wishlist-kicker">${escapeHtml(kickerParts.join(" · "))}</span>` : ""}
            <h3 class="wishlist-need">${escapeHtml(item.need)}</h3>
            ${item.detail ? `<p class="wishlist-detail">${escapeHtml(item.detail)}</p>` : ""}
            ${cta}
          </li>`;
      })
      .join("");
  }

  function renderTransit(site) {
    const t = site.transit;
    if (!t) return;
    const title = document.getElementById("transit-title");
    if (!title) return;
    title.textContent = t.headline;
    document.getElementById("transit-intro").textContent = t.intro;
    document.getElementById("transit-path-title").textContent = t.pathTitle;
    const agency = document.getElementById("transit-agency");
    if (agency) {
      agency.textContent = t.agencyNote || "";
      agency.hidden = !t.agencyNote;
    }

    const stagingTitle = document.getElementById("transit-staging-title");
    const stagingEl = document.getElementById("transit-staging");
    if (t.staging && t.staging.length) {
      stagingTitle.textContent = t.stagingTitle || "Staging";
      stagingTitle.hidden = false;
      stagingEl.hidden = false;
      stagingEl.innerHTML = t.staging
        .map(
          ([dt, dd]) =>
            `<div><dt>${escapeHtml(dt)}</dt><dd>${escapeHtml(dd)}</dd></div>`
        )
        .join("");
    } else {
      stagingTitle.hidden = true;
      stagingEl.hidden = true;
      stagingEl.innerHTML = "";
    }

    document.getElementById("transit-steps").innerHTML = (t.steps || [])
      .map((step) => `<li>${escapeHtml(step)}</li>`)
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
            ? `${escapeHtml(place)}<span class="parking-meta">${escapeHtml(rates)}</span>`
            : escapeHtml(place);
          return `<div><dt>${escapeHtml(dt)}</dt><dd>${dd}</dd></div>`;
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
      .map((note) => `<li>${escapeHtml(note)}</li>`)
      .join("");

    document.getElementById("transit-links").innerHTML = (t.links || [])
      .map((link, i) => {
        const sep = i > 0 ? ' <span aria-hidden="true"> · </span> ' : "";
        return `${sep}<a href="${escapeHtml(link.url)}" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`;
      })
      .join("");
  }

  function renderTimeline(site) {
    const tl = site.timeline;
    if (!tl) return;
    const title = document.getElementById("timeline-title");
    const intro = document.getElementById("timeline-intro");
    const list = document.getElementById("timeline-list");
    if (!title || !intro || !list) return;
    title.textContent = tl.headline;
    intro.textContent = tl.intro;
    const mt = site.mailto || {};
    list.innerHTML = (tl.steps || [])
      .map((step, i) => {
        let href = step.ctaHref || "";
        if (step.ctaMailto) {
          const key = String(step.ctaMailto);
          const subject = mt[`${key}Subject`] || mt.interestSubject || mt.marchSubject;
          const body = mt[`${key}Body`] || mt.interestBody || mt.marchBody;
          if (subject) href = mailto(subject, body || "");
        }
        const btnClass = step.ctaClass || (step.ctaMailto ? "btn btn-primary" : "btn btn-ghost");
        const extra = href.startsWith("mailto:")
          ? ""
          : ' rel="noopener noreferrer"';
        const cta =
          href && step.ctaLabel
            ? `<p class="timeline-cta"><a class="${escapeHtml(btnClass)}" href="${escapeHtml(href)}"${extra}>${escapeHtml(step.ctaLabel)}</a></p>`
            : "";
        const itinerary = Array.isArray(step.itinerary) && step.itinerary.length
          ? `<ol class="timeline-itinerary">${step.itinerary
              .map((row) => {
                const note = row.note
                  ? `<span class="timeline-itinerary-note">${escapeHtml(row.note)}</span>`
                  : "";
                return `<li><span class="timeline-itinerary-time">${escapeHtml(row.time)}</span><span class="timeline-itinerary-label">${escapeHtml(row.label)}</span>${note}</li>`;
              })
              .join("")}</ol>`
          : "";
        return `
      <li class="timeline-item" style="animation-delay: ${0.05 * i}s">
        <p class="timeline-when">${escapeHtml(step.when)}</p>
        <h3 class="timeline-step-title">${escapeHtml(step.title)}</h3>
        <p class="timeline-body">${escapeHtml(step.body)}</p>
        ${itinerary}
        ${cta}
      </li>`;
      })
      .join("");
  }

  function renderMarchMailto(site) {
    const mt = site.mailto;
    const a = document.getElementById("march-mailto");
    if (!a || !mt) return;
    a.href = mailto(mt.marchSubject, mt.marchBody);
  }

  function joinerStatus(group) {
    return String(group?.status || "interested").toLowerCase() === "confirmed"
      ? "confirmed"
      : "interested";
  }

  function joinerName(group) {
    return String(group?.name || group?.org || "").trim();
  }

  function sortJoiners(groups) {
    return [...groups].sort((a, b) => {
      const ac = joinerStatus(a) === "confirmed" ? 0 : 1;
      const bc = joinerStatus(b) === "confirmed" ? 0 : 1;
      if (ac !== bc) return ac - bc;
      return joinerName(a).localeCompare(joinerName(b), "en", {
        sensitivity: "base",
      });
    });
  }

  function tribeIdOf(group) {
    return String(group?.tribe || "").trim().toUpperCase();
  }

  function groupsByTribe(groups, tribeId) {
    const id = String(tribeId || "").toUpperCase();
    return sortJoiners(
      (groups || []).filter((g) => joinerName(g) && tribeIdOf(g) === id)
    );
  }

  function renderTribeJoiners(groups) {
    if (!groups.length) return "";
    return `<ul class="tribe-joiners">${groups
      .map((g) => {
        const status = joinerStatus(g);
        return `<li>
              <span class="roster-org">${escapeHtml(joinerName(g))}</span>
              <span class="roster-tag is-${status}">${status}</span>
            </li>`;
      })
      .join("")}</ul>`;
  }

  function renderJoiningNote(site) {
    const intro = document.getElementById("joining-intro");
    if (!intro) return;
    const text = site.joining?.intro || "";
    intro.textContent = text;
    intro.hidden = !text;
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
    if (!hero) {
      document.body.classList.add("is-past-hero");
      return;
    }

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
    if (!document.querySelector(".toc [data-toc-target]")) return;
    window.DocScroll.init({
      tocLinkSelector: ".toc [data-toc-target]",
      sectionSelector: "[data-doc-section]",
      mainSelector: ".doc-main",
      headingSelector: ".doc-main .no-heading-anchors",
      getScrollSpyOffsetPx() {
        const header = document.querySelector(".site-header");
        const headerH = header ? header.getBoundingClientRect().height || 52 : 0;
        const rem =
          parseFloat(getComputedStyle(document.documentElement).fontSize) ||
          16;
        const inner = document.body.classList.contains("page-inner");
        const pastHero = document.body.classList.contains("is-past-hero");
        const narrow = window.matchMedia("(max-width: 1099px)").matches;
        if (inner) return headerH + rem;
        return pastHero && narrow ? headerH + rem : rem;
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

    const page = pageName();

    try {
      if (page === "home") {
        const site = await loadJson("/data/site.json");
        renderHome(site);
        observeReveal(".story-chapter");
      } else if (page === "officers") {
        const [site, participants] = await Promise.all([
          loadJson("/data/site.json"),
          loadJson("/data/participants.json"),
        ]);
        renderEvent(site);
        renderTimeline(site);
        renderPortal(site);
        renderTransit(site);
        renderChampions(site, participants);
        renderJoiningNote(site);
        renderMarchMailto(site);
        observeReveal(".tribe-item, .tribe-joiners li, .timeline-item");
      } else if (page === "fund") {
        const site = await loadJson("/data/site.json");
        renderWishlist(site);
        observeReveal(".wishlist-item");
      } else if (page === "history") {
        const history = await loadJson("/data/history.json");
        renderHistory(history);
        initHistoryCarousels();
        observeReveal(".history-card, .history-bucket");
      }
    } catch (err) {
      console.error(err);
      const fallback =
        document.getElementById("gh-pitch-body") ||
        document.getElementById("hero-def") ||
        document.getElementById("wishlist-body") ||
        document.getElementById("history-lead");
      if (fallback) {
        fallback.textContent =
          "Could not load site data. Please refresh, or email krewe@cpalss.com.";
      }
    }

    initDocScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
