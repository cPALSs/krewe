/** TOC scroll-spy, hash sync, pin-on-click, and heading copy links — shared by eglny + GLF site.js */
(function (root) {
  function getDefaultScrollSpyOffsetPx() {
    const nav = document.getElementById("site-nav");
    const navHeight = nav?.getBoundingClientRect().height || 52;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return navHeight + rem;
  }

  function initDocScroll(options) {
    options = options || {};
    const tocLinkSelector = options.tocLinkSelector || "[data-toc-target]";
    const sectionSelector = options.sectionSelector || "[data-doc-section], [data-host-section]";
    const mainSelector = options.mainSelector || ".site-doc-main, .host-doc-main";
    const getScrollSpyOffsetPx = options.getScrollSpyOffsetPx || getDefaultScrollSpyOffsetPx;
    const headingSelector = options.headingSelector || "h2[id], h3[id], h4[id]";

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

  root.DocScroll = { init: initDocScroll, getDefaultScrollSpyOffsetPx: getDefaultScrollSpyOffsetPx };
})(typeof window !== "undefined" ? window : globalThis);
