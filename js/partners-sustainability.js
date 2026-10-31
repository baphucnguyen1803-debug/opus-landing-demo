(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(text) {
    var d = document.createElement("div");
    d.textContent = text == null ? "" : String(text);
    return d.innerHTML;
  }

  function sectionHead(eyebrow, title, titleId) {
    return (
      '<header class="opus-section-head sr-in">' +
      '<p class="eyebrow">' +
      esc(eyebrow) +
      "</p>" +
      "<h2" +
      (titleId ? ' id="' + titleId + '"' : "") +
      ">" +
      esc(title) +
      "</h2>" +
      '<span class="opus-section-head__rule" aria-hidden="true"></span>' +
      "</header>"
    );
  }

  function onLogoError(img) {
    var cell = img.closest(".partners-grid__cell");
    if (!cell) return;
    img.hidden = true;
    var fb = cell.querySelector(".partners-grid__fallback");
    if (fb) fb.hidden = false;
  }

  function renderPartners(root, data) {
    if (!root || !data) return;
    var html =
      '<div class="wrap partners-section__inner">' +
      sectionHead(data.eyebrow, data.title, "partners-heading") +
      '<ul class="partners-grid sr-in" role="list">';

    data.logos.forEach(function (logo) {
      var base = window.OPUS_PARTNERS_ASSET_BASE || "assets/media/";
      var src = base + logo.slug + ".png";
      html +=
        '<li class="partners-grid__cell" tabindex="0">' +
        '<img src="' +
        esc(src) +
        '" alt="' +
        esc(logo.name) +
        '" loading="lazy" class="partners-grid__logo" width="160" height="56">' +
        '<span class="partners-grid__fallback" hidden>' +
        esc(logo.name) +
        "</span></li>";
    });

    html += "</ul></div>";
    root.innerHTML = html;
    root.querySelectorAll(".partners-grid__logo").forEach(function (img) {
      img.addEventListener("error", function () {
        onLogoError(img);
      });
      if (img.complete && img.naturalWidth === 0) onLogoError(img);
    });
  }

  function renderMaterialTile(tile) {
    return (
      '<li><article class="sustainability-materials__tile sustainability-materials__tile--chamfer">' +
      '<div class="sustainability-materials__tile-inner">' +
      '<img src="' +
      esc(tile.src) +
      '" alt="" loading="lazy" class="sustainability-materials__img">' +
      '<div class="sustainability-materials__overlay" aria-hidden="true"></div>' +
      '<p class="sustainability-materials__label">' +
      esc(tile.label) +
      "</p></div></article></li>"
    );
  }

  function renderSustainability(root, data) {
    if (!root || !data) return;
    var h = data.header;
    var m = data.materials;
    var c = data.certifications;

    var html = '<div class="sustainability-section__intro wrap">';

    html +=
      '<div class="sustainability-hero sr-in">' +
      '<div class="sustainability-hero__copy stack">' +
      sectionHead(h.eyebrow, h.title, "sustainability-heading") +
      '<p class="lede sustainability-hero__subline">' +
      esc(h.subline) +
      "</p></div>" +
      '<figure class="sustainability-hero__figure">' +
      '<img src="' +
      esc(h.heroImage) +
      '" alt="' +
      esc(h.heroAlt) +
      '" loading="lazy" class="sustainability-hero__img">' +
      "</figure></div>";

    var p = data.pillars;
    var first = p.items[0];
    html +=
      '<div class="sustainability-pillars-split sr-in" id="sustainability-pillars">' +
      '<figure class="sustainability-pillars-split__media">' +
      '<img src="' +
      esc(first.image) +
      '" alt="' +
      esc(first.imageAlt) +
      '" loading="lazy" class="sustainability-pillars-split__img" id="sustainability-pillars-img">' +
      "</figure>" +
      '<div class="sustainability-pillars-split__aside">' +
      '<div class="sustainability-pillars-split__tabs" role="tablist" aria-label="Sustainability focus areas">';
    p.items.forEach(function (item, index) {
      var active = index === 0;
      html +=
        '<button type="button" class="sustainability-pillars-split__tab' +
        (active ? " is-active" : "") +
        '" role="tab" aria-selected="' +
        (active ? "true" : "false") +
        '" tabindex="' +
        (active ? "0" : "-1") +
        '" data-index="' +
        index +
        '">' +
        esc(item.title) +
        "</button>";
    });
    html +=
      "</div>" +
      '<p class="sustainability-pillars-split__detail" id="sustainability-pillars-detail">' +
      esc(first.text) +
      "</p></div></div></div>";

    html +=
      '<div class="sustainability-materials sr-in">' +
      '<div class="sustainability-materials__inner wrap">' +
      '<p class="sustainability-materials__lead">' +
      esc(m.lead) +
      "</p>" +
      '<ul class="sustainability-materials__grid" role="list">';

    m.tiles.forEach(function (tile) {
      html += renderMaterialTile(tile);
    });

    html += "</ul></div></div>";

    html += '<div class="sustainability-certs wrap sr-in">';
    html +=
      '<header class="opus-section-head">' +
      '<p class="eyebrow">' +
      esc(c.eyebrow) +
      "</p>" +
      "<h3>" +
      esc(c.title) +
      "</h3>" +
      '<span class="opus-section-head__rule" aria-hidden="true"></span>' +
      "</header>" +
      '<p class="sustainability-certs__lead">' +
      esc(c.lead) +
      "</p>" +
      '<ul class="sustainability-certs__grid" role="list">';

    var certBase = window.OPUS_PARTNERS_ASSET_BASE || "assets/media/";
    c.items.forEach(function (item) {
      html +=
        '<li class="sustainability-cert-card">' +
        '<div class="sustainability-cert-card__logo">' +
        '<img src="' +
        esc(certBase + item.logo) +
        '" alt="" loading="lazy">' +
        "</div>" +
        "<h4>" +
        esc(item.name) +
        "</h4></li>";
    });
    html += "</ul>";

    html +=
      '<p class="sustainability-certs__note">' + esc(c.closingNote) + "</p></div>";

    root.innerHTML = html;
    initSustainabilityPillars(root, p.items);
  }

  function initSustainabilityPillars(root, items) {
    if (!root || !items || !items.length) return;
    var split = root.querySelector("#sustainability-pillars");
    if (!split) return;
    var img = split.querySelector("#sustainability-pillars-img");
    var detail = split.querySelector("#sustainability-pillars-detail");
    var tabs = split.querySelectorAll(".sustainability-pillars-split__tab");
    if (!img || !detail || !tabs.length) return;

    function activate(index) {
      var item = items[index];
      if (!item) return;
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.setAttribute("tabindex", on ? "0" : "-1");
      });
      img.src = item.image;
      img.alt = item.imageAlt || item.title;
      detail.textContent = item.text;
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        activate(Number(tab.getAttribute("data-index")));
      });
    });
  }

  function boot() {
    var partnersRoot = document.getElementById("partners");
    var sustainRoot = document.getElementById("sustainability");
    renderPartners(partnersRoot, window.OPUS_PARTNERS_DATA);
    renderSustainability(sustainRoot, window.OPUS_SUSTAINABILITY_DATA);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
