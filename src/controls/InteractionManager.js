import * as THREE from 'three';

class InteractionManager {
  constructor(renderer, camera, scene, controlPointManager, surfaceManager, modelManager, orbitCtrl, transformCtrl) {
    this.renderer = renderer;
    this.camera = camera;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.selectedControlPoint = null;
    this.controlPointManager = controlPointManager;
    this.surfaceManager = surfaceManager;
    this.modelManager = modelManager;
    this.orbitCtrl = orbitCtrl;
    this.transformCtrl = transformCtrl;
    this.pointPlacingMode = false; // Initialize pointPlacingMode here

    this.renderer.domElement.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false);
    this.renderer.domElement.addEventListener('mousedown', this.onDocumentMouseDown.bind(this), false);
  }

  setPointPlacingMode(value) {
    this.pointPlacingMode = value; // Update the class property
  }

  onDocumentMouseMove(event) {
    event.preventDefault();
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.controlPointManager.ctrlPtMeshes);
    if (intersects.length > 0 && this.selectedControlPoint !== intersects[0].object) {
      this.renderer.domElement.style.cursor = 'pointer';
    } else {
      this.renderer.domElement.style.cursor = 'auto';
    }
  }

  onDocumentMouseDown(event) {
    event.preventDefault();
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (this.pointPlacingMode) { // Access the class property
      const intersects = this.raycaster.intersectObject(this.modelManager.smoothMesh);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        console.log('Point added at:', point); // Debugging
        this.surfaceManager.addPoint(point);
      }
    } else {
      const intersects = this.raycaster.intersectObjects(this.controlPointManager.ctrlPtMeshes);
      if (intersects.length > 0) {
        this.orbitCtrl.enabled = false;
        if (this.selectedControlPoint !== intersects[0].object) {
          if (this.selectedControlPoint) this.transformCtrl.detach(this.selectedControlPoint);
          this.selectedControlPoint = intersects[0].object;
          this.transformCtrl.attach(this.selectedControlPoint);
        }
      } else {
        this.orbitCtrl.enabled = true;
      }
    }
  }
}

export default InteractionManager;