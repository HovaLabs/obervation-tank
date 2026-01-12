import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { Suspense, useRef } from "react";
import { DoubleSide, MOUSE } from "three";
import type { Mesh } from "three";
import { ClownFishModel } from "./ClownFishComponent";
import { useEndpoints } from "../../context/EndpointContext";

interface BoxProps {
  position: [number, number, number];
  scale: [number, number, number];
  color: [number, number, number];
  opacity?: number;
}

function Box(props: BoxProps): React.ReactElement {
  const boxRef = useRef<Mesh>(null);

  return (
    <mesh ref={boxRef} position={props.position} scale={props.scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={props.color}
        opacity={props.opacity || 1}
        transparent={props.opacity ? true : false}
        side={DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

interface PlaneProps {
  position: [number, number, number];
  scale?: [number, number, number];
  size: [number, number];
  color: [number, number, number];
  opacity?: number;
}

function Plane(props: PlaneProps): React.ReactElement {
  const planeRef = useRef<Mesh>(null);

  return (
    <mesh
      ref={planeRef}
      position={props.position}
      scale={props.scale}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={props.size} />
      <meshStandardMaterial
        color={props.color}
        opacity={props.opacity || 1}
        transparent={props.opacity ? true : false}
        metalness={1}
        side={DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

export function Aquarium(): React.ReactElement {
  const { endpoints, endpointStatuses, hslToRgb } = useEndpoints();

  return (
    <Canvas camera={{ position: [0, 17, 55], fov: 75 }}>
      <OrbitControls
        enableRotate={true}
        enablePan={true}
        enableZoom={true}
        rotateSpeed={0.5}
        panSpeed={1}
        zoomSpeed={0.5}
        mouseButtons={{
          LEFT: MOUSE.ROTATE,
          MIDDLE: MOUSE.DOLLY,
          RIGHT: MOUSE.PAN,
        }}
      />
      <>
        <pointLight
          position={[30 / 2, 20 / 2, 20 / 2]}
          color={[1, 1, 1]}
          intensity={80}
        />
        <pointLight
          position={[-30 / 2, 20 / 2, 20 / 2]}
          color={[1, 1, 1]}
          intensity={80}
        />
        <pointLight
          position={[30 / 2, 20 / 2, -20 / 2]}
          color={[1, 1, 1]}
          intensity={80}
        />
        <pointLight
          position={[-30 / 2, 20 / 2, -20 / 2]}
          color={[1, 1, 1]}
          intensity={80}
        />
        <pointLight position={[0, 0, 0]} color={[1, 1, 1]} intensity={80} />
        <pointLight
          position={[50, 50, 30]}
          color={[1, 1, 1]}
          intensity={80}
        />
      </>

      <ambientLight color={[1, 1, 1]} intensity={1} />

      <Suspense>
        {endpoints.map((endpoint, ind) => {
          const status = endpointStatuses[endpoint.id];
          const hasError = status?.status === "error" || (status?.status === "pending" && !!status?.error);
          const colorRgb = hslToRgb(endpoint.color);

          return (
            <ClownFishModel
              scale={0.1}
              index={ind}
              key={endpoint.id}
              color={colorRgb}
              hasError={hasError}
              endpointUrl={endpoint.url}
            />
          );
        })}
      </Suspense>

      <Box
        scale={[30, 20, 20]}
        position={[0, 0, 0]}
        color={[0, 0.25, 0.5]}
        opacity={0.3}
      />

      <Plane
        color={[0, 0.2, 0.3]}
        size={[30, 20]}
        position={[0, -10, 0]}
        opacity={0.8}
      />
    </Canvas>
  );
}
