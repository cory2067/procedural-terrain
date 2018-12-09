// Width in heightmap points
var HEIGHTMAP_SCALE = 5;
var SIZE = Math.pow(2, HEIGHTMAP_SCALE) + 1;

// How many units of distance per point?
// (lower for fine resolution)
var LENGTH_PER_POINT = 4;

///////////////////////////////

var scene = new THREE.Scene();
//scene.background = new THREE.Color(0xbfd1e5);

// Apply fog to hide chunks we haven't loaded yet
var fogColor = new THREE.Color(0xbfd1e5);
scene.background = fogColor;
//scene.fog = new THREE.Fog(fogColor, 72, 128);

// Parameters: field of view (degrees), aspect ratio, near/far clip planes
var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 20000);
var controls = new THREE.FirstPersonControls(camera);
var clock = new THREE.Clock(); // used for computing deltas, for first person speed
controls.movementSpeed = 100;
controls.lookSpeed = 0.1;

// Create a renderer and attach it to the DOM
var renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// color, intensity
var light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(50, 30, 0);
scene.add(light);

var ambient = new THREE.AmbientLight(0x202020); // soft white light
scene.add(ambient);

var TOTAL_SIZE = SIZE * 3;
var baseWaterGeo = new THREE.PlaneBufferGeometry(TOTAL_SIZE * LENGTH_PER_POINT,
                                                 TOTAL_SIZE * LENGTH_PER_POINT,
                                                 TOTAL_SIZE, TOTAL_SIZE);

baseWaterGeo.rotateX(-Math.PI/2); // rotate to lie on the ground
baseWaterGeo.translate(0,10,0); // translate upwards
// 0,5,0 for other one

// Initialize our landscape as a flat plane
// depth, width, depth segments, width segments
var baseLandGeo = new THREE.PlaneBufferGeometry(TOTAL_SIZE * LENGTH_PER_POINT,
                                                TOTAL_SIZE * LENGTH_PER_POINT,
                                                TOTAL_SIZE, TOTAL_SIZE);
baseLandGeo.rotateX(-Math.PI/2); // rotate to lie on the ground

// MeshBasicMaterial just is a constant color
// var material = new THREE.MeshBasicMaterial( {color: 0xcc1177, side: THREE.DoubleSide} );
var texture = new THREE.TextureLoader().load("textures/stone.jpg");
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(36, 36);

var bumpTex = new THREE.TextureLoader().load("textures/stonebump2.jpg");
bumpTex.wrapS = THREE.RepeatWrapping;
bumpTex.wrapT = THREE.RepeatWrapping;
texture.repeat.set(12, 12);

var waterMaterial = new THREE.MeshPhongMaterial({reflectivity: 0.3, color: 0x0066ff});
var material = new THREE.MeshPhongMaterial({reflectivity: 0.2, map: texture, bumpMap: bumpTex, bumpScale: 0.1});

// Given a BufferGeometry, apply the (complete) heightmap
// Modifies the geometry object, returns nothing
function applyHeightmap(geometry, heightmap) {
    var vertices = geometry.attributes.position.array;
    for (var i = 0; i < vertices.length/3; i++ ) {
        var x = Math.floor(i / SIZE);
        var z = i % SIZE;

        vertices[i*3 + 1] = heightmap[z][x];
    }
}

// apply the heightmap for a chunk onto the heightmap for the entire render space
function applyPartialHeightmap(geometry, heightmap, startX, startZ) {
    var vertices = geometry.attributes.position.array;
    var totalSize = Math.sqrt(vertices.length / 3);
    var size = heightmap.length;
    for (var z = 0; z < size; z++) {
        for (var x = 0; x < size; x++) {
            // calulate the right corresponding index in vertices
            var i = ((x + startX*size)*totalSize + z + startZ*size)*3 + 1;
            vertices[i] = heightmap[z][x];
        }
    }

}

var chunks = {};

function chunkId(chunk) {
    return chunk.x + "," + chunk.z;
}

