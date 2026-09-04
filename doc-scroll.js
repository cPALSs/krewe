/** TOC scroll-spy, hash sync, pin-on-click, and heading copy links — shared by eglny + GLF site.js */
(function (root) {
  function getDefaultScrollSpyOffsetPx() {
    const nav = document.getElementById("site-nav");
    const navHeight = nav?.getBoundingClientRect().height || 52;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return navHeight + rem;
  }

  const tocPagers = [];

  function chevronSvg(dir) {
    const d = dir === "up" ? "M4 10.5 L8 6.5 L12 10.5" : "M4 6.5 L8 10.5 L12 6.5";
    return (
      '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">' +
      '<path d="' +
      d +
      '" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    );
  }

  function outerHeight(el) {
    if (!el || el.hidden) return 0;
    const style = getComputedStyle(el);
    if (style.display === "none") return 0;
    return (
      el.offsetHeight +
      (parseFloat(style.marginTop) || 0) +
      (parseFloat(style.marginBottom) || 0)
    );
  }

  function enhanceTocPager(nav, desktopQuery) {
    const label = nav.querySelector(
      ".site-doc-toc-label:not(.site-doc-toc-label--section), .host-doc-toc-label, .toc-label",
    );
    if (!label) return null;

    let head = nav.querySelector(":scope > .toc-head");
    if (!head) {
      head = document.createElement("div");
      head.className = "toc-head";
      label.parentNode.insertBefore(head, label);
      head.appendChild(label);
    }

    let pager = head.querySelector(".toc-pager");
    let prevBtn;
    let nextBtn;
    if (!pager) {
      pager = document.createElement("div");
      pager.className = "toc-pager";
      pager.hidden = true;
      pager.setAttribute("role", "group");
      pager.setAttribute("aria-label", "Table of contents pages");

      prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.className = "toc-page-btn toc-page-btn--prev";
      prevBtn.setAttribute("aria-label", "Previous headings");
      prevBtn.innerHTML = chevronSvg("up");

      nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "toc-page-btn toc-page-btn--next";
      nextBtn.setAttribute("aria-label", "Next headings");
      nextBtn.innerHTML = chevronSvg("down");

      pager.appendChild(prevBtn);
      pager.appendChild(nextBtn);
      head.appendChild(pager);
    } else {
      prevBtn = pager.querySelector(".toc-page-btn--prev");
      nextBtn = pager.querySelector(".toc-page-btn--next");
    }

    let items = Array.prototype.filter.call(nav.children, function (el) {
      return el.hasAttribute("data-toc-target") || el.classList.contains("site-doc-toc-label--section");
    });

    let list = nav.querySelector(":scope > .toc-list");
    if (!list && items.length) {
      list = document.createElement("div");
      list.className = "toc-list";
      items[0].parentNode.insertBefore(list, items[0]);
      items.forEach(function (el) {
        list.appendChild(el);
      });
    } else if (list) {
      items = Array.prototype.filter.call(list.children, function (el) {
        return el.hasAttribute("data-toc-target") || el.classList.contains("site-doc-toc-label--section");
      });
    }

    let pageIndex = 0;
    let measureTimer = null;
    let followTargetId = null;
    const desktopMq = window.matchMedia(desktopQuery);

    function visibleItems() {
      return items.filter(function (el) {
        return !el.hidden;
      });
    }

    function visibleIndexForTarget(vis, id) {
      if (!id) return -1;
      for (let i = 0; i < vis.length; i++) {
        if (vis[i].getAttribute("data-toc-target") === id) return i;
      }
      return -1;
    }

    function pageIndexForItem(pages, itemIndex) {
      if (itemIndex < 0) return -1;
      for (let p = 0; p < pages.length; p++) {
        const start = pages[p].start;
        const end = start + pages[p].count;
        if (itemIndex >= start && itemIndex < end) return p;
      }
      return -1;
    }

    function listBudget() {
      const style = getComputedStyle(nav);
      const stickyTop = parseFloat(style.top) || 0;
      const padY = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const back = nav.querySelector(".site-doc-toc-back, .toc-back");
      const foot = nav.querySelector(":scope > .toc-foot");
      let chrome = padY + outerHeight(head);
      if (back) chrome += outerHeight(back);
      if (foot) chrome += outerHeight(foot);
      return Math.max(0, window.innerHeight - stickyTop - rem - chrome);
    }

    function applyPage(vis, start, count) {
      const end = start + count;
      vis.forEach(function (el, i) {
        el.classList.toggle("is-toc-page-off", i < start || i >= end);
      });
    }

    function measure() {
      const vis = visibleItems();
      vis.forEach(function (el) {
        el.classList.remove("is-toc-page-off");
      });

      const tocVisible =
        desktopMq.matches && getComputedStyle(nav).display !== "none" && getComputedStyle(nav).position === "sticky";

      if (!tocVisible || vis.length <= 1) {
        pager.hidden = true;
        nav.classList.remove("is-toc-paged");
        pageIndex = 0;
        followTargetId = null;
        return;
      }

      const heights = vis.map(outerHeight);
      let total = 0;
      for (let i = 0; i < heights.length; i++) total += heights[i];

      if (total <= listBudget()) {
        pager.hidden = true;
        nav.classList.remove("is-toc-paged");
        pageIndex = 0;
        followTargetId = null;
        return;
      }

      pager.hidden = false;
      const budget = listBudget();

      const pages = [];
      let i = 0;
      while (i < vis.length) {
        let used = 0;
        let count = 0;
        while (i + count < vis.length) {
          const h = heights[i + count];
          if (count > 0 && used + h > budget) break;
          used += h;
          count += 1;
        }
        pages.push({ start: i, count: Math.max(1, count) });
        i += Math.max(1, count);
      }

      if (followTargetId) {
        const targetPage = pageIndexForItem(pages, visibleIndexForTarget(vis, followTargetId));
        if (targetPage >= 0) pageIndex = targetPage;
        followTargetId = null;
      }

      if (pageIndex >= pages.length) pageIndex = pages.length - 1;
      if (pageIndex < 0) pageIndex = 0;

      const page = pages[pageIndex];
      applyPage(vis, page.start, page.count);
      pager.hidden = false;
      nav.classList.add("is-toc-paged");
      prevBtn.disabled = pageIndex <= 0;
      nextBtn.disabled = pageIndex >= pages.length - 1;
    }

    function scheduleMeasure() {
      clearTimeout(measureTimer);
      measureTimer = setTimeout(measure, 50);
    }

    prevBtn.addEventListener("click", function () {
      if (pageIndex <= 0) return;
      pageIndex -= 1;
      measure();
    });

    nextBtn.addEventListener("click", function () {
      pageIndex += 1;
      measure();
    });

    window.addEventListener("resize", scheduleMeasure, { passive: true });
    if (desktopMq.addEventListener) desktopMq.addEventListener("change", scheduleMeasure);
    else desktopMq.addListener(scheduleMeasure);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleMeasure).catch(function () {});
    }

    const mo = new MutationObserver(scheduleMeasure);
    items.forEach(function (el) {
      mo.observe(el, { attributes: true, attributeFilter: ["hidden"] });
    });

    function showTarget(id) {
      followTargetId = id || null;
      measure();
    }

    measure();
    return { measure: measure, showTarget: showTarget };
  }

  function initTocPager(options) {
    options = options || {};
    const navSelector = options.navSelector || ".site-doc-toc, .host-doc-toc, .toc";
    const desktopQuery = options.desktopQuery || "(min-width: 1100px)";
    document.querySelectorAll(navSelector).forEach(function (nav) {
      if (nav.dataset.tocPagerReady === "1") return;
      nav.dataset.tocPagerReady = "1";
      const api = enhanceTocPager(nav, desktopQuery);
      if (api) tocPagers.push(api);
    });
  }

  let lastActiveTargetId = null;

  function followTocPage(id) {
    lastActiveTargetId = id || null;
    tocPagers.forEach(function (api) {
      if (typeof api.showTarget === "function") api.showTarget(id);
    });
  }

  function refreshTocPager() {
    tocPagers.forEach(function (api) {
      if (lastActiveTargetId && typeof api.showTarget === "function") {
        api.showTarget(lastActiveTargetId);
      } else {
        api.measure();
      }
    });
  }

  function initDocScroll(options) {
    options = options || {};
    const tocLinkSelector = options.tocLinkSelector || "[data-toc-target]";
    const sectionSelector = options.sectionSelector || "[data-doc-section], [data-host-section]";
    const mainSelector = options.mainSelector || ".site-doc-main, .host-doc-main";
    const getScrollSpyOffsetPx = options.getScrollSpyOffsetPx || getDefaultScrollSpyOffsetPx;
    const headingSelector = options.headingSelector || "h2[id], h3[id], h4[id]";

    initTocPager({
      navSelector: options.tocNavSelector || ".site-doc-toc, .host-doc-toc, .toc",
      desktopQuery: options.tocDesktopQuery || "(min-width: 1100px)",
    });

    const tocLinks = document.querySelectorAll(tocLinkSelector);
    const sections = document.querySelectorAll(sectionSelector);
    const mainRoots = document.querySelectorAll(mainSelector);
    const noop = function () {};

    if (!tocLinks.length || !sections.length) {
      return { scrollToSection: noop, navigateToSection: noop };
    }

    const sectionList = Array.prototype.slice.call(sections);
    let activeSectionId = null;
    let scrollLockId = null;
    let pinnedSectionId = null;
    let isProgrammaticScroll = false;
    let scrollSettleTimer = null;
    let scrollSpyTimer = null;

    function sectionUrl(id) {
      return location.origin + location.pathname + location.search + "#" + encodeURIComponent(id);
    }

    function copyToClipboard(text) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
      }
      return new Promise(function (resolve, reject) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
          resolve();
        } catch (err) {
          reject(err);
        }
        document.body.removeChild(ta);
      });
    }

    function scrollToSection(id, behavior) {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: behavior || "smooth", block: "start" });
    }

    function setLocationHash(id) {
      const hash = "#" + encodeURIComponent(id);
      if (history.replaceState) {
        history.replaceState(null, "", hash);
      } else {
        location.hash = hash;
      }
    }

    function clearLocationHash() {
      if (!currentHashId()) return;
      if (history.replaceState) {
        history.replaceState(null, "", location.pathname + location.search);
      } else {
        location.hash = "";
      }
    }

    function currentHashId() {
      const raw = location.hash.slice(1);
      return raw ? decodeURIComponent(raw) : null;
    }

    function sectionFromViewport() {
      if (!sectionList.length) return null;
      const offset = getScrollSpyOffsetPx();
      let chosen = null;
      for (let i = 0; i < sectionList.length; i++) {
        if (sectionList[i].getBoundingClientRect().top <= offset + 1) {
          chosen = sectionList[i];
        }
      }
      return chosen ? chosen.id : null;
    }

    function setActive(id, updateHash, force) {
      if (!id) {
        if (activeSectionId !== null) {
          activeSectionId = null;
          lastActiveTargetId = null;
          tocLinks.forEach(function (link) {
            link.classList.remove("is-active");
          });
        }
        if (updateHash) clearLocationHash();
        return;
      }
      if (!force && scrollLockId && id !== scrollLockId) return;
      if (!force && pinnedSectionId && id !== pinnedSectionId) return;

      if (id !== activeSectionId) {
        activeSectionId = id;
        tocLinks.forEach(function (link) {
          link.classList.toggle("is-active", link.getAttribute("data-toc-target") === id);
        });
        followTocPage(id);
      }

      if (updateHash && currentHashId() !== id) {
        setLocationHash(id);
      }
    }

    function syncActiveFromViewport() {
      if (scrollLockId) return;
      const id = sectionFromViewport();
      if (!id) {
        pinnedSectionId = null;
        setActive(null, true);
        return;
      }
      if (pinnedSectionId) {
        setActive(pinnedSectionId, true, true);
        return;
      }
      setActive(id, true);
    }

    function finalizeProgrammaticScroll() {
      if (!scrollLockId) return;
      const id = scrollLockId;
      scrollLockId = null;
      isProgrammaticScroll = false;
      pinnedSectionId = id;
      setActive(id, true, true);
    }

    function onScrollSettled(callback) {
      clearTimeout(scrollSettleTimer);

      if ("onscrollend" in window) {
        let done = false;
        const finish = function () {
          if (done) return;
          done = true;
          window.removeEventListener("scrollend", finish);
          clearTimeout(fallbackTimer);
          callback();
        };
        const fallbackTimer = setTimeout(finish, 1000);
        window.addEventListener("scrollend", finish, { once: true });
        return;
      }

      scrollSettleTimer = setTimeout(callback, 150);
    }

    function navigateToSection(id, behavior) {
      scrollLockId = id;
      pinnedSectionId = null;
      isProgrammaticScroll = true;
      setActive(id, true, true);
      scrollToSection(id, behavior);

      if (behavior === "auto") {
        requestAnimationFrame(function () {
          requestAnimationFrame(finalizeProgrammaticScroll);
        });
        return;
      }

      onScrollSettled(finalizeProgrammaticScroll);
    }

    function onUserScrollIntent() {
      if (isProgrammaticScroll || scrollLockId) return;
      pinnedSectionId = null;
    }

    tocLinks.forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        navigateToSection(link.getAttribute("data-toc-target"), "smooth");
      });
    });

    window.addEventListener(
      "scroll",
      function () {
        if (isProgrammaticScroll || scrollLockId) return;
        clearTimeout(scrollSpyTimer);
        scrollSpyTimer = setTimeout(syncActiveFromViewport, 50);
      },
      { passive: true },
    );

    window.addEventListener(
      "resize",
      function () {
        if (!scrollLockId && !pinnedSectionId) syncActiveFromViewport();
      },
      { passive: true },
    );

    window.addEventListener("wheel", onUserScrollIntent, { passive: true });
    window.addEventListener("touchstart", onUserScrollIntent, { passive: true });
    window.addEventListener("keydown", function (e) {
      const keys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];
      if (keys.indexOf(e.key) === -1) return;
      onUserScrollIntent();
    });

    mainRoots.forEach(function (main) {
      main.querySelectorAll(headingSelector).forEach(function (heading) {
        if (heading.querySelector(".doc-heading-anchor")) return;

        heading.classList.add("doc-heading");

        const anchor = document.createElement("a");
        anchor.className = "doc-heading-anchor";
        anchor.href = "#" + heading.id;
        anchor.setAttribute("aria-label", "Copy link to this section");
        anchor.innerHTML = "#";

        anchor.addEventListener("click", function (e) {
          e.preventDefault();
          copyToClipboard(sectionUrl(heading.id))
            .then(function () {
              anchor.classList.remove("is-copy-failed");
              anchor.classList.add("is-copied");
              anchor.textContent = "\u2713";
              anchor.setAttribute("aria-label", "Link copied");
              setTimeout(function () {
                anchor.classList.remove("is-copied");
                anchor.textContent = "#";
                anchor.setAttribute("aria-label", "Copy link to this section");
              }, 2000);
            })
            .catch(function () {
              anchor.classList.remove("is-copied");
              anchor.classList.add("is-copy-failed");
              anchor.setAttribute("aria-label", "Copy failed");
              setTimeout(function () {
                anchor.classList.remove("is-copy-failed");
                anchor.setAttribute("aria-label", "Copy link to this section");
              }, 2000);
            });
          setLocationHash(heading.id);
        });

        heading.appendChild(anchor);
      });
    });

    function scrollFromHash(behavior) {
      const raw = location.hash.slice(1);
      if (!raw) {
        if (!currentHashId()) syncActiveFromViewport();
        return;
      }
      navigateToSection(decodeURIComponent(raw), behavior || "auto");
    }

    scrollFromHash("auto");

    window.addEventListener("hashchange", function () {
      scrollFromHash("smooth");
    });

    return { scrollToSection: scrollToSection, navigateToSection: navigateToSection };
  }

  root.DocScroll = {
    init: initDocScroll,
    getDefaultScrollSpyOffsetPx: getDefaultScrollSpyOffsetPx,
    refreshTocPager: refreshTocPager,
  };
})(typeof window !== "undefined" ? window : globalThis);
