import * as CANNON from "cannon-es";
import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";

class CWorld extends CANNON.World {
  constructor() {
    this.wss = new WebSocketServer({ port: 8080 });
    super({ gravity: new CANNON.Vec3(0, -9.82, 0) });
  }
  addBody(body) {
    super.addBody(body);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "addBody", body: body, color: 0x00ffff }));
      }
    });
  }
  removeBody(body) {
    super.removeBody(body);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "removeBody", id: body.id }));
      }
    });
  }
  getPoses() {
    return this.bodies.reduce((poses, body) => {
      poses[body.id] = {
        position: body.position,
        quaternion: body.quaternion,
      };
    }, {});
  }
}

class CBody extends CANNON.Body {
  constructor(options) {
    this.id = uuidv4();
    super(options);
  }
}

const cworld = new CWorld();

const groundBody = new CBody({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Plane(),
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
cworld.addBody(groundBody);

const cubeBodies = [];
function addCube() {
  const cubeSize = 0.4;
  const velocity = 10;
  const cubeBody = new Cbody({
    mass: 1,
    shape: new CANNON.Box(new CANNON.Vec3(cubeSize / 2, cubeSize / 2, cubeSize / 2)),
    position: new CANNON.Vec3(0, 1, 0),
    velocity: new CANNON.Vec3(velocity, 0, 0),
    angularVelocity: new CANNON.Vec3(0, 0, -5),
  });
  cubeBodies.push(cubeBody.cubeBody);
  if (cubeBodies.length > 300) {
    const oldCubeBody = cubeBodies.shift();
    world.removeBody(oldCubeBody.body);
  }
}

setTimeout(() => {
  setInterval(addCube, 1000);
}, 10000);

setInterval(() => {
  cworld.step(1 / 60);
}, 1000 / 60);

setInterval(() => {
  cworld.wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "update", data: cworld.getPoses() }));
    }
  });
}, 500);
