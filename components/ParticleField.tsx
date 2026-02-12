"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type ParticleFieldProps = {
  count?: number;
  pointSize?: number;
  cloudWidth?: number;
  cloudHeight?: number;
};

export function ParticleField({
  count = 42_000,
  pointSize = 0.012,
  cloudWidth = 11,
  cloudHeight = 7
}: ParticleFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
    camera.position.set(0, 0, 22);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block";
    container.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const homePositions = new Float32Array(count * 2);

    const crumple = (x: number, y: number, amp: number) => ({
      x:
        (Math.sin(x * 1.7) * Math.cos(y * 2.1) + Math.sin(x * 3.2 + y * 1.4) * 0.6) * amp,
      y:
        (Math.cos(x * 2.1) * Math.sin(y * 1.7) + Math.cos(x * 1.4 - y * 3.2) * 0.6) * amp,
    });

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const inInner = Math.random() < 0.6;
      const scale = inInner ? 0.5 : 1;
      let px = THREE.MathUtils.randFloatSpread(cloudWidth * 2 * scale);
      let py = THREE.MathUtils.randFloatSpread(cloudHeight * 2 * scale);

      const edgeFactor = Math.max(0, (Math.abs(px) / cloudWidth + Math.abs(py) / cloudHeight) / 2 - 0.3);
      const crumpleAmp = 0.4 + edgeFactor * 1.2;
      const d = crumple(px, py, crumpleAmp);
      px += d.x;
      py += d.y;

      positions[i3 + 0] = px;
      positions[i3 + 1] = py;
      positions[i3 + 2] = THREE.MathUtils.randFloatSpread(4);

      homePositions[i * 2 + 0] = px;
      homePositions[i * 2 + 1] = py;

      velocities[i3 + 0] = THREE.MathUtils.randFloatSpread(0.02);
      velocities[i3 + 1] = THREE.MathUtils.randFloatSpread(0.02);
      velocities[i3 + 2] = THREE.MathUtils.randFloatSpread(0.01);
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const cloudRadius = Math.max(cloudWidth, cloudHeight) * 1.15;
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPointSize: { value: pointSize * 15 },
        uCloudRadius: { value: cloudRadius },
        uFadeStart: { value: cloudRadius * 0.35 },
      },
      vertexShader: `
        uniform float uPointSize;
        uniform float uCloudRadius;
        uniform float uFadeStart;
        varying float vAlpha;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uPointSize * (300.0 / -mv.z);
          float d = length(position.xy);
          vAlpha = 1.0 - smoothstep(uFadeStart, uCloudRadius, d);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          float a = smoothstep(0.0, 0.15, length(gl_PointCoord - 0.5) * 2.0);
          gl_FragColor = vec4(0.65, 0.65, 0.65, a * vAlpha * 0.28);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const handleResize = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Mouse position in world space (XY plane at z=0)
    const mouseWorld = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2(0, 0);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersect = new THREE.Vector3();

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseNDC.x = (e.clientX - rect.left) / rect.width * 2 - 1;
      mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseNDC, camera);
      raycaster.ray.intersectPlane(plane, intersect);
      mouseWorld.x = intersect.x;
      mouseWorld.y = intersect.y;
    };

    window.addEventListener("pointermove", onPointerMove);

    const clock = new THREE.Clock();
    let running = true;

    const maxSpeed = 0.1;
    const damping = 0.975;
    const containmentStrength = 0.15;
    const springStrength = 0.4;
    const mouseStrength = 0.025;
    const mouseRadius = 12;

    const tick = () => {
      if (!running) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        let px = positions[i3 + 0];
        let py = positions[i3 + 1];
        let pz = positions[i3 + 2];

        let vx = velocities[i3 + 0];
        let vy = velocities[i3 + 1];
        let vz = velocities[i3 + 2];

        const hx = homePositions[i * 2 + 0];
        const hy = homePositions[i * 2 + 1];
        vx += (hx - px) * springStrength * dt;
        vy += (hy - py) * springStrength * dt;

        const wiggleX = 0.3 * Math.sin(py * 0.4) + 0.2 * Math.cos(px * 0.5);
        const wiggleY = 0.3 * Math.cos(px * 0.4) + 0.2 * Math.sin(py * 0.5);
        const boundaryW = cloudWidth * 1.25 + wiggleX;
        const boundaryH = cloudHeight * 1.25 + wiggleY;
        if (Math.abs(px) > boundaryW || Math.abs(py) > boundaryH) {
          vx += (-px / (Math.abs(px) + 0.1)) * containmentStrength * dt;
          vy += (-py / (Math.abs(py) + 0.1)) * containmentStrength * dt;
        }

        vx += (Math.random() - 0.5) * 0.012 * dt;
        vy += (Math.random() - 0.5) * 0.012 * dt;

        // Mouse attraction: particles drift toward cursor like magnetic dust
        const dx = mouseWorld.x - px;
        const dy = mouseWorld.y - py;
        const distSq = dx * dx + dy * dy + 0.5;
        const dist = Math.sqrt(distSq);
        if (dist > 0.1 && dist < mouseRadius) {
          const f = (mouseStrength * dt) / (dist + 0.5);
          vx += (dx / dist) * f;
          vy += (dy / dist) * f;
        }

        if (Math.abs(pz) > 5) {
          vz -= (pz / (Math.abs(pz) + 0.1)) * 0.1 * dt;
        }

        vx *= damping;
        vy *= damping;
        vz *= damping;

        const s2 = vx * vx + vy * vy + vz * vz;
        if (s2 > maxSpeed * maxSpeed) {
          const s = Math.sqrt(s2);
          const k = maxSpeed / s;
          vx *= k;
          vy *= k;
          vz *= k;
        }

        px += vx;
        py += vy;
        pz += vz;

        positions[i3 + 0] = px;
        positions[i3 + 1] = py;
        positions[i3 + 2] = pz;

        velocities[i3 + 0] = vx;
        velocities[i3 + 1] = vy;
        velocities[i3 + 2] = vz;
      }

      posAttr.needsUpdate = true;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };

    let raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", onPointerMove);

      scene.remove(points);

      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [count, pointSize, cloudWidth, cloudHeight]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
      }}
      aria-hidden
    />
  );
}
