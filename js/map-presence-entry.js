import { geoMercator, geoPath, geoBounds, geoInterpolate } from "d3-geo";
import { feature } from "topojson-client";

var LOGO = "assets/brand/logo-opus.png";
var PRESENCE_NAMES = {
  Italy: 1,
  Vietnam: 1,
  Netherlands: 1,
  China: 1,
  Singapore: 1,
};
var REGION = {
  type: "Polygon",
  coordinates: [[[-15, -12], [135, -12], [135, 62], [-15, 62], [-15, -12]]],
};

var LOCATIONS = [
  { id: "treviso", lat: 45.67, lng: 12.24, type: "hub", label: "Treviso, Italy", dx: -72, dy: -32 },
  { id: "hcmc", lat: 10.82, lng: 106.63, type: "hub", label: "Ho Chi Minh City, Vietnam", dx: 14, dy: 22 },
  { id: "amsterdam", lat: 52.37, lng: 4.9, type: "support", label: "Amsterdam", dx: -78, dy: -8 },
  { id: "guangzhou", lat: 23.13, lng: 113.26, type: "support", label: "Guangzhou", dx: 12, dy: -18 },
  { id: "singapore", lat: 1.35, lng: 103.82, type: "support", label: "Singapore", dx: 16, dy: 28 },
];

function arcLine(start, end, n) {
  var pts = [];
  for (var i = 0; i <= n; i++) {
    var t = i / n;
    var p = geoInterpolate([start.lng, start.lat], [end.lng, end.lat])(t);
    pts.push(p);
  }
  return { type: "LineString", coordinates: pts };
}

