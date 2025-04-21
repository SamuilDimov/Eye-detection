import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { AnimationMixer } from 'three';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

let eyeModel, mixer, detectionModel;
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

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.set(0, 0, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 2, 2);
light.castShadow = true;
scene.add(light);
scene.add(new THREE.AmbientLight(0x222222));

// Floor shadow catcher
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.ShadowMaterial({ opacity: 0.3 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.2;
floor.receiveShadow = true;
scene.add(floor);

// Load model
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
      console.log('🧩 Mesh found:', name);

      if (name.includes('parp_down')) {
        lowerLids.push(child);
        console.log('👇 Lower eyelid added:', name);
      }

      if (name.includes('eye001')) {
        upperLids.push(child);
        console.log('👆 Upper eyelid added:', name);
      }

      if (name.includes('sphere')) {
        irisMeshes.push(child);
        child.userData.originalColor = child.material.color.clone(); // Save original color
        console.log('🎯 Iris mesh added:', name);
      }
    }
  });

  console.log('✅ Model loaded — upper:', upperLids.length, 'lower:', lowerLids.length);
  startBlinking();
}, undefined, err => {
  console.error('❌ Error loading model:', err);
});

// Webcam setup
const video = document.getElementById('webcam');
navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
  video.srcObject = stream;
  video.onloadeddata = () => {
    cocoSsd.load().then(model => {
      detectionModel = model;
      detectHuman();
    });
  };
});

// Status box
const statusBox = document.getElementById('statusBox');

// Person detection loop
function detectHuman() {
  if (!detectionModel || !video) return;

  detectionModel.detect(video).then(predictions => {
    const personDetected = predictions.some(p => p.class === 'person');

    if (personDetected) {
      targetUpperY = 0.4;
      targetLowerY = -0.4;
      statusBox.innerText = '🧍 Person Detected';

      irisMeshes.forEach(mesh => {
        mesh.material.color.setRGB(1.0, 0.2, 0.2); // 🔴 Tint red (preserves detail)
      });
    } else {
      targetUpperY = 0.02;
      targetLowerY = 0.02;
      statusBox.innerText = '😶 No person detected';

      irisMeshes.forEach(mesh => {
        mesh.material.color.copy(mesh.userData.originalColor); // Restore original color
      });
    }
  });

  requestAnimationFrame(detectHuman);
}

// Blinking system
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

// Floating animation
let floatOffset = 0;
let floatSpeed = 0.01;

// Render loop
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);

  if (eyeModel) {
    floatOffset += floatSpeed;
    eyeModel.position.y = Math.sin(floatOffset) * 0.05;
  }

  // Animate upper lids
  currentUpperY += (targetUpperY - currentUpperY) * 0.1;
  upperLids.forEach(lid => {
    lid.position.y = currentUpperY;
  });

  // Animate lower lids
  currentLowerY += (targetLowerY - currentLowerY) * 0.1;
  lowerLids.forEach(lid => {
    lid.position.y = currentLowerY;
  });

  renderer.render(scene, camera);
}
animate();
