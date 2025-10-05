// Coordinate scaling utilities for computer use
// Simple scaling between real screen resolution and computer use resolution

export type Resolution = {
  width: number;
  height: number;
};

export enum ScalingSource {
  COMPUTER = "computer",
  API = "api",
}

// Claude's Computer Use API was trained on these specific resolutions
const MAX_SCALING_TARGETS: Record<string, Resolution> = {
  XGA: { width: 1024, height: 768 },    // 4:3
  WXGA: { width: 1280, height: 800 },   // 16:10
  FWXGA: { width: 1366, height: 768 },  // ~16:9
};

/**
 * Scales coordinates between the real screen resolution and computer use resolution
 * to reduce computing costs while maintaining functionality.
 *
 * When source is COMPUTER:
 * - Scales down coordinates from real screen size to computer use resolution
 * - Used when receiving coordinates from mouse/screen events
 *
 * When source is API:
 * - Scales up coordinates from computer use resolution to real screen size
 * - Used when receiving coordinates from API/tool calls
 *
 * @param realDimensions The real screen dimensions {width, height}
 * @param computerUseDimensions The computer use dimensions {width, height} (typically smaller)
 * @param source Whether coordinates are coming from computer events or API calls
 * @param x The x coordinate to scale
 * @param y The y coordinate to scale
 * @returns Tuple of scaled [x, y] coordinates
 */
export function scaleCoordinates({
  source,
  realDimensions,
  computerUseDimensions,
  x,
  y,
}: {
  source: ScalingSource;
  realDimensions: { width: number; height: number };
  computerUseDimensions: { width: number; height: number };
  x: number;
  y: number;
}): [number, number] {
  const xScalingFactor = computerUseDimensions.width / realDimensions.width;
  const yScalingFactor = computerUseDimensions.height / realDimensions.height;

  if (source === ScalingSource.API) {
    // Scale up from computer use resolution to real screen size
    const scaledCoords: [number, number] = [
      Math.round(x / xScalingFactor), 
      Math.round(y / yScalingFactor)
    ];
    return scaledCoords;
  }

  // Scale down from real screen size to computer use resolution
  const scaledCoords: [number, number] = [
    Math.round(x * xScalingFactor), 
    Math.round(y * yScalingFactor)
  ];
  return scaledCoords;
}

/**
 * Automatically selects the best target resolution for Claude's Computer Use API
 * based on the real screen's aspect ratio.
 * 
 * Claude was trained on specific resolutions (XGA, WXGA, FWXGA), so we need to
 * match the closest one to minimize accuracy loss.
 * 
 * @param realDimensions The actual screen dimensions
 * @returns The optimal target resolution from Claude's training set, or null if screen is already smaller
 */
export function getOptimalComputerUseDimensions(
  realDimensions: { width: number; height: number }
): Resolution | null {
  const ratio = realDimensions.width / realDimensions.height;
  
  // Find the target dimension with the closest aspect ratio
  let bestMatch: Resolution | null = null;
  let smallestRatioDiff = Infinity;
  
  for (const dimension of Object.values(MAX_SCALING_TARGETS)) {
    const targetRatio = dimension.width / dimension.height;
    const ratioDiff = Math.abs(targetRatio - ratio);
    
    // Only consider dimensions smaller than the real screen
    if (dimension.width < realDimensions.width && ratioDiff < smallestRatioDiff) {
      bestMatch = dimension;
      smallestRatioDiff = ratioDiff;
    }
  }
  
  return bestMatch;
}

/**
 * Get the computer use dimensions based on real dimensions and scaling factor
 * @deprecated Use getOptimalComputerUseDimensions instead for Claude Computer Use API
 */
export function getComputerUseDimensions(
  realDimensions: { width: number; height: number },
  scalingFactor: number = 0.25 // Default to 1/4 scale
): Resolution {
  return {
    width: Math.round(realDimensions.width * scalingFactor),
    height: Math.round(realDimensions.height * scalingFactor)
  };
}