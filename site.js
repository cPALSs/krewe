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

  const LANG_KEY = "lsk-lang";
  const dicts = { en: null, vi: null };
  let lang = "en";
  let I18N = {};
  let I18N_EN = {};
  let siteCache = null;
  let historyCache = null;
  let participantsCache = null;

  function getPath(obj, path) {
    return String(path)
      .split(".")
      .reduce((o, k) => (o != null && o[k] != null ? o[k] : undefined), obj);
  }

  function detectLang() {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "en" || saved === "vi") return saved;
    } catch (_) {}
    const list = [];
    if (navigator.language) list.push(navigator.language);
    if (Array.isArray(navigator.languages)) list.push(...navigator.languages);
    for (const item of list) {
      if (String(item || "").toLowerCase().startsWith("vi")) return "vi";
    }
    return "en";
  }

  function t(key, vars) {
    let val = getPath(I18N, key);
    if (val == null) val = getPath(I18N_EN, key);
    if (val == null) return key;
    if (typeof val === "string" && vars) return fillTemplate(val, vars);
    return val;
  }

  function applyChrome() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const v = t(el.dataset.i18n);
      if (typeof v === "string") el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const v = t(el.dataset.i18nHtml);
      if (typeof v === "string") el.innerHTML = v;
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const v = t(el.dataset.i18nAria);
      if (typeof v === "string") el.setAttribute("aria-label", v);
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const v = t(el.dataset.i18nTitle);
      if (typeof v === "string") el.setAttribute("title", v);
    });
    const metaKey = { home: "home", history: "history", officers: "gh", fund: "fund" }[
      pageName()
    ];
    if (metaKey) {
      const title = t(`meta.${metaKey}.title`);
      const desc = t(`meta.${metaKey}.description`);
      if (typeof title === "string") {
        document.title = title;
        document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
        document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", title);
      }
      if (typeof desc === "string") {
        document.querySelector('meta[name="description"]')?.setAttribute("content", desc);
        document
          .querySelector('meta[property="og:description"]')
          ?.setAttribute("content", desc);
        document
          .querySelector('meta[name="twitter:description"]')
          ?.setAttribute("content", desc);
      }
    }
    document.querySelectorAll("[data-set-lang]").forEach((btn) => {
      btn.setAttribute(
        "aria-selected",
        btn.getAttribute("data-set-lang") === lang ? "true" : "false"
      );
    });
  }

  function setLang(next) {
    if (next !== "en" && next !== "vi") return;
    lang = next;
    I18N = dicts[lang] || I18N_EN;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (_) {}
    applyChrome();
    renderCurrentPage();
  }

  function initLangSwitch() {
    const toggle = document.getElementById("lang-toggle");
    const menu = document.getElementById("lang-menu");
    if (!toggle || !menu) return;

    function closeMenu() {
      menu.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
    }

    function openMenu() {
      menu.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
    }

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      if (menu.hidden) openMenu();
      else closeMenu();
    });

    menu.querySelectorAll("[data-set-lang]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setLang(btn.getAttribute("data-set-lang"));
        closeMenu();
      });
    });

    document.addEventListener("click", (event) => {
      if (!menu.hidden && !event.target.closest(".lang-switch")) closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !menu.hidden) {
        closeMenu();
        toggle.focus();
      }
    });
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
    const intro = document.getElementById("journey-intro");
    if (tagline) tagline.textContent = t("home.heroLede") || site.tagline || "";
    if (intro) intro.textContent = t("home.definition") || site.definition || "";

    const story = site.story;
    if (story?.krewe) {
      const titleEl = document.getElementById("krewe-title");
      const bodyEl = document.getElementById("krewe-body");
      if (titleEl) titleEl.textContent = t("home.kreweHeadline") || story.krewe.headline;
      if (bodyEl) bodyEl.textContent = t("home.kreweBody") || story.krewe.body;
    }

    const chaptersEl = document.getElementById("story-chapters");
    const chapterCopy = t("home.chapters");
    if (chaptersEl && story?.chapters?.length) {
      chaptersEl.innerHTML = story.chapters
        .map((ch, i) => {
          const copy = Array.isArray(chapterCopy) ? chapterCopy[i] || {} : {};
          const localized = {
            ...ch,
            kicker: copy.kicker || ch.kicker,
            headline: copy.headline || ch.headline,
            body: copy.body || ch.body,
            cta: copy.cta || ch.cta,
            youtubeTitle: copy.youtubeTitle || ch.youtubeTitle,
            imageAlt: copy.imageAlt || ch.imageAlt,
          };
          const media = renderStoryMedia(localized);
          const cta = (() => {
            if (!localized.href || !localized.cta) return "";
            const external =
              localized.external === true || /^https?:\/\//i.test(localized.href);
            const cls = external ? "btn btn-ghost" : "btn btn-primary";
            const extra = external
              ? ' rel="noopener noreferrer" target="_blank"'
              : "";
            return `<p><a class="${cls}" href="${escapeHtml(localized.href)}"${extra}>${escapeHtml(localized.cta)}</a></p>`;
          })();
          return `
            <article class="story-chapter ${i % 2 ? "" : "is-flip"}">
              ${media}
              <div class="story-copy">
                ${localized.kicker ? `<p class="story-kicker">${escapeHtml(localized.kicker)}</p>` : ""}
                <h3>${escapeHtml(localized.headline)}</h3>
                <p>${escapeHtml(localized.body)}</p>
                ${cta}
              </div>
            </article>`;
        })
        .join("");
    }

    const slideAlts = t("home.slides");
    const slides = (site.hero?.slides || []).map((slide, i) => ({
      ...slide,
      alt: (Array.isArray(slideAlts) && slideAlts[i]) || slide.alt,
    }));
    initCarousel(slides);
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
          `<button type="button" class="video-carousel-dot${index === 0 ? " is-active" : ""}" data-slide-to="${index}" aria-label="${escapeHtml(t("history.showPhotoN", { n: index + 1, total: items.length }))}" aria-selected="${index === 0 ? "true" : "false"}"></button>`,
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
            <button type="button" class="video-carousel-nav video-carousel-prev" aria-label="${escapeHtml(t("history.prevPhoto"))}" aria-controls="${escapeHtml(carouselId)}">
              ${historyCarouselChevron("prev")}
            </button>
            <div class="video-carousel-dots" role="tablist" aria-label="${escapeHtml(groupTitle)}">${dots}</div>
            <button type="button" class="video-carousel-nav video-carousel-next" aria-label="${escapeHtml(t("history.nextPhoto"))}" aria-controls="${escapeHtml(carouselId)}">
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
      return `<figure class="history-photo" style="background-image: url('${escapeHtml(items[0].src)}')"><img src="${escapeHtml(items[0].src)}" alt="${escapeHtml(items[0].alt || "")}" loading="lazy" /></figure>`;
    }
    return renderHistoryPhotoCarousel(items, entry.headline || t("history.photoGroup"));
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
          `<button type="button" class="video-carousel-dot${index === 0 ? " is-active" : ""}" data-slide-to="${index}" aria-label="${escapeHtml(t("history.showVideoN", { n: index + 1, total: items.length }))}" aria-selected="${index === 0 ? "true" : "false"}"></button>`,
      )
      .join("");
    return `
      <figure class="video-card video-card--carousel" data-video-carousel id="${escapeHtml(carouselId)}" tabindex="0">
        <div class="video-carousel">
          <div class="video-carousel-viewport">
            ${slides}
          </div>
          <div class="video-carousel-chrome">
            <button type="button" class="video-carousel-nav video-carousel-prev" aria-label="${escapeHtml(t("history.prevVideo"))}" aria-controls="${escapeHtml(carouselId)}">
              ${historyCarouselChevron("prev")}
            </button>
            <div class="video-carousel-dots" role="tablist" aria-label="${escapeHtml(groupTitle)}">${dots}</div>
            <button type="button" class="video-carousel-nav video-carousel-next" aria-label="${escapeHtml(t("history.nextVideo"))}" aria-controls="${escapeHtml(carouselId)}">
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
    return renderHistoryCarousel(items, entry.youtubeTitle || entry.headline || t("history.videoGroup"));
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

  function localizeHistoryEntry(entry) {
    const over = t(`history.entries.${entry.id}`);
    if (!over || typeof over !== "object" || Array.isArray(over)) return entry;
    const next = { ...entry, ...over };
    if (Array.isArray(over.links) && Array.isArray(entry.links)) {
      next.links = entry.links.map((link, i) => ({
        ...link,
        label: over.links[i] || link.label,
      }));
    }
    if (Array.isArray(over.videos) && Array.isArray(entry.youtube)) {
      next.youtube = entry.youtube.map((item, i) =>
        typeof item === "string"
          ? item
          : { ...item, title: over.videos[i] || item.title }
      );
    }
    if (Array.isArray(over.imageAlts) && Array.isArray(entry.images)) {
      next.images = entry.images.map((img, i) => ({
        ...img,
        alt: over.imageAlts[i] || img.alt,
        title: (over.imageTitles && over.imageTitles[i]) || img.title,
      }));
    }
    return next;
  }

  function renderHistory(history) {
    const kicker = document.getElementById("history-kicker");
    const headline = document.getElementById("history-headline");
    const lead = document.getElementById("history-lead");
    const note = document.getElementById("history-note");
    if (kicker) kicker.textContent = t("history.kicker") || history.kicker || "";
    if (headline) headline.textContent = t("history.headline") || history.headline || "";
    if (lead) lead.textContent = t("history.lead") || history.lead || "";
    if (note) {
      note.textContent = history.note || "";
      note.hidden = !history.note;
    }

    const bucketsEl = document.getElementById("history-buckets");
    if (bucketsEl && history.buckets?.length) {
      bucketsEl.innerHTML = history.buckets
        .map((b) => {
          const copy = t(`history.buckets.${b.id}`) || {};
          const label = copy.label || b.label;
          const blurb = copy.blurb || b.blurb;
          return `
        <article class="history-bucket">
          <p class="story-kicker">${escapeHtml(label)}</p>
          <p>${escapeHtml(blurb)}</p>
        </article>`;
        })
        .join("");
    }

    const hostEl = document.getElementById("history-host");
    const marchEl = document.getElementById("history-march");
    const entries = (history.entries || []).map(localizeHistoryEntry);
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

    if (root.dataset.carouselBound === "1") {
      root.querySelectorAll(".hero-slide").forEach((el, i) => {
        el.setAttribute("aria-label", t("home.slideOf", { n: i + 1, total: slides.length }));
        const img = el.querySelector("img");
        if (img && slides[i]) img.alt = slides[i].alt || "";
      });
      dotsEl?.querySelectorAll(".hero-dot").forEach((el, i) => {
        el.setAttribute("aria-label", t("home.showPhoto", { n: i + 1 }));
      });
      return;
    }

    root.innerHTML = slides
      .map(
        (s, i) => `
      <div class="hero-slide${i === 0 ? " is-active" : ""}" role="group" aria-roledescription="slide" aria-label="${escapeHtml(t("home.slideOf", { n: i + 1, total: slides.length }))}">
        <img src="${escapeHtml(s.src)}" alt="${escapeHtml(s.alt || "")}" ${i === 0 ? "" : 'loading="lazy"'} />
      </div>`
      )
      .join("");

    if (slides.length < 2 || !controls || !dotsEl) return;

    controls.hidden = false;
    dotsEl.innerHTML = slides
      .map(
        (_, i) =>
          `<button type="button" class="hero-dot${i === 0 ? " is-active" : ""}" aria-label="${escapeHtml(t("home.showPhoto", { n: i + 1 }))}" data-slide="${i}"></button>`
      )
      .join("");
    root.dataset.carouselBound = "1";

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
    const ev = t("gh.event") || {};
    const pitchCopy = t("gh.pitch") || {};
    const pitch = site.officerPitch || site.pitch;
    const headline = document.getElementById("gh-pitch-headline");
    const body = document.getElementById("gh-pitch-body");
    if (headline) headline.textContent = pitchCopy.headline || pitch?.headline || "";
    if (body) body.textContent = pitchCopy.body || pitch?.body || "";

    const dateDisplay = ev.dateDisplay || e?.dateDisplay || "";
    const venue = ev.venue || e?.venue || "";
    const kicker = document.getElementById("page-kicker");
    if (kicker && e) {
      kicker.textContent = `${dateDisplay} · ${venue}`;
    }

    const facts = document.getElementById("event-facts");
    if (!facts || !e) return;
    const labels = t("gh.facts") || {};
    const rows = [
      [labels.event || "Event", `${ev.edition || e.edition} ${ev.name || e.name}`],
      [labels.when || "When", `${dateDisplay} · ${ev.timeNote || e.timeNote}`],
      [labels.where || "Where", venue],
    ];
    const festival = ev.festivalNote || e.festivalNote;
    const staging = ev.stagingNote || e.stagingNote;
    const route = ev.routeNote || e.routeNote;
    if (festival) rows.push([labels.festival || "Festival", festival]);
    if (staging) rows.push([labels.staging || "Staging", staging]);
    if (route) rows.push([labels.route || "Route", route]);
    rows.push([labels.theme || "Theme", ev.theme || e.theme]);
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
    const copy = t("gh.portal") || {};
    const title = document.getElementById("waivers-title");
    const body = document.getElementById("waivers-body");
    const cutoff = document.getElementById("waivers-cutoff");
    const link = document.getElementById("portal-link");
    if (title) title.textContent = copy.headline || p.headline;
    if (body) body.textContent = copy.body || p.body;
    if (cutoff) cutoff.textContent = copy.cutoff || p.cutoff || "";
    if (link) {
      link.href = site.portalUrl || "https://portal.cpalss.com";
      if (copy.button || p.button) link.textContent = copy.button || p.button;
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
    return t("gh.champions.volunteerAria", { id: tribeId });
  }

  function renderChampions(site, participants) {
    const ask = site.championAsk;
    const title = document.getElementById("champions-title");
    if (!title || !ask) return;
    const askCopy = t("gh.champions") || {};
    title.textContent = askCopy.headline || ask.headline;
    document.getElementById("champions-body").textContent = askCopy.body || ask.body;
    document.getElementById("champions-when").textContent = askCopy.when || ask.when;

    const { map: byTribe, max } = championsByTribe(participants);

    const list = document.getElementById("tribe-list");
    const tribeCards = site.tribes.map((tribe, i) => {
      const tribeCopy = t(`gh.tribes.${tribe.id}`) || {};
      const name = tribeCopy.name || tribe.name;
      const peers = tribeCopy.peers || tribe.peers;
      const profile = tribeCopy.championProfile || tribe.championProfile;
      const champs = byTribe[tribe.id] || [];
      const filledCount = champs.length;
      const subject = t("mailto.championSubject", {
        tribe: `${tribe.id} · ${name}`,
        tribeId: tribe.id,
        tribeName: name,
      });
      const body = t("mailto.championBody", {
        tribeId: tribe.id,
        tribeName: name,
      });
      const href = mailto(subject, body);
      const confirmed =
        filledCount > 0
          ? `<div class="tribe-hosts">
            <p class="tribe-hosts-label">${escapeHtml(askCopy.hostsLabel || "Champions")}</p>
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
        !filled && profile
          ? `<div class="tribe-open">
            <p class="tribe-profile"><span class="tribe-looking">${escapeHtml(askCopy.looking || "Looking for champion:")}</span> ${escapeHtml(profile)}</p>
            ${
              ctaLabel
                ? `<a class="btn btn-tribe-sm" href="${href}" aria-label="${escapeHtml(ctaLabel)}">${escapeHtml(askCopy.volunteer || "Volunteer")}</a>`
                : ""
            }
          </div>`
          : "";
      const joiners = renderTribeJoiners(groupsByTribe(site.joining?.groups, tribe.id));
      const vehicle =
        tribe.block === "vehicle" ? ` · ${askCopy.vehicleBlock || "vehicle block"}` : "";
      return `
          <li class="tribe-item" style="animation-delay: ${0.05 * i}s">
            <span class="tribe-id">${escapeHtml(t("gh.champions.tribeLabel", { id: tribe.id }))}${escapeHtml(vehicle)}</span>
            <h3 class="tribe-name">${escapeHtml(name)}</h3>
            <p class="tribe-peers">${escapeHtml(peers)}</p>
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
    const copy = t("fund") || {};
    const title = document.getElementById("wishlist-title");
    const body = document.getElementById("wishlist-body");
    if (title) title.textContent = copy.headline || wl.headline;
    if (body) body.textContent = copy.body || wl.body;

    const pdf = document.getElementById("packet-pdf");
    if (pdf && site.packetPdfUrl) pdf.href = site.packetPdfUrl;

    const payee = document.getElementById("fund-payee");
    if (payee) {
      const rows = [
        [copy.payableTo || "Payable to", wl.payee || "cPALSs"],
        [copy.memo || "Memo", wl.memo || "LSK 2026"],
        [copy.ein || "EIN", wl.ein || "47-1100695"],
      ];
      payee.innerHTML = rows
        .map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${escapeHtml(dd)}</dd></div>`)
        .join("");
    }

    const list = document.getElementById("wishlist-list");
    if (!list) return;
    const items = wl.items || [];
    if (!items.length) {
      list.innerHTML = `<li class="roster-empty">${escapeHtml(copy.empty || "")}</li>`;
      return;
    }

    list.innerHTML = items
      .map((item, i) => {
        const itemCopy = t(`fund.items.${item.id}`) || {};
        const need = itemCopy.need || item.need;
        const detail = itemCopy.detail || item.detail;
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
              ? t("fund.slotOne")
              : t("fund.slotMany", { n: slotsTotal })
            : "";
        const kickerParts = [amount, slotsLabel].filter(Boolean);
        const subject = t("mailto.wishlistSubject", { need });
        const mailBody = t("mailto.wishlistBody", {
          need,
          amount: amount || t("fund.seePacket"),
        });
        const href = mailto(subject, mailBody);
        const cta = fullyFunded
          ? `<span class="btn btn-tribe is-filled">${escapeHtml(copy.fullyFunded)}</span>`
          : `<a class="btn btn-tribe" href="${href}">${escapeHtml(copy.sponsorGift)}</a>`;
        return `
          <li class="wishlist-item" style="animation-delay: ${0.05 * i}s">
            ${kickerParts.length ? `<span class="wishlist-kicker">${escapeHtml(kickerParts.join(" · "))}</span>` : ""}
            <h3 class="wishlist-need">${escapeHtml(need)}</h3>
            ${detail ? `<p class="wishlist-detail">${escapeHtml(detail)}</p>` : ""}
            ${cta}
          </li>`;
      })
      .join("");
  }

  function renderTransit(site) {
    const tr = site.transit;
    if (!tr) return;
    const copy = t("gh.transit") || {};
    const title = document.getElementById("transit-title");
    if (!title) return;
    title.textContent = copy.headline || tr.headline;
    document.getElementById("transit-intro").textContent = copy.intro || tr.intro;
    document.getElementById("transit-path-title").textContent =
      copy.pathTitle || tr.pathTitle;
    const agency = document.getElementById("transit-agency");
    if (agency) {
      agency.textContent = tr.agencyNote || "";
      agency.hidden = !tr.agencyNote;
    }

    const stagingTitle = document.getElementById("transit-staging-title");
    const stagingEl = document.getElementById("transit-staging");
    const stagingRows = copy.staging || tr.staging;
    if (stagingRows && stagingRows.length) {
      stagingTitle.textContent = copy.stagingTitle || tr.stagingTitle || "";
      stagingTitle.hidden = false;
      stagingEl.hidden = false;
      stagingEl.innerHTML = stagingRows
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

    const steps = copy.steps || tr.steps || [];
    document.getElementById("transit-steps").innerHTML = steps
      .map((step) => `<li>${escapeHtml(step)}</li>`)
      .join("");

    const parkingTitle = document.getElementById("transit-parking-title");
    const parkingLead = document.getElementById("transit-parking-lead");
    const parkingEl = document.getElementById("transit-parking");
    const parkingRates = document.getElementById("transit-parking-rates");
    const parkingRows = copy.parking || tr.parking;
    if (parkingRows && parkingRows.length) {
      parkingTitle.textContent = copy.parkingTitle || tr.parkingTitle || "";
      parkingTitle.hidden = false;
      parkingLead.textContent = copy.parkingLead || tr.parkingLead || "";
      parkingLead.hidden = !(copy.parkingLead || tr.parkingLead);
      parkingEl.hidden = false;
      parkingEl.innerHTML = parkingRows
        .map((row) => {
          const [dt, place, rates] = row;
          const dd = rates
            ? `${escapeHtml(place)}<span class="parking-meta">${escapeHtml(rates)}</span>`
            : escapeHtml(place);
          return `<div><dt>${escapeHtml(dt)}</dt><dd>${dd}</dd></div>`;
        })
        .join("");
      parkingRates.textContent = tr.parkingRates || "";
      parkingRates.hidden = !tr.parkingRates;
    } else {
      parkingTitle.hidden = true;
      parkingLead.hidden = true;
      parkingEl.hidden = true;
      parkingRates.hidden = true;
    }

    const map = tr.map;
    const mapEl = document.getElementById("transit-map");
    if (map && map.embedUrl) {
      mapEl.hidden = false;
      document.getElementById("transit-map-iframe").src = map.embedUrl;
      document.getElementById("transit-map-title").textContent =
        copy.mapTitle || map.title || "";
      const open = document.getElementById("transit-map-open");
      open.href = map.openUrl || map.embedUrl;
    } else {
      mapEl.hidden = true;
    }

    const notes = copy.notes || tr.notes || [];
    document.getElementById("transit-notes").innerHTML = notes
      .map((note) => `<li>${escapeHtml(note)}</li>`)
      .join("");

    const linkLabels = copy.links;
    document.getElementById("transit-links").innerHTML = (tr.links || [])
      .map((link, i) => {
        const sep = i > 0 ? ' <span aria-hidden="true"> · </span> ' : "";
        const label =
          (Array.isArray(linkLabels) && linkLabels[i]) || link.label;
        return `${sep}<a href="${escapeHtml(link.url)}" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
      })
      .join("");
  }

  function renderTimeline(site) {
    const tl = site.timeline;
    if (!tl) return;
    const copy = t("gh.timeline") || {};
    const title = document.getElementById("timeline-title");
    const intro = document.getElementById("timeline-intro");
    const list = document.getElementById("timeline-list");
    if (!title || !intro || !list) return;
    title.textContent = copy.headline || tl.headline;
    intro.textContent = copy.intro || tl.intro;
    const stepsCopy = Array.isArray(copy.steps) ? copy.steps : [];
    list.innerHTML = (tl.steps || [])
      .map((step, i) => {
        const stepCopy = stepsCopy[i] || {};
        const when = stepCopy.when || step.when;
        const stepTitle = stepCopy.title || step.title;
        const body = stepCopy.body || step.body;
        const ctaLabel = stepCopy.ctaLabel || step.ctaLabel;
        let href = step.ctaHref || "";
        if (step.ctaMailto) {
          const key = String(step.ctaMailto);
          const subject = t(`mailto.${key}Subject`) || t("mailto.interestSubject");
          const mailBody = t(`mailto.${key}Body`) || t("mailto.interestBody");
          if (subject) href = mailto(subject, mailBody || "");
        }
        const btnClass = step.ctaClass || (step.ctaMailto ? "btn btn-primary" : "btn btn-ghost");
        const extra = href.startsWith("mailto:")
          ? ""
          : ' rel="noopener noreferrer"';
        const cta =
          href && ctaLabel
            ? `<p class="timeline-cta"><a class="${escapeHtml(btnClass)}" href="${escapeHtml(href)}"${extra}>${escapeHtml(ctaLabel)}</a></p>`
            : "";
        const itinerarySrc = stepCopy.itinerary || step.itinerary;
        const itinerary = Array.isArray(itinerarySrc) && itinerarySrc.length
          ? `<ol class="timeline-itinerary">${itinerarySrc
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
        <p class="timeline-when">${escapeHtml(when)}</p>
        <h3 class="timeline-step-title">${escapeHtml(stepTitle)}</h3>
        <p class="timeline-body">${escapeHtml(body)}</p>
        ${itinerary}
        ${cta}
      </li>`;
      })
      .join("");
  }

  function renderMarchMailto() {
    const a = document.getElementById("march-mailto");
    if (!a) return;
    a.href = mailto(t("mailto.marchSubject"), t("mailto.marchBody"));
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
              <span class="roster-tag is-${status}">${escapeHtml(
          status === "confirmed"
            ? t("gh.champions.statusConfirmed")
            : t("gh.champions.statusInterested")
        )}</span>
            </li>`;
      })
      .join("")}</ul>`;
  }

  function renderJoiningNote(site) {
    const intro = document.getElementById("joining-intro");
    if (!intro) return;
    const text = site.joining?.intro || "";
    intro.textContent = t("gh.joiningIntro") || text;
    intro.hidden = !(t("gh.joiningIntro") || text);
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
    const nav = document.querySelector(".site-nav");
    const toggle = document.getElementById("nav-toggle");
    const drawer = document.getElementById("site-nav-drawer");
    const backdrop = nav?.querySelector(".site-nav-backdrop");
    const srLabel = toggle?.querySelector(".sr-only");
    if (!header || !nav || !toggle || !drawer) return;

    const desktopQuery = window.matchMedia("(min-width: 880px)");

    function setOpen(open) {
      if (desktopQuery.matches) {
        nav.classList.remove("is-open");
        header.classList.remove("is-nav-open");
        toggle.setAttribute("aria-expanded", "false");
        drawer.setAttribute("aria-hidden", "false");
        if (backdrop) {
          backdrop.hidden = true;
          backdrop.setAttribute("aria-hidden", "true");
        }
        document.body.classList.remove("nav-open");
        if (srLabel) srLabel.textContent = t("nav.openMenu");
        return;
      }
      nav.classList.toggle("is-open", open);
      header.classList.toggle("is-nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      drawer.setAttribute("aria-hidden", open ? "false" : "true");
      if (backdrop) {
        backdrop.hidden = !open;
        backdrop.setAttribute("aria-hidden", open ? "false" : "true");
      }
      document.body.classList.toggle("nav-open", open);
      if (srLabel) srLabel.textContent = open ? t("nav.closeMenu") : t("nav.openMenu");
    }

    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));

    if (backdrop) {
      backdrop.addEventListener("click", () => setOpen(false));
    }

    nav.querySelectorAll(".site-nav-links a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) setOpen(false);
    });

    desktopQuery.addEventListener("change", (event) => {
      if (event.matches) setOpen(false);
    });

    if (desktopQuery.matches) {
      drawer.setAttribute("aria-hidden", "false");
    }

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

  function renderCurrentPage() {
    const page = pageName();
    if (page === "home" && siteCache) {
      renderHome(siteCache);
      observeReveal(".story-chapter");
    } else if (page === "officers" && siteCache) {
      renderEvent(siteCache);
      renderTimeline(siteCache);
      renderPortal(siteCache);
      renderTransit(siteCache);
      renderChampions(siteCache, participantsCache || {});
      renderJoiningNote(siteCache);
      renderMarchMailto();
      observeReveal(".tribe-item, .tribe-joiners li, .timeline-item");
    } else if (page === "fund" && siteCache) {
      renderWishlist(siteCache);
      observeReveal(".wishlist-item");
    } else if (page === "history" && historyCache) {
      historyCarouselSeq = 0;
      renderHistory(historyCache);
      initHistoryCarousels();
      observeReveal(".history-card, .history-bucket");
    }
  }

  async function init() {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    lang = detectLang();
    document.querySelector(".hero")?.classList.add("is-ready");
    const navApi = initNav();
    initPastHero(navApi);
    initLangSwitch();

    const page = pageName();

    try {
      const [en, vi] = await Promise.all([
        loadJson("/data/i18n/en.json"),
        loadJson("/data/i18n/vi.json"),
      ]);
      dicts.en = en;
      dicts.vi = vi;
      I18N_EN = en;
      I18N = dicts[lang] || en;
      applyChrome();

      if (page === "home") {
        siteCache = await loadJson("/data/site.json");
        renderHome(siteCache);
        observeReveal(".story-chapter");
      } else if (page === "officers") {
        const [site, participants] = await Promise.all([
          loadJson("/data/site.json"),
          loadJson("/data/participants.json"),
        ]);
        siteCache = site;
        participantsCache = participants;
        renderEvent(site);
        renderTimeline(site);
        renderPortal(site);
        renderTransit(site);
        renderChampions(site, participants);
        renderJoiningNote(site);
        renderMarchMailto();
        observeReveal(".tribe-item, .tribe-joiners li, .timeline-item");
      } else if (page === "fund") {
        siteCache = await loadJson("/data/site.json");
        renderWishlist(siteCache);
        observeReveal(".wishlist-item");
      } else if (page === "history") {
        historyCache = await loadJson("/data/history.json");
        renderHistory(historyCache);
        initHistoryCarousels();
        observeReveal(".history-card, .history-bucket");
      }
    } catch (err) {
      console.error(err);
      const fallback =
        document.getElementById("gh-pitch-body") ||
        document.getElementById("journey-intro") ||
        document.getElementById("wishlist-body") ||
        document.getElementById("history-lead");
      if (fallback) {
        fallback.textContent = t("loadError");
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
