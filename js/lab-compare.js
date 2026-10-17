(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINAL = "assets/lab/shoe-final.jpg";
  var DRAWING = "assets/lab/shoe-drawing.jpg";
  var FALLBACK = "assets/media/M07.jpg";

  function imagesReady(done) {
    Promise.all([
      fetch(FINAL, { method: "HEAD" }),
      fetch(DRAWING, { method: "HEAD" }),
    ])
      .then(function (res) { done(res[0].ok && res[1].ok); })
      .catch(function () { done(false); });
  }

  function initCompareSlider() {
    var mount = document.getElementById("lab-compare");
    if (!mount) return;
    var ready = window.SITE_CONFIG && window.SITE_CONFIG.comparisonReady;
    if (!ready) {
      mount.innerHTML = '<div class="lab-compare__frame"><img src="' + FALLBACK + '" alt=""></div>';
      return;
    }

    imagesReady(function (ok) {
      if (!ok) {
        mount.innerHTML = '<div class="lab-compare__frame"><img src="' + FALLBACK + '" alt=""></div>';
        return;
      }

      mount.innerHTML =
        '<div class="compare-slider" id="compare-slider-root">' +
        '<img class="compare-slider__base" src="' + FINAL + '" alt="">' +
        '<div class="compare-slider__top"><img src="' + DRAWING + '" alt=""></div>' +
        '<span class="compare-slider__label compare-slider__label--left">Drawing</span>' +
        '<span class="compare-slider__label compare-slider__label--right">Finished shoe</span>' +
        '<div class="compare-slider__handle" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="100" aria-label="Compare drawing and finished shoe" aria-valuenow="50">' +
        '<span class="compare-slider__knob" aria-hidden="true">↔</span></div>' +
        "</div>";

      var root = mount.querySelector(".compare-slider");
      var top = root.querySelector(".compare-slider__top");
      var handle = root.querySelector(".compare-slider__handle");
      var labelLeft = root.querySelector(".compare-slider__label--left");
      var labelRight = root.querySelector(".compare-slider__label--right");
      var pos = 50;
      var userTouched = false;

      var apply = function (pct) {
        pos = Math.max(0, Math.min(100, pct));
        root.style.setProperty("--pos", pos + "%");
        top.style.clipPath = "inset(0 calc(100% - " + pos + "%) 0 0)";
        handle.style.left = pos + "%";
        handle.setAttribute("aria-valuenow", String(Math.round(pos)));
        if (labelLeft) labelLeft.style.opacity = pos <= 2 ? "0" : "1";
        if (labelRight) labelRight.style.opacity = pos >= 98 ? "0" : "1";
      };

      apply(pos);

      var move = function (clientX) {
        userTouched = true;
        var rect = root.getBoundingClientRect();
        apply(((clientX - rect.left) / rect.width) * 100);
      };

      root.addEventListener("pointerdown", function (e) {
        if (e.target.closest(".compare-slider__handle")) return;
        root.setPointerCapture(e.pointerId);
        move(e.clientX);
      });

      var dragging = false;
      handle.addEventListener("pointerdown", function (e) {
        dragging = true;
        userTouched = true;
        handle.setPointerCapture(e.pointerId);
      });
      handle.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        move(e.clientX);
      });
      handle.addEventListener("pointerup", function () { dragging = false; });
      root.addEventListener("pointerup", function () { dragging = false; });

      handle.addEventListener("keydown", function (e) {
        userTouched = true;
        if (e.key === "ArrowLeft") { e.preventDefault(); apply(pos - 5); }
        if (e.key === "ArrowRight") { e.preventDefault(); apply(pos + 5); }
        if (e.key === "Home") { e.preventDefault(); apply(0); }
        if (e.key === "End") { e.preventDefault(); apply(100); }
      });

      if (!reduceMotion && "IntersectionObserver" in window) {
        var obs = new IntersectionObserver(function (entries) {
          if (!entries[0].isIntersecting || userTouched) return;
          var start = performance.now();
          var keyframes = [50, 80, 20, 50];
          var seg = 600;
          function tick(now) {
            if (userTouched) return;
            var elapsed = now - start;
            if (elapsed >= 1800) {
              apply(50);
              obs.disconnect();
              return;
            }
            var idx = Math.min(2, Math.floor(elapsed / seg));
            var t = (elapsed % seg) / seg;
            var from = keyframes[idx];
            var to = keyframes[idx + 1];
            apply(from + (to - from) * (0.5 - 0.5 * Math.cos(Math.PI * t)));
            requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }, { threshold: 0.35 });
        obs.observe(root);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCompareSlider);
  } else {
    initCompareSlider();
  }
})();
