import { BN } from "bn.js";

const WhiteTile = Array(10 * 10 * 4).fill(255);
export function getWhitePixels() {
  return WhiteTile;
}
const BlackTile = Array(10 * 10 * 4).fill(255);
for (let i = 0; i < BlackTile.length; i++) {
  ((i + 1) % 4 !== 0) && (BlackTile[i] = 0);
}
export function getBlackPixels() {
  return BlackTile;
}

export function getRandomPixels() {
  let pixels = [];
  for (let y = 0; y < 10; y ++) {
    for (let x = 0; x < 10; x++) {
      pixels.push(Math.floor(Math.random() * 255))
      pixels.push(Math.floor(Math.random() * 255))
      pixels.push(Math.floor(Math.random() * 255))
      pixels.push(255)
    }
  }
  return pixels;
}
export function covertTileColorToPixels(colors) {
  let pixels = [];
  for (let y = 0; y < 10; y++) {
    let r = new BN(colors.r[y]);
    let g = new BN(colors.g[y]);
    let b = new BN(colors.b[y]);

    for (let x = 0; x < 10; x++) {
      // we take 8 bits from uin80 10 times.
      pixels.push(r.shrn((9 - x) * 8).and(new BN('255', 10)).toNumber());
      pixels.push(g.shrn((9 - x) * 8).and(new BN('255', 10)).toNumber());
      pixels.push(b.shrn((9 - x) * 8).and(new BN('255', 10)).toNumber());
      pixels.push(255)
    }
  }
  return pixels;
}

export function encodePixelsToTileColor(pixels) {
  const tileColor = {
    r: [],
    b: [],
    g: []
  }
  for (let y = 0; y < 10; y++) {
    let r = new BN('0', 10);
    let g = new BN('0', 10);
    let b = new BN('0', 10);
    for (let x = 0; x < 10; x++) {
      r = r.shln(x === 0 ? 0 : 8).or(new BN(pixels[(x * 4 + 0)  + y * 10 * 4].toString(10), 10))
      g = g.shln( x === 0 ? 0 : 8).or(new BN(pixels[(x * 4 + 1)  + y * 10 * 4].toString(10), 10))
      b = b.shln( x === 0 ? 0 : 8).or(new BN(pixels[(x * 4 + 2)  + y * 10 * 4].toString(10), 10))
    }
    tileColor.r.push(r.toString(10))
    tileColor.g.push(g.toString(10))
    tileColor.b.push(b.toString(10))
  }
  return tileColor;
}
