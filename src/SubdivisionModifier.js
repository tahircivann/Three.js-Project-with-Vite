import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { LoopSubdivision } from 'three-subdivide';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import GUI from 'lil-gui';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import FFD from './ffd/FFDManager'; // Keep the original FFD as it is

// Constants and Variables
const MIN_SUBD_LEVEL = 0;
const MAX_SUBD_LEVEL = 4;
const modelLibrary = [
  { type: 'BoxGeometry', args: [200, 200, 200, 2, 2, 2] },
  { type: 'TorusGeometry', args: [100, 60, 4, 8, Math.PI * 2] },
  { type: 'SphereGeometry', args: [100, 3, 3], meshScale: 1.5 },
  { type: 'IcosahedronGeometry', args: [100, 1], meshScale: 1.5 },
  { type: 'CylinderGeometry', args: [25, 75, 200, 8, 3], meshScale: 1.5 },
  { type: 'OctahedronGeometry', args: [200, 0] },
];

// Scene Manager Class
class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 500;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.physicallyCorrectLights = true;
    document.body.appendChild(this.renderer.domElement);
    this.ambientLight = new THREE.AmbientLight(0x404040, 1);
    this.scene.add(this.ambientLight);
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.position.set(1, 1, 1).normalize();
    this.scene.add(this.directionalLight);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.damping = 0.2;
    this.controls.addEventListener('change', () => this.render());
    this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
    this.transformControls.addEventListener('change', () => this.render());
    this.scene.add(this.transformControls);
    this.transformControls.addEventListener('objectChange', () => {
      this.updateLattice();
      this.controls.enabled = false;
    });
    window.addEventListener('resize', () => this.onWindowResize(), false);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

// GUI Manager Class
class GUIManager {
  constructor(sceneManager, modelManager) {
    this.gui = new GUI();
    this.sceneManager = sceneManager;
    this.modelManager = modelManager;
    this.init();
  }

  init() {
    const modelFolder = this.gui.addFolder('Models');
    modelFolder.add({ model: modelLibrary[0].type }, 'model', modelLibrary.map((model) => model.type))
      .name('Select Model')
      .onChange((value) => {
        const index = modelLibrary.findIndex((model) => model.type === value);
        this.modelManager.addModel(index);
      });

    const settingsFolder = this.gui.addFolder('Settings');
    settingsFolder.add(this.modelManager, 'pointPlacingMode')
      .name('Point Placing Mode')
      .onChange((value) => {
        if (!value) {
          this.modelManager.createSurface();
          this.modelManager.applySmoothing();
        }
      });

    settingsFolder.add(this.modelManager, 'smoothingFactor', 0, 1, 0.01)
      .name('Smoothing Factor')
      .onChange(() => {
        this.modelManager.applySmoothing();
      });

    settingsFolder.add(this.modelManager, 'meshQuality', MIN_SUBD_LEVEL, MAX_SUBD_LEVEL, 1)
      .name('Mesh Quality')
      .onChange((value) => {
        this.modelManager.updateSubdivisionLevel(value);
      });

    settingsFolder.open();
    modelFolder.open();
  }
}

// Model Manager Class
class ModelManager {
  constructor(sceneManager, ffdManager) {
    this.sceneManager = sceneManager;
    this.ffdManager = ffdManager;
    this.modelIndex = 0;
    this.smoothMesh = null;
    this.wireframeMesh = null;
    this.smoothVertsUndeformed = [];
    this.meshQuality = 2;
    this.smoothingFactor = 0.5;
    this.pointPlacingMode = false;
    this.placedPoints = [];
    this.surfaceMesh = null;
    this.isRotating = false;
    this.spanCounts = [2, 2, 2];
    this.ctrlPtMeshes = [];
    this.latticeLines = [];
    this.selectedControlPoint = null;
    this.init();
  }

  init() {
    this.addModel(this.modelIndex);
    this.addEventListeners();
  }

