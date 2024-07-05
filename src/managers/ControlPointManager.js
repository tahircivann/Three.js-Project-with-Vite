import * as THREE from 'three';

class ControlPointManager {
  constructor(scene, ffd, modelManager) {
    this.scene = scene;
    this.ffd = ffd;
    this.modelManager = modelManager;
    this.ctrlPtMeshes = [];
    this.latticeLines = [];
  }

  addCtrlPtMeshes() {
    for (let i = 0; i < this.ffd.getTotalCtrlPtCount(); i++) {
      const ctrlPtMesh = new THREE.Mesh(new THREE.SphereGeometry(5), new THREE.MeshLambertMaterial({ color: 0x4d4dff }));
      ctrlPtMesh.position.copy(this.ffd.getPosition(i));
      this.ctrlPtMeshes.push(ctrlPtMesh);
      this.scene.add(ctrlPtMesh);
    }
  }

  removeCtrlPtMeshes() {
    this.ctrlPtMeshes.forEach(mesh => this.scene.remove(mesh));
    this.ctrlPtMeshes = [];
  }

  addLatticeLines() {
    for (let i = 0; i < this.ffd.getCtrlPtCount(0) - 1; i++) {
      for (let j = 0; j < this.ffd.getCtrlPtCount(1); j++) {
        for (let k = 0; k < this.ffd.getCtrlPtCount(2); k++) {
          const lineGeom = new THREE.BufferGeometry().setFromPoints([
            this.ffd.getPosition(this.ffd.getIndex(i, j, k)),
            this.ffd.getPosition(this.ffd.getIndex(i + 1, j, k))
          ]);
          const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: 0x4d4dff }));
          this.latticeLines.push(line);
          this.scene.add(line);
        }
      }
    }
    for (let i = 0; i < this.ffd.getCtrlPtCount(0); i++) {
      for (let j = 0; j < this.ffd.getCtrlPtCount(1) - 1; j++) {
        for (let k = 0; k < this.ffd.getCtrlPtCount(2); k++) {
          const lineGeom = new THREE.BufferGeometry().setFromPoints([
            this.ffd.getPosition(this.ffd.getIndex(i, j, k)),
            this.ffd.getPosition(this.ffd.getIndex(i, j + 1, k))
          ]);
          const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: 0x4d4dff }));
          this.latticeLines.push(line);
          this.scene.add(line);
        }
      }
    }
    for (let i = 0; i < this.ffd.getCtrlPtCount(0); i++) {
      for (let j = 0; j < this.ffd.getCtrlPtCount(1); j++) {
        for (let k = 0; k < this.ffd.getCtrlPtCount(2) - 1; k++) {
          const lineGeom = new THREE.BufferGeometry().setFromPoints([
            this.ffd.getPosition(this.ffd.getIndex(i, j, k)),
            this.ffd.getPosition(this.ffd.getIndex(i, j, k + 1))
          ]);
          const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: 0x4d4dff }));
          this.latticeLines.push(line);
          this.scene.add(line);
        }
      }
    }
  }

  removeLatticeLines() {
    this.latticeLines.forEach(line => this.scene.remove(line));
    this.latticeLines = [];
  }

  updateLattice() {
    this.ctrlPtMeshes.forEach((mesh, index) => {
      this.ffd.setPosition(index, mesh.position);
    });

    let lineIndex = 0;
    for (let i = 0; i < this.ffd.getCtrlPtCount(0) - 1; i++) {
      for (let j = 0; j < this.ffd.getCtrlPtCount(1); j++) {
        for (let k = 0; k < this.ffd.getCtrlPtCount(2); k++) {
          this.updateLatticeLine(lineIndex++, this.ffd.getPositionTernary(i, j, k), this.ffd.getPositionTernary(i + 1, j, k));
        }
      }
    }
    for (let i = 0; i < this.ffd.getCtrlPtCount(0); i++) {
      for (let j = 0; j < this.ffd.getCtrlPtCount(1) - 1; j++) {
        for (let k = 0; k < this.ffd.getCtrlPtCount(2); k++) {
          this.updateLatticeLine(lineIndex++, this.ffd.getPositionTernary(i, j, k), this.ffd.getPositionTernary(i, j + 1, k));
        }
      }
    }
    for (let i = 0; i < this.ffd.getCtrlPtCount(0); i++) {
      for (let j = 0; j < this.ffd.getCtrlPtCount(1); j++) {
        for (let k = 0; k < this.ffd.getCtrlPtCount(2) - 1; k++) {
          this.updateLatticeLine(lineIndex++, this.ffd.getPositionTernary(i, j, k), this.ffd.getPositionTernary(i, j, k + 1));
        }
      }
    }

    this.modelManager.deform();
  }

  updateLatticeLine(index, start, end) {
    const line = this.latticeLines[index];
    line.geometry.setFromPoints([start, end]);
    line.geometry.attributes.position.needsUpdate = true;
  }
}

export default ControlPointManager;