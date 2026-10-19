(function () {
  "use strict";

  function sampleRegion(img, sx, sy, sw, sh) {
    var c = document.createElement("canvas");
    var size = 32;
    c.width = size;
    c.height = size;
    var ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
    var data = ctx.getImageData(0, 0, size, size).data;
    var r = 0;
    var g = 0;
    var b = 0;
    var n = 0;
    for (var i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n += 1;
    }
    if (!n) return null;
    r = Math.round(r / n);
    g = Math.round(g / n);
    b = Math.round(b / n);
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  function sampleFromUrl(src, region, done) {
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      var rx = region && region.x != null ? region.x : 0.38;
      var ry = region && region.y != null ? region.y : 0.42;
      var rw = region && region.w != null ? region.w : 0.22;
      var rh = region && region.h != null ? region.h : 0.18;
      var sx = Math.max(0, Math.floor(img.naturalWidth * rx));
      var sy = Math.max(0, Math.floor(img.naturalHeight * ry));
      var sw = Math.max(8, Math.floor(img.naturalWidth * rw));
      var sh = Math.max(8, Math.floor(img.naturalHeight * rh));
      done(sampleRegion(img, sx, sy, sw, sh));
    };
    img.onerror = function () { done(null); };
    img.src = src;
  }

  window.OpusColorSample = { sampleFromUrl: sampleFromUrl };
})();
