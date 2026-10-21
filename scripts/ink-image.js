// Passe une image en couleurs à l'encre « Trame & Encre » : encre #111, papier #F3F3F0 et trame de points entre les deux.
// Le vert (feuillage, herbe) éclaircit et le rouge (cape) assombrit : le personnage reste en noir franc sur un décor clair.
// Utilisé pour assets/camp/camp-day-ink.jpg :
//   node scripts/ink-image.js assets/camp/camp-day.jpg assets/camp/camp-day-ink.jpg 62 145 2
// Arguments : entrée, sortie, seuil de l'encre, seuil du papier (0-255 environ), rayon du lissage en px.
const path = require("path");
const Jimp = require(path.resolve("node_modules/jimp-compact"));
const [, , input, output, t1s, t2s, blurS] = process.argv;
const t1 = Number(t1s), t2 = Number(t2s), blur = Number(blurS ?? 1);
const PAPER = [0xf3, 0xf3, 0xf0], INK = [0x11, 0x11, 0x11];
(async () => {
  const img = await Jimp.read(input);
  const { width: w, height: h, data } = img.bitmap;
  // Valeur « encre » : le vert (feuillage, herbe) éclaircit, le rouge (cape) assombrit.
  const v = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const lum = 0.3 * r + 0.59 * g + 0.11 * b;
    const greenness = Math.max(0, g - Math.max(r, b));
    const redness = Math.max(0, r - Math.max(g, b) - 20);
    v[i] = lum + greenness * 2.2 - redness * 1.6;
  }
  // Flou en boîte : on lisse le grain du pixel art pour garder de grandes formes.
  const s = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let sum = 0, n = 0;
    for (let dy = -blur; dy <= blur; dy++) for (let dx = -blur; dx <= blur; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < w && yy < h) { sum += v[yy * w + xx]; n++; }
    }
    s[y * w + x] = sum / n;
  }
  // Trois valeurs : encre, trame de points (cellule 6 px, rayon selon la valeur), papier.
  const CELL = 6;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const val = s[y * w + x];
    let ink;
    if (val < t1) ink = true;
    else if (val > t2) ink = false;
    else {
      const k = 1 - (val - t1) / (t2 - t1); // 1 = sombre
      const cx = Math.floor(x / CELL) * CELL + CELL / 2, cy = Math.floor(y / CELL) * CELL + CELL / 2;
      const r = 0.6 + k * (CELL * 0.42);
      ink = (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r;
    }
    const c = ink ? INK : PAPER, o = (y * w + x) * 4;
    data[o] = c[0]; data[o + 1] = c[1]; data[o + 2] = c[2]; data[o + 3] = 255;
  }
  img.quality(88);
  await img.writeAsync(output);
})();
