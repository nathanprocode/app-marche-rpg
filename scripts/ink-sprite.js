// Met une image générée au format des sprites « Trame & Encre » (voir docs/sprites-encre.md) :
// fond retiré, personnage recadré, 192 px de haut, quatre valeurs (encre, trame dense, trame légère, papier),
// contour noir et liseré papier pour rester lisible sur la carte, de jour comme de nuit.
//   node scripts/ink-sprite.js <entrée.png> <sortie.png> [hauteur=192] [éclaircir=0]
// L'entrée doit être un PNG ou un JPG : convertir un .webp avec scripts/webp-to-png.ps1.
// « éclaircir » (0 à 1, 0.15 conseillé) : pour une image à trame très fine, qui vire au noir une fois réduite.
const path = require("path");
const Jimp = require(path.resolve("node_modules/jimp-compact"));

const [, , input, output, heightArg, lightenArg] = process.argv;
const TARGET_HEIGHT = Number(heightArg ?? 192);
const LIGHTEN = Number(lightenArg ?? 0);
const INK = [0x11, 0x11, 0x11];
const PAPER = [0xf3, 0xf3, 0xf0];
/** Au-dessus de cette luminosité, un pixel relié au bord de l'image est du fond. */
const BACKGROUND_LUMA = 205;
/** Les traits et la trame sont épaissis de ce rayon avant le détourage, pour boucher les trous du contour. */
const SEAL_RADIUS = 5;
/** Seuils des quatre valeurs, sur la luminosité moyenne après réduction (0 = noir, 255 = blanc). */
const INK_BELOW = 85;
const DENSE_BELOW = 140;
const LIGHT_BELOW = 195;

function luma(data, o) {
  return 0.3 * data[o] + 0.59 * data[o + 1] + 0.11 * data[o + 2];
}

/** Carré de rayon r autour de chaque pixel marqué (dilatation). */
function dilate(mask, w, h, r) {
  const rows = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    let last = -Infinity;
    for (let x = 0; x < w; x++) if (mask[y * w + x]) last = x; else if (x - last <= r) rows[y * w + x] = 1;
    last = Infinity;
    for (let x = w - 1; x >= 0; x--) if (mask[y * w + x]) last = x; else if (last - x <= r) rows[y * w + x] = 1;
    for (let x = 0; x < w; x++) if (mask[y * w + x]) rows[y * w + x] = 1;
  }
  const out = new Uint8Array(w * h);
  for (let x = 0; x < w; x++) {
    let last = -Infinity;
    for (let y = 0; y < h; y++) if (rows[y * w + x]) last = y; else if (y - last <= r) out[y * w + x] = 1;
    last = Infinity;
    for (let y = h - 1; y >= 0; y--) if (rows[y * w + x]) last = y; else if (last - y <= r) out[y * w + x] = 1;
    for (let y = 0; y < h; y++) if (rows[y * w + x]) out[y * w + x] = 1;
  }
  return out;
}

/** Fond = pixels clairs reliés au bord, sans traverser les traits (épaissis pour boucher les trous). */
function backgroundMask(data, w, h) {
  const ink = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) ink[i] = luma(data, i * 4) < BACKGROUND_LUMA ? 1 : 0;
  const sealed = dilate(ink, w, h, SEAL_RADIUS);
  const bg = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop();
    if (bg[i] || sealed[i]) continue;
    bg[i] = 1;
    const x = i % w, y = (i - x) / w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - w);
    if (y < h - 1) stack.push(i + w);
  }
  // Rend au fond la marge claire laissée par l'épaississement, autour de la silhouette.
  const near = dilate(bg, w, h, SEAL_RADIUS);
  for (let i = 0; i < w * h; i++) if (near[i] && !ink[i]) bg[i] = 1;
  return bg;
}

(async () => {
  const image = await Jimp.read(input);
  if (LIGHTEN) image.brightness(LIGHTEN);
  const { width: w, height: h, data } = image.bitmap;
  const bg = backgroundMask(data, w, h);

  // Cadre serré autour du personnage.
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!bg[y * w + x]) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (maxX < 0) throw new Error("Aucun personnage trouvé : le fond couvre toute l'image.");

  // Réduction par moyenne : chaque pixel de sortie résume un bloc de l'original (luminosité et couverture).
  const border = 2; // contour noir + liseré papier
  const innerH = TARGET_HEIGHT - border * 2;
  const scale = (maxY - minY + 1) / innerH;
  const innerW = Math.max(1, Math.round((maxX - minX + 1) / scale));
  const outW = innerW + border * 2, outH = TARGET_HEIGHT;
  const tone = new Float32Array(outW * outH).fill(255);
  const solid = new Uint8Array(outW * outH);
  for (let oy = 0; oy < innerH; oy++) for (let ox = 0; ox < innerW; ox++) {
    const x0 = minX + Math.floor(ox * scale), x1 = Math.max(x0 + 1, minX + Math.floor((ox + 1) * scale));
    const y0 = minY + Math.floor(oy * scale), y1 = Math.max(y0 + 1, minY + Math.floor((oy + 1) * scale));
    let sum = 0, covered = 0, n = 0;
    for (let y = y0; y < Math.min(y1, h); y++) for (let x = x0; x < Math.min(x1, w); x++) {
      n++;
      if (bg[y * w + x]) continue;
      covered++;
      sum += luma(data, (y * w + x) * 4);
    }
    const i = (oy + border) * outW + ox + border;
    if (covered * 2 >= n) {
      solid[i] = 1;
      tone[i] = sum / covered;
    }
  }

  // Quatre valeurs : la trame suit une grille fixe, comme une trame collée sur la planche.
  const out = new Jimp(outW, outH, 0x00000000);
  const px = out.bitmap.data;
  const paint = (i, color) => {
    px[i * 4] = color[0];
    px[i * 4 + 1] = color[1];
    px[i * 4 + 2] = color[2];
    px[i * 4 + 3] = 255;
  };
  const isSolid = (x, y) => x >= 0 && y >= 0 && x < outW && y < outH && solid[y * outW + x] === 1;
  for (let y = 0; y < outH; y++) for (let x = 0; x < outW; x++) {
    const i = y * outW + x;
    if (!solid[i]) continue;
    const v = tone[i];
    // Bord de la silhouette : toujours à l'encre, pour une découpe nette.
    const edge = !isSolid(x - 1, y) || !isSolid(x + 1, y) || !isSolid(x, y - 1) || !isSolid(x, y + 1);
    let inked;
    if (edge || v < INK_BELOW) inked = true;
    else if (v < DENSE_BELOW) inked = (x + y) % 2 === 0; // trame dense : un point sur deux
    else if (v < LIGHT_BELOW) inked = x % 2 === 0 && y % 2 === 0; // trame légère : un point sur quatre
    else inked = false;
    paint(i, inked ? INK : PAPER);
  }
  // Liseré papier autour de la silhouette : le personnage reste lisible sur un fond noir.
  for (let y = 0; y < outH; y++) for (let x = 0; x < outW; x++) {
    const i = y * outW + x;
    if (solid[i]) continue;
    let touches = false;
    for (let dy = -1; dy <= 1 && !touches; dy++) for (let dx = -1; dx <= 1; dx++) if (isSolid(x + dx, y + dy)) touches = true;
    if (touches) paint(i, PAPER);
  }

  await out.writeAsync(output);
  console.log(`${output} : ${outW} × ${outH}`);
})();
