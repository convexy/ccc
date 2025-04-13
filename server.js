import { createServer } from "http";
import express from "express";
import * as CANNON from "cannon-es";
import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { velocity } from "three/tsl";

class CWorld {
  constructor() {
    this.physics = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
    this.wss = new WebSocketServer({ port: 8080 });
    this.cobjects = [];
  }
  addCObject(cobject) {
    this.cobjects.push(cobject);
    this.physics.addBody(cobject.physics);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: "addCObject", body: cobject.getBase()
        }));
      }
    });
  }
  removeCObject(cobject) {
    this.cobjects.splice(this.cobjects.indexOf(cobject), 1);
    this.physics.removeBody(cobject);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "removeCObject", id: cobject.id }));
      }
    });
  }
  sendAllCobjects(ws) {
    this.cobjects.forEach((cobject) => {
      ws.send(JSON.stringify({
        type: "addCObject", body: cobject.getBase()
      }));
    });
  }
  getPoses() {
    return this.cobjects.reduce((poses, cobject) => {
      poses[cobject.id] = {
        position: cobject.physics.position,
        quaternion: cobject.physics.quaternion,
        velocity: cobject.physics.velocity,
        angularVelocity: cobject.physics.angularVelocity,
      };
      return poses;
    }, {});
  }
}

const cworld = new CWorld();

cworld.wss.on("connection", (ws) => {
  cworld.sendAllCobjects(ws);
});

const groundBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Plane(),
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
cworld.physics.addBody(groundBody);

class CObjects {
  constructor() {
  }
  getBase() {
    return {
      id: this.id,
      mass: this.mass,
      shapeType: this.shapeType,
      cubesize: this.cubeSize,
      color: this.color,
      position: this.physics.position,
      quaternion: this.physics.quaternion,
      velocity: this.physics.velocity,
      angularVelocity: this.physics.angularVelocity,
    }
  }
}

class CCube extends CObjects {
  constructor() {
    super();
    this.id = uuidv4();
    const cubeSize = 0.4;
    const mass = 1;
    const velocity = 10;
    this.physics = new CANNON.Body({
      mass: mass,
      shape: new CANNON.Box(new CANNON.Vec3(cubeSize / 2, cubeSize / 2, cubeSize / 2)),
      position: new CANNON.Vec3(0, 2, 0),
      velocity: new CANNON.Vec3(velocity, 0, 0),
      angularVelocity: new CANNON.Vec3(0, 0, -5),
    });
    this.shapeType = "cube";
    this.cubeSize = cubeSize;
    this.mass = mass;
    this.color = 0x00ffff;
  }
}

const ccubes = [];
function addCube() {
  const ccube = new CCube();
  cworld.addCObject(ccube);
  ccubes.push(ccube);
  if (ccubes.length > 300) {
    const oldCube = ccubes.shift();
    cworld.removeCObject(oldCube);
  }
}

setTimeout(() => {
  setInterval(addCube, 1000);
}, 1000);

let lastTime = 0;
setInterval(() => {
  let currentTime = performance.now() / 1000;
  let deltaTime = currentTime - lastTime;
  cworld.physics.step(1 / 60, deltaTime, 3);
  lastTime = currentTime;
}, 1000 / 60);

setInterval(() => {
  cworld.wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "updatePoses", poses: cworld.getPoses() }));
    }
  });
}, 1000);

const app = express();
const server = createServer(app);
app.use(express.static("public"));
server.listen(8000, () => {
  console.log("Server is running on http://localhost:8000");
});
