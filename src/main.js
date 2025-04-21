// main.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { AnimationMixer } from 'three';
import * as faceapi from 'face-api.js';

let eyeModel, mixer;
let blinkTop, blinkBottom;
let clock = new THREE.Clock();

const upperLids = [];
const lowerLids = [];
const irisMeshes = [];

let targetUpperY = 0.02;
let targetLowerY = 0.02;
let currentUpperY = 0.02;
let currentLowerY = 0.02;

let blinking = false;
let blinkTimeout = null;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 2, 2);
light.castShadow = true;
scene.add(light);
scene.add(new THREE.AmbientLight(0x222222));

const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.ShadowMaterial({ opacity: 0.3 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.2;
floor.receiveShadow = true;
scene.add(floor);

const loader = new GLTFLoader();
loader.load('/models/Animatronic_Eyes.glb', gltf => {
  eyeModel = gltf.scene;
  eyeModel.scale.set(0.5, 0.5, 0.5);
  eyeModel.position.set(0, 0, 0);
  scene.add(eyeModel);

  mixer = new AnimationMixer(eyeModel);
  blinkTop = mixer.clipAction(gltf.animations[0]);
  blinkBottom = mixer.clipAction(gltf.animations[1]);

  blinkTop.setLoop(THREE.LoopOnce);
  blinkBottom.setLoop(THREE.LoopOnce);
  blinkTop.clampWhenFinished = true;
  blinkBottom.clampWhenFinished = true;

  eyeModel.traverse(child => {
    if (child.isMesh) {
      const name = child.name.toLowerCase();
      if (name.includes('parp_down')) lowerLids.push(child);
      if (name.includes('eye001')) upperLids.push(child);
      if (name.includes('sphere')) {
        irisMeshes.push(child);
        child.material.color.setRGB(0.1, 0.6, 0.1); // base iris color
        child.userData.originalEmissive = child.material.emissive.clone();
      }
    }
  });

  startBlinking();
}, undefined, err => console.error('Model load error:', err));

const video = document.getElementById('webcam');
const statusBox = document.getElementById('statusBox');

navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
  video.srcObject = stream;
  video.onloadeddata = async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceExpressionNet.loadFromUri('/models');
    await faceapi.nets.ageGenderNet.loadFromUri('/models');
    detectSmiles();
  };
});

function detectSmiles() {
  faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceExpressions()
    .withAgeAndGender()
    .then(detections => {
      if (detections.length > 0) {
        const { expressions, age, gender, genderProbability } = detections[0];
        const isSmiling = expressions.happy > 0.6;

        if (isSmiling) {
          targetUpperY = 0.4;
          targetLowerY = -0.4;
          irisMeshes.forEach(mesh => {
            mesh.material.color.setRGB(0.1, 0.6, 0.1);
            mesh.material.emissive.setRGB(0.6, 0, 0);
          });
        } else {
          targetUpperY = 0.02;
          targetLowerY = 0.02;
          irisMeshes.forEach(mesh => {
            mesh.material.color.setRGB(0.1, 0.6, 0.1);
            mesh.material.emissive.setRGB(0, 0, 0);
          });
        }

        statusBox.innerText =
          `${isSmiling ? '😊 Smiling Detected' : '😐 No Smile'}\n` +
          `🎂 Age: ${age.toFixed(1)}\n` +
          `👤 Gender: ${gender} (${(genderProbability * 100).toFixed(0)}%)`;
      } else {
        statusBox.innerText = '😶 No Face Detected';
      }

      requestAnimationFrame(detectSmiles);
    });
}

function startBlinking() {
  if (blinking) return;
  blinking = true;
  scheduleNextBlink();
}

function scheduleNextBlink() {
  const delay = Math.random() * 4000 + 3000;
  blinkTimeout = setTimeout(() => {
    playBlink();
    scheduleNextBlink();
  }, delay);
}

function playBlink() {
  if (blinkTop) blinkTop.reset().play();
  if (blinkBottom) blinkBottom.reset().play();
}

let floatOffset = 0;
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);

  if (eyeModel) {
    floatOffset += 0.01;
    eyeModel.position.y = Math.sin(floatOffset) * 0.05;
  }

  currentUpperY += (targetUpperY - currentUpperY) * 0.1;
  upperLids.forEach(lid => lid.position.y = currentUpperY);
  currentLowerY += (targetLowerY - currentLowerY) * 0.1;
  lowerLids.forEach(lid => lid.position.y = currentLowerY);

  renderer.render(scene, camera);
}
animate();
