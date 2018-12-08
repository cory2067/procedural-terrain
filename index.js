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
scene.fog = new THREE.Fog(fogColor, 75, 132);

// Parameters: field of view (degrees), aspect ratio, near/far clip planes
var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 20000);
var controls = new THREE.FirstPersonControls(camera);
var clock = new THREE.Clock(); // used for computing deltas, for first person speed
controls.movementSpeed = 10;
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


var waterBaseGeo = new THREE.PlaneBufferGeometry(SIZE * LENGTH_PER_POINT,
                                             SIZE * LENGTH_PER_POINT,
                                             SIZE - 1, SIZE - 1);

waterBaseGeo.rotateX(-Math.PI/2); // rotate to lie on the ground
waterBaseGeo.translate(0,8,0); // translate upwards
// 0,5,0 for other one

// Initialize our landscape as a flat plane
// depth, width, depth segments, width segments
var baseLandGeo = new THREE.PlaneBufferGeometry(SIZE * LENGTH_PER_POINT,
                                                SIZE * LENGTH_PER_POINT,
                                                SIZE - 1, SIZE - 1);
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

// Given a BufferGeometry, apply the heightmap
// Modifies the geometry object, returns nothing
function applyHeightmap(geometry, heightmap) {
    var vertices = geometry.attributes.position.array;
    for (var i = 0; i < vertices.length/3; i++ ) {
        var x = Math.floor(i / SIZE);
        var z = i % SIZE;

        vertices[i*3 + 1] = heightmap[z][x];
    }
}

var chunks = {};


function chunkId(chunk) {
    return chunk.x + "," + chunk.z;
}

var CHUNK_SIZE = SIZE * LENGTH_PER_POINT;
function createChunk(x, z, adjChunks) {
    var geometry = baseLandGeo.clone();
    // applyHeightmap(geometry, perlinHeightMap(HEIGHTMAP_SCALE, x, z));

    var heightmap = heightMap(HEIGHTMAP_SCALE, x, z, adjChunks);
    applyHeightmap(geometry, heightmap);
    geometry.computeVertexNormals();

    var waterGeo = waterBaseGeo.clone();
    applyHeightmap(waterGeo, perlinHeightMap(HEIGHTMAP_SCALE, x+9, z+9, true));
    waterGeo.computeVertexNormals();

    var land = new THREE.Mesh(geometry, material);
    var water = new THREE.Mesh(waterGeo, waterMaterial);

    land.position.x = x * CHUNK_SIZE;
    land.position.z = z * CHUNK_SIZE;
    water.position.x = x * CHUNK_SIZE;
    water.position.z = z * CHUNK_SIZE;

    geometry.translate(x * CHUNK_SIZE, 0, z * CHUNK_SIZE);

    var chunk = {
        land: land,
        water: water,
        heightmap: heightmap,
        geometry: geometry,
        waterGeo: waterGeo,
        x: x,
        z: z,
    };

    // scene.add(chunk.land);
    // scene.add(chunk.water);
    chunks[chunkId(chunk)] = chunk;
    console.log("Created chunk at " + chunkId(chunk));

    return chunk;
}

function deleteChunk(chunk) {
    scene.remove(chunk.land);
    scene.remove(chunk.water);

    console.log("Removed chunk at " + chunkId(chunk));
    delete chunks[chunkId(chunk)];
}

var chunk = createChunk(0, 0, []);
var landMesh;

camera.position.x = 0;
camera.position.y = 50;
camera.position.z = 0;

function updateChunks(pos) {
    var xind = Math.floor((pos.x + CHUNK_SIZE/2) / CHUNK_SIZE - 0.01);
    var zind = Math.floor((pos.z + CHUNK_SIZE/2) / CHUNK_SIZE - 0.01);

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

    var chunkGeos = [];
    for (var ind of mustExist) {
        var chunk = chunks[ind[0] + "," + ind[1]];
        if (!chunk) {
            var adjChunks = getAdjacentChunks(ind[0], ind[1]);
            chunkGeos.push(createChunk(ind[0], ind[1], adjChunks).geometry);
        } else {
            chunkGeos.push(chunk.geometry);
        }
    }
    if (landMesh) {
        scene.remove(landMesh);
    }

    
    console.log(chunkGeos);
    var landGeo = THREE.BufferGeometryUtils.mergeBufferGeometries(chunkGeos);
    landGeo.computeVertexNormals();
    landGeo.normalizeNormals();
    var landMesh = new THREE.Mesh(landGeo, material);
    scene.add(landMesh);

    for (var key in chunks) {
        var chunk = chunks[key];
        if (Math.abs(chunk.x - xind) > 2 || Math.abs(chunk.z - zind) > 2) {
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
