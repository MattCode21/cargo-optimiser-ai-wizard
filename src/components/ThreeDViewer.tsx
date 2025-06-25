
import { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import * as THREE from 'three';

interface ThreeDViewerProps {
  isLoading: boolean;
  showResult: boolean;
  maxItems: number;
}

const SimpleBox = ({ position, args, color }: { position: [number, number, number], args: [number, number, number], color: string }) => {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

const WireframeBox = ({ position, args }: { position: [number, number, number], args: [number, number, number] }) => {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshBasicMaterial wireframe color="#444" />
    </mesh>
  );
};

const LoadingAnimation = ({ itemCount }: { itemCount: number }) => {
  const [currentItem, setCurrentItem] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying || currentItem >= itemCount) return;

    const timer = setTimeout(() => {
      setCurrentItem(prev => Math.min(prev + 1, itemCount));
    }, 500);

    return () => clearTimeout(timer);
  }, [currentItem, itemCount, isPlaying]);

  // Calculate positions to fit within container (6x4x3)
  // Container bounds: x: -3 to 3, y: -2 to 2, z: -1.5 to 1.5
  // Box size: 1.2x0.6x0.8 to fit better
  const getPosition = (index: number): [number, number, number] => {
    const itemsPerRow = 4;
    const itemsPerLayer = 8;
    
    const layer = Math.floor(index / itemsPerLayer);
    const indexInLayer = index % itemsPerLayer;
    const row = Math.floor(indexInLayer / itemsPerRow);
    const col = indexInLayer % itemsPerRow;
    
    const x = (col - 1.5) * 1.4; // -2.1 to 2.1
    const z = (row - 0.5) * 1.2; // -0.6 to 0.6
    const y = -1.5 + (layer * 0.8); // Start from bottom
    
    return [x, y, z];
  };

  return (
    <>
      {/* Container/Carton outline */}
      <WireframeBox position={[0, 0, 0]} args={[6, 4, 3]} />

      {/* Items being loaded */}
      {Array.from({ length: currentItem }).map((_, index) => {
        const position = getPosition(index);

        return (
          <SimpleBox
            key={index}
            position={position}
            args={[1.2, 0.6, 0.8]}
            color={`hsl(${index * 30}, 70%, 60%)`}
          />
        );
      })}
    </>
  );
};

const StaticResult = ({ itemCount }: { itemCount: number }) => {
  // Same positioning logic as LoadingAnimation
  const getPosition = (index: number): [number, number, number] => {
    const itemsPerRow = 4;
    const itemsPerLayer = 8;
    
    const layer = Math.floor(index / itemsPerLayer);
    const indexInLayer = index % itemsPerLayer;
    const row = Math.floor(indexInLayer / itemsPerRow);
    const col = indexInLayer % itemsPerRow;
    
    const x = (col - 1.5) * 1.4;
    const z = (row - 0.5) * 1.2;
    const y = -1.5 + (layer * 0.8);
    
    return [x, y, z];
  };

  return (
    <>
      {/* Container outline */}
      <WireframeBox position={[0, 0, 0]} args={[6, 4, 3]} />

      {/* All items loaded */}
      {Array.from({ length: itemCount }).map((_, index) => {
        const position = getPosition(index);

        return (
          <SimpleBox
            key={index}
            position={position}
            args={[1.2, 0.6, 0.8]}
            color={`hsl(${index * 30}, 70%, 60%)`}
          />
        );
      })}
    </>
  );
};

const ThreeDViewer = ({ isLoading, showResult, maxItems }: ThreeDViewerProps) => {
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);

  useEffect(() => {
    if (showResult && !isLoading) {
      // Show loading animation first, then static result
      setShowLoadingAnimation(true);
      const timer = setTimeout(() => {
        setShowLoadingAnimation(false);
      }, Math.min(maxItems, 12) * 500 + 1000); // Animation duration + 1 second buffer

      return () => clearTimeout(timer);
    }
  }, [showResult, isLoading, maxItems]);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden relative">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="animate-spin mx-auto mb-4" size={40} />
                <p className="text-lg font-medium">Calculating optimal arrangement...</p>
                <p className="text-sm text-gray-600">This may take a few moments</p>
              </div>
            </div>
          ) : showResult ? (
            <>
              <Canvas camera={{ position: [8, 6, 8], fov: 50 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                {showLoadingAnimation ? (
                  <LoadingAnimation itemCount={Math.min(maxItems, 12)} />
                ) : (
                  <StaticResult itemCount={Math.min(maxItems, 12)} />
                )}
                <OrbitControls enableZoom enablePan enableRotate />
              </Canvas>
              <div className="absolute top-4 left-4 bg-white/90 px-3 py-2 rounded-md shadow-md">
                <p className="text-sm font-medium">
                  {showLoadingAnimation ? 'Loading Items...' : `Optimized Loading: ${Math.min(maxItems, 12)} Items`}
                </p>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <div className="w-8 h-8 bg-gray-400 rounded"></div>
                </div>
                <p className="text-gray-600">3D visualization will appear here</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ThreeDViewer;