  addEventListeners() {
    document.getElementById('startRotation').addEventListener('click', () => {
      this.isRotating = true;
    });

    document.getElementById('stopRotation').addEventListener('click', () => {
      this.isRotating = false;
    });

    document.getElementById('zoom').addEventListener('input', (event) => {
      const zoomValue = event.target.value;
      this.sceneManager.camera.position.z = 1000 - zoomValue * 10;
    });

    document.getElementById('applyDeformationAndSmoothingButton').addEventListener('click', () => {
      this.applySmoothing();
      this.deform();
    });

    document.getElementById('exportSTLButton').addEventListener('click', () => {
      const exporter = new STLExporter();
      const stlString = exporter.parse(this.smoothMesh);

      const blob = new Blob([stlString], { type: 'text/plain' });
      const link = document.createElement('a');
      link.style.display = 'none';
      document.body.appendChild(link);

      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = 'model.stl';
      link.click();

      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    });
  }

  addModel(index) {
    if (this.smoothMesh) {
      this.sceneManager.scene.remove(this.smoothMesh);
      this.sceneManager.scene.remove(this.wireframeMesh);
    }

    this.modelIndex = index;
    const model = modelLibrary[this.modelIndex];
    let geometry = new THREE[model.type](...model.args);

    if (model.scale) geometry.scale(model.scale, model.scale, model.scale);

    const iterations = this.meshQuality;
    const params = {
      split: true,
      uvSmooth: false,
      preserveEdges: false,
      flatOnly: false,
      maxTriangles: Infinity,
    };
    geometry = LoopSubdivision.modify(geometry, iterations, params);

    this.smoothVertsUndeformed.length = 0;
    for (let i = 0; i < geometry.attributes.position.array.length; i += 3) {
      const vertex = new THREE.Vector3(
        geometry.attributes.position.array[i],
        geometry.attributes.position.array[i + 1],
        geometry.attributes.position.array[i + 2]
      );
      this.smoothVertsUndeformed.push(vertex.clone());
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.5,
      roughness: 0.5
    });
    this.smoothMesh = new THREE.Mesh(geometry, material);

    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: true
    });
    this.wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);

    const modelScale = model.meshScale || 1;
    this.smoothMesh.scale.set(modelScale, modelScale, modelScale);
    this.wireframeMesh.scale.set(modelScale, modelScale, modelScale);

    this.sceneManager.scene.add(this.smoothMesh);
    this.sceneManager.scene.add(this.wireframeMesh);

    this.rebuildFFD(false);
  }

  createSurface() {
    if (this.surfaceMesh) {
      this.sceneManager.scene.remove(this.surfaceMesh);
    }

    if (this.placedPoints.length > 3) {
      const points = this.placedPoints.map((pointMesh) => pointMesh.position);
      const geometry = new ConvexGeometry(points);
      const material = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        opacity: 0.5,
        transparent: true
      });
      this.surfaceMesh = new THREE.Mesh(geometry, material);
      this.sceneManager.scene.add(this.surfaceMesh);
    }
  }

  applySmoothing() {
    if (!this.surfaceMesh || !this.smoothMesh) return;

    const smoothArea = this.surfaceMesh.geometry;
    const positions = this.smoothMesh.geometry.attributes.position.array;
    const tempPosition = new THREE.Vector3();
    const smoothPositions = smoothArea.attributes.position.array;

    for (let i = 0; i < this.smoothVertsUndeformed.length; i++) {
      tempPosition.copy(this.smoothVertsUndeformed[i]);

      for (let j = 0; j < smoothPositions.length; j += 3) {
        const smoothVertex = new THREE.Vector3(smoothPositions[j], smoothPositions[j + 1], smoothPositions[j + 2]);
        if (tempPosition.distanceTo(smoothVertex) < 20) {
          const evalPt = this.ffdManager.evalWorld(tempPosition);
          tempPosition.lerp(evalPt, this.smoothingFactor);
          positions[i * 3] = tempPosition.x;
          positions[i * 3 + 1] = tempPosition.y;
          positions[i * 3 + 2] = tempPosition.z;
          break;
        }
      }
    }

    this.smoothMesh.geometry.attributes.position.needsUpdate = true;
    this.smoothMesh.geometry.computeVertexNormals();
  }

  laplacianSmooth(geometry, iterations, lambda = 0.5) {
    const positions = geometry.attributes.position.array;
    const vertices = [];
    const neighbors = [];

    for (let i = 0; i < positions.length; i += 3) {
      vertices.push(new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]));
      neighbors.push([]);
    }

    geometry.index.array.forEach((index, i, array) => {
      const a = array[i * 3];
      const b = array[i * 3 + 1];
      const c = array[i * 3 + 2];
      neighbors[a].push(vertices[b], vertices[c]);
      neighbors[b].push(vertices[a], vertices[c]);
      neighbors[c].push(vertices[a], vertices[b]);
    });

    for (let iter = 0; iter < iterations; iter++) {
      const newPositions = [];

      for (let i = 0; i < vertices.length; i++) {
        const v = vertices[i];
        const n = neighbors[i];
        const avg = new THREE.Vector3();

        n.forEach((neighbor) => avg.add(neighbor));
        avg.divideScalar(n.length);

        const smoothVertex = v.clone().lerp(avg, lambda);
        newPositions.push(smoothVertex);
      }

      for (let i = 0; i < vertices.length; i++) {
        vertices[i].copy(newPositions[i]);
      }
    }

    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = vertices[i / 3].x;
      positions[i + 1] = vertices[i / 3].y;
      positions[i + 2] = vertices[i / 3].z;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  updateSubdivisionLevel(level) {
    this.meshQuality = level;
    this.addModel(this.modelIndex);
    this.applySmoothing();
  }

  rebuildFFD(spanCountChangeOnly) {
    this.removeCtrlPtMeshes();
    this.removeLatticeLines();

    const bbox = spanCountChangeOnly ? this.ffdManager.getBoundingBox() : new THREE.Box3().setFromObject(this.smoothMesh);

    const modelScale = modelLibrary[this.modelIndex].meshScale || 1;
    if (modelScale !== 1) {
      bbox.min.multiplyScalar(modelScale);
      bbox.max.multiplyScalar(modelScale);
    }

    const spanCountsCopy = [...this.spanCounts];
    this.ffdManager.rebuildLattice(bbox, spanCountsCopy);

    this.addCtrlPtMeshes();
    this.addLatticeLines();
    this.deform();
  }

  removeCtrlPtMeshes() {
    this.ctrlPtMeshes.forEach((mesh) => this.sceneManager.scene.remove(mesh));
    this.ctrlPtMeshes = [];
  }

  removeLatticeLines() {
    this.latticeLines.forEach((line) => this.sceneManager.scene.remove(line));
    this.latticeLines = [];
  }

  addCtrlPtMeshes() {
    for (let i = 0; i < this.ffdManager.getTotalCtrlPtCount(); i++) {
      const ctrlPtMesh = new THREE.Mesh(new THREE.SphereGeometry(5), new THREE.MeshLambertMaterial({ color: 0x4d4dff }));
      ctrlPtMesh.position.copy(this.ffdManager.getPosition(i));
      this.ctrlPtMeshes.push(ctrlPtMesh);
      this.sceneManager.scene.add(ctrlPtMesh);
    }
  }

  addLatticeLines() {
    for (let i = 0; i < this.ffdManager.getCtrlPtCount(0) - 1; i++) {
      for (let j = 0; j < this.ffdManager.getCtrlPtCount(1); j++) {
        for (let k = 0; k < this.ffdManager.getCtrlPtCount(2); k++) {
          const lineGeom = new THREE.BufferGeometry().setFromPoints([
            this.ffdManager.getPosition(this.ffdManager.getIndex(i, j, k)),
            this.ffdManager.getPosition(this.ffdManager.getIndex(i + 1, j, k))
          ]);
          const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: 0x4d4dff }));
          this.latticeLines.push(line);
          this.sceneManager.scene.add(line);
        }
      }
    }
    for (let i = 0; i < this.ffdManager.getCtrlPtCount(0); i++) {
      for (let j = 0; j < this.ffdManager.getCtrlPtCount(1) - 1; j++) {
        for (let k = 0; k < this.ffdManager.getCtrlPtCount(2); k++) {
          const lineGeom = new THREE.BufferGeometry().setFromPoints([
            this.ffdManager.getPosition(this.ffdManager.getIndex(i, j, k)),
            this.ffdManager.getPosition(this.ffdManager.getIndex(i, j + 1, k))
          ]);
          const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: 0x4d4dff }));
          this.latticeLines.push(line);
          this.sceneManager.scene.add(line);
        }
      }
    }
    for (let i = 0; i < this.ffdManager.getCtrlPtCount(0); i++) {
      for (let j = 0; j < this.ffdManager.getCtrlPtCount(1); j++) {
        for (let k = 0; k < this.ffdManager.getCtrlPtCount(2) - 1; k++) {
          const lineGeom = new THREE.BufferGeometry().setFromPoints([
            this.ffdManager.getPosition(this.ffdManager.getIndex(i, j, k)),
            this.ffdManager.getPosition(this.ffdManager.getIndex(i, j, k + 1))
          ]);
          const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: 0x4d4dff }));
          this.latticeLines.push(line);
          this.sceneManager.scene.add(line);
        }
      }
    }
  }

  deform() {
    const positions = this.smoothMesh.geometry.attributes.position.array;
    const tempPosition = new THREE.Vector3();

    for (let i = 0; i < this.smoothVertsUndeformed.length; i++) {
      tempPosition.copy(this.smoothVertsUndeformed[i]);
      const evalPt = this.ffdManager.evalWorld(tempPosition);
      positions[i * 3] = evalPt.x;
      positions[i * 3 + 1] = evalPt.y;
      positions[i * 3 + 2] = evalPt.z;
    }

    this.smoothMesh.geometry.attributes.position.needsUpdate = true;
    this.smoothMesh.geometry.computeVertexNormals();
  }
}

