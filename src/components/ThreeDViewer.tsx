
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

// Advanced Bottom-Left-Fill (BLF) bin packing with rotation optimization
const advancedBinPacking = (containerDims: [number, number, number], itemDims: [number, number, number]) => {
  const [containerX, containerY, containerZ] = containerDims;
  const [itemX, itemY, itemZ] = itemDims;
  
  const placedItems: PlacedItem[] = [];
  const emptySpaces: Space[] = [
    { x: 0, y: 0, z: 0, width: containerX, height: containerY, depth: containerZ }
  ];

  // All possible orientations of the item
  const orientations = [
    { dims: [itemX, itemY, itemZ] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], rotated: false },
    { dims: [itemY, itemX, itemZ] as [number, number, number], rotation: [0, 0, Math.PI/2] as [number, number, number], rotated: true },
    { dims: [itemZ, itemY, itemX] as [number, number, number], rotation: [Math.PI/2, 0, 0] as [number, number, number], rotated: true },
    { dims: [itemX, itemZ, itemY] as [number, number, number], rotation: [0, Math.PI/2, 0] as [number, number, number], rotated: true },
    { dims: [itemY, itemZ, itemX] as [number, number, number], rotation: [Math.PI/2, 0, Math.PI/2] as [number, number, number], rotated: true },
    { dims: [itemZ, itemX, itemY] as [number, number, number], rotation: [0, Math.PI/2, Math.PI/2] as [number, number, number], rotated: true },
  ];

  const findBestFit = (space: Space) => {
    let bestFit = null;
    let bestScore = -1;

    for (const orientation of orientations) {
      const [w, h, d] = orientation.dims;
      
      if (w <= space.width && h <= space.height && d <= space.depth) {
        // Scoring function prioritizes tighter fits and bottom-left placement
        const volumeScore = (w * h * d) / (space.width * space.height * space.depth);
        const positionScore = 1 / (1 + space.x + space.y + space.z);
        const wasteScore = 1 - ((space.width - w) + (space.height - h) + (space.depth - d)) / 
                             (space.width + space.height + space.depth);
        
        const totalScore = volumeScore * 0.5 + positionScore * 0.3 + wasteScore * 0.2;
        
        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestFit = {
            orientation,
            space,
            score: totalScore
          };
        }
      }
    }

    return bestFit;
  };

  const splitSpace = (space: Space, placedItem: { x: number, y: number, z: number, w: number, h: number, d: number }) => {
    const newSpaces: Space[] = [];
    
    // Right space
    if (space.x + placedItem.w < space.x + space.width) {
      newSpaces.push({
        x: space.x + placedItem.w,
        y: space.y,
        z: space.z,
        width: space.width - placedItem.w,
        height: space.height,
        depth: space.depth
      });
    }
    
    // Top space
    if (space.y + placedItem.h < space.y + space.height) {
      newSpaces.push({
        x: space.x,
        y: space.y + placedItem.h,
        z: space.z,
        width: placedItem.w,
        height: space.height - placedItem.h,
        depth: space.depth
      });
    }
    
    // Front space
    if (space.z + placedItem.d < space.z + space.depth) {
      newSpaces.push({
        x: space.x,
        y: space.y,
        z: space.z + placedItem.d,
        width: placedItem.w,
        height: placedItem.h,
        depth: space.depth - placedItem.d
      });
    }

    return newSpaces;
  };

  const removeOverlappingSpaces = (spaces: Space[]) => {
    return spaces.filter((space, index) => {
      for (let i = 0; i < spaces.length; i++) {
        if (i === index) continue;
        const other = spaces[i];
        
        // Check if space is completely contained within another space
        if (space.x >= other.x && space.y >= other.y && space.z >= other.z &&
            space.x + space.width <= other.x + other.width &&
            space.y + space.height <= other.y + other.height &&
            space.z + space.depth <= other.z + other.depth) {
          return false;
        }
      }
      return true;
    });
  };

  let iterations = 0;
  const maxIterations = 1000;

  while (emptySpaces.length > 0 && iterations < maxIterations) {
    iterations++;
    
    // Sort spaces by bottom-left-front priority
    emptySpaces.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      if (a.x !== b.x) return a.x - b.x;
      return a.z - b.z;
    });

    let bestPlacement = null;
    let bestSpaceIndex = -1;

    // Find the best placement among all available spaces
    for (let i = 0; i < emptySpaces.length; i++) {
      const fit = findBestFit(emptySpaces[i]);
      if (fit && (!bestPlacement || fit.score > bestPlacement.score)) {
        bestPlacement = fit;
        bestSpaceIndex = i;
      }
    }

    if (!bestPlacement) break;

    const space = bestPlacement.space;
    const orientation = bestPlacement.orientation;
    const [w, h, d] = orientation.dims;

    // Place the item
    placedItems.push({
      position: [
        space.x + w/2 - containerX/2,
        space.y + h/2 - containerY/2,
        space.z + d/2 - containerZ/2
      ],
      dimensions: orientation.dims,
      rotation: orientation.rotation,
      rotated: orientation.rotated
    });

    // Remove the used space
    emptySpaces.splice(bestSpaceIndex, 1);

    // Split the space and add new empty spaces
    const newSpaces = splitSpace(space, { x: space.x, y: space.y, z: space.z, w, h, d });
    emptySpaces.push(...newSpaces);

    // Remove overlapping and redundant spaces
    const cleanedSpaces = removeOverlappingSpaces(emptySpaces);
    emptySpaces.length = 0;
    emptySpaces.push(...cleanedSpaces);

    // Remove spaces that are too small for any orientation
    const minDim = Math.min(itemX, itemY, itemZ);
    for (let i = emptySpaces.length - 1; i >= 0; i--) {
      const space = emptySpaces[i];
      if (space.width < minDim && space.height < minDim && space.depth < minDim) {
        emptySpaces.splice(i, 1);
      }
    }
  }

  console.log(`Packed ${placedItems.length} items in ${iterations} iterations`);
  return placedItems;
};

