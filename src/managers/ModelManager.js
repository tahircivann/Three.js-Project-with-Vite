import * as THREE from 'three';
import { LoopSubdivision } from 'three-subdivide';
import { modelLibrary } from '../utils/settings';
import FFD from '../ffd/FFDManager';

class ModelManager {
  constructor(scene, settings, spanCounts, surfaceManager) {
    this.scene = scene;
    this.settings = settings;
    this.spanCounts = spanCounts;
    this.surfaceManager = surfaceManager;
    this.modelIndex = 0;
    this.subdLevel = 2;
    this.smoothMesh = null;
    this.wireframeMesh = null;
    this.smoothVertsUndeformed = [];
    this.modelScale = 1;
    this.modelLibrary = modelLibrary;
    this.ffd = new FFD();
  }

  setControlPointManager(controlPointManager) {
    this.controlPointManager = controlPointManager;
  }

  addModel() {
    if (this.smoothMesh) {
      this.scene.remove(this.smoothMesh);
      this.scene.remove(this.wireframeMesh);
    }

    const model = this.modelLibrary[this.modelIndex];
    let geometry = new THREE[model.type](...model.args);

    if (model.scale) geometry.scale(model.scale, model.scale, model.scale);

    const params = {
      split: this.settings.split,
      uvSmooth: this.settings.uvSmooth,
      preserveEdges: this.settings.preserveEdges,
      flatOnly: this.settings.flatOnly,
      maxTriangles: Infinity,
    };
    geometry = LoopSubdivision.modify(geometry, this.subdLevel, params);

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
      roughness: 0.5,
    });
    this.smoothMesh = new THREE.Mesh(geometry, material);

    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: true,
    });
    this.wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);

    this.modelScale = model.meshScale || 1;
    this.smoothMesh.scale.set(this.modelScale, this.modelScale, this.modelScale);
    this.wireframeMesh.scale.set(this.modelScale, this.modelScale, this.modelScale);

    this.scene.add(this.smoothMesh);
    this.scene.add(this.wireframeMesh);

    this.rebuildFFD(false);
  }

  updateSubdivisionLevel(level) {
    this.subdLevel = level;
    this.addModel();
  }

  applySmoothing() {
    if (!this.surfaceManager.surfaceMesh || !this.smoothMesh) return;

    const smoothArea = this.surfaceManager.surfaceMesh.geometry;
    const positions = this.smoothMesh.geometry.attributes.position.array;
    const tempPosition = new THREE.Vector3();
    const smoothPositions = smoothArea.attributes.position.array;

    for (let i = 0; i < this.smoothVertsUndeformed.length; i++) {
      tempPosition.copy(this.smoothVertsUndeformed[i]);

      for (let j = 0; j < smoothPositions.length; j += 3) {
        const smoothVertex = new THREE.Vector3(smoothPositions[j], smoothPositions[j + 1], smoothPositions[j + 2]);
        if (tempPosition.distanceTo(smoothVertex) < 20) { // Adjust threshold for smoothing area
          const evalPt = this.ffd.evalWorld(tempPosition);
          tempPosition.lerp(evalPt, this.settings.smoothingFactor); // Smoothing effect using the factor
          positions[i * 3] = tempPosition.x;
          positions[i * 3 + 1] = tempPosition.y;
          positions[i * 3 + 2] = tempPosition.z;
          break;
        }
      }
    }

    this.smoothMesh.geometry.attributes.position.needsUpdate = true;
    this.smoothMesh.geometry.computeVertexNormals();
    console.log('Applied smoothing to mesh'); // Debugging
  }

  deform() {
    const positions = this.smoothMesh.geometry.attributes.position.array;
    const tempPosition = new THREE.Vector3();

    for (let i = 0; i < this.smoothVertsUndeformed.length; i++) {
      tempPosition.copy(this.smoothVertsUndeformed[i]);
      const evalPt = this.ffd.evalWorld(tempPosition);
      positions[i * 3] = evalPt.x;
      positions[i * 3 + 1] = evalPt.y;
      positions[i * 3 + 2] = evalPt.z;
    }

    this.smoothMesh.geometry.attributes.position.needsUpdate = true;
    this.smoothMesh.geometry.computeVertexNormals();
  }

  rebuildFFD(spanCountChangeOnly) {
    this.controlPointManager.removeCtrlPtMeshes();
    this.controlPointManager.removeLatticeLines();

    const bbox = spanCountChangeOnly ? this.ffd.getBoundingBox() : new THREE.Box3().setFromObject(this.smoothMesh);

    if (this.modelScale !== 1) {
      bbox.min.multiplyScalar(this.modelScale);
      bbox.max.multiplyScalar(this.modelScale);
    }

    const spanCountsCopy = [...this.spanCounts]; // Use this.spanCounts
    this.ffd.rebuildLattice(bbox, spanCountsCopy);

    this.controlPointManager.addCtrlPtMeshes();
    this.controlPointManager.addLatticeLines();
    this.deform();
  }
}

export default ModelManager;