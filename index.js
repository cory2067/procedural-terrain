// Width in heightmap points
var HEIGHTMAP_SCALE = 4;
var SIZE = Math.pow(2, HEIGHTMAP_SCALE) + 1;

// How many units of distance per point?
// (lower for fine resolution)
var LENGTH_PER_POINT = 4;

///////////////////////////////

var scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfd1e5);

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

// Initialize our landscape as a flat plane
// depth, width, depth segments, width segments
var geometry = new THREE.PlaneBufferGeometry(SIZE * LENGTH_PER_POINT,
                                             SIZE * LENGTH_PER_POINT,
                                             SIZE - 1, SIZE - 1);
geometry.rotateX(-Math.PI/2); // rotate to lie on the ground

var waterGeo = new THREE.PlaneBufferGeometry(SIZE * LENGTH_PER_POINT,
                                             SIZE * LENGTH_PER_POINT,
                                             SIZE - 1, SIZE - 1);
waterGeo.rotateX(-Math.PI/2); // rotate to lie on the ground
waterGeo.translate(0,6,0); // translate upwards

// Given a BufferGeometry, apply the heightmap
// Modifies the geometry object, returns nothing
function applyHeightmap(geometry, heightmap) {
    var vertices = geometry.attributes.position.array;
    console.log(geometry.attributes.position);
    for (var i = 0; i < vertices.length/3; i++ ) {
        var x = Math.floor(i / SIZE);
        var z = i % SIZE;

        vertices[i*3 + 1] = heightmap[z][x];
    }
}

applyHeightmap(geometry, heightMap(HEIGHTMAP_SCALE));

// MeshBasicMaterial just is a constant color
// var material = new THREE.MeshBasicMaterial( {color: 0xcc1177, side: THREE.DoubleSide} );
var texture = new THREE.TextureLoader().load("textures/stone.jpg");
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(12, 12);

var material = new THREE.MeshPhongMaterial({/*color: 0xcc1177,*/ map: texture});
var waterMaterial = new THREE.MeshPhongMaterial({color: 0x0066ff});
var land = new THREE.Mesh(geometry, material);
var water = new THREE.Mesh(waterGeo, waterMaterial);
light.target = land;
scene.add(land);
scene.add(water);

camera.position.x = -50;
camera.position.y = 30;
camera.position.z = 0;

function animate() {
    requestAnimationFrame(animate);
    controls.update(clock.getDelta());
    renderer.render(scene, camera);
}

animate();
