import Globe from "globe.gl";

var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

var LOCATIONS = [
  { id: "treviso", lat: 45.67, lng: 12.24, type: "hub", label: "Treviso", city: "Treviso, Italy" },
  { id: "hcmc", lat: 10.82, lng: 106.63, type: "hub", label: "Ho Chi Minh City", city: "Ho Chi Minh City, Vietnam" },
  { id: "amsterdam", lat: 52.37, lng: 4.9, type: "support", label: "Amsterdam", city: "Amsterdam" },
  { id: "guangzhou", lat: 23.13, lng: 113.26, type: "support", label: "Guangzhou", city: "Guangzhou" },
  { id: "singapore", lat: 1.35, lng: 103.82, type: "support", label: "Singapore", city: "Singapore" },
];

var INITIAL_POV = { lat: 30, lng: 62, altitude: 1.85 };

function webglOk() {
  try {
    var c = document.createElement("canvas");
    return !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch (e) {
    return false;
  }
}

function renderFlatFallback(mount) {
  mount.innerHTML =
    '<div class="globe-fallback">' +
    '<img src="assets/map/earth-blue-marble.jpg" alt="Earth map">' +
    '<svg class="globe-fallback__overlay" viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true"></svg>' +
    "</div>";
  var img = mount.querySelector("img");
  var svg = mount.querySelector("svg");
  if (!img || !svg) return;

  function project(lng, lat) {
    var lonMin = -15;
    var lonMax = 140;
    var latMin = -15;
    var latMax = 65;
    var x = ((lng - lonMin) / (lonMax - lonMin)) * 100;
    var y = ((latMax - lat) / (latMax - latMin)) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  }

  LOCATIONS.forEach(function (loc) {
    var p = project(loc.lng, loc.lat);
    var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", p.x);
    c.setAttribute("cy", p.y);
    c.setAttribute("r", loc.type === "hub" ? "1.2" : "0.9");
    c.setAttribute("fill", loc.type === "hub" ? "#D97B4A" : "#fff");
    c.setAttribute("stroke", loc.type === "hub" ? "none" : "#D97B4A");
    c.setAttribute("data-id", loc.id);
    svg.appendChild(c);
  });

  var t = project(12.24, 45.67);
  var v = project(106.63, 10.82);
  var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M" + t.x + "," + t.y + " Q" + (t.x + v.x) / 2 + ",0 " + v.x + "," + v.y);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "#D97B4A");
  path.setAttribute("stroke-opacity", "0.6");
  path.setAttribute("stroke-width", "0.4");
  path.setAttribute("stroke-dasharray", "2 1");
  svg.appendChild(path);
}

function bootGlobe(mount) {
  var globe = Globe()(mount)
    .globeImageUrl("assets/map/earth-blue-marble.jpg")
    .bumpImageUrl("assets/map/earth-topology.png")
    .backgroundColor("rgba(0,0,0,0)")
    .showAtmosphere(true)
    .atmosphereColor("#E8C9B5")
    .atmosphereAltitude(0.16)
    .enablePointerInteraction(true);

  globe.controls().enableZoom = false;
  globe.controls().autoRotate = false;

  var points = LOCATIONS.map(function (loc) {
    return {
      lat: loc.lat,
      lng: loc.lng,
      type: loc.type,
      id: loc.id,
      size: loc.type === "hub" ? 0.55 : 0.38,
      color: loc.type === "hub" ? "#D97B4A" : "#FFFFFF",
      altitude: loc.type === "hub" ? 0.03 : 0.02,
    };
  });

  globe
    .pointsData(points)
    .pointAltitude("altitude")
    .pointRadius("size")
    .pointColor("color")
    .labelsData(LOCATIONS.map(function (l) {
      return { lat: l.lat, lng: l.lng, text: l.label, color: "#fff", size: 1.1 };
    }))
    .labelText("text")
    .labelSize("size")
    .labelColor("color")
    .labelDotRadius(0.25)
    .labelResolution(3)
    .ringsData(LOCATIONS.filter(function (l) { return l.type === "hub"; }))
    .ringLat("lat")
    .ringLng("lng")
    .ringColor(function () { return "rgba(217,123,74,0.45)"; })
    .ringMaxRadius(3)
    .ringPropagationSpeed(1.2)
    .ringRepeatPeriod(1600)
    .arcsData([{ startLat: 45.67, startLng: 12.24, endLat: 10.82, endLng: 106.63 }])
    .arcColor(function () { return ["#D97B4A", "#F3C4A6"]; })
    .arcStroke(0.6)
    .arcDashLength(0.45)
    .arcDashGap(0.15)
    .arcDashAnimateTime(2600);

  globe.pointOfView(INITIAL_POV, 0);

  var renderer = globe.renderer();
  if (renderer) renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var card = document.getElementById("presence-map-card");
  var obs = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) {
      globe.pointOfView(INITIAL_POV, 0);
    } else if (renderer) {
      renderer.setAnimationLoop(null);
    }
  }, { threshold: 0.15 });
  if (card) obs.observe(card);

  document.querySelectorAll(".map-legend-item[data-map-id]").forEach(function (btn) {
    var id = btn.getAttribute("data-map-id");
    var loc = LOCATIONS.find(function (l) { return l.id === id; });
    if (!loc) return;
    var enter = function () {
      btn.classList.add("is-highlight");
      globe.pointOfView({ lat: loc.lat, lng: loc.lng, altitude: 1.5 }, 1000);
    };
    var leave = function () {
      btn.classList.remove("is-highlight");
      globe.pointOfView(INITIAL_POV, 1000);
    };
    btn.addEventListener("mouseenter", enter);
    btn.addEventListener("focus", enter);
    btn.addEventListener("mouseleave", leave);
    btn.addEventListener("blur", leave);
  });

  return globe;
}

function init() {
  var mount = document.getElementById("presence-globe-mount");
  if (!mount) return;

  if (!webglOk() || reduceMotion) {
    renderFlatFallback(mount);
    return;
  }

  try {
    bootGlobe(mount);
  } catch (err) {
    console.error("[OPUS globe]", err);
    renderFlatFallback(mount);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
