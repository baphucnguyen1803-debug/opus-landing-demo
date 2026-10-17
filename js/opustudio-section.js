(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var COLORWAYS = [
    { id: "sandstone", name: "Sandstone", src: "assets/media/M12-A.jpg", swatch: "#e8e2d8" },
    { id: "graphite", name: "Graphite", src: "assets/media/M12-B.jpg", swatch: "#1a1a1a" },
    { id: "terracotta", name: "Terracotta", src: "assets/media/M12-C.jpg", swatch: "#b4532a" },
    { id: "olive", name: "Olive", src: "assets/media/M12-D.jpg", swatch: "#5c6b4a" },
  ];

  var MOSAIC = [
    "assets/media/M12-A.jpg",
    "assets/media/M12-B.jpg",
    "assets/media/M12-C.jpg",
    "assets/media/M14.jpg",
    "assets/media/M16.jpg",
    "assets/media/M22-A.jpg",
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

  function initMosaic() {
    var grid = document.getElementById("studio-assets-mosaic");
    if (!grid) return;
    MOSAIC.forEach(function (src) {
      var im = document.createElement("img");
      im.src = src;
      im.alt = "";
      grid.appendChild(im);
    });
    if ("IntersectionObserver" in window) {
      var obs = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        grid.classList.add("is-in");
        grid.querySelectorAll("img").forEach(function (img, i) {
          img.style.transitionDelay = i * 40 + "ms";
        });
        obs.disconnect();
      }, { threshold: 0.2 });
      obs.observe(grid);
    }
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
    initMosaic();
    initModelViewer();
    window.dispatchEvent(new CustomEvent("opus:studio-mounted"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
