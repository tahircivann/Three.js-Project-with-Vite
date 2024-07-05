import * as THREE from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';

class SurfaceManager {
  constructor(scene) {
    this.scene = scene;
    this.placedPoints = [];
    this.surfaceMesh = null;
  }

  createSurface() {
    if (this.surfaceMesh) {
      this.scene.remove(this.surfaceMesh);
    }

    if (this.placedPoints.length > 3) {
      const points = this.placedPoints.map(pointMesh => pointMesh.position);
      const geometry = new ConvexGeometry(points);
      const material = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        opacity: 0.5,
        transparent: true,
      });
      this.surfaceMesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.surfaceMesh);
      console.log('Surface created with points:', points); // Debugging
    }
  }

  addPoint(position) {
    const pointGeometry = new THREE.SphereGeometry(3, 16, 16);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
    pointMesh.position.copy(position);
    this.scene.add(pointMesh);
    this.placedPoints.push(pointMesh);
    console.log('Point added:', position); // Debugging
  }
}

export default SurfaceManager;