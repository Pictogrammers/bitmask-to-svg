# bitmask-to-svg

JavaScript Library to convert a 1D/2D Array to an SVG Path.

Link to Demo (coming soon)

## Usage

Some use cases for this library.

- 1 Bit depth image to SVG path.
- Bitmap font glyph to SVG path.
- Pixel perfect SVG mask for an image.

```typescript
import bitmaskToPath from '@pictogrammers/bitmask-to-svg';

const letterP = [
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 1, 0, 1, 1],
    [0, 1, 1, 1, 0],
    [0, 1, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0]
];

const width = letterP[0].length;
const height = letterP.length;
const path = bitmaskToPath(letterP);
console.log(width, height, path);
// 5 7 M2,3H3V2H2ZM2,6H1V1H4V2H5V3H4V4H2Z
```

This path data can then be written to an SVG file in NodeJS.

```typescript
import { writeFileSync } from 'fs';

writeFileSync(
    "letter-p.svg",
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><path d="${data}" /></svg>`,
    {
      encoding: "utf8"
    }
);
```

## Spec

The `options` allows the path to be scaled or offset. The `width` is only required to be passed if the array is 1 dimensional.

| Property | Default | Description |
|----------|---------|-------------|
| width    | `undefined` | Required if `data` is a 1 dimensional array. |
| height   | `undefined` | Not actually used. |
| scale    | `1` | SVG path scale size. |
| offsetX  | `0` | This x offset ignores scale! |
| offsetY  | `0` | This y offset ignores scale! |

## Development

Clone the repo.

```bash
npm install
npm run build # Build
npm start # Build + View demo
# Navigate to localhost:3000
```