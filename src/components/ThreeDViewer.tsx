
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

// Calculate maximum items that can fit in the container
const calculateMaxFittableItems = () => {
  const containerDimensions = [6, 4, 3]; // [length, width, height]
  const itemDimensions = [1.2, 0.6, 0.8]; // [length, width, height]
  
  const itemsX = Math.floor(containerDimensions[0] / itemDimensions[0]);
  const itemsY = Math.floor(containerDimensions[1] / itemDimensions[1]);
  const itemsZ = Math.floor(containerDimensions[2] / itemDimensions[2]);
  
  return itemsX * itemsY * itemsZ;
};

const LoadingAnimation = ({ itemCount }: { itemCount: number }) => {
  const [currentItem, setCurrentItem] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying || currentItem >= itemCount) return;

    const timer = setTimeout(() => {
      setCurrentItem(prev => Math.min(prev + 1, itemCount));
    }, 300); // Faster animation for more items

    return () => clearTimeout(timer);
  }, [currentItem, itemCount, isPlaying]);

  // Calculate positions to fit within container (6x4x3)
  // Container bounds: x: -3 to 3, y: -2 to 2, z: -1.5 to 1.5
  // Box size: 1.2x0.6x0.8
  const getPosition = (index: number): [number, number, number] => {
    const itemsPerX = Math.floor(6 / 1.2); // 5 items
    const itemsPerY = Math.floor(4 / 0.6); // 6 items  
    const itemsPerZ = Math.floor(3 / 0.8); // 3 items
    
    const layer = Math.floor(index / (itemsPerX * itemsPerY));
    const indexInLayer = index % (itemsPerX * itemsPerY);
    const row = Math.floor(indexInLayer / itemsPerX);
    const col = indexInLayer % itemsPerX;
    
    const x = -2.4 + (col * 1.2); // Start from left edge
    const y = -1.8 + (row * 0.6); // Start from bottom
    const z = -1.2 + (layer * 0.8); // Start from front
    
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
            color={`hsl(${index * 15}, 70%, 60%)`}
          />
        );
      })}
    </>
  );
};

const StaticResult = ({ itemCount }: { itemCount: number }) => {
  // Same positioning logic as LoadingAnimation
  const getPosition = (index: number): [number, number, number] => {
    const itemsPerX = Math.floor(6 / 1.2); // 5 items
    const itemsPerY = Math.floor(4 / 0.6); // 6 items  
    const itemsPerZ = Math.floor(3 / 0.8); // 3 items
    
    const layer = Math.floor(index / (itemsPerX * itemsPerY));
    const indexInLayer = index % (itemsPerX * itemsPerY);
    const row = Math.floor(indexInLayer / itemsPerX);
    const col = indexInLayer % itemsPerX;
    
    const x = -2.4 + (col * 1.2); // Start from left edge
    const y = -1.8 + (row * 0.6); // Start from bottom
    const z = -1.2 + (layer * 0.8); // Start from front
    
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
            color={`hsl(${index * 15}, 70%, 60%)`}
          />
        );
      })}
    </>
  );
};

const ThreeDViewer = ({ isLoading, showResult, maxItems }: ThreeDViewerProps) => {
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
  
  // Calculate the actual maximum items that can fit, regardless of input maxItems
  const maxFittableItems = calculateMaxFittableItems();
  const actualMaxItems = Math.min(maxItems, maxFittableItems);

  useEffect(() => {
    if (showResult && !isLoading) {
      // Show loading animation first, then static result
      setShowLoadingAnimation(true);
      const timer = setTimeout(() => {
        setShowLoadingAnimation(false);
      }, actualMaxItems * 300 + 1000); // Animation duration + 1 second buffer

      return () => clearTimeout(timer);
    }
  }, [showResult, isLoading, actualMaxItems]);

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
                  <LoadingAnimation itemCount={actualMaxItems} />
                ) : (
                  <StaticResult itemCount={actualMaxItems} />
                )}
                <OrbitControls enableZoom enablePan enableRotate />
              </Canvas>
              <div className="absolute top-4 left-4 bg-white/90 px-3 py-2 rounded-md shadow-md">
                <p className="text-sm font-medium">
                  {showLoadingAnimation ? 'Loading Items...' : `Optimized Loading: ${actualMaxItems} Items`}
                </p>
                <p className="text-xs text-gray-600">
                  Max capacity: {maxFittableItems} items
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
