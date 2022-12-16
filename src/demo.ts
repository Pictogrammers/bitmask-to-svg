import bitmaskToPath from './index';

let $canvas, context, $path;
const width = 50;
const height = 50;
const scale = 10;

const bitmask = Array(width * height).fill(0);

function Update() {
	context.clearRect(0, 0, $canvas.width, $canvas.height);
	for (let y = 0; y < height; ++y) {
		for (let x = 0; x < width; ++x) {
			if (bitmask[XYToIndex(x, y)] == 1) {
				context.fillRect(x * scale, y * scale, scale, scale);
			}
		}
	}

	const path = CalculatePath(bitmask);
	$path.setAttribute('d', path);
}

window.addEventListener('load', () => {
	$canvas = document.getElementsByTagName('canvas')[0];
	context = canvas.getContext('2d');
	$path = document.getElementsByTagName('path')[0];
	
	for (let y = 0; y < height; ++y) {
		for (let x = 0; x < width; ++x) {
			bitmask[XYToIndex(x, y)] = Math.random() < 0.3 ? 1 : 0;
		}
	}
	
	Update();
	
	$canvas.addEventListener('pointerdown', ({ pageX: x, pageY: y }) => {
		x = Math.trunc(x / scale);
		y = Math.trunc(y / scale);
		bitmask[XYToIndex(x, y)] = bitmask[XYToIndex(x, y)] ? 0 : 1;
		Update();
	});
});