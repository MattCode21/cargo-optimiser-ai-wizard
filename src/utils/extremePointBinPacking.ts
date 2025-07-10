interface PlacedItem {
  position: [number, number, number];
  dimensions: [number, number, number];
  rotation: [number, number, number];
  rotated: boolean;
}

interface Item {
  width: number;
  height: number;
  depth: number;
  id: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

interface Container {
  width: number;
  height: number;
  depth: number;
  items: Item[];
  volumeUsed: number;
  extremePoints: Array<[number, number, number]>;
  space: boolean[][][];
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

const createContainer = (width: number, height: number, depth: number): Container => {
  const w = Math.ceil(width);
  const h = Math.ceil(height);
  const d = Math.ceil(depth);
  
  // Initialize 3D space array
  const space: boolean[][][] = [];
  for (let x = 0; x <= w; x++) {
    space[x] = [];
    for (let y = 0; y <= d; y++) {
      space[x][y] = [];
      for (let z = 0; z <= h; z++) {
        space[x][y][z] = false;
      }
    }
  }

  return {
    width,
    height,
    depth,
    items: [],
    volumeUsed: 0,
    extremePoints: [[0, 0, 0]],
    space
  };
};

const addItemToContainer = (
  container: Container,
  item: Item,
  position: [number, number, number],
  rotation: [number, number, number]
): void => {
  const [x, y, z] = position;
  const [w, d, h] = rotation;

  item.position = position;
  item.rotation = rotation;
  container.items.push(item);
  container.volumeUsed += item.width * item.height * item.depth;

  // Mark space as occupied
  const xEnd = Math.min(Math.floor(x + w), Math.floor(container.width));
  const yEnd = Math.min(Math.floor(y + d), Math.floor(container.depth));
  const zEnd = Math.min(Math.floor(z + h), Math.floor(container.height));

  for (let px = Math.floor(x); px < xEnd; px++) {
    for (let py = Math.floor(y); py < yEnd; py++) {
      for (let pz = Math.floor(z); pz < zEnd; pz++) {
        if (px >= 0 && py >= 0 && pz >= 0 && 
            px < container.space.length && 
            py < container.space[0].length && 
            pz < container.space[0][0].length) {
          container.space[px][py][pz] = true;
        }
      }
    }
  }

  // Add new extreme points
  const newPoints: Array<[number, number, number]> = [
    [x + w, y, z],
    [x, y + d, z],
    [x, y, z + h]
  ];

  for (const point of newPoints) {
    if (isValidPoint(container, point) && 
        !container.extremePoints.some(ep => 
          Math.abs(ep[0] - point[0]) < 0.01 && 
          Math.abs(ep[1] - point[1]) < 0.01 && 
          Math.abs(ep[2] - point[2]) < 0.01)) {
      container.extremePoints.push(point);
    }
  }

  // Remove the used extreme point
  container.extremePoints = container.extremePoints.filter(ep => 
    !(Math.abs(ep[0] - position[0]) < 0.01 && 
      Math.abs(ep[1] - position[1]) < 0.01 && 
      Math.abs(ep[2] - position[2]) < 0.01)
  );
};

const isValidPoint = (container: Container, point: [number, number, number]): boolean => {
  const [x, y, z] = point;
  return x >= 0 && x <= container.width && 
         y >= 0 && y <= container.depth && 
         z >= 0 && z <= container.height;
};

const canPlace = (
  container: Container,
  position: [number, number, number],
  rotation: [number, number, number]
): boolean => {
  const [x, y, z] = position;
  const [w, d, h] = rotation;

  // Check boundaries
  if (x + w > container.width || 
      y + d > container.depth || 
      z + h > container.height) {
    return false;
  }

  // Check if space is already occupied
  const xEnd = Math.min(Math.floor(x + w), Math.floor(container.width));
  const yEnd = Math.min(Math.floor(y + d), Math.floor(container.depth));
  const zEnd = Math.min(Math.floor(z + h), Math.floor(container.height));

  // Check key points
  const pointsToCheck: Array<[number, number, number]> = [
    [Math.floor(x), Math.floor(y), Math.floor(z)], // Origin
    [xEnd - 1, Math.floor(y), Math.floor(z)], // Right bottom near
    [Math.floor(x), yEnd - 1, Math.floor(z)], // Left bottom far
    [xEnd - 1, yEnd - 1, Math.floor(z)], // Right bottom far
    [Math.floor(x), Math.floor(y), zEnd - 1], // Left top near
    [xEnd - 1, Math.floor(y), zEnd - 1], // Right top near
    [Math.floor(x), yEnd - 1, zEnd - 1], // Left top far
    [xEnd - 1, yEnd - 1, zEnd - 1], // Right top far
    [Math.floor(x + w/2), Math.floor(y + d/2), Math.floor(z + h/2)] // Center
  ];

  for (const [px, py, pz] of pointsToCheck) {
    if (px < 0 || py < 0 || pz < 0 || 
        px >= container.space.length || 
        py >= container.space[0].length || 
        pz >= container.space[0][0].length) {
      continue;
    }
    if (container.space[px][py][pz]) {
      return false;
    }
  }

  // Additional sampling for larger items
  if (w > 10 || d > 10 || h > 10) {
    const xSteps = Math.max(1, Math.floor(w / 5));
    const ySteps = Math.max(1, Math.floor(d / 5));
    const zSteps = Math.max(1, Math.floor(h / 5));

    for (let dx = 0; dx < w; dx += xSteps) {
      for (let dy = 0; dy < d; dy += ySteps) {
        for (let dz = 0; dz < h; dz += zSteps) {
          const px = Math.floor(x + dx);
          const py = Math.floor(y + dy);
          const pz = Math.floor(z + dz);
          
          if (px < 0 || py < 0 || pz < 0 || 
              px >= container.space.length || 
              py >= container.space[0].length || 
              pz >= container.space[0][0].length) {
            continue;
          }
          if (container.space[px][py][pz]) {
            return false;
          }
        }
      }
    }
  }

  return true;
};

const getAllOrientations = (dims: [number, number, number]): Array<[number, number, number]> => {
  const [w, h, d] = dims;
  const orientations = new Set<string>();
  const results: Array<[number, number, number]> = [];
  
  // Generate all possible permutations
  const permutations: Array<[number, number, number]> = [
    [w, h, d], [w, d, h], [h, w, d], [h, d, w], [d, w, h], [d, h, w]
  ];
  
  for (const perm of permutations) {
    const key = perm.join(',');
    if (!orientations.has(key)) {
      orientations.add(key);
      results.push(perm);
    }
  }
  
  return results;
};

export const getOptimalBinPacking = (
  containerDims: [number, number, number], 
  itemDims: [number, number, number],
  containerUnit: string = 'cm',
  itemUnit: string = 'cm'
): PlacedItem[] => {
  // Convert all dimensions to centimeters
  const [containerX, containerY, containerZ] = containerDims.map(dim => 
    convertToStandardUnit(dim, containerUnit)
  ) as [number, number, number];
  
  const [itemX, itemY, itemZ] = itemDims.map(dim => 
    convertToStandardUnit(dim, itemUnit)
  ) as [number, number, number];
  
  console.log(`Container dimensions (cm): ${containerX} x ${containerY} x ${containerZ}`);
  console.log(`Item dimensions (cm): ${itemX} x ${itemY} x ${itemZ}`);
  
  // Calculate theoretical maximum
  const containerVolume = containerX * containerY * containerZ;
  const itemVolume = itemX * itemY * itemZ;
  const theoreticalMax = Math.floor(containerVolume / itemVolume);
  console.log(`Theoretical maximum items: ${theoreticalMax}`);
  
  // Create container (swap Y and Z for proper 3D representation)
  const container = createContainer(containerX, containerZ, containerY);
  const orientations = getAllOrientations([itemX, itemY, itemZ]);
  
  const placedItems: PlacedItem[] = [];
  
  // Create items to place
  const items: Item[] = [];
  for (let i = 0; i < theoreticalMax; i++) {
    items.push({
      width: itemX,
      height: itemY,
      depth: itemZ,
      id: i
    });
  }
  
  // Pack items using extreme point algorithm
  for (const item of items) {
    let bestFitness = Infinity;
    let bestPosition: [number, number, number] | null = null;
    let bestOrientation: [number, number, number] | null = null;
    
    // Sort extreme points by bottom-left-front preference
    container.extremePoints.sort((a, b) => {
      if (Math.abs(a[2] - b[2]) > 0.01) return a[2] - b[2]; // Z (height) first
      if (Math.abs(a[0] - b[0]) > 0.01) return a[0] - b[0]; // X second
      return a[1] - b[1]; // Y third
    });
    
    for (const point of container.extremePoints) {
      for (const orientation of orientations) {
        if (canPlace(container, point, orientation)) {
          // Fitness based on position (prefer bottom-left-front)
          const fitness = point[0] * point[0] + point[1] * point[1] + point[2] * point[2];
          
          if (fitness < bestFitness) {
            bestFitness = fitness;
            bestPosition = point;
            bestOrientation = orientation;
          }
        }
      }
    }
    
    if (bestPosition && bestOrientation) {
      addItemToContainer(container, item, bestPosition, bestOrientation);
      
      // Convert back to visualization format (swap Y and Z back)
      const [x, y, z] = bestPosition;
      const [w, h, d] = bestOrientation;
      
      placedItems.push({
        position: [
          x + w/2 - containerX/2,
          z + d/2 - containerZ/2, // Z becomes Y
          y + h/2 - containerY/2  // Y becomes Z
        ],
        dimensions: [w, d, h], // Swap dimensions back
        rotation: [0, 0, 0], // Simplified rotation for now
        rotated: !(w === itemX && h === itemY && d === itemZ)
      });
    } else {
      break; // No more space
    }
  }
  
  console.log(`Extreme point packing: ${placedItems.length} items placed`);
  return placedItems;
};

export const calculateSpaceUtilization = (
  containerDims: [number, number, number],
  itemDims: [number, number, number],
  placedItems: PlacedItem[],
  containerUnit: string = 'cm',
  itemUnit: string = 'cm'
): number => {
  // Convert dimensions to same unit (cm)
  const containerVolume = containerDims
    .map(dim => convertToStandardUnit(dim, containerUnit))
    .reduce((a, b) => a * b, 1);
  
  const itemVolume = itemDims
    .map(dim => convertToStandardUnit(dim, itemUnit))
    .reduce((a, b) => a * b, 1);
  
  const totalItemsVolume = placedItems.length * itemVolume;
  const utilization = (totalItemsVolume / containerVolume) * 100;
  
  console.log(`Space utilization: ${utilization.toFixed(2)}%`);
  return Math.round(utilization * 100) / 100;
};