interface Edge {
  x: number;
  y: number;
  type?: 'H' | 'V';
  next?: Edge;
}

interface Options {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  include?: number[][];
}

export function toIndex(x: number, y: number, width: number) {
  return y * width + x;
}

/**
 * Convert a 2d array to SVG paths.
 * @param data
 * @param options
 * @returns array of path strings, one per include grouping
 */
export default function bitmaskToPath(data: number[] | number[][], options: Options = {}) {

  let bitmask: number[],
    width: number,
    height: number,
    scale = 1,
    offsetX = 0,
    offsetY = 0,
    include: number[][] = [[1]];

  if (options.width) {
    bitmask = data as number[];
    width = options.width;
    height = bitmask.length / width;
    if (height % 1 !== 0) {
      throw new Error(`Invalid bitmask width. ${height} = ${bitmask.length} / ${width}`);
    }
  } else if (data[0] instanceof Array) {
    bitmask = data.flat();
    width = data[0].length;
    height = data.length;
  } else {
    throw new Error(`options.width is required for 1 dimensional array.`)
  }

  if (options.scale) {
    scale = options.scale;
  }

  if (options.offsetX) {
    offsetX = options.offsetX;
  }

  if (options.offsetY) {
    offsetY = options.offsetY;
  }

  if (options.include) {
    include = options.include;
  }

  const groupCount = include.length;
  const newWidth = width + 2;
  const newHeight = height + 2;

  function BMXYToIndex(x: number, y: number) {
    return (y + 1) * newWidth + (x + 1);
  }

  // Build value → group bitmask lookup
  const valueToGroupBits = new Map<number, number>();
  for (let g = 0; g < groupCount; ++g) {
    for (const val of include[g]) {
      valueToGroupBits.set(val, (valueToGroupBits.get(val) ?? 0) | (1 << g));
    }
  }

  // Single pass: build padded cellMask where each cell stores a bitfield of group membership
  const cellMask = new Int32Array(newWidth * newHeight);
  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      const bits = valueToGroupBits.get(bitmask[toIndex(x, y, width)]) ?? 0;
      if (bits) {
        cellMask[BMXYToIndex(x, y)] = bits;
      }
    }
  }

  // Allocate per-group edge structures upfront
  const edgeXCount = width * (height + 1);
  const edgeYCount = (width + 1) * height;
  const edgeCount = edgeXCount + edgeYCount;

  function EdgeXIndex(x: number, y: number) {
    return y * width + x;
  }
  function EdgeYIndex(x: number, y: number) {
    return edgeXCount + y * (width + 1) + x;
  }

  const allEdges: Edge[][] = [];
  const allContours: Set<Edge>[] = [];
  for (let g = 0; g < groupCount; ++g) {
    allEdges.push(Array(edgeCount).fill(0).map(() => ({ x: 0, y: 0, next: undefined })) as Edge[]);
    allContours.push(new Set<Edge>());
  }

  // Helper: check group membership via cellMask bit
  function isSet(x: number, y: number, bit: number) {
    return (cellMask[BMXYToIndex(x, y)] & bit) !== 0;
  }

  function SetEdge(contours: Set<Edge>, edge: Edge, x: number, y: number) {
    edge.x = x;
    edge.y = y;
    contours.add(edge);
  }

  function UnionGroup(contours: Set<Edge>, edge: Edge) {
    for (var itr = edge.next; itr !== undefined && itr !== edge; itr = itr.next) {
      contours.delete(itr);
    }
    if (itr !== undefined) {
      contours.add(edge);
    }
  }

  // Single pass edge detection for all groups
  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      const myMask = cellMask[BMXYToIndex(x, y)];
      if (myMask === 0) continue;

      for (let g = 0; g < groupCount; ++g) {
        const groupBit = 1 << g;
        if ((myMask & groupBit) === 0) continue;

        const edges = allEdges[g];
        const contours = allContours[g];

        if (!isSet(x - 1, y, groupBit)) {
          const edge = edges[EdgeYIndex(x, y)];
          SetEdge(contours, edge, x, y + 1);
          if (isSet(x - 1, y - 1, groupBit)) {
            edge.next = edges[EdgeXIndex(x - 1, y)];
          } else if (isSet(x, y - 1, groupBit)) {
            edge.next = edges[EdgeYIndex(x, y - 1)];
          } else {
            edge.next = edges[EdgeXIndex(x, y)];
          }
          UnionGroup(contours, edge);
        }
        if (!isSet(x + 1, y, groupBit)) {
          const edge = edges[EdgeYIndex(x + 1, y)];
          SetEdge(contours, edge, x + 1, y);
          if (isSet(x + 1, y + 1, groupBit)) {
            edge.next = edges[EdgeXIndex(x + 1, y + 1)];
          } else if (isSet(x, y + 1, groupBit)) {
            edge.next = edges[EdgeYIndex(x + 1, y + 1)];
          } else {
            edge.next = edges[EdgeXIndex(x, y + 1)];
          }
          UnionGroup(contours, edge);
        }
        if (!isSet(x, y - 1, groupBit)) {
          const edge = edges[EdgeXIndex(x, y)];
          SetEdge(contours, edge, x, y);
          if (isSet(x + 1, y - 1, groupBit)) {
            edge.next = edges[EdgeYIndex(x + 1, y - 1)];
          } else if (isSet(x + 1, y, groupBit)) {
            edge.next = edges[EdgeXIndex(x + 1, y)];
          } else {
            edge.next = edges[EdgeYIndex(x + 1, y)];
          }
          UnionGroup(contours, edge);
        }
        if (!isSet(x, y + 1, groupBit)) {
          const edge = edges[EdgeXIndex(x, y + 1)];
          SetEdge(contours, edge, x + 1, y + 1);
          if (isSet(x - 1, y + 1, groupBit)) {
            edge.next = edges[EdgeYIndex(x, y + 1)];
          } else if (isSet(x - 1, y, groupBit)) {
            edge.next = edges[EdgeXIndex(x - 1, y + 1)];
          } else {
            edge.next = edges[EdgeYIndex(x, y)];
          }
          UnionGroup(contours, edge);
        }
      }
    }
  }

  // Per-group post-processing: type assignment, compression, path building
  const paths: string[] = [];

  for (let g = 0; g < groupCount; ++g) {
    const contours = allContours[g];

    for (const edge of contours) {
      let itr = edge;
      do {
        if (itr.next) {
          itr.next.type = itr.x == itr?.next?.x ? 'V' : 'H';
          itr = itr.next;
        }
      } while (itr !== edge);
    }

    for (let edge of contours) {
      let itr = edge;
      do {
        if (itr.type != itr.next?.type) {
          while (itr.next?.type == itr.next?.next?.type) {
            if (itr.next === edge) {
              contours.delete(edge);
              edge = itr.next.next as Edge;
              contours.add(edge);
            }
            itr.next = itr.next?.next;
          }
        }
        itr = itr.next as Edge;
      } while (itr !== edge);
    }

    let path = '';
    for (const edge of contours) {
      path += `M${edge.x * scale},${edge.y * scale}`;
      for (var itr = edge.next; itr != edge; itr = itr?.next) {
        if (itr?.type == 'H') {
          path += `H${(itr?.x * scale) + offsetX}`;
        } else if (itr?.type == 'V') {
          path += `V${(itr?.y * scale) + offsetY}`;
        }
      }
      path += 'Z';
    }
    paths.push(path);
  }

  return paths;
}
