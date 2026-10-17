import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { feature } from "topojson-client";
import { geoMercator, geoContains } from "d3-geo";
import world from "world-atlas/countries-110m.json" with { type: "json" };

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../assets/data");
mkdirSync(outDir, { recursive: true });

const W = 800;
const H = 480;
const land = feature(world, world.objects.land);

const projection = geoMercator().center([55, 28]).scale(500).translate([W / 2, H / 2]);

const dots = [];
const step = 7;
for (let x = 0; x < W; x += step) {
  for (let y = 0; y < H; y += step) {
    const p = projection.invert([x, y]);
    if (!p) continue;
    const [lon, lat] = p;
    if (lon < -12 || lon > 142 || lat < -12 || lat > 62) continue;
    if (geoContains(land, p)) dots.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
  }
}

const markers = [
  { id: "treviso", type: "core", lon: 12.24, lat: 45.67, label: "Treviso", sub: "Italy" },
  { id: "hcmc", type: "core", lon: 106.63, lat: 10.82, label: "Ho Chi Minh City", sub: "Vietnam" },
  { id: "amsterdam", type: "support", lon: 4.9, lat: 52.37, label: "Amsterdam", sub: "Netherlands" },
  { id: "guangzhou", type: "support", lon: 113.26, lat: 23.13, label: "Guangzhou", sub: "China" },
  { id: "singapore", type: "support", lon: 103.82, lat: 1.35, label: "Singapore", sub: "" },
].map((m) => {
  const [x, y] = projection([m.lon, m.lat]);
  return { ...m, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
});

const treviso = markers.find((m) => m.id === "treviso");
const hcmc = markers.find((m) => m.id === "hcmc");
const arc = {
  d: `M ${treviso.x} ${treviso.y} Q ${(treviso.x + hcmc.x) / 2} ${treviso.y - 70} ${hcmc.x} ${hcmc.y}`,
};

writeFileSync(
  join(outDir, "eurasia-dots.json"),
  JSON.stringify({ width: W, height: H, dots, markers, arc }, null, 0)
);
console.log("dots:", dots.length, "→ assets/data/eurasia-dots.json");
