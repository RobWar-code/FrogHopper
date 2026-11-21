import {IMAGE_DIR} from './config.js';

const names = [
  'lilyPad', 'entrance', 'reedBed', 'leapingFish', 'splash',
  ...Array.from({length: 6}, (_, i) => `frog${String(i + 1).padStart(2, '0')}`),
  ...Array.from({length: 6}, (_, i) => `frogLeaping${String(i + 1).padStart(2, '0')}`),
];
const images = new Map();

/** Resolve even when an asset is unavailable; rendering has fallbacks. */
export function loadImages() {
  return Promise.all(names.map(name => new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      images.set(name, image);
      resolve();
    };
    image.onerror = () => resolve();
    image.src = `${IMAGE_DIR}${name}.png`;
  })));
}

/** All sprites use centre-based positioning. */
export function sprite(name, x, y, width, height, options = {}) {
  const image = images.get(name);
  if (!image) return null;
  return new Konva.Image({
    image, x: x - width / 2, y: y - height / 2,
    width, height, listening: false, ...options,
  });
}

export function frogSprite(angle, leaping = false) {
  const index = Math.min(5, Math.round(Math.abs(angle) / 22.5)) + 1;
  return {
    name: `frog${leaping ? 'Leaping' : ''}${String(index).padStart(2, '0')}`,
    flip: angle < 0,
  };
}

export function reedBedSegment(x, y, width, height, cropX, cropWidth) {
  const image = images.get('reedBed');
  if (!image || width <= 0 || cropWidth <= 0) return null;
  return new Konva.Image({
    image, x, y, width, height,
    crop: {x: cropX, y: 0, width: cropWidth, height: image.naturalHeight},
    listening: false,
  });
}

export function imageDimensions(name) {
  const image = images.get(name);
  return image ? {width: image.naturalWidth, height: image.naturalHeight} : null;
}
