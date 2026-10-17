import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { feature } from "topojson-client";
import { geoMercator, geoPath, geoContains } from "d3-geo";
import world from "world-atlas/countries-110m.json" with { type: "json" };

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../assets/map");
mkdirSync(outDir, { recursive: true });

const land = feature(world, world.objects.land);
const width = 960;
const height = 520;

const projection = geoMercator()
  .center([55, 28])
  .scale(520)
  .translate([width / 2, height / 2]);

const path = geoPath(projection);

const dots = [];
const step = 7;
for (let x = 0; x < width; x += step) {
  for (let y = 0; y < height; y += step) {
    const p = projection.invert([x, y]);
    if (!p) continue;
    const [lon, lat] = p;
    if (lon < -15 || lon > 135 || lat < -10 || lat > 62) continue;
    if (geoContains(land, p)) dots.push([x, y]);
  }
}

const locations = [
  { id: "treviso", lon: 12.24, lat: 45.67, type: "core", label: "Treviso", role: "OPUSlab · Italy" },
  { id: "hcmc", lon: 106.63, lat: 10.82, type: "core", label: "Ho Chi Minh City", role: "Headquarters · Vietnam" },
  { id: "netherlands", lon: 5.3, lat: 52.1, type: "support", label: "Netherlands", role: "Commercial coordination" },
  { id: "china", lon: 104.2, lat: 35.9, type: "support", label: "China", role: "Business development" },
  { id: "singapore", lon: 103.82, lat: 1.35, type: "support", label: "Singapore", role: "Regional operations" },
];

const projected = locations.map((loc) => {
  const pt = projection([loc.lon, loc.lat]);
  return { ...loc, x: pt[0], y: pt[1] };
});

const treviso = projected.find((l) => l.id === "treviso");
const hcmc = projected.find((l) => l.id === "hcmc");

const arcPath = `M ${treviso.x} ${treviso.y} Q ${(treviso.x + hcmc.x) / 2} ${treviso.y - 80} ${hcmc.x} ${hcmc.y}`;

const dotEls = dots.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.15" fill="#D2CCC2"/>`).join("\n");

const markers = projected
  .map((loc) => {
    if (loc.type === "core") {
      return `<g class="map-marker map-marker--core" data-id="${loc.id}" tabindex="0" role="button" aria-label="${loc.label}">
  <circle class="map-marker__pulse" cx="${loc.x.toFixed(1)}" cy="${loc.y.toFixed(1)}" r="18" fill="none" stroke="#B4532A" stroke-width="1.5" opacity="0.45"/>
  <circle class="map-marker__dot" cx="${loc.x.toFixed(1)}" cy="${loc.y.toFixed(1)}" r="6" fill="#B4532A"/>
  <text class="map-marker__label" x="${(loc.x + 14).toFixed(1)}" y="${(loc.y - 6).toFixed(1)}" font-size="13" font-family="Inter, system-ui, sans-serif" fill="#1A1A1A"><tspan font-weight="700">${loc.label}</tspan><tspan dx="6" fill="#6B6B6B">${loc.role}</tspan></text>
</g>`;
    }
    return `<g class="map-marker map-marker--support" data-id="${loc.id}" tabindex="0" role="button" aria-label="${loc.label}">
  <circle class="map-marker__dot" cx="${loc.x.toFixed(1)}" cy="${loc.y.toFixed(1)}" r="5" fill="#F6F5F2" stroke="#B4532A" stroke-width="2"/>
</g>`;
  })
  .join("\n");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="map-title">
  <title id="map-title">OPUS presence across Europe and Asia</title>
  <g class="map-dots">${dotEls}</g>
  <path class="map-arc" d="${arcPath}" fill="none" stroke="#B4532A" stroke-width="2" stroke-dasharray="6 4" pathLength="1"/>
  ${markers}
</svg>`;

writeFileSync(join(outDir, "presence-map.svg"), svg);
console.log("Wrote presence-map.svg with", dots.length, "land dots");
