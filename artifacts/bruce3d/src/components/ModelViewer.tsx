import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface ModelViewerProps {
  file: File;
}

export default function ModelViewer({ file }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setLoading(true);
    setError(false);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0d14);

    const w = container.clientWidth || 400;
    const h = container.clientHeight || 200;

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.001, 10000);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x9333ea, 0.4);
    fillLight.position.set(-5, -5, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xc084fc, 0.3);
    rimLight.position.set(0, 5, -10);
    scene.add(rimLight);

    const gridHelper = new THREE.GridHelper(10, 20, 0x333355, 0x1a1a2e);
    gridHelper.position.y = -1.2;
    scene.add(gridHelper);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;
    controlsRef.current = controls;

    const material = new THREE.MeshPhongMaterial({
      color: 0x9333ea,
      specular: 0x553377,
      shininess: 80,
      side: THREE.DoubleSide,
    });

    let animId: number;
    const url = URL.createObjectURL(file);
    const ext = file.name.split(".").pop()?.toLowerCase();

    const fitCamera = (object: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim === 0) return;
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = maxDim / 2 / Math.tan(fov / 2);
      cameraZ *= 1.8;
      camera.position.set(center.x, center.y, center.z + cameraZ);
      camera.near = cameraZ / 100;
      camera.far = cameraZ * 100;
      camera.updateProjectionMatrix();
      controls.target.copy(center);
      gridHelper.position.y = box.min.y - 0.05;
      controls.update();
    };

    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    if (ext === "stl") {
      const loader = new STLLoader();
      loader.load(
        url,
        (geometry) => {
          geometry.computeVertexNormals();
          const mesh = new THREE.Mesh(geometry, material);
          scene.add(mesh);
          fitCamera(mesh);
          setLoading(false);
          animate();
        },
        undefined,
        () => { setError(true); setLoading(false); }
      );
    } else if (ext === "obj") {
      const loader = new OBJLoader();
      loader.load(
        url,
        (group) => {
          group.traverse((child) => {
            if (child instanceof THREE.Mesh) child.material = material;
          });
          scene.add(group);
          fitCamera(group);
          setLoading(false);
          animate();
        },
        undefined,
        () => { setError(true); setLoading(false); }
      );
    } else {
      setLoading(false);
      animate();
    }

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      URL.revokeObjectURL(url);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [file]);

  const resetView = () => {
    controlsRef.current?.reset();
  };

  const zoom = (dir: 1 | -1) => {
    const cam = cameraRef.current;
    if (!cam) return;
    cam.position.multiplyScalar(dir === 1 ? 0.8 : 1.25);
    controlsRef.current?.update();
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-primary/30 bg-[#0d0d14]" style={{ height: 220 }}>
      <div ref={containerRef} className="w-full h-full" />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d14]">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-muted-foreground">Загрузка модели...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d14]">
          <span className="text-xs text-muted-foreground">Не удалось загрузить модель</span>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="absolute top-2 left-2 text-xs text-muted-foreground bg-black/50 backdrop-blur px-2 py-1 rounded-lg pointer-events-none">
            🖱 Вращать · Колёсико — масштаб
          </div>
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            <button onClick={resetView} className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur text-muted-foreground hover:text-white transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => zoom(1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur text-muted-foreground hover:text-white transition-colors">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => zoom(-1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur text-muted-foreground hover:text-white transition-colors">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 text-xs text-primary/60 bg-black/40 px-2 py-0.5 rounded-lg pointer-events-none font-mono">
            {file.name}
          </div>
        </>
      )}
    </div>
  );
}
