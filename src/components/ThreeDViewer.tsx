import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RotateCcw, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import * as THREE from 'three';

interface ThreeDViewerProps {
  isLoading: boolean;
  showResult: boolean;
  maxItems: number;
  containerDims: [number, number, number];
  itemDims: [number, number, number];
  containerUnit: string;
  itemUnit: string;
  packingData?: Array<{
    position: [number, number, number];
    rotation: [number, number, number];
  }>;
}

interface PlacedItem {
  position: [number, number, number];
  dimensions: [number, number, number];
  rotation: [number, number, number];
  rotated: boolean;
}

// Convert units to a standard unit (cm)
const convertToStandardUnit = (value: number, fromUnit: string): number => {
  const conversions: { [key: string]: number } = {
    'mm': 0.1,
    'cm': 1,
    'in': 2.54,
    'ft': 30.48,
    'm': 100
  };
  return value * (conversions[fromUnit] || 1);
};

const PackedBox = ({ 
  position, 
  dimensions, 
  rotation, 
  color, 
  opacity = 0.8,
  index 
}: { 
  position: [number, number, number];
  dimensions: [number, number, number];
  rotation: [number, number, number];
  color: string;
  opacity?: number;
  index: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current && hovered) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={dimensions} />
        <meshPhongMaterial 
          color={color} 
          transparent 
          opacity={hovered ? 0.9 : opacity}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Wireframe outline */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={dimensions} />
        <meshBasicMaterial wireframe color="#333" opacity={0.3} transparent />
      </mesh>
      {/* Item number label */}
      {hovered && (
        <Text
          position={[0, dimensions[1]/2 + 0.5, 0]}
          fontSize={0.5}
          color="#333"
          anchorX="center"
          anchorY="middle"
        >
          Item {index + 1}
        </Text>
      )}
    </group>
  );
};

const ContainerWireframe = ({ 
  dimensions, 
  containerType = "container" 
}: { 
  dimensions: [number, number, number];
  containerType?: string;
}) => {
  const [width, height, depth] = dimensions;
  
  // Container color based on type
  const getContainerColor = () => {
    switch (containerType.toLowerCase()) {
      case 'pallet': return '#8B4513'; // Brown for wooden pallet
      case 'container': return '#4A5568'; // Gray for shipping container
      default: return '#666'; // Default gray
    }
  };

  return (
    <group>
      {/* Container wireframe */}
      <mesh position={[width/2, height/2, depth/2]}>
        <boxGeometry args={[width, height, depth]} />
        <meshBasicMaterial 
          wireframe 
          color={getContainerColor()}
        />
      </mesh>
      
      {/* Container base (solid) */}
      <mesh position={[width/2, 0.05, depth/2]}>
        <boxGeometry args={[width, 0.1, depth]} />
        <meshPhongMaterial 
          color={getContainerColor()} 
          transparent 
          opacity={0.3}
        />
      </mesh>

      {/* Corner markers */}
      {[
        [0, 0, 0], [width, 0, 0], [0, 0, depth], [width, 0, depth],
        [0, height, 0], [width, height, 0], [0, height, depth], [width, height, depth]
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.1]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
      ))}
    </group>
  );
};

