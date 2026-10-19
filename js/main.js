(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var header = document.getElementById("site-header");
  var headerH = function () { return header ? header.offsetHeight : 72; };
  var COUNTRIES = ["Austria","Belgium","Bulgaria","Croatia","Cyprus","Czechia","Denmark","Estonia","Finland","France","Germany","Greece","Hungary","Ireland","Italy","Latvia","Lithuania","Luxembourg","Malta","Netherlands","Poland","Portugal","Romania","Slovakia","Slovenia","Spain","Sweden","United Kingdom","Norway","Switzerland","Iceland","United States","Canada","Vietnam","China","Singapore","Japan","South Korea","Australia","New Zealand","Other"];

  function initHeader() {
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle("is-solid", window.scrollY > 80);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function scrollToId(id, extra) {
    var el = document.getElementById(id);
    if (!el) return;
    var top = el.getBoundingClientRect().top + window.scrollY - headerH() - (extra || 0);
    window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? "auto" : "smooth" });
  }

  function rememberCta(node) {
    var label = node.getAttribute("data-cta") || (node.textContent || "").trim();
    var hidden = document.getElementById("cta-source");
    if (hidden) hidden.value = label;
    var support = node.getAttribute("data-support");
    if (support) {
      document.querySelectorAll('input[name="support"]').forEach(function (box) {
        box.checked = box.getAttribute("data-support-id") === support;
      });
    }
  }

  function parseHashLink(href) {
    var raw = (href || "").replace(/^#/, "");
    var q = raw.indexOf("?");
    if (q === -1) return { id: raw, params: new URLSearchParams() };
    return { id: raw.slice(0, q), params: new URLSearchParams(raw.slice(q + 1)) };
  }

  function applyDevelopmentStage(params) {
    if (!params) return;
    var stage = params.get("stage");
    if (!stage) return;
    var select = document.getElementById("development_stage");
    if (!select) return;
    Array.prototype.forEach.call(select.options, function (opt) {
      if (opt.value === stage) select.value = stage;
    });
  }

  function applyHashState() {
    var parsed = parseHashLink(window.location.hash);
    if (parsed.id) applyDevelopmentStage(parsed.params);
  }

  function initSmoothScroll() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var parsed = parseHashLink(a.getAttribute("href"));
      if (!parsed.id) return;
      var target = document.getElementById(parsed.id);
      if (!target) return;
      e.preventDefault();
      rememberCta(a);
      applyDevelopmentStage(parsed.params);
      scrollToId(parsed.id);
      var suffix = parsed.params.toString() ? "?" + parsed.params.toString() : "";
      history.replaceState(null, "", "#" + parsed.id + suffix);
    });
    applyHashState();
    window.addEventListener("hashchange", applyHashState);
  }

  function initActiveNav() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".desk-nav a"));
    var sections = ["opuslab", "opustudio", "manufacturing", "about", "contact"]
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
    if (!sections.length) return;
    var ratios = {};
    var pickActive = function () {
      if (window.scrollY < 140) {
        links.forEach(function (link) { link.classList.remove("is-active"); });
        return;
      }
      var bestId = null;
      var best = 0;
      sections.forEach(function (sec) {
        var r = ratios[sec.id] || 0;
        if (r > best) {
          best = r;
          bestId = sec.id;
        }
      });
      if (!bestId || best < 0.12) {
        links.forEach(function (link) { link.classList.remove("is-active"); });
        return;
      }
      links.forEach(function (link) {
        link.classList.toggle("is-active", link.getAttribute("href") === "#" + bestId);
      });
    };
    if (!("IntersectionObserver" in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        ratios[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
      });
      pickActive();
    }, { rootMargin: "-32% 0px -48% 0px", threshold: [0, 0.08, 0.15, 0.3, 0.5] });
    sections.forEach(function (sec) { observer.observe(sec); });
    window.addEventListener("scroll", pickActive, { passive: true });
  }

  function initMobileMenu() {
    var menu = document.getElementById("mobile-menu");
    var toggle = document.getElementById("nav-toggle");
    if (!menu || !toggle) return;
    var panel = menu.querySelector(".mobile-menu__panel");
    var closeBtn = menu.querySelector(".mobile-menu__close");
    var focusables = function () {
      return panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
    };
    var open = function () {
      menu.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      document.body.classList.add("menu-open");
      document.body.style.overflow = "hidden";
      var first = focusables()[0];
      if (first) first.focus();
    };
    var close = function () {
      menu.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      document.body.classList.remove("menu-open");
      document.body.style.overflow = "";
      toggle.focus();
    };
    toggle.addEventListener("click", function () {
      if (menu.hidden) open(); else close();
    });
    if (closeBtn) closeBtn.addEventListener("click", close);
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        close();
      });
    });
    document.addEventListener("keydown", function (e) {
      if (menu.hidden) return;
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab") return;
      var nodes = Array.prototype.slice.call(focusables());
      if (!nodes.length) return;
      var first = nodes[0];
      var last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  function initMobileCta() {
    var bar = document.getElementById("mobile-cta");
    var heroCta = document.getElementById("hero-cta");
    var contact = document.getElementById("contact");
    if (!bar || !("IntersectionObserver" in window)) return;
    var heroVisible = true;
    var contactVisible = false;
    var update = function () {
      var hide = heroVisible || contactVisible || document.body.classList.contains("menu-open");
      bar.classList.toggle("is-hidden", hide);
    };
    if (heroCta) {
      var heroObs = new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        update();
      }, { threshold: 0.05 });
      heroObs.observe(heroCta);
    } else {
      heroVisible = false;
    }
    if (contact) {
      var contactObs = new IntersectionObserver(function (entries) {
        contactVisible = entries[0].isIntersecting;
        update();
      }, { threshold: 0.12 });
      contactObs.observe(contact);
    }
    update();
  }

  function encodeMediaPath(path) {
    if (typeof window.resolveMediaUrl === "function") return window.resolveMediaUrl(path);
    if (!path || typeof path !== "string") return path;
    var q = path.indexOf("?");
    var base = q === -1 ? path : path.slice(0, q);
    var query = q === -1 ? "" : path.slice(q);
    var slash = base.lastIndexOf("/");
    if (slash === -1) return encodeURIComponent(base) + query;
    return base.slice(0, slash + 1) + encodeURIComponent(base.slice(slash + 1)) + query;
  }

  function isVideoPath(value) {
    return typeof value === "string" && /\.(mp4|webm)(\?|$)/i.test(value);
  }
  function isImagePath(value) {
    return typeof value === "string" && /\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(value);
  }

  function hydrateMedia() {
    var catalog = window.MEDIA || {};
    document.querySelectorAll(".media-slot").forEach(function (slot) {
      var id = slot.getAttribute("data-media-id");
      var entry = catalog[id];
      if (entry == null) return;
      if ((typeof entry === "string" && isVideoPath(entry)) || (entry && entry.src && isVideoPath(entry.src))) {
        fillVideo(slot, entry);
      } else if (isImagePath(entry)) {
        fillImage(slot, entry);
      } else if (entry && entry.frames && entry.frames.length) {
        fillSequence(slot, entry);
      }
    });
  }

  function fillImage(slot, src) {
    var img = document.createElement("img");
    img.src = encodeMediaPath(src);
    img.alt = descOf(slot);
    img.loading = "lazy";
    slot.replaceChildren(img);
    slot.classList.add("is-filled");
  }

  function attachLazyVideoSource(video) {
    var url = video.getAttribute("data-src");
    if (!url || video.getAttribute("src")) return;
    video.src = url;
    video.load();
  }

  function fillVideo(slot, entry) {
    var src = typeof entry === "string" ? entry : entry.src;
    var video = document.createElement("video");
    var mediaId = slot.getAttribute("data-media-id");
    var eager = mediaId === "M01";
    video.setAttribute("data-src", encodeMediaPath(src));
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.preload = "none";
    var poster = (entry && entry.poster) || (mediaId === "M01" ? (window.MEDIA && window.MEDIA.M02) : "");
    if (typeof poster === "string") video.poster = encodeMediaPath(poster);
    if (!reduceMotion && eager) {
      video.autoplay = true;
      attachLazyVideoSource(video);
    }
    video.addEventListener("loadeddata", function () {
      if (!reduceMotion && (eager || slot.classList.contains("is-in-view"))) {
        video.play().catch(function () {});
      }
    });
    slot.replaceChildren(video);
    slot.classList.add("is-filled");
  }

  function fillSequence(slot, entry) {
    var reel = document.createElement("div");
    reel.className = "media-reel";
    var frames = entry.frames.map(function (src, i) {
      var img = document.createElement("img");
      img.className = "media-reel__frame" + (i === 0 ? " is-active" : "");
      img.src = src;
      img.alt = descOf(slot);
      if (i > 0) img.loading = "lazy";
      reel.appendChild(img);
      return img;
    });
    slot.replaceChildren(reel);
    slot.classList.add("is-filled");
    if (reduceMotion || frames.length < 2) return;
    var i = 0;
    var play = function () {
      frames[i].classList.remove("is-active");
      i = (i + 1) % frames.length;
      frames[i].classList.add("is-active");
    };
    var timer = null;
    var start = function () { if (!timer) timer = setInterval(play, entry.interval || 4000); };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; }; };
    var card = slot.closest(".pillar-card");
    if (card) {
      card.addEventListener("mouseenter", start);
      card.addEventListener("mouseleave", stop);
    } else {
      start();
    }
  }

  function descOf(slot) {
    var alt = slot.getAttribute("data-alt");
    if (alt) return alt.trim();
    var node = slot.querySelector(".media-slot__desc");
    return node ? node.textContent.trim() : "";
  }

  function initColorway() {
    var stage = document.getElementById("colorway-slot");
    var buttons = document.querySelectorAll(".swatch");
    var label = document.getElementById("colorway-label");
    if (!stage || !buttons.length) return;
    var setLabel = function (btn) {
      if (!label) return;
      var name = btn.getAttribute("data-color-name") || "Colorway";
      label.textContent = "Colorway: " + name;
    };
    buttons.forEach(function (btn) {
      if (window.OpusSwatch) {
        var c = btn.getAttribute("data-swatch-color") || btn.style.backgroundColor;
        window.OpusSwatch.apply(btn, c);
      }
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
          b.setAttribute("aria-selected", b === btn ? "true" : "false");
        });
        setLabel(btn);
        var id = btn.getAttribute("data-variant");
        var src = window.MEDIA && window.MEDIA[id];
        var img = stage.querySelector("img");
        if (!img || typeof src !== "string") return;
        if (img.src.indexOf(src) !== -1) return;
        img.style.transition = "opacity 250ms ease";
        img.style.opacity = "0";
        var next = src;
        img.onload = function () { img.style.opacity = "1"; };
        window.setTimeout(function () { img.src = next; }, reduceMotion ? 0 : 125);
      });
    });
    var active = document.querySelector(".swatch.is-active");
    if (active) setLabel(active);
  }

  function initVideoLifecycle() {
    if (!("IntersectionObserver" in window)) return;
    document.querySelectorAll(".media-slot video").forEach(function (video) {
      var slot = video.closest(".media-slot");
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (reduceMotion) {
            video.pause();
            return;
          }
          if (entry.isIntersecting) {
            if (slot) slot.classList.add("is-in-view");
            attachLazyVideoSource(video);
            var playWhenReady = function () {
              video.play().catch(function () {});
            };
            if (video.readyState >= 2) playWhenReady();
            else video.addEventListener("loadeddata", playWhenReady, { once: true });
          } else {
            if (slot) slot.classList.remove("is-in-view");
            video.pause();
          }
        });
      }, { threshold: 0.15, rootMargin: "80px 0px" });
      observer.observe(video);
    });
  }

  function initStats() {
    var band = document.getElementById("stats-band");
    if (!band) return;
    var nums = band.querySelectorAll("[data-count]");
    var run = function () {
      nums.forEach(function (el) {
        var end = Number(el.getAttribute("data-count"));
        var format = el.getAttribute("data-format");
        if (reduceMotion) {
          el.textContent = formatNumber(end, format);
          return;
        }
        var start = performance.now();
        var dur = 1400;
        var tick = function (now) {
          var t = Math.min(1, (now - start) / dur);
          var eased = 1 - Math.pow(1 - t, 3);
          el.textContent = formatNumber(Math.round(end * eased), format);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    };
    if (!("IntersectionObserver" in window)) { run(); return; }
    var once = false;
    var observer = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting || once) return;
      once = true;
      run();
      observer.disconnect();
    }, { threshold: 0.3 });
    observer.observe(band);
  }

  function formatNumber(n, format) {
    return format === "comma" ? n.toLocaleString("en-US") : String(n);
  }

  function initCategories() {
    var row = document.getElementById("cat-row");
    if (!row) return;
    var wrap = row.parentElement;
    var prev = wrap.querySelector(".cat-arrow--prev");
    var next = wrap.querySelector(".cat-arrow--next");
    var step = function () { return Math.min(row.clientWidth * 0.7, 320); };
    var syncArrows = function () {
      var max = row.scrollWidth - row.clientWidth - 2;
      if (prev) prev.classList.toggle("is-disabled", row.scrollLeft <= 2);
      if (next) next.classList.toggle("is-disabled", row.scrollLeft >= max);
    };
    if (prev) prev.addEventListener("click", function () {
      row.scrollBy({ left: -step(), behavior: reduceMotion ? "auto" : "smooth" });
    });
    if (next) next.addEventListener("click", function () {
      row.scrollBy({ left: step(), behavior: reduceMotion ? "auto" : "smooth" });
    });
    row.addEventListener("scroll", syncArrows, { passive: true });
    window.addEventListener("resize", syncArrows);
    syncArrows();
  }

  function initFileUpload() {
    var input = document.getElementById("attachment");
    var trigger = document.getElementById("attachment-trigger");
    var nameEl = document.getElementById("attachment-name");
    var clearBtn = document.getElementById("attachment-clear");
    if (!input || !trigger || !nameEl) return;
    var maxBytes = 10 * 1024 * 1024;
    var showFile = function () {
      var file = input.files && input.files[0];
      if (!file) {
        nameEl.textContent = "No file selected";
        nameEl.classList.add("is-empty");
        if (clearBtn) clearBtn.hidden = true;
        return;
      }
      nameEl.textContent = file.name;
      nameEl.classList.remove("is-empty");
      if (clearBtn) clearBtn.hidden = false;
    };
    trigger.addEventListener("click", function () { input.click(); });
    input.addEventListener("change", function () {
      var file = input.files && input.files[0];
      if (file && file.size > maxBytes) {
        input.value = "";
        nameEl.textContent = "File exceeds 10 MB limit";
        nameEl.classList.add("is-empty");
        if (clearBtn) clearBtn.hidden = true;
        return;
      }
      showFile();
    });
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        input.value = "";
        showFile();
      });
    }
  }

  function initReveal() {
    var nodes = document.querySelectorAll(".reveal");
    if (reduceMotion) {
      nodes.forEach(function (n) { n.classList.add("is-in"); });
      return;
    }
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("is-in"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    nodes.forEach(function (n) { observer.observe(n); });
  }

  function initForm() {
    var form = document.getElementById("lead-form");
    if (!form) return;
    var country = document.getElementById("country");
    if (country) {
      COUNTRIES.forEach(function (name) {
        var opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        country.appendChild(opt);
      });
    }
    var params = new URLSearchParams(window.location.search);
    ["utm_source","utm_medium","utm_campaign","utm_content","utm_term"].forEach(function (key) {
      var input = form.elements[key];
      if (input) input.value = params.get(key) || "";
    });
    if (form.elements.page_url) form.elements.page_url.value = window.location.href;

    form.querySelectorAll("input, select, textarea").forEach(function (field) {
      field.addEventListener("blur", function () { validateField(field); });
    });

    var submitting = false;
    var statusEl = document.getElementById("form-status");
    var submitBtn = document.getElementById("form-submit");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (submitting) return;
      var valid = true;
      form.querySelectorAll("input, select, textarea").forEach(function (field) {
        if (!validateField(field)) valid = false;
      });
      if (!validateSupport()) valid = false;
      if (!valid) return;

      var cfg = window.SITE_CONFIG || {};
      var data = collectFormData(form);
      submitting = true;
      if (submitBtn) {
        submitBtn.classList.add("is-loading");
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
      }

      if (!cfg.googleFormAction) {
        console.log("[OPUS demo] Inquiry payload:", JSON.stringify(data, null, 2));
        if (statusEl) {
          statusEl.hidden = false;
          statusEl.className = "form-status";
          statusEl.textContent = "Demo mode: connect Google Form in site-config.js to deliver inquiries to CRM.";
        }
        submitting = false;
        if (submitBtn) {
          submitBtn.classList.remove("is-loading");
          submitBtn.disabled = false;
          submitBtn.textContent = "Start a Project Inquiry";
        }
        return;
      }

      submitToGoogleForm(data);
      form.hidden = true;
      var done = document.getElementById("form-done");
      if (done) done.hidden = false;
      if (statusEl) statusEl.hidden = true;
      redirectAfterSubmit();
      submitting = false;
    });
  }

  function collectFormData(form) {
    var data = {};
    new FormData(form).forEach(function (value, key) {
      if (key === "support") {
        data.support = data.support || [];
        data.support.push(value);
      } else if (key === "attachment") {
        data.attachment = value && value.name ? value.name : "";
      } else if (key !== "privacy_consent") {
        data[key] = value;
      }
    });
    data.support_summary = (data.support || []).join(" · ");
    return data;
  }

  function submitToGoogleForm(data) {
    var cfg = window.SITE_CONFIG || {};
    if (!cfg.googleFormAction) return;
    var fields = cfg.googleFormFields || {};
    var fd = new FormData();
    var sent = false;
    Object.keys(fields).forEach(function (key) {
      var entryId = fields[key];
      if (!entryId) return;
      var val = key === "support" ? data.support_summary : data[key];
      if (val == null || val === "") return;
      fd.append(entryId, val);
      sent = true;
    });
    if (!sent) return;
    fetch(cfg.googleFormAction, { method: "POST", mode: "no-cors", body: fd }).catch(function () {});
  }

  function redirectAfterSubmit() {
    var cfg = window.SITE_CONFIG || {};
    var target = cfg.mainSiteUrl || cfg.afterSubmitRedirect || "#top";
    window.setTimeout(function () {
      if (/^https?:\/\//i.test(target)) {
        window.location.href = target;
        return;
      }
      var id = target.charAt(0) === "#" ? (target.slice(1) || "top") : "top";
      scrollToId(id);
      history.replaceState(null, "", "#" + id);
      var done = document.getElementById("form-done");
      var form = document.getElementById("lead-form");
      if (form) {
        form.hidden = false;
        form.reset();
      }
      if (done) done.hidden = true;
    }, reduceMotion ? 1400 : 2400);
  }

  function initMotion() {
    document.body.classList.add("page-ready");
    if (reduceMotion) return;
    document.querySelectorAll(".pillar-grid .pillar-card, .tile-grid .tile, .step-card").forEach(function (el, i) {
      el.style.setProperty("--reveal-delay", (i % 6) * 80 + "ms");
      el.classList.add("reveal-stagger");
    });
    var staggerObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        staggerObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".reveal-stagger").forEach(function (n) { staggerObserver.observe(n); });
  }

  function setError(field, message) {
    var wrap = field.closest(".field");
    if (!wrap) return;
    wrap.classList.toggle("is-invalid", Boolean(message));
    var err = wrap.querySelector(".field-error");
    if (err) err.textContent = message || "";
  }

  function validateField(field) {
    if (field.type === "hidden" || field.type === "file" || field.name === "support") return true;
    if (field.type === "checkbox" && field.name === "privacy_consent") {
      var ok = field.checked;
      setError(field, ok ? "" : "[TO CONFIRM: consent wording]");
      return ok;
    }
    if (field.required && !String(field.value || "").trim()) {
      setError(field, field.labels && field.labels[0] ? field.labels[0].textContent : "");
      return false;
    }
    if (field.type === "email" && field.value) {
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);
      setError(field, ok ? "" : "Work email *");
      return ok;
    }
    setError(field, "");
    return true;
  }

  function validateSupport() {
    var boxes = document.querySelectorAll('input[name="support"]');
    var ok = Array.prototype.some.call(boxes, function (b) { return b.checked; });
    var err = document.getElementById("support-error");
    if (err) err.textContent = ok ? "" : "Type of support needed *";
    return ok;
  }

  function initPresenceMap() {
    var mount = document.getElementById("presence-map-mount");
    var card = document.getElementById("presence-map-card");
    if (!mount) return;
    var src = mount.getAttribute("data-map-src");
    if (!src) return;
    fetch(src)
      .then(function (r) { return r.text(); })
      .then(function (svg) {
        mount.innerHTML = svg;
        var markers = mount.querySelectorAll(".map-marker");
        var legendItems = document.querySelectorAll(".map-legend-item[data-map-id]");
        var highlight = function (id) {
          markers.forEach(function (m) {
            m.classList.toggle("is-highlight", m.getAttribute("data-id") === id);
          });
          legendItems.forEach(function (item) {
            item.classList.toggle("is-highlight", item.getAttribute("data-map-id") === id);
          });
        };
        legendItems.forEach(function (item) {
          var id = item.getAttribute("data-map-id");
          item.addEventListener("mouseenter", function () { highlight(id); });
          item.addEventListener("focus", function () { highlight(id); });
          item.addEventListener("mouseleave", function () { highlight(null); });
          item.addEventListener("blur", function () { highlight(null); });
        });
        markers.forEach(function (marker) {
          var id = marker.getAttribute("data-id");
          marker.addEventListener("mouseenter", function () { highlight(id); });
          marker.addEventListener("focus", function () { highlight(id); });
          marker.addEventListener("mouseleave", function () { highlight(null); });
          marker.addEventListener("blur", function () { highlight(null); });
        });
      })
      .catch(function () {});
    if (card && "IntersectionObserver" in window) {
      var obs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          card.classList.add("is-in-view");
          obs.disconnect();
        }
      }, { threshold: 0.2 });
      obs.observe(card);
    }
  }

  function initSectionAnimations() {
    if (reduceMotion) return;
    var qms = document.getElementById("qms-block");
    if (qms) {
      qms.classList.add("is-animate");
      if ("IntersectionObserver" in window) {
        var qObs = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) {
            qms.classList.add("is-in-view");
            qObs.disconnect();
          }
        }, { threshold: 0.2 });
        qObs.observe(qms);
      }
    }
    var how = document.getElementById("how-block");
    if (how && "IntersectionObserver" in window) {
      var hObs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          how.classList.add("is-in-view");
          hObs.disconnect();
        }
      }, { threshold: 0.15 });
      hObs.observe(how);
    }
  }

  function initBandCta() {
    var band = document.getElementById("band-cta");
    var video = band && band.querySelector(".band-cta__video");
    if (!band || !video) return;
    var mobile = window.matchMedia("(max-width: 767px)").matches;
    var canVideo = !reduceMotion && !mobile;
    var tryPlay = function () {
      if (!canVideo) return;
      video.play().then(function () {
        band.classList.add("is-video-playing");
      }).catch(function () {});
    };
    if ("IntersectionObserver" in window) {
      var obs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          if (canVideo && !video.getAttribute("src")) {
            video.load();
          }
          tryPlay();
        } else {
          video.pause();
        }
      }, { rootMargin: "200px 0px", threshold: 0.01 });
      obs.observe(band);
    }
    window.matchMedia("(max-width: 767px)").addEventListener("change", function () {
      mobile = window.matchMedia("(max-width: 767px)").matches;
      canVideo = !reduceMotion && !mobile;
      if (!canVideo) video.pause();
    });
  }

  initHeader();
  initSmoothScroll();
  initActiveNav();
  initMobileMenu();
  hydrateMedia();
  window.addEventListener("opus:studio-mounted", hydrateMedia);
  initVideoLifecycle();
  initColorway();
  initFileUpload();
  initStats();
  initReveal();
  initForm();
  initMotion();
  initSectionAnimations();
  window.dispatchEvent(new CustomEvent("opus:media-hydrated"));
})();
