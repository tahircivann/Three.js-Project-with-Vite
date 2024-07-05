import GUI from 'lil-gui';
import { modelLibrary } from '../utils/settings';
class UIManager {
  constructor(modelManager, settings, surfaceManager, interactionManager) {
    this.modelManager = modelManager;
    this.settings = settings;
    this.surfaceManager = surfaceManager;
    this.interactionManager = interactionManager; // Store interactionManager
    this.gui = new GUI();
  }

  init() {
    const modelFolder = this.gui.addFolder('Models');
    modelFolder.add({ model: modelLibrary[this.modelManager.modelIndex].type }, 'model', modelLibrary.map((model) => model.type))
      .name('Select Model')
      .onChange((value) => {
        this.modelManager.modelIndex = modelLibrary.findIndex(model => model.type === value);
        this.modelManager.addModel();
      });

    const settingsFolder = this.gui.addFolder('Settings');
    settingsFolder.add(this.settings, 'pointPlacingMode')
      .name('Point Placing Mode')
      .onChange((value) => {
        console.log('Point Placing Mode changed to:', value); // Debugging
        this.settings.pointPlacingMode = value;
        this.interactionManager.setPointPlacingMode(value); // Use this.interactionManager
        if (!value) {
          console.log('Creating surface with points:', this.surfaceManager.placedPoints.length); // Debugging
          this.surfaceManager.createSurface();
          this.modelManager.applySmoothing();
        }
      });

    settingsFolder.add(this.settings, 'smoothingFactor', 0, 1, 0.01)
      .name('Smoothing Factor')
      .onChange((value) => {
        console.log('Smoothing Factor changed to:', value); // Debugging
        this.settings.smoothingFactor = value;
        this.modelManager.applySmoothing();
      });

    settingsFolder.add(this.settings, 'meshQuality', this.settings.MIN_SUBD_LEVEL, this.settings.MAX_SUBD_LEVEL, 1)
      .name('Mesh Quality')
      .onChange((value) => {
        console.log('Mesh Quality changed to:', value); // Debugging
        this.modelManager.updateSubdivisionLevel(value);
      });

    settingsFolder.open();
    modelFolder.open();

    // Add LoopSubdivision parameters
    const loopSubdFolder = this.gui.addFolder('Loop Subdivision');
    loopSubdFolder.add(this.modelManager, 'subdLevel', 0, 5, 1).name('Iterations').onChange(() => {
      this.modelManager.updateSubdivisionLevel(this.modelManager.subdLevel);
    });
    loopSubdFolder.add(this.modelManager.settings, 'split').name('Split Edges').onChange(() => {
      this.modelManager.updateSubdivisionLevel(this.modelManager.subdLevel);
    });
    loopSubdFolder.add(this.modelManager.settings, 'uvSmooth').name('UV Smooth').onChange(() => {
      this.modelManager.updateSubdivisionLevel(this.modelManager.subdLevel);
    });
    loopSubdFolder.add(this.modelManager.settings, 'preserveEdges').name('Preserve Edges').onChange(() => {
      this.modelManager.updateSubdivisionLevel(this.modelManager.subdLevel);
    });
    loopSubdFolder.add(this.modelManager.settings, 'flatOnly').name('Flat Only').onChange(() => {
      this.modelManager.updateSubdivisionLevel(this.modelManager.subdLevel);
    });
    loopSubdFolder.open();
  }
}

export default UIManager;