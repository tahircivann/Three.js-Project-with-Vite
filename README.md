# Three.js Project with Vite
![dPHDJuD048Rl_8f9FUF5cmVJ2CGsaQInzDJqi8KHjrrsoB0OZV6_km9jQS6MoWbcvvdPTpuO5qQmAJFb55kfSy4YWvYod3HgCpUV2e4nDaAd2bikQn5lKwPI9nufOhW9Wk3HznmZZIMYDqQytHHmvqD82IgfKuY85BZWxOA3BqLgOpbEReE9566qvsPC6vjr15yEs6SP2gcjVGMk-s2_Va](https://github.com/tahircivann/Three.js-Project-with-Vite/assets/69795597/93cd2f10-097c-49ad-b1ad-90da4b963823)

This project is a 3D modeling tool built with Three.js, Vite, and various Three.js extensions. It allows users to create, manipulate, and export 3D models with subdivision surfaces, free-form deformation (FFD), and smoothing.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Usage](#usage)
4. [Components](#components)
    - [ModelManager](#modelmanager)
    - [SurfaceManager](#surfacemanager)
    - [ControlPointManager](#controlpointmanager)
    - [UIManager](#uimanager)
    - [InteractionManager](#interactionmanager)
    - [STLExporterManager](#stlexportermanager)
5. [Customization](#customization)
6. [License](#license)

## Overview

This project provides an interactive 3D environment where users can:
- Select and display different 3D models from a library.
- Apply subdivision surfaces to increase model smoothness.
- Add and manipulate control points to deform models using Free-Form Deformation (FFD).
- Apply smoothing to the model surface based on a defined factor.
- Export the final model as an STL file.

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. ***Run the Development Server:**
   ```bash
    npm run dev
   ```
  - Open your browser and navigate to http://localhost:3000 to see the application in action.


4. ## Usage

### User Interface

- **Start Rotation:** Starts rotating the model.
- **Stop Rotation:** Stops rotating the model.
- **Zoom:** Adjusts the camera zoom.
- **Reset Deformation & Smoothing:** Applies smoothing and deformation to the model.
- **Export as STL:** Exports the current model as an STL file.

### Interaction

- **Point Placing Mode:** Allows placing points on the model for surface creation.
- **Model Manipulation:** Click and drag control points to deform the model.

## Components

### ModelManager

Manages the 3D models including adding models to the scene, updating subdivision levels, and applying deformation and smoothing.

#### Methods:
- `addModel()`: Adds a model to the scene.
- `updateSubdivisionLevel(level)`: Updates the subdivision level of the model.
- `applySmoothing()`: Applies smoothing to the model.
- `deform()`: Deforms the model using FFD.
- `rebuildFFD(spanCountChangeOnly)`: Rebuilds the FFD lattice.

### SurfaceManager

Manages the creation and manipulation of surfaces created from placed points.

#### Methods:
- `createSurface()`: Creates a surface from placed points.
- `addPoint(position)`: Adds a point to the surface.

### ControlPointManager

Handles the control points used for FFD, including adding, removing, and updating control points and lattice lines.

#### Methods:
- `addCtrlPtMeshes()`: Adds control point meshes to the scene.
- `removeCtrlPtMeshes()`: Removes control point meshes from the scene.
- `addLatticeLines()`: Adds lattice lines to the scene.
- `removeLatticeLines()`: Removes lattice lines from the scene.
- `updateLattice()`: Updates the FFD lattice.

### UIManager

Initializes and manages the graphical user interface (GUI) for user interaction.

#### Methods:
- `init()`: Initializes the GUI and its event listeners.

### InteractionManager

Handles user interactions such as mouse movements and clicks for manipulating the 3D scene and objects.

#### Methods:
- `onDocumentMouseMove(event)`: Handles mouse move events.
- `onDocumentMouseDown(event)`: Handles mouse down events.

### STLExporterManager

Provides functionality to export the current model as an STL file.

#### Methods:
- `exportSTL(mesh)`: Exports the given mesh as an STL file.

## Customization

You can customize the project by:

- Adding new models to the `modelLibrary`.
- Adjusting the parameters for subdivision and smoothing.
- Modifying the UI components and their functionality.
