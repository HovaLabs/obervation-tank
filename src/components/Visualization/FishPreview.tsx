import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ClownFishModel } from "./ClownFishComponent";
import { RGBTuple } from "../../utils/colorUtils";

interface FishPreviewProps {
  color: RGBTuple;
  hasError?: boolean;
  scale?: number;
}

export function FishPreview({ color, hasError = false, scale = 0.35 }: FishPreviewProps): React.ReactElement {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
      <ambientLight intensity={1.6} />
      <pointLight position={[5, 5, 5]} intensity={40} />
      <Suspense fallback={null}>
        <ClownFishModel
          scale={scale}
          color={color}
          hasError={hasError}
          isPreview={true}
        />
      </Suspense>
    </Canvas>
  );
}
