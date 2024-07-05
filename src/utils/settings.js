const modelLibrary = [
  { type: 'BoxGeometry', args: [200, 200, 200, 2, 2, 2] },
  { type: 'TorusGeometry', args: [100, 60, 4, 8, Math.PI * 2] },
  { type: 'SphereGeometry', args: [100, 3, 3], meshScale: 1.5 },
  { type: 'IcosahedronGeometry', args: [100, 1], meshScale: 1.5 },
  { type: 'CylinderGeometry', args: [25, 75, 200, 8, 3], meshScale: 1.5 },
  { type: 'OctahedronGeometry', args: [200, 0] },
];

const settings = {
  pointPlacingMode: false,
  smoothingFactor: 0.5,
  spanCounts: [2, 2, 2],
  isRotating: false,
  MIN_SUBD_LEVEL: 0,
  MAX_SUBD_LEVEL: 4,
  modelLibrary,  // Make sure to export modelLibrary correctly
  meshQuality: 2, // Add meshQuality to the settings object
  split: true, // LoopSubdivision parameter
  uvSmooth: false, // LoopSubdivision parameter
  preserveEdges: false, // LoopSubdivision parameter
  flatOnly: false // LoopSubdivision parameter
};

export { settings, modelLibrary };