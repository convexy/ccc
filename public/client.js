import * as THREE from "three";
import * as CANNON from "cannon-es";
import { WebSocket } from "ws";

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

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);
const gridHelper = new THREE.GridHelper(100, 100);
scene.add(gridHelper);

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
});

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

class CObjects {
  constructor(body, mesh) {
    this.body = body;
    this.mesh = mesh;
  }
}

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

let poses = null;
let cobjects = {};
const ws = new WebSocket("ws://localhost:8080");
ws.onmessage = (event) => {
  data = JSON.parse(event.data);
  if (data.type) {
    switch (data.type) {
      case "addBody":
        const body = new CANNON.Body(data.body);
        const geometry = new THREE.BoxGeometry(data.body.shapes[0].halfExtents.x * 2, data.body.shapes[0].halfExtents.y * 2, data.body.shapes[0].halfExtents.z * 2);
        const material = new THREE.MeshPhongMaterial({ color: data.color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
        cobjects[data.body.id] = new CObjects(body, mesh);
        scene.add(mesh);
        world.addBody(body);
        break;
      case "removeBody":
        const removeCObject = cobjects[data.id];
        if (removeCObject) {
          scene.remove(removeCObject.mesh);
          world.removeBody(removeCObject.body);
          delete cobjects[data.id];
        }
        break;
      case "updatePoses":
        poses = data.poses;
        break;
    }
  }
}


const clock = new THREE.Clock();
function animate() {
  stats.begin();
  const deltaTime = clock.getDelta();
  world.step(1 / 60, deltaTime, 3);

  if (poses) {
    for (const id in poses) {
      const pose = poses[id];
      if (cobjects[id]) {
        cobjects[id].body.position.lerp(pose.position, 0.2);
        cobjects[id].body.quaternion.lerp(pose.quaternion, 0.2);
      }
    }
  }
  for (const cobject of cobjects) {
    cobject.mesh.position.copy(cobject.body.position);
    cobject.mesh.quaternion.copy(cobject.body.quaternion);
  }
  moveCamera(deltaTime);
  renderer.render(scene, camera);
  stats.end();
}
renderer.setAnimationLoop(animate);

