import React, { useEffect, useRef } from 'react';

function ensureThreeJs() {
  if (window.THREE) return Promise.resolve(window.THREE);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = () => resolve(window.THREE);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function initScene(container) {
  const THREE = window.THREE;
  const width = container.clientWidth || 320;
  const height = container.clientHeight || 220;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.z = 4.2;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  return { scene, camera, renderer, THREE };
}

function buildCardMesh(THREE) {
  const group = new THREE.Group();
  const geometry = new THREE.BoxGeometry(2.4, 1.45, 0.08);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x0284c7,
    metalness: 0.85,
    roughness: 0.22,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
    reflectivity: 0.9
  });
  const card = new THREE.Mesh(geometry, material);
  group.add(card);

  const chipGeo = new THREE.PlaneGeometry(0.35, 0.28);
  const chipMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.3 });
  const chip = new THREE.Mesh(chipGeo, chipMat);
  chip.position.set(-0.7, 0.2, 0.045);
  group.add(chip);
  return group;
}

function addLighting(scene, THREE) {
  const ambient = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
  dirLight.position.set(3, 4, 3);
  scene.add(dirLight);
  const pointLight = new THREE.PointLight(0x0ea5e9, 2, 10);
  pointLight.position.set(-2, -1, 2);
  scene.add(pointLight);
}

function createObserver(container, onVisibilityChange) {
  const observer = new IntersectionObserver(([entry]) => {
    onVisibilityChange(entry.isIntersecting);
  });
  observer.observe(container);
  return observer;
}

function bindCardMotion(container, cardGroup, renderer, scene, camera) {
  let targetRot = { x: 0, y: 0.35 };
  let isVisible = true;
  let animId = null;
  let clock = 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const onMove = (e) => {
    const r = container.getBoundingClientRect();
    targetRot.y = (((e.clientX - r.left) / r.width) * 2 - 1) * 0.45;
    targetRot.x = -(((e.clientY - r.top) / r.height) * 2 - 1) * 0.35;
  };

  const loop = () => {
    animId = requestAnimationFrame(loop);
    if (!isVisible) return;
    clock += 0.02;
    if (!reduced) {
      cardGroup.rotation.y += (targetRot.y - cardGroup.rotation.y) * 0.08;
      cardGroup.rotation.x += (targetRot.x - cardGroup.rotation.x) * 0.08;
      cardGroup.position.y = Math.sin(clock) * 0.08;
    }
    renderer.render(scene, camera);
  };
  loop();
  container.addEventListener('mousemove', onMove);
  const observer = createObserver(container, (v) => { isVisible = v; });
  return () => {
    cancelAnimationFrame(animId);
    observer.disconnect();
    container.removeEventListener('mousemove', onMove);
  };
}

export function Hero3DCanvas() {
  const containerRef = useRef(null);

  useEffect(() => {
    let cleanup = null;
    ensureThreeJs().then((THREE) => {
      if (!containerRef.current) return;
      const { scene, camera, renderer } = initScene(containerRef.current);
      const card = buildCardMesh(THREE);
      scene.add(card);
      addLighting(scene, THREE);
      const stopMotion = bindCardMotion(containerRef.current, card, renderer, scene, camera);
      cleanup = () => {
        stopMotion();
        if (renderer.domElement && containerRef.current) {
          containerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    }).catch(console.error);

    return () => { if (cleanup) cleanup(); };
  }, []);

  return <div ref={containerRef} className="hero-3d-canvas-wrap" aria-label="3D Interactive Finance Card" />;
}
