import * as THREE from "./libs/three/three.module.js";
import * as CANNON from "./libs/cannon-es/cannon-es.js";

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

(function () {
  const groundBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
  });
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(groundBody);
  const goundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
  const groundMesh = new THREE.Mesh(goundGeometry, groundMaterial);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);
})();


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
  constructor(id, body, mesh) {
    this.id = id;
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
const ws = new WebSocket("ws://" + location.hostname + ":8080");
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type) {
    switch (data.type) {
      case "addCObject":
        const body = new CANNON.Body({
          mass: data.body.mass,
          shape: new CANNON.Box(new CANNON.Vec3(data.body.cubesize / 2, data.body.cubesize / 2, data.body.cubesize / 2)),
          position: data.body.position,
          quaternion: data.body.quaternion,
          velocity: data.body.velocity,
          angularVelocity: data.body.angularVelocity,
        });
        const geometry = new THREE.BoxGeometry(data.body.cubesize, data.body.cubesize, data.body.cubesize);
        const material = new THREE.MeshPhongMaterial({ color: data.body.color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
        cobjects[data.body.id] = new CObjects(data.body.id, body, mesh);
        scene.add(mesh);
        world.addBody(body);
        break;
      case "removeCObject":
        const removeCObject = cobjects[data.id];
        console.log("remove", removeCObject);
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
  const deltaTime = clock.getDelta();
  world.step(1 / 60, deltaTime, 3);

  if (poses) {
    for (const id in poses) {
      if (!cobjects[id]) continue;
      const cobject = cobjects[id];
      const pose = poses[id];
      cobject.body.position.copy(pose.position);
      cobject.body.quaternion.copy(pose.quaternion);
      cobject.body.velocity.copy(pose.velocity);
      cobject.body.angularVelocity.copy(pose.angularVelocity);
      // cobject.body.position.lerp(new CANNON.Vec3(pose.position.x, pose.position.y, pose.position.z), 0.2, cobject.body.position);
      // cobject.body.quaternion.slerp(new CANNON.Quaternion(pose.quaternion.x, pose.quaternion.y, pose.quaternion.z, pose.quaternion.w), 0.2, cobject.body.quaternion);
      // cobject.body.velocity.lerp(new CANNON.Vec3(pose.velocity.x, pose.velocity.y, pose.velocity.z), 0.2, cobject.body.velocity);
      // cobject.body.angularVelocity.lerp(new CANNON.Vec3(pose.angularVelocity.x, pose.angularVelocity.y, pose.angularVelocity.z), 0.2, cobject.body.angularVelocity);
    }
    poses = null;
  }
  for (const cobject of Object.values(cobjects)) {
    cobject.mesh.position.copy(cobject.body.position);
    cobject.mesh.quaternion.copy(cobject.body.quaternion);
  }
  moveCamera(deltaTime);
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
