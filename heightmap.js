// Uses diamond-square recursively for <steps> steps. <steps> must be >= 1.
function heightMap(steps) {
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
  return heights
}

// Performs diamondSquare at the resolution level defined by size
function diamondSquare(heights, size) {
  if (size < 2) {
    return;
  }

  var half = size / 2;
  var roughness = 0.2;
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
