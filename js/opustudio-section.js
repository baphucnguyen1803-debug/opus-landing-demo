(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var COLORWAYS = [
    { id: "opt1", name: "Option 1", src: "assets/media/wire/opustudio/render-opt-1.jpg", swatch: "#e8e2d8" },
    { id: "opt2", name: "Option 2", src: "assets/media/wire/opustudio/render-opt-2.jpg", swatch: "#6b6b6b" },
    { id: "opt3", name: "Option 3", src: "assets/media/wire/opustudio/render-opt-3.jpg", swatch: "#b4532a" },
    { id: "opt4", name: "Option 4", src: "assets/media/wire/opustudio/render-opt-4.jpg", swatch: "#5c6b4a" },
    { id: "opt5", name: "Option 5", src: "assets/media/wire/opustudio/render-opt-5.jpg", swatch: "#1a1a1a" },
  ];

  var ECOMM_FRAMES = [
    "assets/media/wire/opustudio/ecom-opt-1.jpg",
    "assets/media/wire/opustudio/ecom-opt-2.jpg",
    "assets/media/wire/opustudio/ecom-opt-3.jpg",
  ];

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

  function initEcomSpin() {
    var wrap = document.getElementById("studio-ecom-viewer");
    var img = document.getElementById("studio-ecom-spin-img");
    var hint = document.getElementById("studio-ecom-hint");
    var dots = document.getElementById("studio-ecom-dots");
    if (!wrap || !img) return;

    var frame = 0;
    var down = false;
    var lastX = 0;

    function setFrame(i) {
      frame = (i + ECOMM_FRAMES.length) % ECOMM_FRAMES.length;
      img.src = ECOMM_FRAMES[frame];
      if (dots) {
        dots.querySelectorAll("button").forEach(function (btn, j) {
          btn.classList.toggle("is-active", j === frame);
        });
      }
    }

    setFrame(0);
    ECOMM_FRAMES.forEach(function (_, i) {
      var im = new Image();
      im.src = ECOMM_FRAMES[i];
    });

    if (dots) {
      ECOMM_FRAMES.forEach(function (_, i) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("aria-label", "View angle " + (i + 1));
        btn.addEventListener("click", function () { setFrame(i); });
        dots.appendChild(btn);
      });
    }

    var showHint = function () {
      if (!hint || reduceMotion) return;
      hint.hidden = false;
      hint.classList.remove("is-hidden");
    };
    showHint();

    wrap.addEventListener("pointerdown", function (e) {
      down = true;
      lastX = e.clientX;
      wrap.setPointerCapture(e.pointerId);
      if (hint) hint.classList.add("is-hidden");
    });
    wrap.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - lastX;
      if (Math.abs(dx) < 12) return;
      lastX = e.clientX;
      setFrame(frame + (dx > 0 ? 1 : -1));
    });
    wrap.addEventListener("pointerup", function () { down = false; });
    wrap.addEventListener("pointercancel", function () { down = false; });
  }

  function boot() {
    initRenderCard();
    initDigitalAssetVisual();
    initEcomSpin();
    window.dispatchEvent(new CustomEvent("opus:studio-mounted"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
