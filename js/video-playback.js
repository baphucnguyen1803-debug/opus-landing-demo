/* Shared muted-loop video lifecycle for hero, pillars, media slots, OPUSlab stage, About */
(function (global) {
  "use strict";

  var MAX_PLAYING = 3;
  var playing = [];
  var userGestureUnlocked = false;
  var reduceMotion = global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var conn = global.navigator.connection || global.navigator.mozConnection || global.navigator.webkitConnection;
  var saveData = !!(conn && conn.saveData);
  var slowNet =
    saveData ||
    (conn && (conn.effectiveType === "slow-2g" || conn.effectiveType === "2g"));
  var postersOnly = reduceMotion || slowNet;
  var mobileMq = global.matchMedia("(max-width: 768px)");

  function encodePath(path) {
    if (!path || typeof path !== "string") return path;
    if (/^https?:\/\//i.test(path)) return path;
    if (typeof global.resolveMediaUrl === "function") return global.resolveMediaUrl(path);
    var q = path.indexOf("?");
    var base = q === -1 ? path : path.slice(0, q);
    var query = q === -1 ? "" : path.slice(q);
    var slash = base.lastIndexOf("/");
    if (slash === -1) return encodeURIComponent(base) + query;
    return base.slice(0, slash + 1) + encodeURIComponent(base.slice(slash + 1)) + query;
  }

  function pickSrc(entry) {
    if (!entry) return "";
    if (typeof entry === "string") return entry;
    if (mobileMq.matches && entry.mobile) return entry.mobile;
    return entry.desktop || entry.src || "";
  }

  function pickPoster(entry) {
    if (!entry || typeof entry !== "object") return "";
    return entry.poster || "";
  }

  function ensurePlayButton(wrap, video) {
    if (wrap.querySelector(".video-play-fallback")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "video-play-fallback";
    btn.setAttribute("aria-label", "Play video");
    btn.textContent = "▶";
    btn.addEventListener("click", function () {
      userGestureUnlocked = true;
      video.play().catch(function () {});
      btn.hidden = true;
    });
    wrap.appendChild(btn);
  }

  function registerPlaying(video, slot) {
    var item = { video: video, slot: slot, ratio: 0 };
    playing.push(item);
    if (playing.length > MAX_PLAYING) {
      playing.sort(function (a, b) { return a.ratio - b.ratio; });
      var drop = playing.shift();
      if (drop && drop.video) drop.video.pause();
    }
    return item;
  }

  function unregisterPlaying(video) {
    playing = playing.filter(function (p) { return p.video !== video; });
  }

  function tryPlay(video, wrap) {
    if (postersOnly) {
      ensurePlayButton(wrap, video);
      return;
    }
    video.play().catch(function () {
      ensurePlayButton(wrap, video);
    });
  }

  function unlockOnGesture() {
    if (userGestureUnlocked) return;
    userGestureUnlocked = true;
    document.querySelectorAll(".media-slot video, .autoplay-video video, .opuslab-stage__video").forEach(function (v) {
      var slot = v.closest(".media-slot, .autoplay-video, .opuslab-stage");
      if (!slot) return;
      var r = slot.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        v.play().catch(function () {});
      }
    });
  }

  ["pointerdown", "touchstart", "keydown", "scroll"].forEach(function (ev) {
    document.addEventListener(ev, unlockOnGesture, { once: false, passive: true });
  });

  function assignSrc(video, url) {
    if (!url || video.getAttribute("src")) return;
    video.src = encodePath(url);
    video.load();
  }

  function createVideoElement(opts) {
    var video = document.createElement("video");
    video.setAttribute("muted", "");
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.loop = true;
    video.preload = opts.hero ? "auto" : "none";
    if (opts.poster) video.poster = encodePath(opts.poster);
    if (opts.hero && opts.src) {
      video.src = encodePath(opts.src);
    } else if (opts.src) {
      video.setAttribute("data-src", encodePath(opts.src));
    }
    video.addEventListener("error", function () {
      var err = video.error;
      console.warn("[video]", video.currentSrc || video.getAttribute("data-src"), err ? err.code : "unknown");
      var wrap = video.parentElement;
      if (wrap) ensurePlayButton(wrap, video);
    });
    return video;
  }

  function bindLifecycle(video, slot, opts) {
    opts = opts || {};
    var wrap = slot;
    if (!("IntersectionObserver" in global)) {
      if (!postersOnly && video.getAttribute("data-src")) assignSrc(video, video.getAttribute("data-src"));
      tryPlay(video, wrap);
      return;
    }
    var trackItem = null;
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var ratio = entry.intersectionRatio;
          if (trackItem) trackItem.ratio = ratio;
          if (entry.isIntersecting && ratio >= 0.25) {
            if (!opts.hero && video.getAttribute("data-src")) {
              assignSrc(video, video.getAttribute("data-src"));
            }
            trackItem = registerPlaying(video, slot);
            trackItem.ratio = ratio;
            var onReady = function () { tryPlay(video, wrap); };
            if (video.readyState >= 2) onReady();
            else video.addEventListener("loadeddata", onReady, { once: true });
          } else if (!entry.isIntersecting || ratio < 0.1) {
            video.pause();
            unregisterPlaying(video);
          }
        });
      },
      { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1], rootMargin: "100% 0px" }
    );
    observer.observe(slot);
  }

  function mountInSlot(slot, entry, options) {
    options = options || {};
    var src = pickSrc(entry);
    var poster = pickPoster(entry) || (typeof entry === "object" && entry.poster) || "";
    if (typeof entry === "object" && !poster && entry.poster) poster = entry.poster;
    var hero = options.hero || slot.classList.contains("media-slot--hero");
    var video = createVideoElement({ hero: hero, src: src, poster: poster });
    slot.replaceChildren(video);
    slot.classList.add("is-filled");
    bindLifecycle(video, slot, { hero: hero });
    return video;
  }

  function mountAutoplayRoot(root) {
    if (root.getAttribute("data-vp-init")) return;
    root.setAttribute("data-vp-init", "1");
    var mp4 = root.getAttribute("data-mp4");
    var poster = root.getAttribute("data-poster");
    var fallback = root.getAttribute("data-fallback-image");
    var wrap = document.createElement("div");
    wrap.className = "autoplay-video__media";
    var video = createVideoElement({ src: mp4, poster: poster });
    wrap.appendChild(video);
    root.appendChild(wrap);
    root.classList.add("is-video");
    bindLifecycle(video, root);
    if (!mp4 && fallback) {
      var img = document.createElement("img");
      img.src = encodePath(fallback);
      img.alt = "";
      img.className = "autoplay-video__poster";
      wrap.appendChild(img);
      root.classList.add("is-fallback");
    }
  }

  function bootAutoplayVideos() {
    document.querySelectorAll(".autoplay-video").forEach(mountAutoplayRoot);
  }

  global.OpusVideo = {
    encodePath: encodePath,
    pickSrc: pickSrc,
    pickPoster: pickPoster,
    mountInSlot: mountInSlot,
    createVideoElement: createVideoElement,
    bindLifecycle: bindLifecycle,
    assignSrc: assignSrc,
    bootAutoplayVideos: bootAutoplayVideos,
    postersOnly: postersOnly,
    isMobile: function () { return mobileMq.matches; },
  };
})(window);
