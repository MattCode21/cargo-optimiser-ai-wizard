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

const SimpleBox = ({ position, args, color, rotation = [0, 0, 0] }: { 
  position: [number, number, number], 
  args: [number, number, number], 
  color: string,
  rotation?: [number, number, number]
}) => {
  return (
    <mesh position={position} rotation={rotation}>
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

interface PlacedItem {
  position: [number, number, number];
  dimensions: [number, number, number];
  rotation: [number, number, number];
  rotated: boolean;
}

interface Space {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
}

// Simplified bin packing algorithm to avoid performance issues
const simpleBinPacking = (containerDims: [number, number, number], itemDims: [number, number, number], maxItems: number = 20) => {
  const [containerX, containerY, containerZ] = containerDims;
  const [itemX, itemY, itemZ] = itemDims;
  
  const placedItems: PlacedItem[] = [];
  
  // Calculate how many items can fit in each dimension
  const itemsX = Math.floor(containerX / itemX);
  const itemsY = Math.floor(containerY / itemY);
  const itemsZ = Math.floor(containerZ / itemZ);
  
  let itemCount = 0;
  
  // Place items in a simple grid pattern
  for (let z = 0; z < itemsZ && itemCount < maxItems; z++) {
    for (let y = 0; y < itemsY && itemCount < maxItems; y++) {
      for (let x = 0; x < itemsX && itemCount < maxItems; x++) {
        const posX = (x * itemX + itemX/2) - containerX/2;
        const posY = (y * itemY + itemY/2) - containerY/2;
        const posZ = (z * itemZ + itemZ/2) - containerZ/2;
        
        placedItems.push({
          position: [posX, posY, posZ],
          dimensions: [itemX, itemY, itemZ],
          rotation: [0, 0, 0],
          rotated: false
        });
        
        itemCount++;
      }
    }
  }
  
  return placedItems;
};

const LoadingAnimation = ({ itemCount }: { itemCount: number }) => {
  const [currentItem, setCurrentItem] = useState(0);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);

  useEffect(() => {
    const containerDims: [number, number, number] = [6, 4, 3];
    const itemDims: [number, number, number] = [1.2, 0.6, 0.8];
    const arrangement = simpleBinPacking(containerDims, itemDims, Math.min(itemCount, 20));
    setPlacedItems(arrangement);
  }, [itemCount]);

  useEffect(() => {
    if (currentItem >= placedItems.length) return;

    const timer = setTimeout(() => {
      setCurrentItem(prev => Math.min(prev + 1, placedItems.length));
    }, 200);

    return () => clearTimeout(timer);
  }, [currentItem, placedItems.length]);

  return (
    <>
      <WireframeBox position={[0, 0, 0]} args={[6, 4, 3]} />
      {placedItems.slice(0, currentItem).map((item, index) => (
        <SimpleBox
          key={index}
          position={item.position}
          args={item.dimensions}
          rotation={item.rotation}
          color={`hsl(${(index * 30) % 360}, 70%, 60%)`}
        />
      ))}
    </>
  );
};

const StaticResult = ({ itemCount }: { itemCount: number }) => {
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);

  useEffect(() => {
    const containerDims: [number, number, number] = [6, 4, 3];
    const itemDims: [number, number, number] = [1.2, 0.6, 0.8];
    const arrangement = simpleBinPacking(containerDims, itemDims, Math.min(itemCount, 20));
    setPlacedItems(arrangement);
  }, [itemCount]);

  return (
    <>
      <WireframeBox position={[0, 0, 0]} args={[6, 4, 3]} />
      {placedItems.map((item, index) => (
        <SimpleBox
          key={index}
          position={item.position}
          args={item.dimensions}
          rotation={item.rotation}
          color={`hsl(${(index * 30) % 360}, 70%, 60%)`}
        />
      ))}
    </>
  );
};

const calculateMaxOptimizedItems = () => {
  const containerDims: [number, number, number] = [6, 4, 3];
  const itemDims: [number, number, number] = [1.2, 0.6, 0.8];
  const arrangement = simpleBinPacking(containerDims, itemDims, 20);
  return arrangement.length;
};

const ThreeDViewer = ({ isLoading, showResult, maxItems }: ThreeDViewerProps) => {
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
  
  const optimizedMaxItems = calculateMaxOptimizedItems();
  const actualMaxItems = Math.min(maxItems || 0, optimizedMaxItems, 20);

  useEffect(() => {
    if (showResult && !isLoading) {
      setShowLoadingAnimation(true);
      const timer = setTimeout(() => {
        setShowLoadingAnimation(false);
      }, actualMaxItems * 200 + 1000);

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
                <p className="text-sm text-gray-600">Optimizing loading pattern</p>
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
                  {showLoadingAnimation ? 'Loading Items...' : `Optimized: ${actualMaxItems} Items`}
                </p>
                <p className="text-xs text-gray-600">
                  Max capacity: {optimizedMaxItems} items
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