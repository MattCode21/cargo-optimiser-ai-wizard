
import { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Text } from '@react-three/drei';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Loader2 } from "lucide-react";

interface ThreeDViewerProps {
  isLoading: boolean;
  showResult: boolean;
  maxItems: number;
}

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

  const resetAnimation = () => {
    setCurrentItem(0);
    setIsPlaying(true);
  };

  const toggleAnimation = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <>
      {/* Container/Carton outline */}
      <Box args={[6, 4, 3]} position={[0, 0, 0]}>
        <meshBasicMaterial wireframe={true} color="#444" />
      </Box>

      {/* Items being loaded */}
      {Array.from({ length: currentItem }).map((_, index) => {
        const x = (index % 3) * 1.8 - 1.8;
        const z = Math.floor(index / 3) * 1.2 - 1.2;
        const y = Math.floor(index / 9) * 1 - 1.5;

        return (
          <Box key={index} args={[1.5, 0.8, 1]} position={[x, y, z]}>
            <meshStandardMaterial color={`hsl(${index * 30}, 70%, 60%)`} />
          </Box>
        );
      })}
    </>
  );
};

const StaticResult = ({ itemCount }: { itemCount: number }) => {
  return (
    <>
      {/* Container outline */}
      <Box args={[6, 4, 3]} position={[0, 0, 0]}>
        <meshBasicMaterial wireframe={true} color="#444" />
      </Box>

      {/* All items loaded */}
      {Array.from({ length: itemCount }).map((_, index) => {
        const x = (index % 3) * 1.8 - 1.8;
        const z = Math.floor(index / 3) * 1.2 - 1.2;
        const y = Math.floor(index / 9) * 1 - 1.5;

        return (
          <Box key={index} args={[1.5, 0.8, 1]} position={[x, y, z]}>
            <meshStandardMaterial color={`hsl(${index * 30}, 70%, 60%)`} />
          </Box>
        );
      })}

      {/* Label */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.5}
        color="#333"
        anchorX="center"
        anchorY="middle"
      >
        Optimized Loading: {itemCount} Items
      </Text>
    </>
  );
};

const ThreeDViewer = ({ isLoading, showResult, maxItems }: ThreeDViewerProps) => {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="animate-spin mx-auto mb-4" size={40} />
                <p className="text-lg font-medium">Calculating optimal arrangement...</p>
                <p className="text-sm text-gray-600">This may take a few moments</p>
              </div>
            </div>
          ) : showResult ? (
            <Canvas camera={{ position: [8, 6, 8], fov: 50 }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <StaticResult itemCount={Math.min(maxItems, 12)} />
              <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
            </Canvas>
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
