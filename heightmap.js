// Uses diamond-square recursively for <steps> steps. <steps> must be >= 1.
function heightMap(steps, globalX, globalZ, adjChunks) {
  var size = Math.pow(2, steps) + 1; // width, height of heightmap array
  var max = size - 1;
  var heights = [];

  for (y=0; y < size; y++) { // initializing arrays
    heights[y] = [];
    for (x=0; x < size; x++) {
      heights[y][x] = 0;
    }
  }

  heights[0][0] = max / 2;
  heights[max][0] = max / 2;
  heights[0][max] = max / 2;
  heights[max][max] = max / 2;

  diamondSquare(heights, max);
  if (adjChunks.length == 0) {
    return heights;
  }
  var alignedHeights = alignHeightMaps(heights, size, globalX, globalZ, adjChunks);
  return alignedHeights;
}

function perlinHeightMap(steps, globalZ, globalX, water) {
  var size = Math.pow(2, steps) + 1; // width, height of heightmap array
  var heights = [];

  for (z=0; z < size; z++) { // initializing arrays
    heights[z] = [];
    for (x=0; x < size; x++) {
      heights[z][x] = getHeight(globalZ + z/(size - 1), globalX + x/(size - 1), water);
    }
  }

  return heights;
}

function perlin(x, z, amp, freq) {
  return amp * noise.perlin2(freq * x, freq * z); 
}

function getHeight(x, z, water) {
  var out = 0;

  if (!water) {
    out += perlin(x, z, 80, 1);
    out += perlin(x, z, 40, 2);
    out += perlin(x, z, 20, 4);
    out += perlin(x, z, 10, 7);
    out += perlin(x, z, 5, 17);
  } else {
    out += perlin(x, z, 1, 50);
  }
  return out;
}

// Performs diamondSquare at the resolution level defined by size
function diamondSquare(heights, size) {
  if (size < 2) {
    return;
  }

  var half = size / 2;
  var roughness = 0.8;
  var scale = roughness * size;
  var max = heights.length;

  // Diamond step
  for (y = half; y < max; y+=size) {
    for (x = half; x < max; x+=size) {
      heights[x][y] = cornerAvg(heights, x, y, half) + randomOffset(scale);
    }
  }

  // Square step
  for (y=0; y < max; y+=half) {
    for (x = (y+half)%size; x < max; x+=size) {
      heights[x][y] = adjacentAvg(heights, x, y, half) + randomOffset(scale);
    }
  }
  // heights[x][y+mid] = adjacentAvg(heights, x, y+mid, mid) + randomOffset();
  // heights[x+mid][y] = adjacentAvg(heights, x+mid, y, mid) + randomOffset();
  // heights[x+mid][y+2*mid] = adjacentAvg(heights, x+mid, y+2*mid, mid) + randomOffset();
  // heights[x+2*mid][y+mid] = adjacentAvg(heights, x+2*mid, y+mid, mid) + randomOffset();
  diamondSquare(heights, size/2);
}

// Averages heights of points at corners of square with radius <dist> centered at x,y
function cornerAvg(heights, x, y, dist) {
  return (heights[x-dist][y-dist] + heights[x+dist][y-dist] + heights[x-dist][y+dist] + heights[x+dist][y+dist])/4;
}

// Averages heights of points at dist <dist> away from x,y in a straight line
function adjacentAvg(heights, x, y, dist) {
  var numPoints = 4;
  var sum = 0;

  if (x - dist >= 0) {
    sum += heights[x-dist][y];
  } else {
    numPoints -= 1;
  }

  if (y - dist >= 0) {
    sum += heights[x][y-dist];
  } else {
    numPoints -= 1;
  }

  if (x + dist < heights.length) {
    sum += heights[x+dist][y];
  } else {
    numPoints -= 1;
  }

  if (y + dist < heights.length) {
    sum += heights[x][y+dist];
  } else {
    numPoints -= 1;
  }

  if (numPoints == 0) {
    return 0;
  }

  return sum / numPoints;
}

function randomOffset(scale) {
  return scale * (Math.random() * 2 - 1); // From -scale to scale
}

function alignHeightMaps(heights, size, globalX, globalZ, adjChunks) {
  var scaleFactor = 0.9;

  var alignedHeights = [];

  for (var y=0; y < size; y++) { // initializing arrays
    alignedHeights[y] = [];
    for (var x=0; x < size; x++) {
      alignedHeights[y][x] = 0;
    }
  }

  // distribute offset to heightmap contents
  for (var y=0; y < size; y++) {
    for (var x=0; x < size; x++) {
      var offset = 0;
      for (var key in adjChunks) {
        var adjChunk = adjChunks[key];
        if (adjChunk.z < globalZ) { // left chunk
          offset += (adjChunk.heightmap[y][size-1] - heights[y][0]) * scaleFactor**(x+1);
        }
        if (adjChunk.z > globalZ) { // right chunk
          offset += (adjChunk.heightmap[y][0] - heights[y][size-1]) * scaleFactor**(size-x);
        }
        if (adjChunk.x < globalX) { // top chunk
          offset += (adjChunk.heightmap[size-1][x] - heights[0][x]) * scaleFactor**(y+1);
        }
        if (adjChunk.x > globalX) { // bottom chunk
          offset += (adjChunk.heightmap[0][x] - heights[size-1][x]) * scaleFactor**(size-y);
        }
      }
      alignedHeights[y][x] = heights[y][x] + offset;
    }
  }

  return alignedHeights;
}