// FFD Manager (wrapping existing FFD implementation)
class FFDManager {
  constructor() {
    this.ffd = new FFD();
  }

  evalWorld(position) {
    return this.ffd.evalWorld(position);
  }

  rebuildLattice(bbox, spanCounts) {
    this.ffd.rebuildLattice(bbox, spanCounts);
  }

  getBoundingBox() {
    return this.ffd.getBoundingBox();
  }

  getTotalCtrlPtCount() {
    return this.ffd.getTotalCtrlPtCount();
  }

  getCtrlPtCount(index) {
    return this.ffd.getCtrlPtCount(index);
  }

  getPosition(index) {
    return this.ffd.getPosition(index);
  }

  setPosition(index, position) {
    this.ffd.setPosition(index, position);
  }

  getPositionTernary(i, j, k) {
    return this.ffd.getPositionTernary(i, j, k);
  }

  getIndex(i, j, k) {
    return this.ffd.getIndex(i, j, k);
  }
}

// Initialize everything
const sceneManager = new SceneManager();
const ffdManager = new FFDManager();
const modelManager = new ModelManager(sceneManager, ffdManager);
new GUIManager(sceneManager, modelManager);

function animate() {
  requestAnimationFrame(animate);
  if (modelManager.isRotating) {
    modelManager.smoothMesh.rotation.y += 0.01;
    modelManager.wireframeMesh.rotation.y += 0.01;
  }
  sceneManager.controls.update();
  sceneManager.render();
}

animate();