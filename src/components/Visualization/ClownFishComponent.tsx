import { Html, useAnimations, useGLTF } from "@react-three/drei";
import { ThreeEvent, useFrame, useGraph } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BufferGeometry, Group, Object3D, Skeleton } from "three";
import { Color, MeshStandardMaterial, Vector3 } from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { RGBTuple } from "../../utils/colorUtils";

{
  /* TYPES/INTERFACES */
}
interface ClownFishModelProps {
  color?: RGBTuple;
  hasError?: boolean;
  index?: number;
  isPreview?: boolean;
  endpointUrl?: string;
  scale?: number;
}

type FishNodes = Record<
  string,
  Object3D & { geometry?: BufferGeometry; skeleton?: Skeleton }
>;

{
  /* CONSTS */
}
const MODEL_PATH = import.meta.env.BASE_URL + "assets/clownFish.glb";
const TWO_PI = Math.PI * 2;
const HALF_PI = Math.PI / 2;
const QUARTER_PI = Math.PI / 4;
const LERP_SPEED = 0.02;
const ROT_LERP_SPEED = 0.03;
const LABEL_STYLE: React.CSSProperties = {
  background: "rgba(0, 0, 0, 0.8)",
  color: "white",
  padding: "8px 12px",
  borderRadius: "6px",
  fontSize: "14px",
  whiteSpace: "nowrap",
  pointerEvents: "none",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

export function ClownFishModel(props: ClownFishModelProps) {
  // Props
  const {
    color,
    hasError = false,
    index = 0,
    isPreview = false,
    endpointUrl = "",
  } = props;

  // Refs
  const group = useRef<Group>(null);
  const motion = useRef({
    pos: new Vector3(0, 0, 0),
    rotY: isPreview ? QUARTER_PI : 0,
    rotZ: isPreview && hasError ? Math.PI : 0,
    targetY: (index % 10) * 1.5 - 5,
    targetRotZ: isPreview && hasError ? Math.PI : 0,
    baseY: (index % 10) * 1.5 - 5,
    radiusFac: 0.01,
    dirSwitch: false,
    isRecovering: false,
    prevHasError: hasError,
  });

  // State
  const [showLabel, setShowLabel] = useState(false);

  // Hooks & derived values
  const { scene, materials, animations } = useGLTF(MODEL_PATH);
  const clonedScene = useMemo(() => clone(scene), [scene]);
  const { nodes } = useGraph(clonedScene) as { nodes: FishNodes };
  const { actions, names } = useAnimations(animations, group);
  const customMaterial = useMemo(() => {
    const baseMaterial = (materials as Record<string, MeshStandardMaterial>)
      .fishclown;
    if (!color) return baseMaterial;
    const mat = baseMaterial.clone();
    mat.color = new Color(...color);
    return mat;
  }, [color, materials]);

  // Initialize position on mount
  useEffect(() => {
    const m = motion.current;
    if (isPreview) {
      m.pos.set(0, 0, 0);
      m.rotY = QUARTER_PI;
      m.rotZ = hasError ? Math.PI : 0;
      m.targetRotZ = hasError ? Math.PI : 0;
      return;
    }
    m.radiusFac = Math.random() * 0.005 + 0.005;
    m.pos.set(20 * (Math.random() - 0.5), m.baseY, 10 * (Math.random() - 0.5));
    m.targetY = m.baseY;
    m.rotY = Math.random() * TWO_PI;
  }, [isPreview, hasError]);

  // Handle error state changes
  useEffect(() => {
    const m = motion.current;
    if (isPreview) {
      m.rotZ = hasError ? Math.PI : 0;
      m.targetRotZ = hasError ? Math.PI : 0;
      return;
    }

    const wasError = m.prevHasError;
    m.prevHasError = hasError;

    if (hasError) {
      m.targetY = 8;
      m.targetRotZ = Math.PI;
      m.isRecovering = false;
    } else if (wasError) {
      m.isRecovering = true;
      m.targetRotZ = 0;
    } else {
      m.targetY = m.baseY;
      m.targetRotZ = 0;
    }
  }, [hasError, isPreview]);

  // Control animation based on error state
  useEffect(() => {
    const action = actions[names[0]];
    if (!action) return;

    if (hasError && !motion.current.isRecovering) {
      action.fadeOut(0.5);
    } else {
      action.reset().fadeIn(0.5).play();
    }
    return () => {
      action?.fadeOut(0.5);
    };
  }, [actions, names, hasError]);

  useFrame(() => {
    const m = motion.current;
    const g = group.current;
    if (!g) return;

    // Interpolate rotation
    m.rotZ += (m.targetRotZ - m.rotZ) * ROT_LERP_SPEED;
    g.rotation.y = m.rotY;
    g.rotation.z = m.rotZ;

    if (isPreview) return;

    // Handle recovery: wait until upright before swimming down
    if (m.isRecovering && Math.abs(m.rotZ) < 0.1) {
      m.targetY = m.baseY;
      m.isRecovering = false;
    }

    // Interpolate Y position
    m.pos.y += (m.targetY - m.pos.y) * LERP_SPEED;

    // Only swim when healthy and not recovering
    if (!hasError && !m.isRecovering) {
      if (Math.abs(m.rotY) >= TWO_PI) {
        m.dirSwitch = !m.dirSwitch;
        m.rotY = 0;
      }
      m.rotY += m.dirSwitch ? m.radiusFac : -m.radiusFac;
      m.pos.x += 0.01 * Math.sin(m.rotY);
      m.pos.z += 0.01 * Math.cos(m.rotY);
    }

    g.position.copy(m.pos);
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (isPreview) return;
    e.stopPropagation();
    setShowLabel((prev) => !prev);
  };

  return (
    <group ref={group} {...props} dispose={null} onClick={handleClick}>
      {showLabel && endpointUrl && !isPreview && (
        <Html position={[0, 25, 0]} center style={LABEL_STYLE}>
          {endpointUrl}
        </Html>
      )}
      <group name="clownfishScene">
        <group name="modelOrientation" rotation={[-HALF_PI, 0, 0]}>
          <group name="fbxRoot" rotation={[HALF_PI, 0, 0]}>
            <group name="armatureContainer">
              <group name="skeletonRoot">
                <group name="meshGroup">
                  <primitive object={nodes._rootJoint} />
                  <group
                    name="meshOffset"
                    position={[0, 0.14, -2.21]}
                    rotation={[-HALF_PI, 0, 0]}
                  />
                  <group
                    name="fishBody"
                    position={[0, 0.14, -2.21]}
                    rotation={[-HALF_PI, 0, 0]}
                  />
                  <skinnedMesh
                    name="clownfishMesh"
                    geometry={nodes.Object_7.geometry}
                    material={customMaterial}
                    skeleton={nodes.Object_7.skeleton}
                  />
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(MODEL_PATH);