var CHUNK_SIZE = SIZE * LENGTH_PER_POINT;
function createChunk(x, z, adjChunks) {
    var heightmap = heightMap(HEIGHTMAP_SCALE, x, z, adjChunks);
    var waterheight = perlinHeightMap(HEIGHTMAP_SCALE, x+9, z+9, true);

    var chunk = {
        heightmap: heightmap,
        waterheight: waterheight,
        x: x,
        z: z,
    };

    chunks[chunkId(chunk)] = chunk;
    console.log("Created chunk at " + chunkId(chunk));

    return chunk;
}

function deleteChunk(chunk) {
    console.log("Removed chunk at " + chunkId(chunk));
    delete chunks[chunkId(chunk)];
}

var landmesh, watermesh;

camera.position.x = 0;
camera.position.y = 50;
camera.position.z = 0;

var lastX = -1;
var lastZ = -1;

function updateChunks(pos) {
    var xind = Math.floor((pos.x + CHUNK_SIZE/2) / CHUNK_SIZE - 0.01);
    var zind = Math.floor((pos.z + CHUNK_SIZE/2) / CHUNK_SIZE - 0.01);

    var changedChunk = false;
    if (lastX != xind || lastZ != zind) {
        changedChunk = true;
        lastX = xind;
        lastZ = zind;
    }

    var mustExist = [ // 9 surrounding chunks should exist
        [xind, zind],
        [xind+1, zind],
        [xind-1, zind],
        [xind, zind+1],
        [xind, zind-1],
        [xind+1, zind+1],
        [xind-1, zind+1],
        [xind+1, zind-1],
        [xind-1, zind-1],
    ]

    var landgeo = baseLandGeo.clone();
    var watergeo = baseWaterGeo.clone();
    for (var ind of mustExist) {
        var chunk = chunks[ind[0] + "," + ind[1]];
        var adjChunks = getAdjacentChunks(ind[0], ind[1]);
        if (!chunk) {
            // run perlin noise/diamond square to generate terrain
            chunk = createChunk(ind[0], ind[1], adjChunks);
        }
        
        if (changedChunk) {
            // rewrite the heightmap for the 3x3 chunk grid
            var x = ind[0] - xind + 1;
            var z = ind[1] - zind + 1;
            applyPartialHeightmap(landgeo, chunk.heightmap, z, x);
            applyPartialHeightmap(watergeo, chunk.waterheight, z, x);
        }
    }
    
    if (changedChunk) {
        // re-render the 3x3 chunk grid
        if (landmesh) scene.remove(landmesh);
        landgeo.computeVertexNormals();
        landmesh = new THREE.Mesh(landgeo, material);
        landmesh.position.x = xind * (CHUNK_SIZE);
        landmesh.position.z = zind * (CHUNK_SIZE);
        scene.add(landmesh);
        
        if (watermesh) scene.remove(watermesh);
        watergeo.computeVertexNormals();
        watermesh = new THREE.Mesh(watergeo, waterMaterial);
        watermesh.position.x = xind * (CHUNK_SIZE);
        watermesh.position.z = zind * (CHUNK_SIZE);
        scene.add(watermesh);
    }

    // free from memory chunks that are distance 3 away
    for (var key in chunks) {
        var chunk = chunks[key];
        if (Math.abs(chunk.x - xind) > 3 || Math.abs(chunk.z - zind) > 3) {
            deleteChunk(chunk);
        }
    }
}

function getAdjacentChunks(xInd, zInd) {
  var adjChunks = [
    chunks[(xInd-1) + "," + zInd],
    chunks[(xInd+1) + "," + zInd],
    chunks[xInd + "," + (zInd-1)],
    chunks[xInd + "," + (zInd+1)]
  ];
  var validChunks = []
  for (var key in adjChunks) {
    if (adjChunks[key] != undefined) {
      validChunks.push(adjChunks[key])
    }
  }
  return validChunks;
}

function animate() {
    requestAnimationFrame(animate);
    controls.update(clock.getDelta());
    updateChunks(camera.position);
    renderer.render(scene, camera);
}

animate();
