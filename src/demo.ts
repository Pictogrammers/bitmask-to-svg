import bitmaskToPath, { toIndex } from './bitmaskToPath.js';

let $canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  $path: SVGPathElement;
const width = 5;
const height = 7;
const scale = 10;

const bitmask = Array(width * height).fill(0);

function Update() {
  context.clearRect(0, 0, $canvas.width, $canvas.height);
  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      if (bitmask[toIndex(x, y, width)] == 1) {
        context.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  const path = bitmaskToPath(bitmask, { width: width, scale: 10 });
  $path.setAttribute('d', path);
  const $pathVal = document.querySelector('[data-path]') as HTMLSpanElement;
  $pathVal.innerText = path;
}

window.addEventListener('load', () => {
  $canvas = document.getElementsByTagName('canvas')[0];
  context = $canvas.getContext('2d') as CanvasRenderingContext2D;
  $path = document.getElementsByTagName('path')[0];

  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      bitmask[toIndex(x, y, width)] = Math.random() < 0.3 ? 1 : 0;
    }
  }
  Update();

  $canvas.addEventListener('pointerdown', (e: PointerEvent) => {
    let { x: pX, y: pY, target } = e;
    let { x: eX, y: eY } = (target as HTMLCanvasElement).getBoundingClientRect();
    let x = Math.trunc((pX - eX) / scale),
      y = Math.trunc((pY - eY) / scale);
    bitmask[toIndex(x, y, width)] = bitmask[toIndex(x, y, width)] ? 0 : 1;
    Update();
  });
});
