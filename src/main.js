import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import ModelManager from './managers/ModelManager';
import SurfaceManager from './managers/SurfaceManager';
import ControlPointManager from './managers/ControlPointManager';
import UIManager from './managers/UIManager';
import InteractionManager from './controls/InteractionManager';
import STLExporterManager from './managers/STLExporterManager';
import { initializeScene, onWindowResize } from './initScene';
import { settings } from './utils/settings';

// Initialize Scene
const { scene, camera, renderer } = initializeScene();
const orbitCtrl = new OrbitControls(camera, renderer.domElement);
const transformCtrl = new TransformControls(camera, renderer.domElement);

orbitCtrl.damping = 0.2;
orbitCtrl.addEventListener('change', render);

transformCtrl.addEventListener('change', render);
scene.add(transformCtrl);

transformCtrl.addEventListener('objectChange', () => {
  controlPointManager.updateLattice();
  orbitCtrl.enabled = false;
});

window.addEventListener('resize', onWindowResize, false);

// Initialize Managers
const surfaceManager = new SurfaceManager(scene);
const modelManager = new ModelManager(scene, settings, settings.spanCounts, surfaceManager); // Pass settings and spanCounts
const controlPointManager = new ControlPointManager(scene, modelManager.ffd, modelManager); // Pass modelManager here
modelManager.setControlPointManager(controlPointManager); // Ensure modelManager has a reference to controlPointManager
const interactionManager = new InteractionManager(renderer, camera, scene, controlPointManager, surfaceManager, modelManager, orbitCtrl, transformCtrl); // Pass required parameters
const uiManager = new UIManager(modelManager, settings, surfaceManager, interactionManager); // Pass interactionManager

uiManager.init();

function animate() {
  requestAnimationFrame(animate);

  if (settings.isRotating) {
    modelManager.smoothMesh.rotation.y += 0.01;
    modelManager.wireframeMesh.rotation.y += 0.01;
  }

  orbitCtrl.update();
  render();
}

function render() {
  renderer.render(scene, camera);
}

modelManager.addModel();
animate();

// Event Listeners for Buttons
document.getElementById('startRotation').addEventListener('click', () => {
  settings.isRotating = true;
});

document.getElementById('stopRotation').addEventListener('click', () => {
  settings.isRotating = false;
});

document.getElementById('zoom').addEventListener('input', (event) => {
  const zoomValue = event.target.value;
  camera.position.z = 1000 - zoomValue * 10; // Adjust the multiplier as needed
});

document.getElementById('applyDeformationAndSmoothingButton').addEventListener('click', () => {
  modelManager.applySmoothing();
  modelManager.deform();
});

document.getElementById('exportSTLButton').addEventListener('click', () => {
  STLExporterManager.exportSTL(modelManager.smoothMesh);
});
