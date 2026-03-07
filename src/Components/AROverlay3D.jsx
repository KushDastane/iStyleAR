import React, { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Environment, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";

/**
 * ShirtModel Component (V15 - Orientation Fix)
 * Robustly handles GLB models with non-standard rotations.
 * Implements smooth 3-axis tracking with depth-aware fit.
 */
function ShirtModel({ poseDataRef, selectedDress }) {
  const meshRef = useRef();
  const { scene } = useGLTF("/models/tshirt.glb");
  const texture = useTexture(selectedDress?.img || "https://res.cloudinary.com/dyiaqidiq/image/upload/v1762696034/wardrobe/tE1OmRIo9BPuVVyoyWROLjeGeWM2/bko2pmrn2hn5nkrectkn.png");

  // 1. Extract, Normalize, and RE-ORIENT Geometry
  const shirtGeometry = useMemo(() => {
    if (!scene) return null;

    let primary = null;
    let maxV = 0;
    scene.traverse((c) => {
      if (c.isMesh) {
        const count = c.geometry.attributes.position.count;
        if (count > maxV) { maxV = count; primary = c; }
      }
    });

    if (!primary) return null;

    const geo = primary.geometry.clone();

    // a. Center and calculate raw size
    geo.center();
    geo.computeBoundingBox();
    const size = new THREE.Vector3();
    geo.boundingBox.getSize(size);

    // b. Auto-Orientation: The 'Depth' (Z) should be the smallest dimension
    // If Size.x is smaller than Size.z, it might be rotated 90 deg.
    // Looking at the user's screenshot, it seems to be rotated around Y.
    const maxDim = Math.max(size.x, size.y, size.z);

    // Let's assume the shirt should be wider (X) than it is deep (Z).
    // If z is significantly larger than x, we rotate 90 deg around Y.
    if (size.z > size.x) {
      geo.rotateY(Math.PI / 2);
      // Recompute bounds after rotation
      geo.computeBoundingBox();
    }

    // c. Ensure it's facing FORWARD (+Z in Three.js standard)
    // Most shirts are concave in the back, convex in the front.
    // We'll trust the base orientation for now but allow for normalization.

    // d. Scale to exactly 1.0 unit height
    const h = geo.boundingBox.getSize(new THREE.Vector3()).y;
    if (h > 0) geo.scale(1 / h, 1 / h, 1 / h);

    return geo;
  }, [scene]);

  useFrame(() => {
    if (!meshRef.current || !poseDataRef.current || !shirtGeometry) return;

    const pose = poseDataRef.current?.[0];
    if (!pose || pose.length < 25) {
      meshRef.current.position.y = -100;
      return;
    }
    meshRef.current.visible = true;

    const lSh = pose[11], rSh = pose[12], lHi = pose[23], rHi = pose[24];

    // --- POSITION ---
    const cX = (lSh.x + rSh.x) / 2;
    const cY = (lSh.y + rSh.y) / 2;
    const cZ = (lSh.z + rSh.z) / 2;

    const targetX = (0.5 - cX) * 10;
    const targetY = -(cY - 0.5) * 8;
    const targetZ = -cZ * 5;

    // --- ROTATION (Mirrored Space Safe) ---
    // Shoulder Dir: Vector from R to L (in mirrored screen space)
    const shDir = new THREE.Vector3(lSh.x - rSh.x, -(lSh.y - rSh.y), (lSh.z - rSh.z) * 2).normalize();

    // Spine Dir: Center Shoulders to Center Hips (Down)
    const cShDir = new THREE.Vector3((lSh.x + rSh.x) / 2, -(lSh.y + rSh.y) / 2, (lSh.z + rSh.z) / 2);
    const cHiDir = new THREE.Vector3((lHi.x + rHi.x) / 2, -(lHi.y + rHi.y) / 2, (lHi.z + rHi.z) / 2);
    const bodyDown = new THREE.Vector3().subVectors(cHiDir, cShDir).normalize();
    const bodyUp = bodyDown.clone().negate();

    // Forward Vector (pointing at camera)
    const forward = new THREE.Vector3().crossVectors(shDir, bodyUp).normalize();
    // Correct Up to be exactly orthogonal
    const orthoUp = new THREE.Vector3().crossVectors(forward, shDir).normalize();

    const lookMatrix = new THREE.Matrix4().makeBasis(shDir, orthoUp, forward);
    const targetQuat = new THREE.Quaternion().setFromRotationMatrix(lookMatrix);

    // --- SCALE ---
    const shoulderWidth = Math.sqrt((rSh.x - lSh.x) ** 2 + (rSh.y - lSh.y) ** 2);
    const scaleFactor = shoulderWidth * 18.5;

    // --- APPLY ---
    // Shift slightly forward (+0.4) and down (-0.7) for better torso wrap
    meshRef.current.position.lerp(new THREE.Vector3(targetX, targetY - 0.7, targetZ + 0.5), 0.2);
    meshRef.current.quaternion.slerp(targetQuat, 0.2);
    meshRef.current.scale.lerp(new THREE.Vector3(scaleFactor, scaleFactor, scaleFactor), 0.2);
  });

  if (!shirtGeometry) return null;

  return (
    <group>
      <mesh ref={meshRef} geometry={shirtGeometry}>
        <meshStandardMaterial
          map={texture}
          color="white"
          side={THREE.DoubleSide}
          roughness={0.6}
          metalness={0.2}
        />
        {/* Tiny AxisHelper for orientation verification */}
        <axesHelper args={[0.05]} />
      </mesh>
    </group>
  );
}

export default function AROverlay3D({ poseDataRef, selectedDress, isVisible }) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-[1000] pointer-events-none overflow-hidden">
      <Canvas alpha dpr={[1, 2]} style={{ position: 'absolute', top: 0, left: 0 }}>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[2, 5, 5]} intensity={1.5} />
        <pointLight position={[-3, 5, 2]} intensity={0.8} />
        <React.Suspense fallback={null}>
          <ShirtModel
            poseDataRef={poseDataRef}
            selectedDress={selectedDress}
          />
        </React.Suspense>
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
