// Width in heightmap points
var WIDTH = 12;
var DEPTH = 12;

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

// color, intensity, max distance. decay
var light = new THREE.PointLight(0xffffff, 5, 0, 1);
light.position.set(-50, 10, 0);
scene.add(light);

// Initialize our landscape as a flat plane
// depth, width, depth segments, width segments
var geometry = new THREE.PlaneBufferGeometry(DEPTH * LENGTH_PER_POINT, 
                                             WIDTH * LENGTH_PER_POINT,
                                             DEPTH - 1, WIDTH - 1);
geometry.rotateX(-Math.PI/2); // rotate to lie on the ground

function getHeightmap(width, depth) {
    var map = [];

    for (var z=0; z < depth; z++) {
        var row = [];
        for (var x=0; x < width; x++) {
            row.push(Math.random() * 3);
        }
        map.push(row);
    }

    return map;
}

// Given a BufferGeometry, apply the heightmap
// Modifies the geometry object, returns nothing
function applyHeightmap(geometry, heightmap) {
    var vertices = geometry.attributes.position.array;
    for (var i = 0; i < vertices.length/3; i++ ) {
        var x = Math.floor(i / DEPTH);
        var z = i % DEPTH; 

        vertices[i*3 + 1] = heightmap[z][x];
    }
}

applyHeightmap(geometry, getHeightmap(WIDTH, DEPTH));

// MeshBasicMaterial just is a constant color
// var material = new THREE.MeshBasicMaterial( {color: 0xcc1177, side: THREE.DoubleSide} );
var material = new THREE.MeshPhongMaterial( {color: 0xcc1177, side: THREE.DoubleSide} );
var land = new THREE.Mesh(geometry, material);
scene.add(land);

camera.position.y = 5;

function animate() {
    requestAnimationFrame(animate);
    controls.update(clock.getDelta());
    renderer.render(scene, camera);
}

animate();
