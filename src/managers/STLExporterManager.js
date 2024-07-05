import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

class STLExporterManager {
  static exportSTL(mesh) {
    const exporter = new STLExporter();
    const stlString = exporter.parse(mesh);

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
  }
}

export default STLExporterManager;
