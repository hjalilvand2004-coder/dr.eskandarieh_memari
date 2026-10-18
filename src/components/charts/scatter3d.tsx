"use client";

/**
 * Scatter3D — پراکندگی سه‌بعدی علمی با Three.js/WebGL (کاملاً آفلاین)
 * - چرخش/بزرگ‌نمایی/جابه‌جایی با OrbitControls
 * - برچسب محورها به‌صورت HTML پروژه‌شده (RTL و فونت وزیرمتن)
 * - هاور روی نقاط با Raycaster و نمایش کد بنا و مقادیر
 * - خروجی PNG با وضوح چاپ (toDataURL با pixelRatio دلخواه)
 * - تم‌آگاه: پس‌زمینه/شبکه/برچسب از متغیرهای تم سامانه
 */
import * as React from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface Scatter3DPoint {
  x: number;
  y: number;
  z: number;
  color: string;
  code?: string;
}

export interface Scatter3DHandle {
  toDataURL: (pixelRatio?: number) => string | null;
}

export interface Scatter3DProps {
  points: Scatter3DPoint[];
  axes: { x: string; y: string; z: string };
  height?: number | string;
  bg: string;
  gridColor: string;
  labelColor: string;
  ariaLabel?: string;
  onReady?: (h: Scatter3DHandle) => void;
}

const CUBE = 1;
const norm = (v: number, min: number, max: number) => {
  if (!Number.isFinite(v)) return 0.5;
  if (max - min < 1e-12) return 0.5;
  return 0.06 + ((v - min) / (max - min)) * (CUBE - 0.12);
};

