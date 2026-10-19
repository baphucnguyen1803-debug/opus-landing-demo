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
    var panelImg = document.getElementById("tech-showcase-img");
    var caption = document.getElementById("tech-showcase-caption");
    var picks = document.querySelectorAll(".tech-pick");
    if (!panelImg || !picks.length) return;
    var show = function (item) {
      picks.forEach(function (p) {
        p.classList.toggle("is-active", p === item);
      });
      var src = item.getAttribute("data-media");
      var cap = item.getAttribute("data-caption");
      panelImg.style.opacity = "0";
      panelImg.onload = function () { panelImg.style.opacity = "1"; };
      panelImg.onerror = function () {
        panelImg.src = "assets/media/M19-A.jpg";
      };
      panelImg.src = src || "assets/media/M19-A.jpg";
      if (caption && caption.offsetParent !== null) caption.textContent = cap || "";
    };
    picks.forEach(function (pick) {
      pick.addEventListener("mouseenter", function () { show(pick); });
      pick.addEventListener("focus", function () { show(pick); });
      pick.addEventListener("click", function () { show(pick); });
    });
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
