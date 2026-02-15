"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer.js";

type ParticleFieldProps = {
  count?: number;
  pointSize?: number;
  cloudWidth?: number;
  cloudHeight?: number;
  targetFps?: number;
};

type DeviceTier = "mobile" | "tablet" | "desktop";

function getDeviceTier(): DeviceTier {
  const ua = navigator.userAgent.toLowerCase();
  const hasTouch = navigator.maxTouchPoints > 1;
  const isTablet = /ipad|tablet|playbook|silk/.test(ua);
  const isMobileUa = /android|iphone|ipod|iemobile|mobile/.test(ua);

  if (isTablet || (hasTouch && !isMobileUa && /macintosh/.test(ua))) {
    return "tablet";
  }
  if (isMobileUa) {
    return "mobile";
  }
  return "desktop";
}

function getTierDefaults(tier: DeviceTier) {
  switch (tier) {
    case "mobile":
      return { count: 36_000, targetFps: 20, pointSize: 0.013, pixelRatioCap: 1.5 };
    case "tablet":
      return { count: 56_000, targetFps: 24, pointSize: 0.014, pixelRatioCap: 1.5 };
    default:
      return { count: 90_000, targetFps: 30, pointSize: 0.014, pixelRatioCap: 2.5 };
  }
}

const VELOCITY_FRAGMENT = `
uniform sampler2D textureHomePhase;
uniform float uDt;
uniform float uTime;
uniform float uCloudWidth;
uniform float uCloudHeight;
uniform float uContainmentStrength;
uniform float uSpringStrength;
uniform float uMouseStrength;
uniform float uMouseRadius;
uniform float uNoiseStrength;
uniform float uNoiseSpeed;
uniform float uDamping;
uniform float uMaxSpeed;
uniform vec2 uMouse;

float hash(vec2 p, float t) {
  return fract(sin(dot(p * 12.9898 + t * 0.1, vec2(78.233, 45.164))) * 43758.5453);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5) / resolution;
  vec4 posData = texture2D(texturePosition, uv);
  vec4 velData = texture2D(textureVelocity, uv);
  vec4 homePhase = texture2D(textureHomePhase, uv);

  vec3 pos = posData.xyz;
  vec3 vel = velData.xyz;
  float hx = homePhase.r;
  float hy = homePhase.g;
  float phX = homePhase.b;
  float phY = homePhase.a;

  float t = uTime * uNoiseSpeed;

  // Spring to home (ease-in-out: soft when far and when close, full pull in between)
  vec2 toHome = vec2(hx - pos.x, hy - pos.y);
  float homeDist = length(toHome) + 0.001;
  float easeIn = smoothstep(0.0, 0.8, homeDist);
  float easeOut = 1.0 - smoothstep(2.0, 4.0, homeDist);
  float ease = mix(0.2, 1.0, easeIn * easeOut);
  // Avoid normalize(0) NaNs; this is equivalent to spring force scaling.
  vec2 pull = toHome * (uSpringStrength * uDt * ease);
  vel.x += pull.x;
  vel.y += pull.y;

  // Containment
  float wiggleX = 0.3 * sin(pos.y * 0.4) + 0.2 * cos(pos.x * 0.5);
  float wiggleY = 0.3 * cos(pos.x * 0.4) + 0.2 * sin(pos.y * 0.5);
  float boundaryW = uCloudWidth * 1.25 + wiggleX;
  float boundaryH = uCloudHeight * 1.25 + wiggleY;
  if (abs(pos.x) > boundaryW || abs(pos.y) > boundaryH) {
    vel.x += (-pos.x / (abs(pos.x) + 0.1)) * uContainmentStrength * uDt;
    vel.y += (-pos.y / (abs(pos.y) + 0.1)) * uContainmentStrength * uDt;
  }

  // Smooth noise drift
  float nx = sin(t + phX + pos.y * 0.15) * 0.6
    + sin(t * 1.7 + phX * 2.3 + pos.x * 0.08) * 0.3
    + cos(t * 0.6 + phY * 1.1 + pos.y * 0.12) * 0.1;
  float ny = cos(t + phY + pos.x * 0.15) * 0.6
    + cos(t * 1.7 + phY * 2.3 + pos.y * 0.08) * 0.3
    + sin(t * 0.6 + phX * 1.1 + pos.x * 0.12) * 0.1;
  vel.x += nx * uNoiseStrength * uDt;
  vel.y += ny * uNoiseStrength * uDt;
  vel.z += sin(t * 0.8 + phX + phY) * uNoiseStrength * 0.3 * uDt;

  // Random jitter (hash)
  float jitter = hash(uv, uTime);
  vel.x += (hash(uv + 0.1, uTime + 1.0) - 0.5) * 0.025 * uDt;
  vel.y += (jitter - 0.5) * 0.025 * uDt;

  // Mouse attraction
  float dx = uMouse.x - pos.x;
  float dy = uMouse.y - pos.y;
  float mouseDist = length(vec2(dx, dy)) + 0.001;
  if (mouseDist > 0.1 && mouseDist < uMouseRadius) {
    float f = (uMouseStrength * uDt) / (mouseDist + 0.5);
    vel.x += (dx / mouseDist) * f;
    vel.y += (dy / mouseDist) * f;
  }

  // Z containment
  if (abs(pos.z) > 5.0) {
    vel.z -= (pos.z / (abs(pos.z) + 0.1)) * 0.1 * uDt;
  }

  vel *= uDamping;

  float s2 = dot(vel, vel);
  if (s2 > uMaxSpeed * uMaxSpeed) {
    float s = sqrt(s2);
    vel *= uMaxSpeed / s;
  }

  gl_FragColor = vec4(vel, 1.0);
}
`;