const LoadingAnimation = ({ itemCount }: { itemCount: number }) => {
  const [currentItem, setCurrentItem] = useState(0);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);

  useEffect(() => {
    const containerDims: [number, number, number] = [6, 4, 3];
    const itemDims: [number, number, number] = [1.2, 0.6, 0.8];
    const arrangement = advancedBinPacking(containerDims, itemDims);
    setPlacedItems(arrangement.slice(0, itemCount));
  }, [itemCount]);

  useEffect(() => {
    if (currentItem >= placedItems.length) return;

    const timer = setTimeout(() => {
      setCurrentItem(prev => Math.min(prev + 1, placedItems.length));
    }, 100);

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
          color={item.rotated ? `hsl(${(index * 25) % 360}, 85%, 65%)` : `hsl(${(index * 15) % 360}, 70%, 55%)`}
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
    const arrangement = advancedBinPacking(containerDims, itemDims);
    setPlacedItems(arrangement.slice(0, itemCount));
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
          color={item.rotated ? `hsl(${(index * 25) % 360}, 85%, 65%)` : `hsl(${(index * 15) % 360}, 70%, 55%)`}
        />
      ))}
    </>
  );
};

const calculateMaxOptimizedItems = () => {
  const containerDims: [number, number, number] = [6, 4, 3];
  const itemDims: [number, number, number] = [1.2, 0.6, 0.8];
  const arrangement = advancedBinPacking(containerDims, itemDims);
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
      }, actualMaxItems * 100 + 1000);

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
                <p className="text-sm text-gray-600">Advanced BLF algorithm with 6-way rotation optimization</p>
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
                  {showLoadingAnimation ? 'Advanced BLF Packing...' : `Optimized: ${actualMaxItems} Items`}
                </p>
                <p className="text-xs text-gray-600">
                  Max capacity: {optimizedMaxItems} items (BLF + rotations)
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
