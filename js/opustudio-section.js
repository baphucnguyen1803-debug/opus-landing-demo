(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var COLORWAYS = [
    { id: "beige", name: "Nâu be", src: "assets/media/wire/opustudio/render-opt-1.jpg", swatch: "#c4a882" },
    { id: "black", name: "Đen", src: "assets/media/wire/opustudio/render-opt-2.jpg", swatch: "#1a1a1a" },
    { id: "gray", name: "Xám", src: "assets/media/wire/opustudio/render-opt-3.jpg", swatch: "#8a8a8a" },
    { id: "white", name: "Trắng", src: "assets/media/wire/opustudio/render-opt-4.jpg", swatch: "#f0ece6" },
    { id: "pink", name: "Hồng", src: "assets/media/wire/opustudio/render-opt-5.jpg", swatch: "#d4a0a8" },
  ];

  var ECOMM_VARIANTS = [
    { id: "brown", name: "Nâu", src: "assets/media/wire/opustudio/ecom-opt-1.jpg", swatch: "#8b5a3c" },
    { id: "white", name: "Trắng", src: "assets/media/wire/opustudio/ecom-opt-2.jpg", swatch: "#f2f0ec" },
    { id: "red", name: "Đỏ", src: "assets/media/wire/opustudio/ecom-opt-3.jpg", swatch: "#b83232" },
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

  function initEcomViewer() {
    var mv = document.getElementById("studio-shoe-model");
    var productImg = document.getElementById("studio-ecom-product-img");
    var hint = document.getElementById("studio-ecom-hint");
    var swatches = document.getElementById("studio-ecom-swatches");
    var view3dBtn = document.getElementById("studio-ecom-view-3d");
    if (!mv || !swatches) return;

    var mode = "3d";
    var variantIdx = 0;

    function showHint() {
      if (!hint || reduceMotion) return;
      hint.hidden = false;
      hint.classList.remove("is-hidden");
    }

    function setMode(next) {
      mode = next;
      var is3d = mode === "3d";
      mv.classList.toggle("is-hidden", !is3d);
      if (productImg) productImg.classList.toggle("is-hidden", is3d);
      if (view3dBtn) view3dBtn.hidden = is3d;
      if (hint) {
        hint.innerHTML = is3d
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 13V8.5a2.5 2.5 0 0 1 5 0V13"/><path d="M6 13h12l-1 8H7l-1-8z"/></svg> Drag to rotate'
          : "Product view";
      }
    }

    function setVariant(i) {
      variantIdx = i;
      var v = ECOMM_VARIANTS[i];
      if (productImg) productImg.src = v.src;
      mv.setAttribute("poster", v.src);
      swatches.querySelectorAll("button").forEach(function (btn, j) {
        btn.classList.toggle("is-selected", j === i);
      });
      setMode("photo");
    }

    ECOMM_VARIANTS.forEach(function (v, i) {
      var btn = window.OpusSwatch
        ? window.OpusSwatch.createButton({ label: v.name, color: v.swatch, role: "option" })
        : document.createElement("button");
      if (!window.OpusSwatch) {
        btn.type = "button";
        btn.title = v.name;
        btn.setAttribute("aria-label", v.name);
        btn.style.background = v.swatch;
      }
      applySampledSwatch(btn, v.src, v.swatch);
      btn.addEventListener("click", function () { setVariant(i); });
      swatches.appendChild(btn);
    });

    if (view3dBtn) {
      view3dBtn.addEventListener("click", function () { setMode("3d"); });
    }

    mv.addEventListener("load", showHint);
    mv.addEventListener("camera-change", function () {
      if (hint) hint.classList.add("is-hidden");
    }, { once: true });

    setMode("3d");
    ECOMM_VARIANTS.forEach(function (v) {
      var im = new Image();
      im.src = v.src;
    });
  }

  function boot() {
    initRenderCard();
    initDigitalAssetVisual();
    initEcomViewer();
    window.dispatchEvent(new CustomEvent("opus:studio-mounted"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
