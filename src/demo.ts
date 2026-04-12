import bitmaskToPath, { toIndex } from './bitmaskToPath.js';

let $canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  $path: SVGPathElement;
const width = 10;
const height = 10;
const scale = 10;
const palettes = new Map([
  ['#224939', 'Darkest Green'],
  ['#36774A', 'Dark Green'],
  ['#4DA350', 'Light Green'],
  ['#89C177', 'Lightest Green']
]);

const bitmask = Array(width * height).fill(0);

function Update() {
  // Update Canvas
  context.clearRect(0, 0, $canvas.width, $canvas.height);
  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      if (bitmask[toIndex(x, y, width)] == 1) {
        context.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  // Get Path
  const path = bitmaskToPath(bitmask, { width: width, scale: 10 });
  $path.setAttribute('d', path[0]);
  const $pathVal = document.querySelector('[data-path]') as HTMLSpanElement;
  $pathVal.innerText = path[0];

  // Write to table cells
  const $data = document.getElementById('data');
  const data = ['[', '\n'];
  for (let y = 0; y < height; ++y) {
    data.push('  ', '[')
    for (let x = 0; x < width; ++x) {
      data.push(`${bitmask[toIndex(x, y, width)]}`);
      if (x !== width - 1) { data.push(',', ' '); }
    }
    data.push(']', ',', '\n');
  }
  data.push(']', '\n');
  if ($data) {
    $data.textContent = data.join('');
  }
}

window.addEventListener('load', () => {
  const $palette = document.getElementById('palette');
  const $grid = document.getElementById('grid');
  const $svg = document.getElementsByTagName('svg')[0] as SVGSVGElement;
  $canvas = document.getElementsByTagName('canvas')[0] as HTMLCanvasElement;
  context = $canvas.getContext('2d') as CanvasRenderingContext2D;
  $path = document.getElementsByTagName('path')[0];

  $canvas.width = width * scale;
  $canvas.height = height * scale;

  $svg.setAttribute('viewBox', `0 0 ${width * scale} ${height * scale}`);
  $svg.style.width = `${width * scale}px`;
  $svg.style.height = `${height * scale}px`;

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

  palettes.forEach((label, color) => {
    const $button = document.createElement('button');
    $button.style.backgroundColor = color;
    $button.title = label;
    $palette?.appendChild($button);
  });
});
