import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import * as CANNON from "cannon-es";

import Stats from "stats.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xddeeff);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
camera.position.set(10, 5, 10);
camera.lookAt(0, 5, 0);

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
});
const controls = new OrbitControls(camera, renderer.domElement);

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);
const gridHelper = new THREE.GridHelper(100, 100);
scene.add(gridHelper);

const bodies = [];
class Body {
  constructor(mesh, body) {
    this.mesh = mesh;
    this.body = body;
  }
  addToWorld() {
    scene.add(this.mesh);
    world.addBody(this.body);
    bodies.push(this);
  }
}

const groundBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Plane(),
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
const goundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
const groundMesh = new THREE.Mesh(goundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
const ground = new Body(groundMesh, groundBody);
ground.addToWorld();

const cubes = [];
function addCube() {
  const cubeSize = 0.4;
  const velocity = 10;
  const cubeBody = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Box(new CANNON.Vec3(cubeSize / 2, cubeSize / 2, cubeSize / 2)),
    position: new CANNON.Vec3(0, 1, 0),
    // velocity: new CANNON.Vec3(velocity, velocity, (Math.random() - 0.5) * velocity),
    velocity: new CANNON.Vec3(
      velocity, 0, 0),
    angularVelocity: new CANNON.Vec3(0, 0, -5),
  });
  const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
  const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
  const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cubeMesh.castShadow = true;
  cubeMesh.receiveShadow = true;
  const cube = new Body(cubeMesh, cubeBody)
  cube.addToWorld();
  cubes.push(cube);
  if (cubes.length > 300) {
    const oldCube = cubes.shift();
    const index = bodies.indexOf(oldCube);
    if (index > -1) {
      bodies.splice(index, 1);
    }
    scene.remove(oldCube.mesh);
    world.removeBody(oldCube.body);
    oldCube.mesh.geometry.dispose();
    oldCube.mesh.material.dispose();
    oldCube.mesh.geometry = null;
    oldCube.mesh.material = null;
    oldCube.mesh = null;
    oldCube.body = null;
  }
}

class ConvexyBody extends Body {
  constructor() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ffff });
    const group = new THREE.Group();
    const meshw = new THREE.Mesh(geometry, material);
    meshw.position.y = 0.5;
    group.add(meshw);
    const mesha = new THREE.Mesh(geometry, material);
    mesha.position.x = -1;
    mesha.position.y = -0.5;
    group.add(mesha);
    const meshs = new THREE.Mesh(geometry, material);
    group.add(meshs);
    meshs.position.y = -0.5;
    const meshd = new THREE.Mesh(geometry, material);
    meshd.position.x = +1;
    meshd.position.y = -0.5;
    group.add(meshd);
    const body = new CANNON.Body({
      mass: 0.1,
      shape: new CANNON.Box(new CANNON.Vec3(1.5, 1.0, 0.5)),
      position: new CANNON.Vec3(5, 1, 0),
    });
    super(group, body);
  }
}

(new ConvexyBody()).addToWorld();

setInterval(addCube, 500);

const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff);
directionalLight.position.set(10, 100, -10);
directionalLight.lookAt(0, 0, 0);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 200;
scene.add(directionalLight);


const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  j: false,
  k: false,
  h: false,
  l: false,
}
window.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "w":
    case "ArrowUp":
      keys.w = true;
      break;
    case "a":
    case "ArrowLeft":
      keys.a = true;
      break;
    case "s":
    case "ArrowDown":
      keys.s = true;
      break;
    case "d":
    case "ArrowRight":
      keys.d = true;
      break;
    case "j":
      keys.j = true;
      break;
    case "k":
      keys.k = true;
      break;
    case "h":
      keys.h = true;
      break;
    case "l":
      keys.l = true;
      break;
  }
});

window.addEventListener("keyup", (event) => {
  switch (event.key) {
    case "w":
    case "ArrowUp":
      keys.w = false;
      break;
    case "a":
    case "ArrowLeft":
      keys.a = false;
      break;
    case "s":
    case "ArrowDown":
      keys.s = false;
      break;
    case "d":
    case "ArrowRight":
      keys.d = false;
      break;
    case "j":
      keys.j = false;
      break;
    case "k":
      keys.k = false;
      break;
    case "h":
      keys.h = false;
      break;
    case "l":
      keys.l = false;
      break;
  }
});

const cameraSpeed = 4;
const cameraRotationSpeed = 1;
function moveCamera(deltaTime) {
  if (keys.w) camera.translateZ(- cameraSpeed * deltaTime); // 前進
  if (keys.s) camera.translateZ(+ cameraSpeed * deltaTime); // 後退
  if (keys.a) camera.translateX(- cameraSpeed * deltaTime); // 左移動
  if (keys.d) camera.translateX(+ cameraSpeed * deltaTime); // 右移動
  if (keys.j) camera.translateY(- cameraSpeed * deltaTime); // 左移動
  if (keys.k) camera.translateY(+ cameraSpeed * deltaTime); // 右移動
  if (keys.h) camera.rotateY(+ cameraRotationSpeed * deltaTime); // 左回転
  if (keys.l) camera.rotateY(- cameraRotationSpeed * deltaTime); // 右回転
}

const clock = new THREE.Clock();
function animate() {
  stats.begin();
  const deltaTime = clock.getDelta();
  world.step(1 / 60, deltaTime, 3);
  for (const body of bodies) {
    body.mesh.position.copy(body.body.position);
    body.mesh.quaternion.copy(body.body.quaternion);
  }
  moveCamera(deltaTime);
  renderer.render(scene, camera);
  stats.end();
}
renderer.setAnimationLoop(animate);