function initMap() {
  var mount = document.getElementById("presence-map-2d");
  if (!mount) return;

  var skeleton = mount.querySelector(".presence-map-2d__skeleton");
  var svg = mount.querySelector("svg");
  var pinsLayer = mount.querySelector(".presence-map-2d__pins");
  var width = 0;
  var height = 0;
  var projection;
  var path;
  var countryFeatures = [];
  var highlightedId = null;
  var mobile = function () { return window.matchMedia("(max-width: 900px)").matches; };

  var ID_TO_COUNTRY = {
    treviso: "Italy",
    hcmc: "Vietnam",
    amsterdam: "Netherlands",
    guangzhou: "China",
    singapore: "Singapore",
  };

  function setHighlight(id) {
    highlightedId = id;
    mount.querySelectorAll(".map-pin").forEach(function (pin) {
      var on = id && pin.getAttribute("data-id") === id;
      pin.classList.toggle("is-highlight", on);
    });
    document.querySelectorAll(".map-legend-item[data-map-id]").forEach(function (row) {
      row.classList.toggle("is-highlight", id && row.getAttribute("data-map-id") === id);
    });
    if (svg) {
      var cname = id && ID_TO_COUNTRY[id];
      svg.querySelectorAll(".map-country").forEach(function (el) {
        el.classList.toggle("is-loc-highlight", cname && el.getAttribute("data-name") === cname);
      });
    }
  }

  function renderPins() {
    if (!pinsLayer || !projection) return;
    pinsLayer.innerHTML = "";
    LOCATIONS.forEach(function (loc) {
      var pt = projection([loc.lng, loc.lat]);
      if (!pt) return;
      var pin = document.createElement("button");
      pin.type = "button";
      pin.className = "map-pin map-pin--" + loc.type;
      pin.setAttribute("data-id", loc.id);
      pin.setAttribute("aria-label", loc.label);
      pin.style.left = pt[0] + "px";
      pin.style.top = pt[1] + "px";

      var badge = document.createElement("span");
      badge.className = "map-pin__badge";
      var img = document.createElement("img");
      img.src = LOGO;
      img.alt = "";
      badge.appendChild(img);
      pin.appendChild(badge);
      var pointer = document.createElement("span");
      pointer.className = "map-pin__pointer";
      pin.appendChild(pointer);

      var label = document.createElement("span");
      label.className = "map-pin__label";
      label.textContent = loc.label;
      label.style.transform = "translate(" + loc.dx + "px," + loc.dy + "px)";
      if (loc.type !== "hub" && mobile()) label.classList.add("map-pin__label--hub-only-hidden");
      pin.appendChild(label);

      if (Math.abs(loc.dx) > 20 || Math.abs(loc.dy) > 20) {
        var line = document.createElement("span");
        line.className = "map-pin__leader";
        line.style.width = Math.sqrt(loc.dx * loc.dx + loc.dy * loc.dy) + "px";
        line.style.transform = "rotate(" + (Math.atan2(loc.dy, loc.dx) * 180 / Math.PI) + "deg)";
        pin.appendChild(line);
      }

      pin.addEventListener("mouseenter", function () { setHighlight(loc.id); });
      pin.addEventListener("focus", function () { setHighlight(loc.id); });
      pin.addEventListener("mouseleave", function () { setHighlight(null); });
      pin.addEventListener("blur", function () { setHighlight(null); });
      pin.addEventListener("click", function () {
        if (mobile() && loc.type !== "hub") {
          pin.classList.toggle("is-label-on");
        }
      });

      pinsLayer.appendChild(pin);
    });
  }

  function draw() {
    var rect = mount.getBoundingClientRect();
    width = Math.max(280, rect.width);
    height = Math.max(320, rect.height);
    projection = geoMercator().fitExtent([[24, 24], [width - 24, height - 24]], REGION);
    path = geoPath(projection);

    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.innerHTML = "";

    countryFeatures.forEach(function (f) {
      var name = f.properties && f.properties.name;
      var isPresence = name && PRESENCE_NAMES[name];
      var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", path(f));
      p.setAttribute("class", "map-country" + (isPresence ? " map-country--presence" : ""));
      if (name) p.setAttribute("data-name", name);
      svg.appendChild(p);
    });

    var treviso = LOCATIONS[0];
    var hcmc = LOCATIONS[1];
    var arcGeo = arcLine(treviso, hcmc, 64);
    var arcPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arcPath.setAttribute("d", path(arcGeo));
    arcPath.setAttribute("class", "map-arc-line");
    arcPath.setAttribute("pathLength", "1");
    svg.appendChild(arcPath);

    renderPins();

    requestAnimationFrame(function () {
      mount.classList.add("is-ready");
      if (skeleton) skeleton.hidden = true;
    });
  }

  function watchScrollIn() {
    var card = document.getElementById("presence-map-card");
    var target = card || mount;
    if (!("IntersectionObserver" in window)) {
      mount.classList.add("is-in-view");
      return;
    }
    var seen = false;
    var obs = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting || seen) return;
      seen = true;
      mount.classList.add("is-in-view");
      obs.disconnect();
    }, { threshold: 0.25 });
    obs.observe(target);
  }

  fetch("assets/map/countries-50m.json")
    .then(function (r) {
      if (!r.ok) throw new Error("topology missing");
      return r.json();
    })
    .then(function (world) {
      countryFeatures = feature(world, world.objects.countries).features;
      draw();
      watchScrollIn();
      if ("ResizeObserver" in window) {
        var ro = new ResizeObserver(function () { draw(); });
        ro.observe(mount);
      }
      document.querySelectorAll(".map-legend-item[data-map-id]").forEach(function (row) {
        var id = row.getAttribute("data-map-id");
        row.addEventListener("mouseenter", function () { setHighlight(id); });
        row.addEventListener("focus", function () { setHighlight(id); });
        row.addEventListener("mouseleave", function () { setHighlight(null); });
        row.addEventListener("blur", function () { setHighlight(null); });
      });
    })
    .catch(function (err) {
      console.error("[OPUS map]", err);
      if (skeleton) skeleton.textContent = "Map unavailable";
    });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMap);
} else {
  initMap();
}
