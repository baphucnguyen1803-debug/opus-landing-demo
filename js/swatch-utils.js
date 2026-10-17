(function () {
  "use strict";

  var CARD_BG = { r: 26, g: 26, b: 26 };

  function parseColor(css) {
    if (!css) return null;
    var hex = css.trim();
    if (hex.startsWith("#")) {
      var h = hex.slice(1);
      if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
      if (h.length === 6) {
        return {
          r: parseInt(h.slice(0, 2), 16),
          g: parseInt(h.slice(2, 4), 16),
          b: parseInt(h.slice(4, 6), 16),
        };
      }
    }
    var m = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) return { r: +m[1], g: +m[2], b: +m[3] };
    return null;
  }

  function luminance(rgb) {
    var f = function (c) {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(rgb.r) + 0.7152 * f(rgb.g) + 0.0722 * f(rgb.b);
  }

  function contrastRatio(l1, l2) {
    var a = Math.max(l1, l2);
    var b = Math.min(l1, l2);
    return (a + 0.05) / (b + 0.05);
  }

  function applySwatchStyles(btn, colorCss) {
    if (!btn) return;
    btn.style.background = colorCss || btn.style.background;
    btn.classList.add("colorway-swatch");
    var rgb = parseColor(colorCss || btn.style.background);
    if (!rgb) return;
    var cardL = luminance(CARD_BG);
    var swL = luminance(rgb);
    var ratio = contrastRatio(cardL, swL);
    if (ratio < 1.8) {
      btn.classList.add("colorway-swatch--low-contrast");
    } else {
      btn.classList.remove("colorway-swatch--low-contrast");
    }
  }

  window.OpusSwatch = {
    apply: applySwatchStyles,
    createButton: function (opts) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("role", opts.role || "option");
      if (opts.label) {
        btn.title = opts.label;
        btn.setAttribute("aria-label", opts.label);
      }
      applySwatchStyles(btn, opts.color);
      return btn;
    },
  };
})();
