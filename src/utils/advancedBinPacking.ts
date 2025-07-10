
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

interface Orientation {
  dims: [number, number, number];
  rotation: [number, number, number];
  rotated: boolean;
}

// Unit conversion utility
const convertToStandardUnit = (value: number, fromUnit: string): number => {
  const conversions: { [key: string]: number } = {
    'mm': 0.1,   // Convert to cm
    'cm': 1,     // Base unit
    'in': 2.54,  // Convert to cm
    'ft': 30.48, // Convert to cm
    'm': 100     // Convert to cm
  };
  return value * (conversions[fromUnit] || 1);
};

export const getOptimalBinPacking = (
  containerDims: [number, number, number], 
  itemDims: [number, number, number],
  containerUnit: string = 'cm',
  itemUnit: string = 'cm'
): PlacedItem[] => {
  // Use the extreme point algorithm for better packing
  return extremePointPacking(containerDims, itemDims, containerUnit, itemUnit);
};

const getOptimalBinPackingFromExtreme = (
  containerDims: [number, number, number], 
  itemDims: [number, number, number],
  containerUnit: string = 'cm',
  itemUnit: string = 'cm'
): PlacedItem[] => {
  // Convert all dimensions to centimeters (standard unit)
  const [containerX, containerY, containerZ] = containerDims.map(dim => 
    convertToStandardUnit(dim, containerUnit)
  ) as [number, number, number];
  
  const [itemX, itemY, itemZ] = itemDims.map(dim => 
    convertToStandardUnit(dim, itemUnit)
  ) as [number, number, number];
  
  console.log(`Container dimensions (cm): ${containerX} x ${containerY} x ${containerZ}`);
  console.log(`Item dimensions (cm): ${itemX} x ${itemY} x ${itemZ}`);
  
  // Calculate theoretical maximum first to limit our attempts
  const containerVolume = containerX * containerY * containerZ;
  const itemVolume = itemX * itemY * itemZ;
  const theoreticalMax = Math.floor(containerVolume / itemVolume);
  console.log(`Container volume: ${containerVolume} cm³`);
  console.log(`Item volume: ${itemVolume} cm³`);
  console.log(`Theoretical maximum items: ${theoreticalMax}`);
  
  const placedItems: PlacedItem[] = [];
  const emptySpaces: Space[] = [
    { x: 0, y: 0, z: 0, width: containerX, height: containerY, depth: containerZ }
  ];

  // All possible orientations with precise rotations
  const orientations: Orientation[] = [
    { dims: [itemX, itemY, itemZ], rotation: [0, 0, 0], rotated: false },
    { dims: [itemY, itemX, itemZ], rotation: [0, 0, Math.PI/2], rotated: true },
    { dims: [itemZ, itemY, itemX], rotation: [Math.PI/2, 0, 0], rotated: true },
    { dims: [itemX, itemZ, itemY], rotation: [0, Math.PI/2, 0], rotated: true },
    { dims: [itemY, itemZ, itemX], rotation: [Math.PI/2, 0, Math.PI/2], rotated: true },
    { dims: [itemZ, itemX, itemY], rotation: [0, Math.PI/2, Math.PI/2], rotated: true },
  ];

  const canFit = (space: Space, dims: [number, number, number]): boolean => {
    const [w, h, d] = dims;
    return w <= space.width && h <= space.height && d <= space.depth;
  };

  const isValidPosition = (item: { x: number, y: number, z: number, w: number, h: number, d: number }): boolean => {
    // Ensure item doesn't exceed container boundaries
    return item.x >= 0 && item.y >= 0 && item.z >= 0 &&
           (item.x + item.w) <= containerX &&
           (item.y + item.h) <= containerY &&
           (item.z + item.d) <= containerZ;
  };

  const findBestFitInSpace = (space: Space): { orientation: Orientation; score: number } | null => {
    let bestFit = null;
    let bestScore = -1;

    for (const orientation of orientations) {
      if (canFit(space, orientation.dims)) {
        const [w, h, d] = orientation.dims;
        
        // Calculate fit efficiency
        const volumeFit = (w * h * d) / (space.width * space.height * space.depth);
        const tightnessFactor = Math.min(w / space.width, h / space.height, d / space.depth);
        const leftoverPenalty = 1 - ((space.width - w) + (space.height - h) + (space.depth - d)) / (space.width + space.height + space.depth);
        
        const totalScore = volumeFit * 0.4 + tightnessFactor * 0.4 + leftoverPenalty * 0.2;
        
        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestFit = { orientation, score: totalScore };
        }
      }
    }

    return bestFit;
  };

  const splitSpace = (space: Space, item: { x: number, y: number, z: number, w: number, h: number, d: number }): Space[] => {
    const newSpaces: Space[] = [];
    
    // Right space (along X-axis)
    if (item.x + item.w < space.x + space.width) {
      newSpaces.push({
        x: item.x + item.w,
        y: space.y,
        z: space.z,
        width: (space.x + space.width) - (item.x + item.w),
        height: space.height,
        depth: space.depth
      });
    }
    
    // Top space (along Y-axis)
    if (item.y + item.h < space.y + space.height) {
      newSpaces.push({
        x: space.x,
        y: item.y + item.h,
        z: space.z,
        width: item.w,
        height: (space.y + space.height) - (item.y + item.h),
        depth: space.depth
      });
    }
    
    // Front space (along Z-axis)
    if (item.z + item.d < space.z + space.depth) {
      newSpaces.push({
        x: space.x,
        y: space.y,
        z: item.z + item.d,
        width: item.w,
        height: item.h,
        depth: (space.z + space.depth) - (item.z + item.d)
      });
    }

    return newSpaces.filter(s => s.width > 0.01 && s.height > 0.01 && s.depth > 0.01);
  };

  const cleanupSpaces = (spaces: Space[]): Space[] => {
    return spaces.filter((space, index) => {
      // Check if this space is valid
      if (space.width < 0.01 || space.height < 0.01 || space.depth < 0.01) return false;
      
      // Check if space can fit at least one item in any orientation
      const canFitAnyOrientation = orientations.some(orientation => 
        canFit(space, orientation.dims)
      );
      if (!canFitAnyOrientation) return false;

      // Check if this space is completely contained within another space
      for (let i = 0; i < spaces.length; i++) {
        if (i === index) continue;
        const other = spaces[i];
        
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
  const maxIterations = theoreticalMax * 5;

  while (emptySpaces.length > 0 && iterations < maxIterations && placedItems.length < theoreticalMax) {
    iterations++;
    
    // Sort spaces by priority: bottom-left-front first, then by volume
    emptySpaces.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 0.01) return a.y - b.y;
      if (Math.abs(a.x - b.x) > 0.01) return a.x - b.x;
      if (Math.abs(a.z - b.z) > 0.01) return a.z - b.z;
      return (b.width * b.height * b.depth) - (a.width * a.height * a.depth);
    });

    let bestPlacement = null;
    let bestSpaceIndex = -1;

    // Find the best placement across all spaces
    for (let i = 0; i < emptySpaces.length; i++) {
      const fit = findBestFitInSpace(emptySpaces[i]);
      if (fit && (!bestPlacement || fit.score > bestPlacement.score)) {
        bestPlacement = { ...fit, spaceIndex: i };
        bestSpaceIndex = i;
      }
    }

    if (!bestPlacement || bestSpaceIndex === -1) break;

    const space = emptySpaces[bestSpaceIndex];
    const orientation = bestPlacement.orientation;
    const [w, h, d] = orientation.dims;

    // Validate the item position
    const itemPlacement = { 
      x: space.x, y: space.y, z: space.z, w, h, d 
    };
    
    if (!isValidPosition(itemPlacement)) {
      emptySpaces.splice(bestSpaceIndex, 1);
      continue;
    }

    // Place the item - center it within the container coordinate system
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

    // Create new spaces from the split
    const newSpaces = splitSpace(space, itemPlacement);
    emptySpaces.push(...newSpaces);

    // Clean up spaces periodically
    if (iterations % 20 === 0) {
      const cleanedSpaces = cleanupSpaces(emptySpaces);
      emptySpaces.length = 0;
      emptySpaces.push(...cleanedSpaces);
    }
  }

  console.log(`Final packing: ${placedItems.length} items placed in ${iterations} iterations`);
  console.log(`Theoretical max: ${theoreticalMax}, achieved: ${placedItems.length}`);
  
  return placedItems;
};

// Use extreme point algorithm from separate file
import { getOptimalBinPacking as extremePointPacking } from './extremePointBinPacking';

export const calculateSpaceUtilization = (
  containerDims: [number, number, number],
  itemDims: [number, number, number],
  placedItems: PlacedItem[],
  containerUnit: string = 'cm',
  itemUnit: string = 'cm'
): number => {
  // Convert dimensions to same unit
  const containerVolume = containerDims
    .map(dim => convertToStandardUnit(dim, containerUnit))
    .reduce((a, b) => a * b, 1);
  
  const itemVolume = itemDims
    .map(dim => convertToStandardUnit(dim, itemUnit))
    .reduce((a, b) => a * b, 1);
  
  const totalItemsVolume = placedItems.length * itemVolume;
  const utilization = (totalItemsVolume / containerVolume) * 100;
  
  console.log(`Space utilization calculation:
    Container volume: ${containerVolume.toFixed(2)} cm³
    Item volume: ${itemVolume.toFixed(2)} cm³ 
    Items placed: ${placedItems.length}
    Total items volume: ${totalItemsVolume.toFixed(2)} cm³
    Utilization: ${utilization.toFixed(2)}%`);
  
  return Math.round(utilization * 100) / 100;
};