export function Scatter3D({ points, axes, height = 420, bg, gridColor, labelColor, ariaLabel, onReady }: Scatter3DProps) {
  const mountRef = React.useRef<HTMLDivElement>(null);
  const labelRefs = React.useRef<Array<HTMLSpanElement | null>>([null, null, null]);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const stateRef = React.useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    controls?: OrbitControls;
    pointsMesh?: THREE.Points;
    raf?: number;
    disposed?: boolean;
  }>({});

  // مختصات نرمال‌شده نقاط
  const normalized = React.useMemo(() => {
    if (!points.length) return [];
    const ext = (get: (p: Scatter3DPoint) => number) => {
      const vs = points.map(get);
      return [Math.min(...vs), Math.max(...vs)] as const;
    };
    const [x0, x1] = ext((p) => p.x);
    const [y0, y1] = ext((p) => p.y);
    const [z0, z1] = ext((p) => p.z);
    return points.map((p) => ({
      raw: p,
      pos: new THREE.Vector3(norm(p.x, x0, x1), norm(p.y, y0, y1), norm(p.z, z0, z1)),
    }));
  }, [points]);

  // ─── راه‌اندازی صحنه (یک‌بار) ───
  React.useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const st = stateRef.current;
    st.disposed = false;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(new THREE.Color(bg), 1);
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / Math.max(1, mount.clientHeight), 0.01, 100);
    camera.position.set(1.75, 1.45, 1.9);
    camera.lookAt(0.5, 0.5, 0.5);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0.5, 0.5, 0.5);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.8;
    controls.maxDistance = 6;

    // شبکه کف + سه محور
    const buildFrame = (grid: string) => {
      const g = new THREE.Color(grid);
      const mat = new THREE.LineBasicMaterial({ color: g, transparent: true, opacity: 0.55 });
      const group = new THREE.Group();
      const N = 10;
      const pts: number[] = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        pts.push(0, 0, t, CUBE, 0, t);
        pts.push(t, 0, 0, t, 0, CUBE);
      }
      const gridGeo = new THREE.BufferGeometry();
      gridGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
      group.add(new THREE.LineSegments(gridGeo, mat));
      // محورها
      const axesPts = new THREE.Float32BufferAttribute(
        [0, 0, 0, CUBE * 1.12, 0, 0, 0, 0, 0, 0, CUBE * 1.12, 0, 0, 0, 0, 0, 0, CUBE * 1.12],
        3
      );
      const axesGeo = new THREE.BufferGeometry();
      axesGeo.setAttribute("position", axesPts);
      group.add(new THREE.LineSegments(axesGeo, new THREE.LineBasicMaterial({ color: g, transparent: true, opacity: 0.9 })));
      return group;
    };
    const frame = buildFrame(gridColor);
    scene.add(frame);

    st.renderer = renderer;
    st.scene = scene;
    st.camera = camera;
    st.controls = controls;

    let lastT = 0;
    const tick = (t: number) => {
      if (st.disposed) return;
      st.raf = requestAnimationFrame(tick);
      controls.update();
      if (t - lastT > 33) {
        lastT = t;
        // به‌روزرسانی برچسب‌های محور (پروجکشن به صفحه)
        const anchors: Array<[THREE.Vector3, number]> = [
          [new THREE.Vector3(CUBE * 1.14, 0, 0), 0],
          [new THREE.Vector3(0, CUBE * 1.1, 0), 1],
          [new THREE.Vector3(0, 0, CUBE * 1.14), 2],
        ];
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        anchors.forEach(([v, idx]) => {
          const el = labelRefs.current[idx];
          if (!el) return;
          const p = v.clone().project(camera);
          el.style.left = `${((p.x + 1) / 2) * w}px`;
          el.style.top = `${((-p.y + 1) / 2) * h}px`;
        });
      }
      renderer.render(scene, camera);
    };
    st.raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    });
    ro.observe(mount);

    onReady?.({
      toDataURL: (pr = 3) => {
        try {
          renderer.setPixelRatio(pr);
          renderer.render(scene, camera);
          const url = renderer.domElement.toDataURL("image/png");
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
          renderer.render(scene, camera);
          return url;
        } catch {
          return null;
        }
      },
    });

    return () => {
      st.disposed = true;
      if (st.raf) cancelAnimationFrame(st.raf);
      ro.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        const any = o as THREE.Mesh;
        if (any.geometry) any.geometry.dispose();
        const m = any.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m?.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentElement) renderer.domElement.parentElement.removeChild(renderer.domElement);
      st.renderer = st.scene = st.camera = st.controls = st.pointsMesh = undefined;
    };
  }, []);

  // ─── به‌روزرسانی رنگ قاب و پس‌زمینه هنگام تغییر تم ───
  React.useEffect(() => {
    const st = stateRef.current;
    if (st.renderer) st.renderer.setClearColor(new THREE.Color(bg), 1);
    st.scene?.traverse((o) => {
      const line = o as THREE.Line & { material: THREE.LineBasicMaterial };
      if ((o as THREE.LineSegments).isLineSegments && line.material?.color) {
        line.material.color.set(gridColor);
      }
    });
  }, [bg, gridColor]);

  // ─── ساخت/به‌روزرسانی نقاط ───
  React.useEffect(() => {
    const st = stateRef.current;
    const scene = st.scene;
    if (!scene) return;
    if (st.pointsMesh) {
      scene.remove(st.pointsMesh);
      st.pointsMesh.geometry.dispose();
      (st.pointsMesh.material as THREE.Material).dispose();
      st.pointsMesh = undefined;
    }
    if (!normalized.length) return;
    const positions = new Float32Array(normalized.length * 3);
    const colors = new Float32Array(normalized.length * 3);
    normalized.forEach((n, i) => {
      positions[i * 3] = n.pos.x;
      positions[i * 3 + 1] = n.pos.y;
      positions[i * 3 + 2] = n.pos.z;
      const c = new THREE.Color(n.raw.color || "#1f4e6e");
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 0.055, vertexColors: true, sizeAttenuation: true, transparent: true, opacity: 0.95 });
    const mesh = new THREE.Points(geo, mat);
    mesh.name = "scatter-points";
    st.pointsMesh = mesh;
    scene.add(mesh);
  }, [normalized]);

  // ─── هاور (Raycaster) ───
  const onPointerMove = (e: React.PointerEvent) => {
    const st = stateRef.current;
    const mesh = st.pointsMesh;
    const camera = st.camera;
    const renderer = st.renderer;
    const tip = tooltipRef.current;
    if (!mesh || !camera || !renderer || !tip) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.params.Points = { threshold: 0.045 };
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObject(mesh);
    if (hits.length && hits[0].index != null) {
      const p = normalized[hits[0].index]?.raw;
      if (p) {
        tip.style.opacity = "1";
        tip.style.left = `${e.clientX - rect.left + 12}px`;
        tip.style.top = `${e.clientY - rect.top - 10}px`;
        tip.textContent = `${p.code ? p.code + " — " : ""}X ${p.x.toLocaleString("fa-IR", { maximumFractionDigits: 1 })} • Y ${p.y.toLocaleString("fa-IR", { maximumFractionDigits: 1 })} • Z ${p.z.toLocaleString("fa-IR", { maximumFractionDigits: 1 })}`;
        return;
      }
    }
    tip.style.opacity = "0";
  };

  const axisLabels = [axes.x, axes.y, axes.z];

  return (
    <div className="relative w-full rounded-lg overflow-hidden border" style={{ height, direction: "ltr" }} onPointerMove={onPointerMove} onPointerLeave={() => { if (tooltipRef.current) tooltipRef.current.style.opacity = "0"; }}>
      <div ref={mountRef} className="absolute inset-0" role="img" aria-label={ariaLabel ?? "نمودار پراکندگی سه‌بعدی تعاملی"} />
      {axisLabels.map((l, i) => (
        <span
          key={i}
          ref={(el) => { labelRefs.current[i] = el; }}
          className="absolute -translate-x-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none whitespace-nowrap px-1.5 py-0.5 rounded-md"
          style={{ color: labelColor, background: bg, fontFamily: "Vazirmatn", direction: "rtl" }}
        >
          {l}
        </span>
      ))}
      <div
        ref={tooltipRef}
        className="absolute z-10 pointer-events-none text-[10px] px-2 py-1 rounded-md border shadow-md transition-opacity"
        style={{ opacity: 0, background: "var(--popover)", color: "var(--popover-foreground)", borderColor: "var(--border)", fontFamily: "Vazirmatn", direction: "rtl" }}
      />
      <span className="absolute bottom-2 left-2 text-[9px] pointer-events-none select-none" style={{ color: labelColor, fontFamily: "Vazirmatn", direction: "rtl" }}>
        درگ: چرخش • اسکرول: بزرگ‌نمایی • راست‌کلیک: جابه‌جایی
      </span>
    </div>
  );
}
