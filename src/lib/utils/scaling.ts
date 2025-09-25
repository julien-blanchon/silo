// Coordinate scaling utilities for computer use
// Scales coordinates between actual screen resolution and standardized target resolutions

export type Resolution = {
  width: number;
  height: number;
};

const MAX_SCALING_TARGETS: Record<string, Resolution> = {
  XGA: { width: 1024, height: 768 }, // 4:3
  WXGA: { width: 1280, height: 800 }, // 16:10
  FWXGA: { width: 1366, height: 768 }, // ~16:9
};

export enum ScalingSource {
  COMPUTER = "computer",
  API = "api",
}

/**
 * Scales coordinates between the actual screen resolution and standardized target resolutions
 * to ensure consistent behavior across different screen sizes.
 *
 * When source is COMPUTER:
 * - Scales down coordinates from actual screen size to closest matching target resolution
 * - Used when receiving coordinates from mouse/screen events
 *
 * When source is API:
 * - Scales up coordinates from target resolution to actual screen size
 * - Used when receiving coordinates from API/tool calls
 *
 * @param screenDimensions The screen dimensions {width, height} to scale from/to
 * @param source Whether coordinates are coming from computer events or API calls
 * @param x The x coordinate to scale
 * @param y The y coordinate to scale
 * @returns Tuple of scaled [x, y] coordinates
 */
export function scaleCoordinates({
  source,
  screenDimensions,
  x,
  y,
}: {
  source: ScalingSource;
  screenDimensions: { width: number; height: number };
  x: number;
  y: number;
}): [number, number] {
  // Calculate aspect ratio of current screen
  const ratio = screenDimensions.width / screenDimensions.height;

  // Find closest matching target resolution
  let closestDimension = Object.values(MAX_SCALING_TARGETS)[0];
  let smallestDiff = Math.abs(
    ratio - closestDimension.width / closestDimension.height
  );

  for (const dimension of Object.values(MAX_SCALING_TARGETS)) {
    const dimensionRatio = dimension.width / dimension.height;
    const diff = Math.abs(dimensionRatio - ratio);
    if (diff < smallestDiff) {
      closestDimension = dimension;
      smallestDiff = diff;
    }
  }

  const xScalingFactor = closestDimension.width / screenDimensions.width;
  const yScalingFactor = closestDimension.height / screenDimensions.height;

  console.log('🔍 Scaling info:', {
    screenDimensions,
    closestDimension,
    xScalingFactor,
    yScalingFactor,
    source,
    originalCoords: [x, y]
  });

  if (source === ScalingSource.API) {
    // Scale up from target resolution to actual screen size
    const scaledCoords: [number, number] = [
      Math.round(x / xScalingFactor), 
      Math.round(y / yScalingFactor)
    ];
    console.log('🔍 API -> Screen scaling result:', scaledCoords);
    return scaledCoords;
  }

  // Scale down from actual screen size to target resolution
  const scaledCoords: [number, number] = [
    Math.round(x * xScalingFactor), 
    Math.round(y * yScalingFactor)
  ];
  console.log('🔍 Screen -> API scaling result:', scaledCoords);
  return scaledCoords;
}

/**
 * Get the target dimensions for a given screen resolution
 */
export function getTargetDimensions(screenDimensions: { width: number; height: number }): Resolution {
  const ratio = screenDimensions.width / screenDimensions.height;

  let closestDimension = Object.values(MAX_SCALING_TARGETS)[0];
  let smallestDiff = Math.abs(
    ratio - closestDimension.width / closestDimension.height
  );

  for (const dimension of Object.values(MAX_SCALING_TARGETS)) {
    const dimensionRatio = dimension.width / dimension.height;
    const diff = Math.abs(dimensionRatio - ratio);
    if (diff < smallestDiff) {
      closestDimension = dimension;
      smallestDiff = diff;
    }
  }

  return closestDimension;
}
