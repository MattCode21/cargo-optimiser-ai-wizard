export interface PackagingRecommendation {
  materials: string[];
  instructions: string[];
  considerations: string[];
}

export const getPackagingRecommendations = (productDescription: string): PackagingRecommendation => {
  const desc = productDescription.toLowerCase().trim();
  
  // Door handles and hardware
  if (desc.includes('door handle') || desc.includes('handle') || desc.includes('knob')) {
    return {
      materials: [
        'Bubble wrap (2–3 layers)',
        'Foam sleeves or EPE foam sheet',
        'Microfiber cloth or non-abrasive paper for premium finishes'
      ],
      instructions: [
        'Wrap each handle individually in microfiber cloth',
        'Apply bubble wrap in 2-3 layers',
        'Use foam sleeves for extra protection',
        'Pack in individual compartments to prevent scratching'
      ],
      considerations: [
        'Premium finishes (matte black, brass, chrome) need extra care',
        'Separate different finishes to prevent cross-contamination',
        'Use anti-static materials for electronic handles'
      ]
    };
  }
  
  // Tiles and ceramics
  if (desc.includes('tile') || desc.includes('ceramic') || desc.includes('porcelain')) {
    return {
      materials: [
        'Heavy-duty corrugated boxes',
        'Paper sheets between tiles',
        'Edge protectors',
        'Foam corner guards'
      ],
      instructions: [
        'Place paper sheets between each tile',
        'Stack tiles vertically in grooves',
        'Use edge protectors on all corners',
        'Fill empty spaces with foam'
      ],
      considerations: [
        'Tiles are heavy - consider weight distribution',
        'Vertical stacking prevents breakage',
        'Mark boxes as fragile and this-way-up'
      ]
    };
  }
  
  // Electronics
  if (desc.includes('electronic') || desc.includes('device') || desc.includes('gadget')) {
    return {
      materials: [
        'Anti-static bubble wrap',
        'ESD-safe packaging',
        'Foam inserts',
        'Moisture absorbing packets'
      ],
      instructions: [
        'Use anti-static materials throughout',
        'Create custom foam inserts for snug fit',
        'Add moisture absorbing packets',
        'Seal in anti-static bags first'
      ],
      considerations: [
        'Prevent static discharge damage',
        'Control humidity levels',
        'Avoid magnetic interference'
      ]
    };
  }
  
  // Glassware and fragile items
  if (desc.includes('glass') || desc.includes('fragile') || desc.includes('mirror')) {
    return {
      materials: [
        'Multiple layers of bubble wrap',
        'Foam peanuts or air pillows',
        'Cardboard dividers',
        'Fragile tape and labels'
      ],
      instructions: [
        'Wrap each item individually in bubble wrap',
        'Use cardboard dividers between items',
        'Fill all empty spaces with cushioning',
        'Double-box for extra protection'
      ],
      considerations: [
        'Never allow items to touch each other',
        'Use plenty of cushioning material',
        'Mark clearly as fragile on all sides'
      ]
    };
  }
  
  // Heavy machinery or tools
  if (desc.includes('tool') || desc.includes('machinery') || desc.includes('equipment')) {
    return {
      materials: [
        'Heavy-duty wooden crates',
        'Steel banding',
        'Rust prevention materials',
        'Shock-absorbing pads'
      ],
      instructions: [
        'Secure items with steel banding',
        'Apply rust prevention coating',
        'Use shock-absorbing pads at contact points',
        'Distribute weight evenly'
      ],
      considerations: [
        'Consider weight limits of containers',
        'Protect against moisture and rust',
        'Ensure proper weight distribution'
      ]
    };
  }
  
  // Default recommendations for general items
  return {
    materials: [
      'Standard bubble wrap',
      'Corrugated cardboard boxes',
      'Packing paper',
      'Tape and labels'
    ],
    instructions: [
      'Wrap items in bubble wrap or packing paper',
      'Use appropriately sized boxes',
      'Fill empty spaces to prevent movement',
      'Seal securely with quality tape'
    ],
    considerations: [
      'Choose box size to minimize empty space',
      'Consider item weight and fragility',
      'Label boxes clearly with contents'
    ]
  };
};

export const getDimensionOptimizationTips = (
  containerDims: [number, number, number],
  itemDims: [number, number, number],
  utilizationPercent: number,
  itemCount: number
): string[] => {
  const tips: string[] = [];
  
  // Calculate theoretical max
  const containerVolume = containerDims[0] * containerDims[1] * containerDims[2];
  const itemVolume = itemDims[0] * itemDims[1] * itemDims[2];
  const theoreticalMax = Math.floor(containerVolume / itemVolume);
  
  if (utilizationPercent < 70) {
    tips.push(`Space utilization is only ${utilizationPercent.toFixed(1)}%. Consider optimizing dimensions.`);
  }
  
  if (itemCount < theoreticalMax * 0.8) {
    const diff = Math.floor(theoreticalMax * 0.8) - itemCount;
    tips.push(`You could potentially fit ${diff} more items with better packing.`);
  }
  
  // Dimension-specific tips
  const containerRatios = [
    containerDims[0] / containerDims[1],
    containerDims[1] / containerDims[2],
    containerDims[0] / containerDims[2]
  ];
  
  const itemRatios = [
    itemDims[0] / itemDims[1],
    itemDims[1] / itemDims[2],
    itemDims[0] / itemDims[2]
  ];
  
  // Check for dimension mismatches
  if (Math.abs(containerRatios[0] - itemRatios[0]) > 0.5) {
    tips.push('Consider adjusting item length-to-width ratio to better match container proportions.');
  }
  
  // Weight considerations
  const estimatedWeight = itemCount * itemVolume * 0.5; // Rough estimate
  tips.push(`Estimated total weight: ${estimatedWeight.toFixed(0)} kg. Ensure this is within container weight limits.`);
  
  // Practical recommendations
  if (itemDims.some(dim => dim < 10)) {
    tips.push('Small items may benefit from bundling or using secondary packaging to improve handling.');
  }
  
  if (itemDims.some(dim => dim > containerDims[0] * 0.8)) {
    tips.push('Large items relative to container size may limit packing efficiency. Consider size optimization.');
  }
  
  return tips;
};