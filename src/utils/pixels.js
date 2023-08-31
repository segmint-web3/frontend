import { Buffer } from 'buffer/';

const WhiteTile = Array(20 * 20 * 4).fill(255);
export function getWhitePixels() {
  return WhiteTile;
}
const BlackTile = Array(20 * 20 * 4).fill(255);
for (let i = 0; i < BlackTile.length; i++) {
  ((i + 1) % 4 !== 0) && (BlackTile[i] = 0);
}
export function getBlackPixels() {
  return BlackTile;
}

const MainBackgroundTileColor = Array(20 * 20 * 4).fill(255);

export function getMainBackgroundTileColor() {
  if(localStorage.getItem('page') === 'desert') {
    for (let i = 0; i < MainBackgroundTileColor.length; i++) {
      (i % 4 === 0) && (MainBackgroundTileColor[i] = 95);
      (i % 4 === 1) && (MainBackgroundTileColor[i] = 32);
      (i % 4 === 2) && (MainBackgroundTileColor[i] = 32);
    }
  } else if(localStorage.getItem('page') === 'forest') {
    for (let i = 0; i < MainBackgroundTileColor.length; i++) {
      (i % 4 === 0) && (MainBackgroundTileColor[i] = 5);
      (i % 4 === 1) && (MainBackgroundTileColor[i] = 54);
      (i % 4 === 2) && (MainBackgroundTileColor[i] = 39);
    }
  } else {
    for (let i = 0; i < MainBackgroundTileColor.length; i++) {
      (i % 4 === 0) && (MainBackgroundTileColor[i] = 33);
      (i % 4 === 1) && (MainBackgroundTileColor[i] = 20);
      (i % 4 === 2) && (MainBackgroundTileColor[i] = 109);
    }
  }
  return MainBackgroundTileColor;
}

const MainForegroundTileColor = Array(20 * 20 * 4).fill(255);
for (let i = 0; i < MainForegroundTileColor.length; i++) {
  (i % 4 === 0) && (MainForegroundTileColor[i] = 204);
  (i % 4 === 1) && (MainForegroundTileColor[i] = 255);
  (i % 4 === 2) && (MainForegroundTileColor[i] = 1);
}
export function getMainForegroundTileColor() {
  return MainForegroundTileColor;
}

export function getRandomPixels() {
  let pixels = [];
  for (let y = 0; y < 20; y ++) {
    for (let x = 0; x < 20; x++) {
      pixels.push(Math.floor(Math.random() * 255))
      pixels.push(Math.floor(Math.random() * 255))
      pixels.push(Math.floor(Math.random() * 255))
      pixels.push(255)
    }
  }
  return pixels;
}
export function encodePixelsToTileColor(pixels) {
  return Buffer.from(pixels.reduce((list, elem, i) => {
    if ((i + 1) % 4 !== 0)
      list.push(elem);
    return list;
  }, [])).toString('base64');
}

export function tryToDecodeTile(bytes) {
  try {
    let pixels = (new Buffer(bytes, 'base64')).reduce((list, elem, i) => {
      list.push(elem);
      if ((i + 1) % 3 === 0)
        list.push(255);
      return list;
    }, []);
    if (pixels.length === 1600) {
      return pixels
    } else {
      console.log('Pixel length is not', pixels.length)
      return getMainBackgroundTileColor();
    }
  } catch (e) {
    console.log(e);
    return getMainBackgroundTileColor();
  }
}
