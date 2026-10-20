(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function initScrollReveal() {
    if (reduceMotion) {
      document.querySelectorAll(".sr-in").forEach(function (n) { n.classList.add("is-visible"); });
      return;
    }
    var nodes = document.querySelectorAll(".sr-in");
    if (!nodes.length || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var parent = el.parentElement;
        if (parent && !parent.classList.contains("sr-stagger")) {
          var sibs = Array.prototype.filter.call(parent.children, function (c) {
            return c.classList && c.classList.contains("sr-in");
          });
          var idx = sibs.indexOf(el);
          if (idx > 0) el.style.transitionDelay = idx * 80 + "ms";
        }
        el.classList.add("is-visible");
        observer.unobserve(el);
      });
    }, { threshold: 0.15 });
    nodes.forEach(function (n) { observer.observe(n); });
  }

  function initHoverVideos() {
    document.querySelectorAll(".hover-video:not([data-hv-init])").forEach(function (root) {
      root.setAttribute("data-hv-init", "1");
      var poster = root.getAttribute("data-poster");
      var src = root.getAttribute("data-video");
      if (!poster && !src) return;
      var img = document.createElement("img");
      img.className = "hover-video__poster";
      img.src = poster || src;
      img.alt = "";
      var video = document.createElement("video");
      video.className = "hover-video__video";
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.preload = "none";
      if (src) {
        video.src = typeof window.resolveMediaUrl === "function" ? window.resolveMediaUrl(src) : src;
      }
      root.appendChild(img);
      root.appendChild(video);
      if (reduceMotion || !finePointer) return;
      var play = function () {
        if (!src) return;
        root.classList.add("is-playing");
        video.play().catch(function () {});
      };
      var stop = function () {
        root.classList.remove("is-playing");
        video.pause();
        video.currentTime = 0;
      };
      root.addEventListener("mouseenter", play);
      root.addEventListener("focusin", play);
      root.addEventListener("mouseleave", stop);
      root.addEventListener("focusout", stop);
    });
  }

  function initStageMarkers() {
    var wrap = document.querySelector(".stages__visual");
    if (!wrap) return;
    var positions = [
      { left: "12%", top: "55%" },
      { left: "28%", top: "48%" },
      { left: "50%", top: "52%" },
      { left: "72%", top: "46%" },
      { left: "88%", top: "58%" },
    ];
    positions.forEach(function (p, i) {
      var el = document.createElement("span");
      el.className = "stage-marker";
      el.style.left = p.left;
      el.style.top = p.top;
      el.setAttribute("data-stage", String(i));
      wrap.appendChild(el);
    });
    document.querySelectorAll(".stage-card").forEach(function (card, i) {
      card.setAttribute("tabindex", "0");
      var show = function () {
        wrap.querySelectorAll(".stage-marker").forEach(function (m, j) {
          m.classList.toggle("is-on", j === i);
        });
      };
      var hide = function () {
        wrap.querySelectorAll(".stage-marker").forEach(function (m) { m.classList.remove("is-on"); });
      };
      card.addEventListener("mouseenter", show);
      card.addEventListener("focus", show);
      card.addEventListener("mouseleave", hide);
      card.addEventListener("blur", hide);
    });
  }

  function initBento() {
    var renderCard = document.querySelector(".bento-card--render");
    if (renderCard) {
      var imgs = [
        "assets/media/M12-A.jpg",
        "assets/media/M12-B.jpg",
        "assets/media/M12-C.jpg",
        "assets/media/M12-D.jpg",
      ];
      var media = renderCard.querySelector(".bento-render-img");
      var dots = renderCard.querySelectorAll(".colorway-dots button");
      var idx = 0;
      var timer = null;
      var setImg = function (i) {
        idx = i;
        if (media) {
          media.style.opacity = "0";
          media.onload = function () { media.style.opacity = "1"; };
          media.src = imgs[i];
        }
        dots.forEach(function (d, j) { d.classList.toggle("is-active", j === i); });
      };
      dots.forEach(function (btn, i) {
        btn.addEventListener("click", function () { setImg(i); });
      });
      renderCard.addEventListener("mouseenter", function () {
        if (reduceMotion) return;
        timer = setInterval(function () { setImg((idx + 1) % imgs.length); }, 900);
      });
      renderCard.addEventListener("mouseleave", function () {
        if (timer) clearInterval(timer);
      });
    }
    var thumbGrid = document.querySelector(".thumb-grid");
    if (thumbGrid && "IntersectionObserver" in window) {
      var obs = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        thumbGrid.classList.add("is-in");
        var imgs = thumbGrid.querySelectorAll("img");
        imgs.forEach(function (img, i) {
          img.style.animationDelay = i * 40 + "ms";
        });
        obs.disconnect();
      }, { threshold: 0.2 });
      obs.observe(thumbGrid);
    }
    initSpinViewer();
  }

  function initSpinViewer() {
    var el = document.querySelector(".spin-viewer");
    if (!el) return;
    var img = el.querySelector("img");
    if (!img) return;
    var frame = 1;
    var max = 36;
    var down = false;
    var lastX = 0;
    el.addEventListener("pointerdown", function (e) {
      down = true;
      lastX = e.clientX;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - lastX;
      if (Math.abs(dx) < 8) return;
      lastX = e.clientX;
      frame = (frame + (dx > 0 ? 1 : -1) + max) % max;
      if (frame === 0) frame = max;
      var pad = String(frame).padStart(3, "0");
      var test = new Image();
      test.onload = function () { img.src = "assets/studio/spin/" + pad + ".jpg"; };
      test.onerror = function () {};
      test.src = "assets/studio/spin/" + pad + ".jpg";
    });
    el.addEventListener("pointerup", function () { down = false; });
  }

  function initTechShowcase() {
    var items = window.TECH_SHOWCASE_ITEMS;
    var root = document.getElementById("tech-showcase");
    var mediaWrap = document.getElementById("tech-showcase-media");
    var panelImg = document.getElementById("tech-showcase-img");
    var videoSlot = document.getElementById("tech-showcase-video-slot");
    var counterEl = document.getElementById("tech-showcase-counter");
    var titleEl = document.getElementById("tech-showcase-item-title");
    var contextEl = document.getElementById("tech-showcase-context");
    var listHost = document.getElementById("tech-showcase-list-host");
    var chipsHost = document.getElementById("tech-showcase-chips-host");
    if (!root || !items || !items.length || !panelImg || !listHost || !chipsHost) return;
    if (root.getAttribute("data-ts-init")) return;
    root.setAttribute("data-ts-init", "1");

    var tabs = [];
    var chips = [];
    var pinned = 0;
    var activeVideo = null;
    var tablist = document.createElement("div");
    tablist.className = "tech-showcase__tablist";
    tablist.setAttribute("role", "tablist");
    tablist.setAttribute("aria-label", "Technical applications");

    var lastGroup = "";
    items.forEach(function (item, index) {
      if (item.group !== lastGroup) {
        lastGroup = item.group;
        var gh = document.createElement("h4");
        gh.className = "tech-showcase__group-title";
        gh.textContent = item.group;
        tablist.appendChild(gh);
      }
      var tab = document.createElement("button");
      tab.type = "button";
      tab.className = "tech-showcase__tab" + (index === 0 ? " is-active" : "");
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", index === 0 ? "true" : "false");
      tab.setAttribute("tabindex", index === 0 ? "0" : "-1");
      tab.setAttribute("data-index", String(index));
      tab.innerHTML =
        '<span class="tech-showcase__tab-index">' +
        String(index + 1).padStart(2, "0") +
        "</span><span class=\"tech-showcase__tab-label\">" +
        item.name +
        "</span>";
      tablist.appendChild(tab);
      tabs.push(tab);
    });
    listHost.appendChild(tablist);

    var chipGroups = {};
    items.forEach(function (item, index) {
      if (!chipGroups[item.group]) chipGroups[item.group] = [];
      chipGroups[item.group].push({ item: item, index: index });
    });
    Object.keys(chipGroups).forEach(function (groupName) {
      var block = document.createElement("div");
      block.className = "tech-showcase__chip-block";
      var label = document.createElement("p");
      label.className = "tech-showcase__chip-group-label";
      label.textContent = groupName;
      var row = document.createElement("div");
      row.className = "tech-showcase__chip-row";
      chipGroups[groupName].forEach(function (entry) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "tech-showcase__chip" + (entry.index === 0 ? " is-active" : "");
        chip.textContent = entry.item.name;
        chip.setAttribute("data-index", String(entry.index));
        row.appendChild(chip);
        chips.push(chip);
      });
      block.appendChild(label);
      block.appendChild(row);
      chipsHost.appendChild(block);
    });

    function mediaUrl(path) {
      var url = path || "assets/media/M19-A.jpg";
      if (typeof window.resolveMediaUrl === "function") url = window.resolveMediaUrl(url);
      return url;
    }

    function padIndex(i) {
      return String(i + 1).padStart(2, "0") + " / " + String(items.length).padStart(2, "0");
    }

    function setActiveUi(index) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.setAttribute("tabindex", on ? "0" : "-1");
      });
      chips.forEach(function (chip) {
        var i = Number(chip.getAttribute("data-index"));
        chip.classList.toggle("is-active", i === index);
      });
    }

    function pauseTechVideo() {
      if (activeVideo) {
        activeVideo.pause();
        activeVideo = null;
      }
      if (videoSlot) {
        videoSlot.hidden = true;
        videoSlot.replaceChildren();
      }
    }

    function mountTechVideo(item) {
      pauseTechVideo();
      if (!item.video || !window.OpusVideo) return;
      var src = item.video;
      if (typeof src === "object" && window.OpusVideo.pickSrc) src = window.OpusVideo.pickSrc(src);
      if (!src) return;
      var video = window.OpusVideo.createVideoElement({ src: src, poster: item.media });
      video.className = "tech-showcase__video";
      if (item.videoDuration) video.loop = true;
      videoSlot.hidden = false;
      videoSlot.appendChild(video);
      panelImg.classList.add("is-hidden");
      if (window.OpusVideo.assignSrc) window.OpusVideo.assignSrc(video, src);
      else video.src = window.OpusVideo.encodePath(src);
      video.play().catch(function () {});
      activeVideo = video;
    }

    function showIndex(index, pin) {
      if (index < 0 || index >= items.length) return;
      if (pin) pinned = index;
      var item = items[index];
      setActiveUi(index);
      if (counterEl) counterEl.textContent = padIndex(index);
      if (titleEl) titleEl.textContent = item.name;
      if (contextEl) contextEl.textContent = item.context || "";

      if (mediaWrap) mediaWrap.classList.add("is-loading");
      window.setTimeout(function () {
        if (mediaWrap) mediaWrap.classList.remove("is-loading");
      }, 220);

      if (item.video) {
        mountTechVideo(item);
      } else {
        pauseTechVideo();
        panelImg.classList.remove("is-hidden");
        panelImg.style.opacity = "0";
        panelImg.onload = function () {
          panelImg.style.opacity = "1";
        };
        panelImg.onerror = function () {
          panelImg.src = mediaUrl("assets/media/M19-A.jpg");
        };
        panelImg.src = mediaUrl(item.media);
      }
    }

    function focusTab(index) {
      var tab = tabs[index];
      if (tab) tab.focus();
    }

    function focusedTabIndex() {
      var active = document.activeElement;
      if (active && active.classList.contains("tech-showcase__tab")) {
        return Number(active.getAttribute("data-index"));
      }
      return pinned;
    }

    tablist.addEventListener("keydown", function (e) {
      var current = focusedTabIndex();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        var next = Math.min(items.length - 1, current + 1);
        showIndex(next, false);
        focusTab(next);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        var prev = Math.max(0, current - 1);
        showIndex(prev, false);
        focusTab(prev);
      } else if (e.key === "Home") {
        e.preventDefault();
        showIndex(0, false);
        focusTab(0);
      } else if (e.key === "End") {
        e.preventDefault();
        showIndex(items.length - 1, false);
        focusTab(items.length - 1);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showIndex(focusedTabIndex(), true);
      }
    });

    tabs.forEach(function (tab) {
      var index = Number(tab.getAttribute("data-index"));
      tab.addEventListener("click", function () {
        showIndex(index, true);
      });
      if (finePointer) {
        tab.addEventListener("mouseenter", function () {
          showIndex(index, false);
        });
        tab.addEventListener("mouseleave", function () {
          showIndex(pinned, false);
        });
      }
      tab.addEventListener("focus", function () {
        showIndex(index, false);
      });
      tab.addEventListener("blur", function () {
        window.setTimeout(function () {
          if (!tablist.contains(document.activeElement)) showIndex(pinned, false);
        }, 0);
      });
    });

    chips.forEach(function (chip) {
      var index = Number(chip.getAttribute("data-index"));
      chip.addEventListener("click", function () {
        showIndex(index, true);
        chip.scrollIntoView({ inline: "center", block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
      });
    });

    showIndex(0, true);
    panelImg.alt = items[0].name;
  }

  function initCategoryCarousel() {
    var track = document.getElementById("cat-track");
    if (!track) return;
    var wrap = track.closest(".cat-track-wrap");
    var prev = wrap && wrap.querySelector(".cat-nav--prev");
    var next = wrap && wrap.querySelector(".cat-nav--next");
    var step = function () { return Math.min(track.clientWidth * 0.85, 320); };
    var sync = function () {
      var max = track.scrollWidth - track.clientWidth - 2;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max;
    };
    if (prev) prev.addEventListener("click", function () {
      track.scrollBy({ left: -step(), behavior: reduceMotion ? "auto" : "smooth" });
    });
    if (next) next.addEventListener("click", function () {
      track.scrollBy({ left: step(), behavior: reduceMotion ? "auto" : "smooth" });
    });
    track.addEventListener("scroll", sync, { passive: true });
    track.setAttribute("tabindex", "0");
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") track.scrollBy({ left: step(), behavior: "smooth" });
      if (e.key === "ArrowLeft") track.scrollBy({ left: -step(), behavior: "smooth" });
    });
    var isDown = false;
    var startX = 0;
    var scrollLeft = 0;
    track.addEventListener("mousedown", function (e) {
      isDown = true;
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });
    track.addEventListener("mouseleave", function () { isDown = false; });
    track.addEventListener("mouseup", function () { isDown = false; });
    track.addEventListener("mousemove", function (e) {
      if (!isDown) return;
      e.preventDefault();
      var x = e.pageX - track.offsetLeft;
      track.scrollLeft = scrollLeft - (x - startX) * 1.2;
    });
    sync();
    window.addEventListener("resize", sync);
  }

  function initBandCtaVideo() {
    /* Band CTA uses a static image (About OPUS 6). */
  }

  function boot() {
    initScrollReveal();
    initHoverVideos();
    initStageMarkers();
    initTechShowcase();
    initCategoryCarousel();
    initBandCtaVideo();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.addEventListener("opus:media-hydrated", function () {
    initHoverVideos();
  });
})();
