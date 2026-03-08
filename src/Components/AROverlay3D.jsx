import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";

function BodyOccluder({ position, rotation, scale }) {
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <cylinderGeometry args={[0.5, 0.45, 1, 32]} />
      <meshBasicMaterial colorWrite={false} depthWrite={true} />
    </mesh>
  );
}

function BodyAnchorRig({ poseDataRef, selectedDress, videoRef }) {
  const { camera } = useThree();
  const anchorRef = useRef(null);
  const attachedModelRef = useRef(null);
  const modelSizeRef = useRef(new THREE.Vector3(1, 1, 1));

  // Bone Refs
  const bonesRef = useRef({
    chest: null,
    leftShoulder: null,
    rightShoulder: null,
    leftUpperArm: null,
    rightUpperArm: null,
    leftForearm: null,
    rightForearm: null
  });

  const targetPositionRef = useRef(new THREE.Vector3(0, 0, -3));
  const targetScaleVectorRef = useRef(new THREE.Vector3(1, 1, 1));
  const targetYawRef = useRef(0);
  const targetRollRef = useRef(0);
  const targetPitchRef = useRef(0);

  const modelPath = selectedDress?.modelPath || "/models/tshirt.glb";
  const { scene } = useGLTF(modelPath);

  const modelClone = useMemo(() => {
    if (!scene) return null;
    return SkeletonUtils.clone(scene);
  }, [scene]);

  useEffect(() => {
    if (!anchorRef.current) return;

    const anchor = anchorRef.current;
    anchor.position.set(0, 0, -3);
    anchor.rotation.set(0, 0, 0);
    anchor.scale.set(1, 1, 1);

    // Reset bone refs
    Object.keys(bonesRef.current).forEach(k => bonesRef.current[k] = null);

    if (attachedModelRef.current) {
      anchor.remove(attachedModelRef.current);
      attachedModelRef.current = null;
    }

    if (!modelClone) return;

    modelClone.traverse((child) => {
      child.frustumCulled = false;

      // Material Polish
      if ((child.isMesh || child.isSkinnedMesh) && child.material) {
        const patchMaterial = (mat) => {
          mat.side = THREE.DoubleSide;
          mat.depthTest = true;
          mat.depthWrite = true;
          mat.transparent = !!mat.map || !!mat.alphaMap;
          mat.alphaTest = mat.transparent ? 0.3 : 0;
          mat.needsUpdate = true;
          if ("roughness" in mat) mat.roughness = 0.55;
          if ("metalness" in mat) mat.metalness = 0.05;
          mat.envMapIntensity = 1.0;
        };

        if (Array.isArray(child.material)) {
          child.material.forEach(patchMaterial);
        } else {
          patchMaterial(child.material);
        }
      }

      // Bone Discovery
      if (child.isBone) {
        const name = child.name.toLowerCase();
        const isLeft = name.includes("left") || name.includes(".l") || name.endsWith("_l");
        const isRight = name.includes("right") || name.includes(".r") || name.endsWith("_r");

        if (!child.userData.baseRotation) {
          child.userData.baseRotation = child.rotation.clone();
        }

        if (name.includes("chest") || name.includes("spine")) bonesRef.current.chest = child;
        if (name.includes("shoulder")) {
          if (isLeft) bonesRef.current.leftShoulder = child;
          if (isRight) bonesRef.current.rightShoulder = child;
        }
        if (name.includes("upper") && name.includes("arm")) {
          if (isLeft) bonesRef.current.leftUpperArm = child;
          if (isRight) bonesRef.current.rightUpperArm = child;
        } else if (name.includes("arm") && !name.includes("fore")) {
          // Fallback for models with simple "arm" names
          if (isLeft && !bonesRef.current.leftUpperArm) bonesRef.current.leftUpperArm = child;
          if (isRight && !bonesRef.current.rightUpperArm) bonesRef.current.rightUpperArm = child;
        }
        if (name.includes("fore") || name.includes("lower")) {
          if (isLeft) bonesRef.current.leftForearm = child;
          if (isRight) bonesRef.current.rightForearm = child;
        }
      }
    });

    // Auto-scale logic - Using robust traverse method
    const box = new THREE.Box3();
    modelClone.traverse((child) => {
      child.frustumCulled = false;
      if ((child.isMesh || child.isSkinnedMesh) && child.geometry) {
        if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
        const childBox = child.geometry.boundingBox.clone();
        childBox.applyMatrix4(child.matrixWorld);
        box.union(childBox);
      }
    });

    if (!box.isEmpty()) {
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        const fitScale = 2 / maxDim;
        modelClone.scale.setScalar(fitScale);
        modelClone.position.copy(center).multiplyScalar(-fitScale);
        modelSizeRef.current.set(size.x * fitScale, size.y * fitScale, size.z * fitScale);
        console.log("Model loaded and scaled:", modelPath, "Size:", modelSizeRef.current);
      }
    } else {
      console.warn("Model box is empty:", modelPath);
    }

    attachedModelRef.current = modelClone;
    anchor.add(modelClone);

    return () => {
      if (attachedModelRef.current) anchor.remove(attachedModelRef.current);
    };
  }, [modelClone]);

  useFrame((state, delta) => {
    if (!anchorRef.current) return;

    const pose = poseDataRef.current?.[0];
    if (!pose) return;

    // Landmark indices
    const L_SHOULDER = 11, R_SHOULDER = 12;
    const L_ELBOW = 13, R_ELBOW = 14;
    const L_WRIST = 15, R_WRIST = 16;
    const L_HIP = 23, R_HIP = 24;

    const minVis = 0.35;
    const getPoint = (idx) => (pose[idx]?.visibility >= minVis) ? pose[idx] : null;

    const ls = getPoint(L_SHOULDER), rs = getPoint(R_SHOULDER);
    if (!ls || !rs) return;

    // --- SCREEN SPACE MAPPING ---
    const dist = Math.abs(camera.position.z - targetPositionRef.current.z);
    const vH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * dist;
    const vW = vH * camera.aspect;

    let cX = 0, cY = 0, fX = 1, fY = 1;
    const video = videoRef?.current;
    if (video?.videoWidth) {
      const vA = video.videoWidth / video.videoHeight;
      const cA = camera.aspect;
      if (vA > cA) {
        const frac = cA / vA;
        cX = (1 - frac) * 0.5; fX = 1 / frac;
      } else {
        const frac = vA / cA;
        cY = (1 - frac) * 0.5; fY = 1 / frac;
      }
    }

    const remap = (p, cx, cy, fx, fy) => ({
      x: (p.x - cx) * fx,
      y: (p.y - cy) * fy,
      z: p.z
    });

    const lsr = remap(ls, cX, cY, fX, fY), rsr = remap(rs, cX, cY, fX, fY);
    const midX = (lsr.x + rsr.x) * 0.5;
    const midY = (lsr.y + rsr.y) * 0.5;

    // Positioning
    targetPositionRef.current.set((0.5 - midX) * vW, (0.5 - midY) * vH, -3);

    // Scaling
    const sW = Math.abs(rsr.x - lsr.x) * vW;
    const scaleMult = selectedDress?.scaleMultiplier || 1;
    const baseScale = (sW / modelSizeRef.current.x) * scaleMult * 1.1;
    targetScaleVectorRef.current.set(baseScale, baseScale, baseScale);

    // Body Rotations
    targetYawRef.current = (ls.z - rs.z) * 2.5;
    targetRollRef.current = -Math.atan2(rsr.y - lsr.y, rsr.x - lsr.x);

    // Apply main anchor transforms
    anchorRef.current.position.lerp(targetPositionRef.current, 0.2);
    anchorRef.current.scale.lerp(targetScaleVectorRef.current, 0.2);
    anchorRef.current.rotation.y = THREE.MathUtils.lerp(anchorRef.current.rotation.y, targetYawRef.current, 0.15);
    anchorRef.current.rotation.z = THREE.MathUtils.lerp(anchorRef.current.rotation.z, targetRollRef.current, 0.15);

    // --- ADVANCED RIGGING ---
    const lerpFactor = 1 - Math.exp(-delta * 12);

    const rigBone = (bone, start, end, intensity = 1.0) => {
      if (!bone || !start || !end) return;
      const vec = new THREE.Vector3(end.x - start.x, start.y - end.y, start.z - end.z).normalize();

      const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), vec);
      bone.quaternion.slerp(targetQuat, lerpFactor);
    };

    const le = getPoint(L_ELBOW), re = getPoint(R_ELBOW);
    const lw = getPoint(L_WRIST), rw = getPoint(R_WRIST);

    if (le) rigBone(bonesRef.current.leftUpperArm, ls, le);
    if (re) rigBone(bonesRef.current.rightUpperArm, rs, re);
    if (le && lw) rigBone(bonesRef.current.leftForearm, le, lw);
    if (re && rw) rigBone(bonesRef.current.rightForearm, re, rw);

    // Chest bend based on hips if available
    const lh = getPoint(L_HIP), rh = getPoint(R_HIP);
    if (lh && rh && bonesRef.current.chest) {
      const hipsMidZ = (lh.z + rh.z) * 0.5;
      const shouldersMidZ = (ls.z + rs.z) * 0.5;
      bonesRef.current.chest.rotation.x = THREE.MathUtils.lerp(
        bonesRef.current.chest.rotation.x,
        (shouldersMidZ - hipsMidZ) * 2.0,
        lerpFactor
      );
    }
  });

  return (
    <group ref={anchorRef} name="BodyAnchor">
      <BodyOccluder
        position={[0, -0.4, -0.15]}
        scale={[
          modelSizeRef.current.x * 0.6,
          modelSizeRef.current.y * 1.5,
          modelSizeRef.current.z * 0.5
        ]}
      />
    </group>
  );
}

function VideoPlane() {
  return (
    <mesh name="VideoPlane" position={[0, 0, -4]} visible={false}>
      <planeGeometry args={[16, 9]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

useGLTF.preload("/models/tshirt.glb");

export default function AROverlay3D({ poseDataRef, selectedDress, isVisible, videoRef }) {
  if (!isVisible) return null;

  return (
    <div
      className="absolute inset-0 z-[1000] pointer-events-none overflow-hidden"
      style={{ transform: "scaleX(-1)" }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={Math.min(window.devicePixelRatio || 1, 1.25)}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          stencil: true
        }}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      >
        <Environment preset="city" />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} />
        <pointLight position={[-5, 5, 2]} intensity={0.5} />

        <VideoPlane />
        <React.Suspense fallback={null}>
          <BodyAnchorRig
            poseDataRef={poseDataRef}
            selectedDress={selectedDress}
            videoRef={videoRef}
          />
        </React.Suspense>
      </Canvas>
    </div>
  );
}

