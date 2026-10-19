(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var COLORWAYS = [
    { id: "beige", name: "Beige", src: "assets/media/wire/opustudio/render-opt-1.jpg", swatch: "#c4a882" },
    { id: "black", name: "Black", src: "assets/media/wire/opustudio/render-opt-2.jpg", swatch: "#1a1a1a" },
    { id: "gray", name: "Gray", src: "assets/media/wire/opustudio/render-opt-3.jpg", swatch: "#8a8a8a" },
    { id: "white", name: "White", src: "assets/media/wire/opustudio/render-opt-4.jpg", swatch: "#f0ece6" },
    { id: "pink", name: "Pink", src: "assets/media/wire/opustudio/render-opt-5.jpg", swatch: "#d4a0a8" },
  ];

  function applySampledSwatch(btn, src, fallback) {
    if (!window.OpusColorSample || !btn) {
      if (window.OpusSwatch) window.OpusSwatch.apply(btn, fallback);
      return;
    }
    window.OpusColorSample.sampleFromUrl(src, { x: 0.34, y: 0.4, w: 0.2, h: 0.16 }, function (color) {
      if (window.OpusSwatch) window.OpusSwatch.apply(btn, color || fallback);
    });
  }

  function initRenderCard() {
    var card = document.getElementById("studio-render-card");
    var img = document.getElementById("studio-render-img");
    var nameEl = document.getElementById("studio-colorway-name");
    var swatches = document.getElementById("studio-render-swatches");
    if (!card || !img || !swatches) return;

    var idx = 0;
    var userTouched = false;
    var cycleTimer = null;
    var preloaded = false;

    function setColorway(i) {
      idx = i;
      var cw = COLORWAYS[i];
      img.style.opacity = "0";
      img.onload = function () { img.style.opacity = "1"; };
      img.src = cw.src;
      if (nameEl) nameEl.textContent = cw.name;
      swatches.querySelectorAll("button").forEach(function (btn, j) {
        btn.classList.toggle("is-selected", j === i);
        btn.setAttribute("aria-selected", j === i ? "true" : "false");
      });
    }

    COLORWAYS.forEach(function (cw, i) {
      var btn = window.OpusSwatch
        ? window.OpusSwatch.createButton({ label: cw.name, color: cw.swatch, role: "option" })
        : document.createElement("button");
      if (!window.OpusSwatch) {
        btn.type = "button";
        btn.title = cw.name;
        btn.setAttribute("aria-label", cw.name);
        btn.style.background = cw.swatch;
        btn.setAttribute("role", "option");
      }
      applySampledSwatch(btn, cw.src, cw.swatch);
      btn.addEventListener("click", function () {
        userTouched = true;
        if (cycleTimer) clearInterval(cycleTimer);
        setColorway(i);
      });
      swatches.appendChild(btn);
    });
    setColorway(0);

    function preload() {
      if (preloaded) return;
      preloaded = true;
      COLORWAYS.forEach(function (cw) {
        var im = new Image();
        im.src = cw.src;
      });
    }

    function startCycle() {
      if (reduceMotion || userTouched) return;
      var step = 0;
      cycleTimer = setInterval(function () {
        step += 1;
        if (step >= COLORWAYS.length) {
          clearInterval(cycleTimer);
          return;
        }
        setColorway(step);
      }, 1600);
    }

    if ("IntersectionObserver" in window) {
      var obs = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        preload();
        startCycle();
        obs.disconnect();
      }, { threshold: 0.25 });
      obs.observe(card);
    }

    card.addEventListener("pointerdown", function () { userTouched = true; if (cycleTimer) clearInterval(cycleTimer); });
  }

  function initDigitalAssetVisual() {
    var img = document.getElementById("studio-digital-asset-img");
    if (!img) return;
    img.src = "assets/media/wire/opustudio/digital-asset.jpg";
  }

  function initModelViewer() {
    var mv = document.getElementById("studio-shoe-model");
    var hint = document.getElementById("studio-ecom-hint");
    var variants = document.getElementById("studio-model-variants");
    if (!mv) return;

    var showHint = function () {
      if (!hint || reduceMotion) return;
      hint.hidden = false;
      hint.classList.remove("is-hidden");
    };

    mv.addEventListener("load", function () {
      showHint();
      if (variants && mv.availableVariants && mv.availableVariants.length) {
        variants.hidden = false;
        var variantColors = {
          midnight: "#1a1a1a",
          beach: "#e8e2d8",
          street: "#6b6b6b",
        };
        mv.availableVariants.forEach(function (name) {
          var btn = window.OpusSwatch
            ? window.OpusSwatch.createButton({ label: name, color: variantColors[name] || "#888", role: "button" })
            : document.createElement("button");
          if (!window.OpusSwatch) {
            btn.type = "button";
            btn.title = name;
            btn.setAttribute("aria-label", name);
          }
          btn.addEventListener("click", function () { mv.variantName = name; });
          variants.appendChild(btn);
        });
      }
    });

    mv.addEventListener("camera-change", function () {
      if (hint) hint.classList.add("is-hidden");
    }, { once: true });

    mv.addEventListener("error", function () {
      if (hint) hint.hidden = true;
    });
  }

  function boot() {
    initRenderCard();
    initDigitalAssetVisual();
    initModelViewer();
    window.dispatchEvent(new CustomEvent("opus:studio-mounted"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
