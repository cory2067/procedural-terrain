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

// width, height, width segments, height segments
var geometry = new THREE.PlaneBufferGeometry(50, 50, 10, 10);
geometry.rotateX(-Math.PI/2); // rotate to lie on the ground

// vertices can be modified to make some kind of height map
var vertices = geometry.attributes.position.array;
console.log(vertices);

for (var i = 1; i < vertices.length; i += 3) {
    vertices[i] = (i % 2);
}

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
