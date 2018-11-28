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
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/*
var geometry = new THREE.BoxGeometry(1, 1, 1);
var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
var cube = new THREE.Mesh(geometry, material);
scene.add(cube);

cube.rotation.x += 0.01;
cube.rotation.y += 0.01;
*/

// width, height, width segments, height segments
var geometry = new THREE.PlaneBufferGeometry(50, 50, 10, 10);
geometry.rotateX(-Math.PI/2); // rotate to lie on the ground

// vertices can be modified to make some kind of height map
var vertices = geometry.attributes.position.array;
console.log(vertices);

for (var i = 1; i < vertices.length; i += 3) {
    vertices[i] = (i % 2);
}

// todo: use some real textures here instead of the basic uniform coloring
var material = new THREE.MeshBasicMaterial( {color: 0xcc1177, side: THREE.DoubleSide} );
var land = new THREE.Mesh(geometry, material);
scene.add(land);

camera.position.y = 5;

function animate() {
    requestAnimationFrame(animate);
    controls.update(clock.getDelta());
    renderer.render(scene, camera);
}

animate();