const POSITION_FRAGMENT = `
uniform float uDt;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5) / resolution;
  vec4 pos = texture2D(texturePosition, uv);
  vec4 vel = texture2D(textureVelocity, uv);
  gl_FragColor = vec4(pos.xyz + vel.xyz * uDt, 1.0);
}
`;

export function ParticleField({
  count,
  pointSize,
  cloudWidth = 11,
  cloudHeight = 7,
  targetFps,
}: ParticleFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const tier = getDeviceTier();
    const tierDefaults = getTierDefaults(tier);
    const effectiveCount = count ?? tierDefaults.count;
    const effectivePointSize = pointSize ?? tierDefaults.pointSize;
    const effectiveTargetFps = targetFps ?? tierDefaults.targetFps;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
    camera.position.set(0, 0, 22);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, tierDefaults.pixelRatioCap));
    renderer.domElement.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block";
    container.appendChild(renderer.domElement);

    // GPU compute resolution: W*H >= count
    const sizeX = Math.ceil(Math.sqrt(effectiveCount * 2));
    const sizeY = Math.ceil(effectiveCount / sizeX);
    const gpuCount = sizeX * sizeY;

    const gpuCompute = new GPUComputationRenderer(sizeX, sizeY, renderer);

    const crumple = (x: number, y: number, amp: number) => ({
      x: (Math.sin(x * 1.7) * Math.cos(y * 2.1) + Math.sin(x * 3.2 + y * 1.4) * 0.6) * amp,
      y: (Math.cos(x * 2.1) * Math.sin(y * 1.7) + Math.cos(x * 1.4 - y * 3.2) * 0.6) * amp,
    });

    const posTexture = gpuCompute.createTexture();
    const velTexture = gpuCompute.createTexture();
    const posData = posTexture.image.data as Float32Array;
    const velData = velTexture.image.data as Float32Array;

    const homePhaseData = new Float32Array(sizeX * sizeY * 4);

    for (let i = 0; i < gpuCount; i++) {
      const i4 = i * 4;
      let px: number;
      let py: number;
      let pz: number;
      let hx: number;
      let hy: number;
      let phX: number;
      let phY: number;
      let vx: number;
      let vy: number;
      let vz: number;

      if (i < effectiveCount) {
        const inInner = Math.random() < 0.6;
        const scale = inInner ? 0.5 : 1;
        px = THREE.MathUtils.randFloatSpread(cloudWidth * 2 * scale);
        py = THREE.MathUtils.randFloatSpread(cloudHeight * 2 * scale);
        const edgeFactor = Math.max(
          0,
          (Math.abs(px) / cloudWidth + Math.abs(py) / cloudHeight) / 2 - 0.3
        );
        const crumpleAmp = 0.4 + edgeFactor * 1.2;
        const d = crumple(px, py, crumpleAmp);
        px += d.x;
        py += d.y;
        pz = THREE.MathUtils.randFloatSpread(4);
        hx = px;
        hy = py;
        phX = Math.random() * Math.PI * 2;
        phY = Math.random() * Math.PI * 2;
        vx = THREE.MathUtils.randFloatSpread(0.02);
        vy = THREE.MathUtils.randFloatSpread(0.02);
        vz = THREE.MathUtils.randFloatSpread(0.01);
      } else {
        px = py = pz = hx = hy = phX = phY = vx = vy = vz = 0;
      }

      posData[i4 + 0] = px;
      posData[i4 + 1] = py;
      posData[i4 + 2] = pz;
      posData[i4 + 3] = 0;

      velData[i4 + 0] = vx;
      velData[i4 + 1] = vy;
      velData[i4 + 2] = vz;
      velData[i4 + 3] = 0;

      homePhaseData[i4 + 0] = hx;
      homePhaseData[i4 + 1] = hy;
      homePhaseData[i4 + 2] = phX;
      homePhaseData[i4 + 3] = phY;
    }

    posTexture.needsUpdate = true;
    velTexture.needsUpdate = true;

    const homePhaseTexture = new THREE.DataTexture(
      homePhaseData,
      sizeX,
      sizeY,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    homePhaseTexture.needsUpdate = true;

    const velVar = gpuCompute.addVariable("textureVelocity", VELOCITY_FRAGMENT, velTexture);
    const posVar = gpuCompute.addVariable("texturePosition", POSITION_FRAGMENT, posTexture);

    gpuCompute.setVariableDependencies(velVar, [velVar, posVar]);
    gpuCompute.setVariableDependencies(posVar, [velVar, posVar]);

    const maxSpeed = 0.18;
    const damping = 0.978;
    const containmentStrength = 0.15;
    const springStrength = 0.55;
    const mouseStrength = 0.06;
    const mouseRadius = 12;
    const noiseStrength = 0.09;
    const noiseSpeed = 0.35;

    velVar.material.uniforms.textureHomePhase = { value: homePhaseTexture };
    velVar.material.uniforms.uDt = { value: 0.016 };
    velVar.material.uniforms.uTime = { value: 0 };
    velVar.material.uniforms.uCloudWidth = { value: cloudWidth };
    velVar.material.uniforms.uCloudHeight = { value: cloudHeight };
    velVar.material.uniforms.uContainmentStrength = { value: containmentStrength };
    velVar.material.uniforms.uSpringStrength = { value: springStrength };
    velVar.material.uniforms.uMouseStrength = { value: mouseStrength };
    velVar.material.uniforms.uMouseRadius = { value: mouseRadius };
    velVar.material.uniforms.uNoiseStrength = { value: noiseStrength };
    velVar.material.uniforms.uNoiseSpeed = { value: noiseSpeed };
    velVar.material.uniforms.uDamping = { value: damping };
    velVar.material.uniforms.uMaxSpeed = { value: maxSpeed };
    velVar.material.uniforms.uMouse = { value: new THREE.Vector2(0, 0) };

    posVar.material.uniforms.uDt = { value: 0.016 };

    const initError = gpuCompute.init();
    if (initError) {
      console.error("GPUComputationRenderer init error:", initError);
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      return;
    }

    // Geometry: one vertex per particle, UV = texel center for sampling
    const uvs = new Float32Array(effectiveCount * 2);
    for (let i = 0; i < effectiveCount; i++) {
      const col = i % sizeX;
      const row = Math.floor(i / sizeX);
      uvs[i * 2 + 0] = (col + 0.5) / sizeX;
      uvs[i * 2 + 1] = (row + 0.5) / sizeY;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(new Float32Array(effectiveCount * 3), 3)
    );
    geometry.setAttribute("uvParticle", new THREE.BufferAttribute(uvs, 2));

    const cloudRadius = Math.max(cloudWidth, cloudHeight) * 1.15;
    const isDark = () => document.documentElement.classList.contains("dark");
    const particleAlpha = isDark() ? 0.22 : 0.24;
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPointSize: { value: effectivePointSize * 15 },
        uCloudRadius: { value: cloudRadius },
        uFadeStart: { value: cloudRadius * 0.35 },
        uPositionTexture: { value: null as THREE.DataTexture | null },
        uParticleAlpha: { value: particleAlpha },
      },
      vertexShader: `
        uniform float uPointSize;
        uniform float uCloudRadius;
        uniform float uFadeStart;
        uniform sampler2D uPositionTexture;
        attribute vec2 uvParticle;
        varying float vAlpha;
        void main() {
          vec4 posData = texture2D(uPositionTexture, uvParticle);
          vec3 position = posData.xyz;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uPointSize * (300.0 / -mv.z);
          float d = length(position.xy);
          vAlpha = 1.0 - smoothstep(uFadeStart, uCloudRadius, d);
        }
      `,
      fragmentShader: `
        uniform float uParticleAlpha;
        varying float vAlpha;
        void main() {
          float a = smoothstep(0.0, 0.15, length(gl_PointCoord - 0.5) * 2.0);
          gl_FragColor = vec4(0.65, 0.65, 0.65, a * vAlpha * uParticleAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Bind position texture immediately so first frame has valid data
    material.uniforms.uPositionTexture.value = gpuCompute.getCurrentRenderTarget(posVar).texture;

    const handleResize = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const observer = new MutationObserver(() => {
      material.uniforms.uParticleAlpha.value = isDark() ? 0.22 : 0.24;
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const mouseWorld = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2(0, 0);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersect = new THREE.Vector3();

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseNDC, camera);
      raycaster.ray.intersectPlane(plane, intersect);
      mouseWorld.x = intersect.x;
      mouseWorld.y = intersect.y;
    };

    window.addEventListener("pointermove", onPointerMove);

    const clock = new THREE.Clock();
    const stepInterval = 1 / Math.max(1, effectiveTargetFps);
    let accumulatedTime = 0;
    let running = true;

    const tick = () => {
      if (!running) return;
      accumulatedTime += clock.getDelta();
      if (accumulatedTime < stepInterval) {
        raf = requestAnimationFrame(tick);
        return;
      }
      // Clamp long tab-switch spikes and step at a stable rate.
      const dt = Math.min(accumulatedTime, stepInterval * 2);
      accumulatedTime = 0;

      velVar.material.uniforms.uDt.value = dt;
      velVar.material.uniforms.uTime.value += dt;
      velVar.material.uniforms.uMouse.value.set(mouseWorld.x, mouseWorld.y);
      posVar.material.uniforms.uDt.value = dt;

      gpuCompute.compute();

      material.uniforms.uPositionTexture.value = gpuCompute.getCurrentRenderTarget(posVar).texture;

      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };

    let raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", onPointerMove);

      scene.remove(points);
      geometry.dispose();
      material.dispose();
      gpuCompute.dispose();
      homePhaseTexture.dispose();
      renderer.dispose();

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [count, pointSize, cloudWidth, cloudHeight, targetFps]);

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
