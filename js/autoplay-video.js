(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var CARD_THRESHOLD = 0.3;

  function initRoot(root) {
    if (root.getAttribute("data-av-init")) return;
    root.setAttribute("data-av-init", "1");

    var mp4 = root.getAttribute("data-mp4");
    var webm = root.getAttribute("data-webm");
    var poster = root.getAttribute("data-poster");
    var fallback = root.getAttribute("data-fallback-image");
    var card = root.closest(".pillar-card") || root.closest("article") || root.parentElement;

    var mediaWrap = document.createElement("div");
    mediaWrap.className = "autoplay-video__media";

    var badge = document.createElement("span");
    badge.className = "autoplay-video__badge";
    badge.setAttribute("aria-hidden", "true");
    badge.innerHTML = "&#10074;&#10074;";

    var playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "autoplay-video__play";
    playBtn.setAttribute("aria-label", "Play video");
    playBtn.textContent = "▶";

    var inView = false;
    var hoverPaused = false;
    var userPaused = false;
    var video = null;

    function showFallback() {
      if (!fallback) return;
      var img = document.createElement("img");
      img.src = fallback;
      img.alt = "";
      img.className = "autoplay-video__poster";
      mediaWrap.appendChild(img);
      root.classList.add("is-fallback");
    }

    function canPlay() {
      return inView && !hoverPaused && !userPaused && !reduceMotion;
    }

    function tryPlay() {
      if (!video || !canPlay()) return;
      video.play().catch(function () {});
    }

    function tryPause() {
      if (!video) return;
      video.pause();
    }

    function syncPlayback() {
      if (canPlay()) tryPlay();
      else tryPause();
    }

    function setHoverPaused(on) {
      hoverPaused = on;
      root.classList.toggle("is-paused", on || (userPaused && !finePointer));
      syncPlayback();
    }

    function assetOk(url, next) {
      if (!url) {
        next(false);
        return;
      }
      fetch(url, { method: "HEAD" })
        .then(function (r) { next(r.ok); })
        .catch(function () { next(false); });
    }

    assetOk(mp4, function (okMp4) {
      if (okMp4) {
        buildVideo(mp4, webm);
        return;
      }
      assetOk(webm, function (okWebm) {
        if (okWebm) buildVideo(null, webm);
        else showFallback();
      });
    });

    function buildVideo(srcMp4, srcWebm) {
      video = document.createElement("video");
      video.className = "autoplay-video__video";
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.preload = "metadata";
      if (poster) video.poster = poster;
      if (srcWebm) {
        var sW = document.createElement("source");
        sW.src = srcWebm;
        sW.type = "video/webm";
        video.appendChild(sW);
      }
      if (srcMp4) {
        var sM = document.createElement("source");
        sM.src = srcMp4;
        sM.type = "video/mp4";
        video.appendChild(sM);
      }
      mediaWrap.appendChild(video);
      root.classList.add("is-video");

      if (reduceMotion) {
        root.classList.add("is-reduced");
        return;
      }

      if (card && finePointer) {
        card.addEventListener("mouseenter", function () { setHoverPaused(true); });
        card.addEventListener("mouseleave", function () { setHoverPaused(false); });
        card.addEventListener("focusin", function () { setHoverPaused(true); });
        card.addEventListener("focusout", function () {
          if (!card.contains(document.activeElement)) setHoverPaused(false);
        });
      }

      if (!finePointer) {
        mediaWrap.addEventListener("click", function () {
          userPaused = !userPaused;
          root.classList.toggle("is-paused", userPaused);
          syncPlayback();
        });
      }

      playBtn.addEventListener("click", function () {
        userPaused = false;
        root.classList.remove("is-paused");
        tryPlay();
      });

      if ("IntersectionObserver" in window && card) {
        var obs = new IntersectionObserver(function (entries) {
          inView = entries[0].intersectionRatio >= CARD_THRESHOLD;
          syncPlayback();
        }, { threshold: [0, 0.3, 0.5, 1] });
        obs.observe(card);
      } else {
        inView = true;
        syncPlayback();
      }
    }

    root.appendChild(mediaWrap);
    root.appendChild(badge);
    root.appendChild(playBtn);
  }

  function boot() {
    document.querySelectorAll(".autoplay-video").forEach(initRoot);
  }

  window.initAutoplayVideos = boot;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.addEventListener("opus:media-hydrated", boot);
})();