const AnimatedPacking = ({ 
  items, 
  containerDims, 
  itemDims,
  containerType = "container"
}: { 
  items: Array<{ position: [number, number, number]; rotation: [number, number, number] }>;
  containerDims: [number, number, number];
  itemDims: [number, number, number];
  containerType?: string;
}) => {
  const [visibleItems, setVisibleItems] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (items.length === 0) return;
    
    setVisibleItems(0);
    setIsAnimating(true);
    
    const interval = setInterval(() => {
      setVisibleItems(prev => {
        if (prev >= items.length - 1) {
          setIsAnimating(false);
          clearInterval(interval);
          return items.length;
        }
        return prev + 1;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [items.length]);

  const visibleItemsToShow = items.slice(0, visibleItems + 1);

  return (
    <>
      <ContainerWireframe dimensions={containerDims} containerType={containerType} />
      {visibleItemsToShow.map((item, index) => {
        // Apply item rotation to dimensions
        const rotatedDims: [number, number, number] = [
          itemDims[0], itemDims[1], itemDims[2]
        ];
        
        // Adjust position to center the item properly
        const adjustedPosition: [number, number, number] = [
          item.position[0] + rotatedDims[0]/2,
          item.position[1] + rotatedDims[1]/2,
          item.position[2] + rotatedDims[2]/2
        ];

        return (
          <PackedBox
            key={index}
            position={adjustedPosition}
            dimensions={rotatedDims}
            rotation={item.rotation}
            color={`hsl(${(index * 137) % 360}, 70%, 60%)`}
            opacity={0.85}
            index={index}
          />
        );
      })}
      
      {/* Loading indicator for next item */}
      {isAnimating && visibleItems < items.length - 1 && (
        <group position={[
          items[visibleItems + 1]?.position[0] + itemDims[0]/2 || 0,
          items[visibleItems + 1]?.position[1] + itemDims[1]/2 + 1 || 1,
          items[visibleItems + 1]?.position[2] + itemDims[2]/2 || 0
        ]}>
          <Text
            fontSize={0.5}
            color="#ff6600"
            anchorX="center"
            anchorY="middle"
          >
            Placing...
          </Text>
        </group>
      )}
    </>
  );
};

const ThreeDViewer = ({ 
  isLoading, 
  showResult, 
  maxItems, 
  containerDims, 
  itemDims, 
  containerUnit, 
  itemUnit,
  packingData = []
}: ThreeDViewerProps) => {
  const [resetKey, setResetKey] = useState(0);
  
  // Convert dimensions to standard unit (cm)
  const convertedContainerDims: [number, number, number] = [
    convertToStandardUnit(containerDims[0], containerUnit),
    convertToStandardUnit(containerDims[1], containerUnit),
    convertToStandardUnit(containerDims[2], containerUnit)
  ];
  
  const convertedItemDims: [number, number, number] = [
    convertToStandardUnit(itemDims[0], itemUnit),
    convertToStandardUnit(itemDims[1], itemUnit),
    convertToStandardUnit(itemDims[2], itemUnit)
  ];

  // Calculate space utilization
  const spaceUtilization = useMemo(() => {
    if (!containerDims || !itemDims || !maxItems) return 0;
    
    const containerVolume = convertedContainerDims[0] * convertedContainerDims[1] * convertedContainerDims[2];
    const itemVolume = convertedItemDims[0] * convertedItemDims[1] * convertedItemDims[2];
    const totalItemsVolume = maxItems * itemVolume;
    return Math.round((totalItemsVolume / containerVolume) * 100);
  }, [convertedContainerDims, convertedItemDims, maxItems]);

  // Generate fallback packing data if none provided
  const fallbackPackingData = useMemo(() => {
    if (packingData.length > 0) return packingData;
    
    const data = [];
    const [cw, ch, cd] = convertedContainerDims;
    const [iw, ih, id] = convertedItemDims;
    
    // Simple grid packing as fallback
    const nx = Math.floor(cw / iw);
    const ny = Math.floor(ch / ih);
    const nz = Math.floor(cd / id);
    
    let count = 0;
    for (let x = 0; x < nx && count < maxItems; x++) {
      for (let y = 0; y < ny && count < maxItems; y++) {
        for (let z = 0; z < nz && count < maxItems; z++) {
          data.push({
            position: [x * iw, y * ih, z * id] as [number, number, number],
            rotation: [0, 0, 0] as [number, number, number]
          });
          count++;
        }
      }
    }
    
    return data.slice(0, maxItems);
  }, [packingData, convertedContainerDims, convertedItemDims, maxItems]);

  const handleReset = () => {
    setResetKey(prev => prev + 1);
  };

  // Determine container type for better visualization
  const containerType = useMemo(() => {
    const volume = convertedContainerDims[0] * convertedContainerDims[1] * convertedContainerDims[2];
    if (volume > 10000000) return "container"; // Large volume = shipping container
    if (convertedContainerDims[1] < 50) return "pallet"; // Low height = pallet
    return "box"; // Default
  }, [convertedContainerDims]);

  // Calculate camera position based on container size
  const cameraPosition = useMemo(() => {
    const maxDim = Math.max(...convertedContainerDims);
    const distance = maxDim * 0.3;
    return [distance, distance * 0.8, distance];
  }, [convertedContainerDims]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="h-96 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 rounded-lg overflow-hidden relative">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={40} />
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Optimizing placement...</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Calculating best fit positions</p>
              </div>
            </div>
          ) : showResult && maxItems > 0 ? (
            <>
              <Canvas 
                key={resetKey} 
                camera={{ 
                  position: cameraPosition as [number, number, number], 
                  fov: 50 
                }}
                className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-800"
              >
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
                <pointLight position={[-10, -10, -5]} intensity={0.3} />
                
                <AnimatedPacking 
                  items={fallbackPackingData}
                  containerDims={convertedContainerDims}
                  itemDims={convertedItemDims}
                  containerType={containerType}
                />
                
                <OrbitControls 
                  enableZoom 
                  enablePan 
                  enableRotate 
                  autoRotate={false}
                  maxDistance={Math.max(...convertedContainerDims) * 2}
                  minDistance={Math.max(...convertedContainerDims) * 0.1}
                />
              </Canvas>
              
              <div className="absolute top-4 left-4 space-y-2">
                <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Maximize className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {maxItems} Items Packed
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Space Utilization: <span className="font-semibold text-green-600">{spaceUtilization}%</span>
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Container: {convertedContainerDims[0]}×{convertedContainerDims[1]}×{convertedContainerDims[2]} cm
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Item Size: {convertedItemDims[0]}×{convertedItemDims[1]}×{convertedItemDims[2]} cm
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    🎯 Optimized Layout
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    📦 3D Packing
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {containerType === "container" ? "🚢" : containerType === "pallet" ? "🏗️" : "📦"} {containerType}
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
                  Replay
                </Button>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-md"></div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">3D Packing Visualization</p>
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