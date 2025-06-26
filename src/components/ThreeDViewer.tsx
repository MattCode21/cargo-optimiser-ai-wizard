import { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RotateCcw, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import * as THREE from 'three';
import { getOptimalBinPacking, calculateSpaceUtilization } from '@/utils/advancedBinPacking';

interface ThreeDViewerProps {
  isLoading: boolean;
  showResult: boolean;
  maxItems: number;
}

interface PlacedItem {
  position: [number, number, number];
  dimensions: [number, number, number];
  rotation: [number, number, number];
  rotated: boolean;
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
      <meshStandardMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
};

const WireframeBox = ({ position, args }: { position: [number, number, number], args: [number, number, number] }) => {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshBasicMaterial wireframe color="#666" />
    </mesh>
  );
};

const LoadingAnimation = ({ itemCount }: { itemCount: number }) => {
  const [currentItem, setCurrentItem] = useState(0);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);

  useEffect(() => {
    const containerDims: [number, number, number] = [6, 4, 3];
    const itemDims: [number, number, number] = [1.2, 0.6, 0.8];
    const arrangement = getOptimalBinPacking(containerDims, itemDims);
    setPlacedItems(arrangement.slice(0, itemCount));
  }, [itemCount]);

  useEffect(() => {
    if (currentItem >= placedItems.length) return;

    const timer = setTimeout(() => {
      setCurrentItem(prev => Math.min(prev + 1, placedItems.length));
    }, 80);

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
          color={item.rotated ? 
            `hsl(${(index * 30 + 180) % 360}, 90%, 65%)` : 
            `hsl(${(index * 25) % 360}, 75%, 55%)`
          }
        />
      ))}
    </>
  );
};

const StaticResult = ({ itemCount }: { itemCount: number }) => {
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [spaceUtilization, setSpaceUtilization] = useState(0);

  useEffect(() => {
    const containerDims: [number, number, number] = [6, 4, 3];
    const itemDims: [number, number, number] = [1.2, 0.6, 0.8];
    const arrangement = getOptimalBinPacking(containerDims, itemDims);
    const actualItems = arrangement.slice(0, itemCount);
    setPlacedItems(actualItems);
    setSpaceUtilization(calculateSpaceUtilization(containerDims, itemDims, actualItems));
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
          color={item.rotated ? 
            `hsl(${(index * 30 + 180) % 360}, 90%, 65%)` : 
            `hsl(${(index * 25) % 360}, 75%, 55%)`
          }
        />
      ))}
    </>
  );
};

const getMaxOptimizedItems = () => {
  const containerDims: [number, number, number] = [6, 4, 3];
  const itemDims: [number, number, number] = [1.2, 0.6, 0.8];
  const arrangement = getOptimalBinPacking(containerDims, itemDims);
  return arrangement.length;
};

const ThreeDViewer = ({ isLoading, showResult, maxItems }: ThreeDViewerProps) => {
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
  const [spaceUtilization, setSpaceUtilization] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  
  const optimizedMaxItems = getMaxOptimizedItems();
  const actualMaxItems = Math.min(maxItems, optimizedMaxItems);

  useEffect(() => {
    if (showResult && !isLoading) {
      setShowLoadingAnimation(true);
      const timer = setTimeout(() => {
        setShowLoadingAnimation(false);
        // Calculate actual space utilization
        const containerDims: [number, number, number] = [6, 4, 3];
        const itemDims: [number, number, number] = [1.2, 0.6, 0.8];
        const arrangement = getOptimalBinPacking(containerDims, itemDims);
        const actualItems = arrangement.slice(0, actualMaxItems);
        setSpaceUtilization(calculateSpaceUtilization(containerDims, itemDims, actualItems));
      }, actualMaxItems * 80 + 1000);

      return () => clearTimeout(timer);
    }
  }, [showResult, isLoading, actualMaxItems]);

  const handleReset = () => {
    setResetKey(prev => prev + 1);
    setShowLoadingAnimation(false);
    setSpaceUtilization(0);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="h-96 bg-gradient-to-br from-slate-100 to-blue-100 dark:from-slate-900 dark:to-blue-900 rounded-lg overflow-hidden relative">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={40} />
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Optimizing placement...</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Advanced multi-orientation bin packing</p>
              </div>
            </div>
          ) : showResult ? (
            <>
              <Canvas 
                key={resetKey} 
                camera={{ position: [8, 6, 8], fov: 50 }}
                className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-800"
              >
                <ambientLight intensity={0.7} />
                <directionalLight position={[10, 10, 5]} intensity={1.2} />
                <spotLight position={[0, 10, 0]} intensity={0.5} />
                {showLoadingAnimation ? (
                  <LoadingAnimation itemCount={actualMaxItems} />
                ) : (
                  <StaticResult itemCount={actualMaxItems} />
                )}
                <OrbitControls 
                  enableZoom 
                  enablePan 
                  enableRotate 
                  autoRotate={false}
                  maxDistance={15}
                  minDistance={3}
                />
              </Canvas>
              
              <div className="absolute top-4 left-4 space-y-2">
                <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Maximize className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {showLoadingAnimation ? 'Optimizing...' : `${actualMaxItems} Items Packed`}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Space Utilization: <span className="font-semibold text-green-600">{spaceUtilization}%</span>
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Max Capacity: {optimizedMaxItems} items
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    🔄 Bright = Rotated
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    📦 Multi-orientation
                  </Badge>
                </div>
              </div>

              <div className="absolute top-4 right-4">
                <Button 
                  onClick={handleReset}
                  variant="outline" 
                  size="sm"
                  className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset View
                </Button>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-md"></div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">3D visualization will appear here</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Start optimization to see results</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ThreeDViewer;
