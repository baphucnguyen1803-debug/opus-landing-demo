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
      if (src) video.src = src;
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

  function initMap() {
    var mount = document.getElementById("presence-map-mount");
    var card = document.getElementById("presence-map-card");
    if (!mount) return;
    fetch("assets/data/eurasia-dots.json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.dots || !data.dots.length) throw new Error("empty dots");
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 " + data.width + " " + data.height);
        svg.setAttribute("role", "img");
        var gDots = document.createElementNS("http://www.w3.org/2000/svg", "g");
        data.dots.forEach(function (pt) {
          var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          c.setAttribute("cx", pt[0]);
          c.setAttribute("cy", pt[1]);
          c.setAttribute("r", "1.6");
          c.setAttribute("fill", "#D2CCC2");
          gDots.appendChild(c);
        });
        svg.appendChild(gDots);
        if (data.arc && data.arc.d) {
          var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", data.arc.d);
          path.setAttribute("fill", "none");
          path.setAttribute("stroke", "#B4532A");
          path.setAttribute("stroke-opacity", "0.6");
          path.setAttribute("stroke-width", "1.5");
          path.setAttribute("stroke-dasharray", "6 4");
          path.setAttribute("class", "map-arc");
          path.setAttribute("pathLength", "1");
          svg.appendChild(path);
        }
        (data.markers || []).forEach(function (m) {
          var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
          g.setAttribute("class", "map-marker map-marker--" + m.type);
          g.setAttribute("data-id", m.id);
          g.setAttribute("tabindex", "0");
          if (m.type === "core") {
            var pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            pulse.setAttribute("class", "map-marker__pulse");
            pulse.setAttribute("cx", m.x);
            pulse.setAttribute("cy", m.y);
            pulse.setAttribute("r", "18");
            pulse.setAttribute("fill", "none");
            pulse.setAttribute("stroke", "#B4532A");
            pulse.setAttribute("stroke-width", "1.5");
            g.appendChild(pulse);
            var dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            dot.setAttribute("class", "map-marker__dot");
            dot.setAttribute("cx", m.x);
            dot.setAttribute("cy", m.y);
            dot.setAttribute("r", "6");
            dot.setAttribute("fill", "#B4532A");
            g.appendChild(dot);
            var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", m.x + 14);
            text.setAttribute("y", m.y - 6);
            text.setAttribute("font-size", "13");
            text.setAttribute("font-family", "Inter, system-ui, sans-serif");
            text.setAttribute("fill", "#1A1A1A");
            text.textContent = m.label + (m.sub ? ", " + m.sub : "");
            g.appendChild(text);
          } else {
            var dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            dot.setAttribute("class", "map-marker__dot");
            dot.setAttribute("cx", m.x);
            dot.setAttribute("cy", m.y);
            dot.setAttribute("r", "5");
            dot.setAttribute("fill", "#F6F5F2");
            dot.setAttribute("stroke", "#B4532A");
            dot.setAttribute("stroke-width", "2");
            g.appendChild(dot);
          }
          svg.appendChild(g);
        });
        mount.innerHTML = "";
        mount.appendChild(svg);
        wireMapLegend(mount);
        if (card && "IntersectionObserver" in window) {
          var obs = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) {
              card.classList.add("is-in-view");
              obs.disconnect();
            }
          }, { threshold: 0.2 });
          obs.observe(card);
        }
      })
      .catch(function (err) {
        console.error("[OPUS map]", err);
        mount.innerHTML = '<div class="map-placeholder" role="alert">Map data unavailable</div>';
      });
  }

  function wireMapLegend(mount) {
    var markers = mount.querySelectorAll(".map-marker");
    var items = document.querySelectorAll(".map-legend-item[data-map-id]");
    var highlight = function (id) {
      markers.forEach(function (m) {
        var on = id && m.getAttribute("data-id") === id;
        m.classList.toggle("is-highlight", on);
        if (on && m.querySelector(".map-marker__dot")) {
          m.querySelector(".map-marker__dot").setAttribute("transform", "scale(1.3)");
        } else if (m.querySelector(".map-marker__dot")) {
          m.querySelector(".map-marker__dot").removeAttribute("transform");
        }
      });
      items.forEach(function (item) {
        item.classList.toggle("is-highlight", id && item.getAttribute("data-map-id") === id);
      });
    };
    items.forEach(function (item) {
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
  }

  function initCompareSlider() {
    var mount = document.getElementById("lab-compare");
    if (!mount) return;
    var ready = window.SITE_CONFIG && window.SITE_CONFIG.comparisonReady;
    if (!ready) {
      mount.innerHTML = '<div class="lab-compare__frame"><img src="assets/media/M07.jpg" alt=""></div>';
      return;
    }
    mount.innerHTML =
      '<div class="compare-slider" role="group" aria-label="CAD and 3D comparison">' +
      '<img class="compare-slider__base" src="assets/lab/render.jpg" alt="">' +
      '<div class="compare-slider__top"><img src="assets/lab/cad.jpg" alt=""></div>' +
      '<span class="compare-slider__label compare-slider__label--cad">CAD</span>' +
      '<span class="compare-slider__label compare-slider__label--render">3D</span>' +
      '<div class="compare-slider__handle" tabindex="0"><span class="compare-slider__knob" aria-hidden="true">↔</span></div>' +
      "</div>";
    var root = mount.querySelector(".compare-slider");
    var top = root.querySelector(".compare-slider__top");
    var handle = root.querySelector(".compare-slider__handle");
    if (!top || !handle) return;
    var pos = 55;
    var apply = function (pct) {
      pos = Math.max(5, Math.min(95, pct));
      top.style.clipPath = "inset(0 " + (100 - pos) + "% 0 0)";
      handle.style.left = pos + "%";
      handle.setAttribute("aria-valuenow", String(Math.round(pos)));
    };
    apply(pos);
    handle.setAttribute("role", "slider");
    handle.setAttribute("aria-valuemin", "0");
    handle.setAttribute("aria-valuemax", "100");
    handle.setAttribute("aria-label", "Compare CAD and 3D render");
    handle.setAttribute("tabindex", "0");
    var dragging = false;
    var move = function (clientX) {
      var rect = root.getBoundingClientRect();
      apply(((clientX - rect.left) / rect.width) * 100);
    };
    handle.addEventListener("pointerdown", function (e) {
      dragging = true;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      move(e.clientX);
    });
    handle.addEventListener("pointerup", function () { dragging = false; });
    handle.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); apply(pos - 5); }
      if (e.key === "ArrowRight") { e.preventDefault(); apply(pos + 5); }
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
      if (caption) caption.textContent = cap || "";
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
    var band = document.getElementById("band-cta-section");
    var video = band && band.querySelector(".band-cta__frame-video");
    if (!band || !video) return;
    var mobile = window.matchMedia("(max-width: 767px)").matches;
    var canPlay = !reduceMotion && !mobile;
    if (!canPlay) return;
    if ("IntersectionObserver" in window) {
      var obs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          video.load();
          video.play().catch(function () {});
        } else {
          video.pause();
        }
      }, { rootMargin: "200px 0px", threshold: 0.01 });
      obs.observe(band);
    }
  }

  function boot() {
    initScrollReveal();
    initHoverVideos();
    initCompareSlider();
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
