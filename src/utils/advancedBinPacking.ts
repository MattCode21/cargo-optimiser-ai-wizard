
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

export const getOptimalBinPacking = (
  containerDims: [number, number, number], 
  itemDims: [number, number, number]
): PlacedItem[] => {
  const [containerX, containerY, containerZ] = containerDims;
  const [itemX, itemY, itemZ] = itemDims;
  
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

  const findBestFitInSpace = (space: Space): { orientation: Orientation; score: number } | null => {
    let bestFit = null;
    let bestScore = -1;

    for (const orientation of orientations) {
      if (canFit(space, orientation.dims)) {
        const [w, h, d] = orientation.dims;
        
        // Multi-criteria scoring for optimal placement
        const volumeEfficiency = (w * h * d) / (space.width * space.height * space.depth);
        const wasteMinimization = 1 - ((space.width - w) + (space.height - h) + (space.depth - d)) / 
                                     (space.width + space.height + space.depth);
        const cornerPreference = 1 / (1 + space.x + space.y + space.z);
        const dimensionMatch = (w === space.width ? 0.3 : 0) + 
                              (h === space.height ? 0.3 : 0) + 
                              (d === space.depth ? 0.3 : 0);
        
        const totalScore = volumeEfficiency * 0.4 + wasteMinimization * 0.3 + 
                          cornerPreference * 0.2 + dimensionMatch * 0.1;
        
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
    
    // Generate all possible splits to maximize space utilization
    
    // Right space (along X-axis)
    if (space.x + item.w < space.x + space.width) {
      newSpaces.push({
        x: space.x + item.w,
        y: space.y,
        z: space.z,
        width: space.width - item.w,
        height: space.height,
        depth: space.depth
      });
    }
    
    // Top space (along Y-axis)
    if (space.y + item.h < space.y + space.height) {
      newSpaces.push({
        x: space.x,
        y: space.y + item.h,
        z: space.z,
        width: item.w,
        height: space.height - item.h,
        depth: space.depth
      });
    }
    
    // Front space (along Z-axis)
    if (space.z + item.d < space.z + space.depth) {
      newSpaces.push({
        x: space.x,
        y: space.y,
        z: space.z + item.d,
        width: item.w,
        height: item.h,
        depth: space.depth - item.d
      });
    }

    // Additional splits for better space utilization
    
    // Corner spaces
    if (space.x + item.w < space.x + space.width && space.y + item.h < space.y + space.height) {
      newSpaces.push({
        x: space.x + item.w,
        y: space.y + item.h,
        z: space.z,
        width: space.width - item.w,
        height: space.height - item.h,
        depth: item.d
      });
    }

    if (space.x + item.w < space.x + space.width && space.z + item.d < space.z + space.depth) {
      newSpaces.push({
        x: space.x + item.w,
        y: space.y,
        z: space.z + item.d,
        width: space.width - item.w,
        height: item.h,
        depth: space.depth - item.d
      });
    }

    if (space.y + item.h < space.y + space.height && space.z + item.d < space.z + space.depth) {
      newSpaces.push({
        x: space.x,
        y: space.y + item.h,
        z: space.z + item.d,
        width: item.w,
        height: space.height - item.h,
        depth: space.depth - item.d
      });
    }

    return newSpaces;
  };

  const cleanupSpaces = (spaces: Space[]): Space[] => {
    // Remove duplicate and contained spaces
    return spaces.filter((space, index) => {
      // Check if this space is valid (positive dimensions)
      if (space.width <= 0 || space.height <= 0 || space.depth <= 0) return false;
      
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
  const maxIterations = 2000; // Increased for better optimization

  while (emptySpaces.length > 0 && iterations < maxIterations) {
    iterations++;
    
    // Sort spaces by priority: bottom-left-front first, then by volume
    emptySpaces.sort((a, b) => {
      const priorityA = a.y * 1000000 + a.x * 1000 + a.z;
      const priorityB = b.y * 1000000 + b.x * 1000 + b.z;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return (b.width * b.height * b.depth) - (a.width * a.height * a.depth);
    });

    let bestPlacement = null;
    let bestSpaceIndex = -1;

    // Find the absolute best placement across all spaces
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

    // Create new spaces from the split
    const newSpaces = splitSpace(space, { 
      x: space.x, y: space.y, z: space.z, w, h, d 
    });
    
    emptySpaces.push(...newSpaces);

    // Clean up spaces every few iterations to maintain performance
    if (iterations % 10 === 0) {
      const cleanedSpaces = cleanupSpaces(emptySpaces);
      emptySpaces.length = 0;
      emptySpaces.push(...cleanedSpaces);
    }
  }

  // Final cleanup
  console.log(`Advanced packing: ${placedItems.length} items placed in ${iterations} iterations`);
  return placedItems;
};

export const calculateSpaceUtilization = (
  containerDims: [number, number, number],
  itemDims: [number, number, number],
  placedItems: PlacedItem[]
): number => {
  const containerVolume = containerDims[0] * containerDims[1] * containerDims[2];
  const itemVolume = itemDims[0] * itemDims[1] * itemDims[2];
  const totalItemsVolume = placedItems.length * itemVolume;
  
  return Math.round((totalItemsVolume / containerVolume) * 100);
};
