import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";

function ShirtModel({ poseDataRef, selectedDress, videoRef }) {
  const groupRef = useRef();
  const targetPositionRef = useRef(new THREE.Vector3(0, 0, 0));
  const targetScaleRef = useRef(2);
  const targetQuatRef = useRef(new THREE.Quaternion());
  const hasTrackedPoseRef = useRef(false);

  const modelPath = selectedDress?.modelPath || "/models/jacket.glb";
  const { scene } = useGLTF(modelPath);
  const sceneClone = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    if (!sceneClone) return;

    sceneClone.rotation.set(0, 0, 0);
    sceneClone.position.set(0, 0, 0);
    sceneClone.scale.set(1, 1, 1);

    sceneClone.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            mat.side = THREE.DoubleSide;
            mat.needsUpdate = true;
          });
        } else {
          child.material.side = THREE.DoubleSide;
          child.material.needsUpdate = true;
        }
      }
    });

    const bounds = new THREE.Box3().setFromObject(sceneClone);
    const center = new THREE.Vector3();
    bounds.getCenter(center);
    sceneClone.position.sub(center);
  }, [sceneClone]);

  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(0, 0, 0);
    groupRef.current.scale.set(2, 2, 2);
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const pose = poseDataRef.current?.[0];
    const camera = state.camera;

    const leftShoulder = pose?.[11];
    const rightShoulder = pose?.[12];
    const leftHip = pose?.[23];
    const rightHip = pose?.[24];

    const minVisibility = 0.05;
    const hasConfidence =
      leftShoulder &&
      rightShoulder &&
      leftHip &&
      rightHip &&
      (leftShoulder.visibility ?? 1) >= minVisibility &&
      (rightShoulder.visibility ?? 1) >= minVisibility &&
      (leftHip.visibility ?? 1) >= minVisibility &&
      (rightHip.visibility ?? 1) >= minVisibility;

    if (pose?.length >= 25 && hasConfidence) {
      const shoulderMidX = (leftShoulder.x + rightShoulder.x) * 0.5;
      const shoulderMidY = (leftShoulder.y + rightShoulder.y) * 0.5;
      const hipMidY = (leftHip.y + rightHip.y) * 0.5;

      const shoulderDx = rightShoulder.x - leftShoulder.x;
      const shoulderDy = rightShoulder.y - leftShoulder.y;
      const shoulderSpanNorm = Math.hypot(shoulderDx, shoulderDy);
      const torsoNorm = Math.abs(hipMidY - shoulderMidY);

      if (shoulderSpanNorm > 0.02 && shoulderSpanNorm < 1.2 && torsoNorm > 0.02) {
        const depth = camera.position.z;
        const visibleHeight =
          2 * Math.tan((THREE.MathUtils.degToRad(camera.fov) * 0.5)) * depth;
        const visibleWidth = visibleHeight * camera.aspect;

        // ---- object-cover crop compensation ----
        // MediaPipe landmarks are in full video frame (0-1),
        // but the video element uses object-cover which crops.
        // We must remap landmarks to match the visible (cropped) area.
        const video = videoRef?.current;
        let adjX = shoulderMidX;
        let adjTorsoCenterY;
        let adjShoulderSpan = shoulderSpanNorm;

        if (video && video.videoWidth && video.videoHeight) {
          const videoAR = video.videoWidth / video.videoHeight;
          const containerAR = camera.aspect; // canvas matches container

          let cropX = 0, cropY = 0, scaleFactorX = 1, scaleFactorY = 1;

          if (videoAR > containerAR) {
            // Video is wider: sides are cropped
            const visibleFractionX = containerAR / videoAR;
            cropX = (1 - visibleFractionX) / 2;
            scaleFactorX = 1 / visibleFractionX;
            scaleFactorY = 1;
          } else {
            // Video is taller: top/bottom are cropped
            const visibleFractionY = videoAR / containerAR;
            cropY = (1 - visibleFractionY) / 2;
            scaleFactorX = 1;
            scaleFactorY = 1 / visibleFractionY;
          }

          // Remap normalized landmark to visible-area-normalized
          adjX = (shoulderMidX - cropX) * scaleFactorX;
          const adjShoulderMidY = (shoulderMidY - cropY) * scaleFactorY;
          const adjHipMidY = (hipMidY - cropY) * scaleFactorY;
          adjTorsoCenterY = adjShoulderMidY + (adjHipMidY - adjShoulderMidY) * 0.42;

          // Scale the shoulder span by the X scale factor
          adjShoulderSpan = shoulderSpanNorm * scaleFactorX;
        } else {
          adjTorsoCenterY = shoulderMidY + (hipMidY - shoulderMidY) * 0.42;
        }

        const rawX = (0.5 - adjX) * visibleWidth;
        const rawY = (0.5 - adjTorsoCenterY) * visibleHeight;

        const prev = targetPositionRef.current;
        let nextX = rawX;
        let nextY = rawY;

        // Reject only extreme jumps after first stable lock.
        if (hasTrackedPoseRef.current) {
          const jump = Math.hypot(rawX - prev.x, rawY - prev.y);
          const jumpLimit = visibleWidth * 0.45;
          if (jump > jumpLimit) {
            nextX = prev.x + (rawX - prev.x) * 0.2;
            nextY = prev.y + (rawY - prev.y) * 0.2;
          }
        }

        const baseYaw = selectedDress?.rotationY || 0;
        const yaw = THREE.MathUtils.clamp(
          baseYaw + (leftShoulder.z - rightShoulder.z) * 0.2,
          -0.08,
          0.08
        );
        const roll = THREE.MathUtils.clamp(
          -Math.atan2(shoulderDy, shoulderDx),
          -0.25,
          0.25
        );

        targetQuatRef.current.setFromEuler(new THREE.Euler(0, yaw, roll, "YXZ"));

        const scaleMultiplier = selectedDress?.scaleMultiplier || 1.0;
        targetScaleRef.current = THREE.MathUtils.clamp(
          adjShoulderSpan * 7 * scaleMultiplier,
          1,
          8
        );

        // Small nudge down so collar sits at shoulder line, not above it
        const yNudge = -0.3 * targetScaleRef.current / 5;
        targetPositionRef.current.set(nextX, nextY + yNudge, 0);

        hasTrackedPoseRef.current = true;
      }
    }

    const posLerp = 1 - Math.exp(-delta * 8);
    const rotLerp = 1 - Math.exp(-delta * 9);
    const scaleLerp = 1 - Math.exp(-delta * 8);

    groupRef.current.position.lerp(targetPositionRef.current, posLerp);
    groupRef.current.quaternion.slerp(targetQuatRef.current, rotLerp);

    const targetScaleVec = new THREE.Vector3(
      targetScaleRef.current,
      targetScaleRef.current,
      targetScaleRef.current
    );
    groupRef.current.scale.lerp(targetScaleVec, scaleLerp);
  });

  if (!sceneClone) return null;

  return (
    <group ref={groupRef}>
      <primitive object={sceneClone} />
    </group>
  );
}

useGLTF.preload("/models/jacket.glb");

export default function AROverlay3D({ poseDataRef, selectedDress, isVisible, videoRef }) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-[1000] pointer-events-none overflow-hidden" style={{ transform: "scaleX(-1)" }}>
      <Canvas
        dpr={Math.min(window.devicePixelRatio || 1, 2)}
        gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[2, 5, 5]} intensity={1.5} />
        <pointLight position={[-3, 5, 2]} intensity={0.8} />
        <React.Suspense fallback={null}>
          <ShirtModel poseDataRef={poseDataRef} selectedDress={selectedDress} videoRef={videoRef} />
        </React.Suspense>
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
