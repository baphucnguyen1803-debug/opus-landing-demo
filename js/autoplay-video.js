(function () {
  "use strict";
  function boot() {
    if (window.OpusVideo && window.OpusVideo.bootAutoplayVideos) {
      window.OpusVideo.bootAutoplayVideos();
    }
  }
  window.initAutoplayVideos = boot;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  window.addEventListener("opus:media-hydrated", boot);
})();
