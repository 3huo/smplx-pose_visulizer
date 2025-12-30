
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SMPLXParameters, CameraConfig, SKELETON_PARENTS, JOINTS_LABELS, JOINT_OFFSETS } from '../types';

interface ViewportProps {
  params: SMPLXParameters;
  cameraConfig: CameraConfig;
}

const Viewport: React.FC<ViewportProps> = ({ params, cameraConfig }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  
  const bonesRef = useRef<THREE.Bone[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    sceneRef.current = scene;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(cameraConfig.fov, width / height, 0.1, 1000);
    camera.position.set(cameraConfig.position.x, cameraConfig.position.y, cameraConfig.position.z);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1, 0);
    controlsRef.current = controls;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const topLight = new THREE.DirectionalLight(0xffffff, 1.2);
    topLight.position.set(5, 15, 10);
    topLight.castShadow = true;
    scene.add(topLight);

    const fillLight = new THREE.PointLight(0x00ccff, 1.5, 20);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    const accentLight = new THREE.PointLight(0xff00ff, 1.0, 15);
    accentLight.position.set(5, 2, 0);
    scene.add(accentLight);

    // Floor
    const grid = new THREE.GridHelper(20, 40, 0x222222, 0x111111);
    scene.add(grid);

    // 2. Build Skeleton
    const bones: THREE.Bone[] = [];
    
    const jointMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.8
    });
    
    const boneMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x0088ff,
      roughness: 0.1, 
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
      emissive: 0x001133
    });

    JOINTS_LABELS.forEach((name, i) => {
      const bone = new THREE.Bone();
      bone.name = name;
      
      const offset = JOINT_OFFSETS[i];
      bone.position.set(offset[0], offset[1], offset[2]);

      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), jointMaterial);
      bone.add(dot);

      let proxyGeo: THREE.BufferGeometry | null = null;
      if (name === "Head") {
        proxyGeo = new THREE.SphereGeometry(0.12, 32, 32);
      } else if (name === "Pelvis" || name.includes("Spine")) {
        proxyGeo = new THREE.BoxGeometry(0.22, 0.12, 0.18);
        proxyGeo.translate(0, 0.05, 0); // 躯干略微上移
      } else if (name.includes("Hip") || name.includes("Knee") || name.includes("Ankle")) {
        // 腿部骨骼：保持 Y 轴垂直，向下延伸
        const h = 0.35;
        proxyGeo = new THREE.CylinderGeometry(0.06, 0.04, h, 12);
        proxyGeo.translate(0, -h/2, 0); // 将几何体底部对准关节
      } else if (name.includes("Shoulder") || name.includes("Elbow") || name.includes("Wrist") || name.includes("Collar")) {
        // 手臂和肩膀：横向对齐
        const h = 0.25;
        proxyGeo = new THREE.CylinderGeometry(0.05, 0.03, h, 12);
        proxyGeo.rotateZ(Math.PI / 2); // 旋转至 X 轴
        // 根据左右侧调整偏移方向
        const side = name.startsWith("L_") ? 1 : -1;
        proxyGeo.translate((h/2) * side, 0, 0); 
      }

      if (proxyGeo) {
        const mesh = new THREE.Mesh(proxyGeo, boneMaterial);
        bone.add(mesh);
      }

      bones.push(bone);
    });

    // Establish Hierarchy
    bones.forEach((bone, i) => {
      const parentIdx = SKELETON_PARENTS[i];
      if (parentIdx !== -1) {
        bones[parentIdx].add(bone);
      } else {
        scene.add(bone); 
      }
    });
    bonesRef.current = bones;

    // 3. Animation Loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 100);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // 4. Update Pose & Shapes
  useEffect(() => {
    if (bonesRef.current.length === 0) return;

    const root = bonesRef.current[0];
    root.position.set(
      JOINT_OFFSETS[0][0] + params.transl.x,
      JOINT_OFFSETS[0][1] + params.transl.y,
      JOINT_OFFSETS[0][2] + params.transl.z
    );

    bonesRef.current.forEach((bone, i) => {
      const startIdx = i * 3;
      if (startIdx + 2 < params.body_pose.length) {
        const rv = new THREE.Vector3(
          params.body_pose[startIdx],
          params.body_pose[startIdx + 1],
          params.body_pose[startIdx + 2]
        );
        
        const angle = rv.length();
        if (angle > 0.0001) {
          const axis = rv.normalize();
          bone.quaternion.setFromAxisAngle(axis, angle);
        } else {
          bone.quaternion.set(0, 0, 0, 1);
        }

        if (i > 0) {
          const defaultOffset = JOINT_OFFSETS[i];
          const scale = 1 + params.betas[0] * 0.05;
          bone.position.set(
            defaultOffset[0] * (1 + params.betas[1] * 0.1),
            defaultOffset[1] * scale,
            defaultOffset[2]
          );
        }
      }
    });
  }, [params]);

  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.fov = cameraConfig.fov;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [cameraConfig.fov]);

  return <div ref={containerRef} className="w-full h-full bg-[#050505]" />;
};

export default Viewport;
