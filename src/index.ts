interface Edge {
  x: number;
  y: number;
  type?: 'H' | 'V';
  next?: Edge;
}

interface Options {
  width?: number;
  height?: number;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
}

export function bitmaskToPath(data: number[] | number[][], options: Options) {

  let bitmask, width, height, scale = 1, offsetX = 0, offsetY = 0;

  if (options.width) {
    bitmask = data;
    width = options.width;
    height = bitmask.length / width;
    if (height % 1 !== 0) {
      throw new Error(`Invalid bitmask width. ${height} = ${bitmask.length} / ${width}`);
    }
  } else if (bitmask[0] instanceof Array) {
    bitmask = data.flat();
    width = bitmask[0].length;
    height = bitmask.length;
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

  // Naively copy into a new bitmask with a border of 1 to make sampling easier (no out of bounds checks)
  const newWidth = width + 2;
  const newHeight = height + 2;
  const bm = Array(newWidth * newHeight).fill(0);

  function XYToIndex(x, y) {
    return y * width + x;
  }

  // BM is just shifted over (1, 1) for the padding
  function BMXYToIndex(x, y) {
    return (y + 1) * newWidth + (x + 1);
  }

  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      bm[BMXYToIndex(x, y)] = bitmask[XYToIndex(x, y)];
    }
  }

  // Edges data structure has [x, y, nextEdge, group]
  const edgeXCount = width * (height + 1);
  const edgeYCount = (width + 1) * height;
  const edgeCount = edgeXCount + edgeYCount;

  const edges = Array(edgeCount).fill(0).map(() => ({ x: 0, y: 0, next: undefined })) as Edge[];
  function EdgeXIndex(x, y) {
    return y * width + x;
  }
  function EdgeYIndex(x, y) {
    return edgeXCount + y * (width + 1) + x;
  }

  const groups = new Set<Edge>();

  function SetEdge(edge, x, y) {
    edge.x = x;
    edge.y = y;
    groups.add(edge);
  }

  function UnionGroup(edge) {
    for (var itr = edge.next; itr !== undefined && itr !== edge; itr = itr.next) {
      groups.delete(itr);
    }
    if (itr !== undefined) {
      groups.add(edge);
    }
  }

  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      if (bm[BMXYToIndex(x, y)] == 1) {
        const left = bm[BMXYToIndex(x - 1, y)];
        if (left == 0) {
          const edge = edges[EdgeYIndex(x, y)];
          SetEdge(edge, x, y + 1);
          if (bm[BMXYToIndex(x - 1, y - 1)]) {
            edge.next = edges[EdgeXIndex(x - 1, y)];
          } else if (bm[BMXYToIndex(x, y - 1)]) {
            edge.next = edges[EdgeYIndex(x, y - 1)];
          } else {
            edge.next = edges[EdgeXIndex(x, y)];
          }
          UnionGroup(edge);
        }
        const right = bm[BMXYToIndex(x + 1, y)];
        if (right == 0) {
          const edge = edges[EdgeYIndex(x + 1, y)];
          SetEdge(edge, x + 1, y);
          if (bm[BMXYToIndex(x + 1, y + 1)]) {
            edge.next = edges[EdgeXIndex(x + 1, y + 1)];
          } else if (bm[BMXYToIndex(x, y + 1)]) {
            edge.next = edges[EdgeYIndex(x + 1, y + 1)];
          } else {
            edge.next = edges[EdgeXIndex(x, y + 1)];
          }
          UnionGroup(edge);
        }
        const top = bm[BMXYToIndex(x, y - 1)];
        if (top == 0) {
          const edge: Edge = edges[EdgeXIndex(x, y)];
          SetEdge(edge, x, y);
          if (bm[BMXYToIndex(x + 1, y - 1)]) {
            edge.next = edges[EdgeYIndex(x + 1, y - 1)];
          } else if (bm[BMXYToIndex(x + 1, y)]) {
            edge.next = edges[EdgeXIndex(x + 1, y)];
          } else {
            edge.next = edges[EdgeYIndex(x + 1, y)];
          }
          UnionGroup(edge);
        }
        const bottom = bm[BMXYToIndex(x, y + 1)];
        if (bottom == 0) {
          const edge = edges[EdgeXIndex(x, y + 1)];
          SetEdge(edge, x + 1, y + 1);
          if (bm[BMXYToIndex(x - 1, y + 1)]) {
            edge.next = edges[EdgeYIndex(x, y + 1)];
          } else if (bm[BMXYToIndex(x - 1, y)]) {
            edge.next = edges[EdgeXIndex(x - 1, y + 1)];
          } else {
            edge.next = edges[EdgeYIndex(x, y)];
          }
          UnionGroup(edge);
        }
      }
    }
  }

  for (const edge of groups) {
    let itr = edge;
    do {
      if (itr.next) {
        itr.next.type = itr.x == itr?.next?.x ? 'V' : 'H';
        itr = itr.next;
      }
    } while (itr !== edge);
  }

  // Compress sequences of H and V
  for (let edge of groups) {
    let itr = edge;
    do {
      if (itr.type != itr.next?.type) {
        while (itr.next?.type == itr.next?.next?.type) {
          if (itr.next === edge) {
            groups.delete(edge);
            edge = itr.next.next as Edge;
            groups.add(edge); // Note this will cause it to iterate over this group again, meh.
          }
          itr.next = itr.next?.next;
        }
      }
      itr = itr.next as Edge;
    } while (itr !== edge);
  }

  let path = '';
  for (const edge of groups) {
    path += `M${edge.x * scale},${edge.y * scale}`;
    for (var itr = edge.next; itr != edge; itr = itr?.next) {
      if (itr?.type == 'H') {
        path += `H${itr?.x * scale}`;
      } else if (itr?.type == 'V') {
        path += `V${itr?.y * scale}`;
      }
    }
    path += 'Z';
  }
  return path;
}
