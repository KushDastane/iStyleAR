import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";

function BodyAnchorRig({ poseDataRef, selectedDress, videoRef }) {
  const anchorRef = useRef(null);
  const attachedModelRef = useRef(null);
  const modelWidthRef = useRef(1);

  const targetPositionRef = useRef(new THREE.Vector3(0, 0, -3));
  const targetScaleRef = useRef(1);
  const targetYawRef = useRef(0);
  const targetRollRef = useRef(0);
  const targetScaleVectorRef = useRef(new THREE.Vector3(1, 1, 1));

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

    if (attachedModelRef.current) {
      anchor.remove(attachedModelRef.current);
      attachedModelRef.current = null;
    }

    if (!modelClone) return;

    modelClone.rotation.set(0, 0, 0);
    modelClone.position.set(0, 0, 0);
    modelClone.scale.set(1, 1, 1);
    modelClone.updateMatrixWorld(true);

    const box = new THREE.Box3();
    modelClone.traverse((child) => {
      child.frustumCulled = false;

      if ((child.isMesh || child.isSkinnedMesh) && child.geometry) {
        if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
        const childBox = child.geometry.boundingBox.clone();
        childBox.applyMatrix4(child.matrixWorld);
        box.union(childBox);
      }

      if (child.isMesh && child.material) {
        const patchMaterial = (mat) => {
          mat.side = THREE.DoubleSide;
          mat.depthTest = false;
          mat.transparent = false;
          mat.needsUpdate = true;
        };

        if (Array.isArray(child.material)) {
          child.material.forEach(patchMaterial);
        } else {
          patchMaterial(child.material);
        }
      }
    });

    if (!box.isEmpty() && Number.isFinite(box.max.x)) {
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        const fitScale = 2 / maxDim;
        modelClone.scale.setScalar(fitScale);
        modelClone.position.copy(center).multiplyScalar(-fitScale);
        modelWidthRef.current = Math.max(0.001, size.x * fitScale);
      }
    }

    attachedModelRef.current = modelClone;
    anchor.add(modelClone);

    return () => {
      if (attachedModelRef.current) {
        anchor.remove(attachedModelRef.current);
        attachedModelRef.current = null;
      }
    };
  }, [modelClone]);

  useFrame((state) => {
    if (!anchorRef.current) return;

    const pose = poseDataRef.current?.[0];
    const leftShoulder = pose?.[11];
    const rightShoulder = pose?.[12];
    const leftHip = pose?.[23];
    const rightHip = pose?.[24];
    const minVisibility = 0.1;

    const hasShoulders =
      pose &&
      pose.length >= 13 &&
      leftShoulder &&
      rightShoulder &&
      (leftShoulder.visibility ?? 1) >= minVisibility &&
      (rightShoulder.visibility ?? 1) >= minVisibility;

    if (hasShoulders) {
      const camera = state.camera;
      const distance = Math.abs(camera.position.z - targetPositionRef.current.z);
      const visibleHeight =
        2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distance;
      const visibleWidth = visibleHeight * camera.aspect;

      let cropX = 0;
      let cropY = 0;
      let factorX = 1;
      let factorY = 1;

      const video = videoRef?.current;
      if (video?.videoWidth && video?.videoHeight) {
        const videoAspect = video.videoWidth / video.videoHeight;
        const containerAspect = camera.aspect;

        if (videoAspect > containerAspect) {
          const visibleFractionX = containerAspect / videoAspect;
          cropX = (1 - visibleFractionX) * 0.5;
          factorX = 1 / visibleFractionX;
        } else {
          const visibleFractionY = videoAspect / containerAspect;
          cropY = (1 - visibleFractionY) * 0.5;
          factorY = 1 / visibleFractionY;
        }
      }

      const remap = (value, crop, factor) =>
        THREE.MathUtils.clamp((value - crop) * factor, 0, 1);

      const adjLSx = remap(leftShoulder.x, cropX, factorX);
      const adjRSx = remap(rightShoulder.x, cropX, factorX);
      const adjLSy = remap(leftShoulder.y, cropY, factorY);
      const adjRSy = remap(rightShoulder.y, cropY, factorY);

      const midX = (adjLSx + adjRSx) * 0.5;
      const shoulderMidY = (adjLSy + adjRSy) * 0.5;

      let torsoY = shoulderMidY;
      if (
        leftHip &&
        rightHip &&
        (leftHip.visibility ?? 1) >= minVisibility &&
        (rightHip.visibility ?? 1) >= minVisibility
      ) {
        const adjLHy = remap(leftHip.y, cropY, factorY);
        const adjRHy = remap(rightHip.y, cropY, factorY);
        const hipMidY = (adjLHy + adjRHy) * 0.5;
        torsoY = shoulderMidY + (hipMidY - shoulderMidY) * 0.35;
      }

      targetPositionRef.current.set((0.5 - midX) * visibleWidth, (0.5 - torsoY) * visibleHeight, -3);

      const shoulderWidthNorm = Math.max(0.02, Math.abs(adjRSx - adjLSx));
      const shoulderWidthWorld = shoulderWidthNorm * visibleWidth;
      const scaleMultiplier = selectedDress?.scaleMultiplier ?? 1;
      targetScaleRef.current = THREE.MathUtils.clamp(
        (shoulderWidthWorld / modelWidthRef.current) * scaleMultiplier,
        0.6,
        4.5
      );

      const yawFromDepth = THREE.MathUtils.clamp(
        (leftShoulder.z - rightShoulder.z) * 3.2,
        -0.45,
        0.45
      );

      const rollFromShoulders = THREE.MathUtils.clamp(
        -Math.atan2(adjRSy - adjLSy, adjRSx - adjLSx),
        -0.35,
        0.35
      );

      targetYawRef.current = yawFromDepth;
      targetRollRef.current = rollFromShoulders;
    }

    anchorRef.current.position.lerp(targetPositionRef.current, 0.22);

    targetScaleVectorRef.current.set(
      targetScaleRef.current,
      targetScaleRef.current,
      targetScaleRef.current
    );
    anchorRef.current.scale.lerp(targetScaleVectorRef.current, 0.22);

    anchorRef.current.rotation.y = THREE.MathUtils.lerp(
      anchorRef.current.rotation.y,
      targetYawRef.current,
      0.16
    );

    anchorRef.current.rotation.z = THREE.MathUtils.lerp(
      anchorRef.current.rotation.z,
      targetRollRef.current * 0.25,
      0.16
    );
  });

  return <group ref={anchorRef} name="BodyAnchor" />;
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
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[2, 5, 5]} intensity={1.5} />
        <pointLight position={[-3, 5, 2]} intensity={0.8} />
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
