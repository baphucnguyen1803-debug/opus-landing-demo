/* GitHub Pages serves Git LFS files as pointer text; route videos through media.githubusercontent.com on *.github.io */
(function (global) {
  "use strict";

  function encodePathSegments(path) {
    if (!path || typeof path !== "string") return path;
    var q = path.indexOf("?");
    var base = q === -1 ? path : path.slice(0, q);
    var query = q === -1 ? "" : path.slice(q);
    var slash = base.lastIndexOf("/");
    if (slash === -1) return encodeURIComponent(base) + query;
    return base.slice(0, slash + 1) + encodeURIComponent(base.slice(slash + 1)) + query;
  }

  function githubMediaCdnBase() {
    var cfg = global.SITE_CONFIG || {};
    if (cfg.mediaGitHubCdn === false) return "";
    if (cfg.mediaGitHubCdnBase) return cfg.mediaGitHubCdnBase;
    var loc = global.location;
    if (!loc || !loc.hostname.endsWith("github.io")) return "";
    var segs = (loc.pathname || "/").split("/").filter(Boolean);
    if (!segs.length) return "";
    var repo = segs[0];
    var owner = cfg.githubOwner || "baphucnguyen1803-debug";
    var branch = cfg.githubBranch || "main";
    return (
      "https://media.githubusercontent.com/media/" +
      owner +
      "/" +
      repo +
      "/" +
      branch +
      "/"
    );
  }

  function isVideoPath(value) {
    return typeof value === "string" && /\.(mp4|webm|MP4)(\?|$)/i.test(value);
  }

  function resolveMediaUrl(path) {
    if (!path || /^https?:\/\//i.test(path)) return path;
    var encoded = encodePathSegments(path);
    var cdn = githubMediaCdnBase();
    if (cdn && isVideoPath(path)) return cdn + encoded;
    return encoded;
  }

  global.resolveMediaUrl = resolveMediaUrl;
})(window);
