/* Same-origin media paths with safe encoding for spaces/special chars */
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

  function resolveMediaUrl(path) {
    if (!path || /^https?:\/\//i.test(path)) return path;
    return encodePathSegments(path);
  }

  global.resolveMediaUrl = resolveMediaUrl;
})(window);
