// Met une planche de marche générée (N images côte à côte sur une seule rangée) au format de la carte :
// même traitement à l'encre que scripts/ink-sprite.js, mais les N images gardent la même échelle, la même taille
// et le même cadrage, pour que Guts ne tremble pas en marchant.
//   node scripts/ink-walk.js <entrée.png> <sortie.png> [images=4] [hauteur=192] [éclaircir=0]
// Chaque image est recalée sur le haut du corps (tête et épée), qui ne bouge pas d'un pas à l'autre.
// Affiche la taille d'une image, à reporter dans src/data/gutsSkins.ts (`frame`).
const { Jimp, BORDER, backgroundMask, contentBox, inkify } = require("./ink-sprite");

/** Part de la hauteur, depuis le haut, qui sert à recaler les images (tête, épaules, épée). */
const ANCHOR_ROWS = 0.35;

const [, , input, output, framesArg, heightArg, lightenArg] = process.argv;
const FRAMES = Number(framesArg ?? 4);
const TARGET_HEIGHT = Number(heightArg ?? 192);
const LIGHTEN = Number(lightenArg ?? 0);

(async () => {
  const image = await Jimp.read(input);
  if (LIGHTEN) image.brightness(LIGHTEN);
  const { width: w, height: h, data } = image.bitmap;
  const bg = backgroundMask(data, w, h);
  const cellW = w / FRAMES;

  // Une image par case de la rangée.
  const frames = [];
  for (let k = 0; k < FRAMES; k++) {
    const fromX = Math.round(k * cellW), toX = Math.round((k + 1) * cellW);
    const box = contentBox(bg, w, h, fromX, toX);
    if (!box) throw new Error(`Image ${k + 1} vide : vérifier le nombre d'images.`);
    frames.push(box);
  }
  const minY = Math.min(...frames.map((f) => f.minY));
  const maxY = Math.max(...frames.map((f) => f.maxY));

  // Repère de chaque image : le centre du haut du corps.
  const anchorBottom = minY + (maxY - minY) * ANCHOR_ROWS;
  for (const f of frames) {
    let sum = 0, n = 0;
    for (let y = minY; y < anchorBottom; y++) for (let x = f.minX; x <= f.maxX; x++) if (!bg[y * w + x]) {
      sum += x;
      n++;
    }
    f.anchor = Math.round(sum / n);
  }
  const left = Math.max(...frames.map((f) => f.anchor - f.minX));
  const right = Math.max(...frames.map((f) => f.maxX - f.anchor));

  // Toutes les images : même cadre autour de leur repère, même échelle.
  const scale = (maxY - minY + 1) / (TARGET_HEIGHT - BORDER * 2);
  const inked = frames.map((f) => inkify(image, bg, { minX: f.anchor - left, maxX: f.anchor + right, minY, maxY }, TARGET_HEIGHT, scale));
  const frameW = inked[0].bitmap.width, frameH = inked[0].bitmap.height;
  const sheet = new Jimp(frameW * FRAMES, frameH, 0x00000000);
  inked.forEach((frame, k) => sheet.composite(frame, k * frameW, 0));
  await sheet.writeAsync(output);
  console.log(`${output} : ${FRAMES} images de ${frameW} × ${frameH}`);
})();
