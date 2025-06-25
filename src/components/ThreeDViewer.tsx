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

// Advanced bin packing algorithm with rotation
const optimizedBinPacking = (containerDims: [number, number, number], itemDims: [number, number, number]) => {
  const [containerX, containerY, containerZ] = containerDims;
  const [itemX, itemY, itemZ] = itemDims;
  
  const placedItems: PlacedItem[] = [];
  const occupiedSpaces: Array<{
    x: number, y: number, z: number,
    width: number, height: number, depth: number
  }> = [];

  // Generate all possible rotations of the item
  const rotations = [
    { dims: [itemX, itemY, itemZ], rotation: [0, 0, 0], rotated: false },
    { dims: [itemY, itemX, itemZ], rotation: [0, 0, Math.PI/2], rotated: true },
    { dims: [itemZ, itemY, itemX], rotation: [Math.PI/2, 0, 0], rotated: true },
    { dims: [itemX, itemZ, itemY], rotation: [0, Math.PI/2, 0], rotated: true },
    { dims: [itemY, itemZ, itemX], rotation: [Math.PI/2, 0, Math.PI/2], rotated: true },
    { dims: [itemZ, itemX, itemY], rotation: [0, Math.PI/2, Math.PI/2], rotated: true },
  ];

  const isSpaceOccupied = (x: number, y: number, z: number, w: number, h: number, d: number) => {
    return occupiedSpaces.some(space => !(
      x >= space.x + space.width ||
      x + w <= space.x ||
      y >= space.y + space.height ||
      y + h <= space.y ||
      z >= space.z + space.depth ||
      z + d <= space.z
    ));
  };

  const canPlaceItem = (x: number, y: number, z: number, dims: [number, number, number]) => {
    const [w, h, d] = dims;
    return x + w <= containerX && 
           y + h <= containerY && 
           z + d <= containerZ &&
           !isSpaceOccupied(x, y, z, w, h, d);
  };

  // Try to place items using a more sophisticated approach
  const step = 0.1; // Smaller step for more precise placement
  let maxItems = 0;
  let bestArrangement: PlacedItem[] = [];

  // Try multiple packing strategies
  for (let strategy = 0; strategy < 3; strategy++) {
    const currentPlacement: PlacedItem[] = [];
    const currentOccupied: typeof occupiedSpaces = [];
    
    for (let z = 0; z < containerZ; z += step) {
      for (let y = 0; y < containerY; y += step) {
        for (let x = 0; x < containerX; x += step) {
          let placed = false;
          
          // Try each rotation
          for (const rotation of rotations) {
            const [w, h, d] = rotation.dims;
            
            // Check if this rotation fits
            if (x + w <= containerX && y + h <= containerY && z + d <= containerZ) {
              // Check if space is available
              const isOccupied = currentOccupied.some(space => !(
                x >= space.x + space.width ||
                x + w <= space.x ||
                y >= space.y + space.height ||
                y + h <= space.y ||
                z >= space.z + space.depth ||
                z + d <= space.z
              ));
              
              if (!isOccupied) {
                currentPlacement.push({
                  position: [x + w/2 - containerX/2, y + h/2 - containerY/2, z + d/2 - containerZ/2],
                  dimensions: rotation.dims,
                  rotation: rotation.rotation as [number, number, number],
                  rotated: rotation.rotated
                });
                
                currentOccupied.push({
                  x, y, z, width: w, height: h, depth: d
                });
                
                placed = true;
                break;
              }
            }
          }
          
          if (placed && currentPlacement.length >= 200) break; // Limit for performance
        }
        if (currentPlacement.length >= 200) break;
      }
      if (currentPlacement.length >= 200) break;
    }
    
    if (currentPlacement.length > maxItems) {
      maxItems = currentPlacement.length;
      bestArrangement = [...currentPlacement];
    }
  }

  return bestArrangement;
};

const LoadingAnimation = ({ itemCount }: { itemCount: number }) => {
  const [currentItem, setCurrentItem] = useState(0);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);

  useEffect(() => {
    // Calculate optimal arrangement
    const containerDims: [number, number, number] = [6, 4, 3];
    const itemDims: [number, number, number] = [1.2, 0.6, 0.8];
    const arrangement = optimizedBinPacking(containerDims, itemDims);
    setPlacedItems(arrangement.slice(0, itemCount));
  }, [itemCount]);

  useEffect(() => {
    if (currentItem >= placedItems.length) return;

    const timer = setTimeout(() => {
      setCurrentItem(prev => Math.min(prev + 1, placedItems.length));
    }, 150); // Faster animation

    return () => clearTimeout(timer);
  }, [currentItem, placedItems.length]);

  return (
    <>
      {/* Container outline */}
      <WireframeBox position={[0, 0, 0]} args={[6, 4, 3]} />

      {/* Items being loaded */}
      {placedItems.slice(0, currentItem).map((item, index) => (
        <SimpleBox
          key={index}
          position={item.position}
          args={item.dimensions}
          rotation={item.rotation}
          color={item.rotated ? `hsl(${(index * 25) % 360}, 80%, 60%)` : `hsl(${(index * 15) % 360}, 70%, 60%)`}
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
    const arrangement = optimizedBinPacking(containerDims, itemDims);
    setPlacedItems(arrangement.slice(0, itemCount));
  }, [itemCount]);

  return (
    <>
      {/* Container outline */}
      <WireframeBox position={[0, 0, 0]} args={[6, 4, 3]} />

      {/* All items loaded */}
      {placedItems.map((item, index) => (
        <SimpleBox
          key={index}
          position={item.position}
          args={item.dimensions}
          rotation={item.rotation}
          color={item.rotated ? `hsl(${(index * 25) % 360}, 80%, 60%)` : `hsl(${(index * 15) % 360}, 70%, 60%)`}
        />
      ))}
    </>
  );
};

const calculateMaxOptimizedItems = () => {
  const containerDims: [number, number, number] = [6, 4, 3];
  const itemDims: [number, number, number] = [1.2, 0.6, 0.8];
  const arrangement = optimizedBinPacking(containerDims, itemDims);
  return arrangement.length;
};

const ThreeDViewer = ({ isLoading, showResult, maxItems }: ThreeDViewerProps) => {
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
  
  const optimizedMaxItems = calculateMaxOptimizedItems();
  const actualMaxItems = Math.min(maxItems, optimizedMaxItems);

  useEffect(() => {
    if (showResult && !isLoading) {
      setShowLoadingAnimation(true);
      const timer = setTimeout(() => {
        setShowLoadingAnimation(false);
      }, actualMaxItems * 150 + 1000);

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
                <p className="text-sm text-gray-600">Optimizing with rotations for maximum efficiency</p>
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
                  {showLoadingAnimation ? 'Optimizing Loading...' : `Optimized: ${actualMaxItems} Items`}
                </p>
                <p className="text-xs text-gray-600">
                  Max capacity: {optimizedMaxItems} items (with rotations)
                </p>
                <p className="text-xs text-blue-600">
                  🔄 Rotated items shown in brighter colors
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
