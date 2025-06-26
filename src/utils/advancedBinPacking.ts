
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
  
  // Calculate theoretical maximum first to limit our attempts
  const theoreticalMax = Math.floor((containerX * containerY * containerZ) / (itemX * itemY * itemZ));
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
    // Add small tolerance to prevent floating point errors
    return w <= (space.width + 0.001) && h <= (space.height + 0.001) && d <= (space.depth + 0.001);
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
        
        // Prioritize tight fits and corner positions
        const volumeEfficiency = (w * h * d) / (space.width * space.height * space.depth);
        const tightnessFactor = (w / space.width) + (h / space.height) + (d / space.depth);
        const cornerPreference = 1 / (1 + space.x + space.y + space.z);
        
        const totalScore = volumeEfficiency * 0.5 + tightnessFactor * 0.3 + cornerPreference * 0.2;
        
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
    if (space.x + item.w < space.x + space.width) {
      const rightSpace = {
        x: space.x + item.w,
        y: space.y,
        z: space.z,
        width: space.width - item.w,
        height: space.height,
        depth: space.depth
      };
      if (rightSpace.width > 0 && rightSpace.height > 0 && rightSpace.depth > 0) {
        newSpaces.push(rightSpace);
      }
    }
    
    // Top space (along Y-axis)
    if (space.y + item.h < space.y + space.height) {
      const topSpace = {
        x: space.x,
        y: space.y + item.h,
        z: space.z,
        width: item.w,
        height: space.height - item.h,
        depth: space.depth
      };
      if (topSpace.width > 0 && topSpace.height > 0 && topSpace.depth > 0) {
        newSpaces.push(topSpace);
      }
    }
    
    // Front space (along Z-axis)
    if (space.z + item.d < space.z + space.depth) {
      const frontSpace = {
        x: space.x,
        y: space.y,
        z: space.z + item.d,
        width: item.w,
        height: item.h,
        depth: space.depth - item.d
      };
      if (frontSpace.width > 0 && frontSpace.height > 0 && frontSpace.depth > 0) {
        newSpaces.push(frontSpace);
      }
    }

    return newSpaces;
  };

  const cleanupSpaces = (spaces: Space[]): Space[] => {
    return spaces.filter((space, index) => {
      // Check if this space is valid (positive dimensions with minimum threshold)
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
  const maxIterations = theoreticalMax * 10; // Reasonable limit based on theoretical max

  while (emptySpaces.length > 0 && iterations < maxIterations && placedItems.length < theoreticalMax) {
    iterations++;
    
    // Sort spaces by priority: bottom-left-front first
    emptySpaces.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      if (a.x !== b.x) return a.x - b.x;
      return a.z - b.z;
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

    // Place the item - center it within the space for visualization
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

    // Clean up spaces periodically to maintain performance
    if (iterations % 50 === 0) {
      const cleanedSpaces = cleanupSpaces(emptySpaces);
      emptySpaces.length = 0;
      emptySpaces.push(...cleanedSpaces);
    }
  }

  console.log(`Final packing: ${placedItems.length} items placed in ${iterations} iterations`);
  console.log(`Theoretical max was: ${theoreticalMax}, achieved: ${placedItems.length}`);
  
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
  
  const utilization = (totalItemsVolume / containerVolume) * 100;
  console.log(`Space utilization calculation:
    Container volume: ${containerVolume}
    Item volume: ${itemVolume} 
    Items placed: ${placedItems.length}
    Total items volume: ${totalItemsVolume}
    Utilization: ${utilization.toFixed(2)}%`);
  
  return Math.round(utilization * 100) / 100; // Round to 2 decimal places
};
