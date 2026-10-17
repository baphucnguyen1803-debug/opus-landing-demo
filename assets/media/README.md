# Demo media naming

Drop replacement files here using the IDs below, then point `js/media-manifest.js` at the new path.

Current files are **temporary demo media** for footwear development and manufacturing. They can be replaced without editing HTML.

## How the loader works

`js/media-manifest.js` defines `window.MEDIA`. On load, `js/main.js` walks every `.media-slot`:

- `MEDIA[id] = "assets/media/M01.mp4"` → `<video muted autoplay loop playsinline>` (M02 is used as the poster for M01)
- `MEDIA[id] = "assets/media/M03.jpg"` → `<img loading="lazy">`
- `MEDIA[id] = { frames: [...], poster, interval }` → cinematic sequence player (demo video)
- `MEDIA[id] = null` → labelled placeholder

M21 (Double Guard QMS) and M24 (map) are built in code, not files.

## IDs

| File | Slot | Notes |
|---|---|---|
| `M01.mp4` | Hero video, 20–30 s, 16:9 | Montage: 3D → sample room → stitching & lasting → outsole → finished shoes. Demo currently uses frames `M01-f1`…`M01-f5`. |
| `M02.jpg` | Hero poster | Still while the video loads |
| `M03.jpg` | Platform · OPUSlab, 4:5 | Designer / pattern maker |
| `M04.jpg` | Platform · OPUStudio, 4:5 | Rendered shoe / colorway |
| `M05.jpg` | Platform · OPUS Manufacturing, 4:5 | Assembly or lasting |
| `M06.mp4` | OPUSlab video, 10–15 s, 16:9 | Same style as 3D, then as a physical sample. Demo uses `M06-f1`, `M06-f2`, `M06.jpg`. |
| `M07.jpg` | OPUSlab tile 1, 4:3 | 3D model on a digital last |
| `M08.jpg` | OPUSlab tile 2, 4:3 | One style, several digital colorways |
| `M09.jpg` | OPUSlab tile 3, 4:3 | Pattern maker / sample room / fitting |
| `M10.jpg` | OPUSlab tile 4, 4:3 | 3D-printed outsole or mould |
| `M11.jpg` | Sample stages, 21:9 | Same style at different stages |
| `M12-A.jpg` … `M12-D.jpg` | OPUStudio colorways, 1:1 | One shoe, same angle and lighting |
| `M13.mp4` | OPUStudio animation, 10–20 s, 16:9 | Turntable or exploded view. Demo uses `M13-f1`…`M13-f3`, `M13.jpg`. |
| `M14.jpg` | OPUStudio tile 1, 4:3 | Clean product render |
| `M15.jpg` | OPUStudio tile 2, 4:3 | Animation still |
| `M16.jpg` | OPUStudio tile 3, 4:3 | Digital style library |
| `M17.jpg` | OPUStudio tile 4, 4:3 | E-commerce views |
| `M18.mp4` | Manufacturing video, 15–20 s, 16:9 | Exterior → stitching → lasting → finished pairs. Demo uses `M18-f1`, `M18-f2`, `M18.jpg`. |
| `M19-A.jpg` … `M19-D.jpg` | Constructions, 1:1 | A waterproof · B HF / no-sew · C stock fitting · D computerized stitching |
| `M20.mp4` | Quality checks, 10–15 s, 16:9 | Demo currently uses `M20.jpg` |
| `M22-A.jpg` … `M22-G.jpg` | Categories, 3:4 | Outleisure · Athleisure · Outdoor · Sneakers · Performance · Casual · Children’s footwear |
| `M23.jpg` | About intro, 21:9 | Team / studio / unit, wide |
| `M28.jpg` | About story, 4:5 | People at work |
| `M25.jpg` | Italy card, 4:3 | Treviso design studio |
| `M26.jpg` | Vietnam card, 4:3 | HCMC HQ or 3D studio |
| `M27.jpg` | International card, 4:3 | Unit exterior or international call |
