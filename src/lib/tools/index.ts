import { tool } from 'ai';
import { z } from 'zod';
import { commands } from '../bindings';
import type { InferUITools, ToolSet } from 'ai';
import type { LanguageModelV2ToolResultOutput } from '@ai-sdk/provider';
import { scaleCoordinates, getOptimalComputerUseDimensions, ScalingSource } from '../utils/scaling';

// Get the primary monitor ID and dimensions on startup
let primaryMonitorId: string | null = null;
let primaryMonitorDimensions: { width: number; height: number } = { width: 1920, height: 1080 };
let computerUseDimensions: { width: number; height: number } | null = null;

// Auto-screenshot setting (enabled by default)
let autoScreenshotEnabled = true;

export function setAutoScreenshot(enabled: boolean) {
    autoScreenshotEnabled = enabled;
    console.log('🖥️ Auto-screenshot:', enabled ? 'enabled' : 'disabled');
}

export function getAutoScreenshot(): boolean {
    return autoScreenshotEnabled;
}

async function getPrimaryMonitorId(): Promise<string> {
    if (primaryMonitorId) return primaryMonitorId;

    try {
        const result = await commands.getMonitors();
        if (result.status === 'ok') {
            const primaryMonitor = result.data.find(m => m.is_primary) || result.data[0];
            if (primaryMonitor) {
                primaryMonitorId = primaryMonitor.id;
                primaryMonitorDimensions = { width: primaryMonitor.width, height: primaryMonitor.height };
                
                // Calculate optimal computer use dimensions based on Claude's training data
                const optimal = getOptimalComputerUseDimensions(primaryMonitorDimensions);
                computerUseDimensions = optimal || primaryMonitorDimensions;
                
                console.log('🖥️  Monitor detected:', primaryMonitorDimensions);
                console.log('🎯 Optimal Computer Use dimensions:', computerUseDimensions);
                
                return primaryMonitorId;
            }
        }
        throw new Error('No monitors found');
    } catch (error) {
        console.warn('⚠️ Failed to detect monitor (may be too early in app lifecycle):', error);
        // Fallback to defaults - will retry on next call
        if (!computerUseDimensions) {
            computerUseDimensions = { width: 1280, height: 800 };
            primaryMonitorDimensions = { width: 1920, height: 1080 };
        }
        throw error;
    }
}

async function getPrimaryMonitorDimensions(): Promise<{ width: number; height: number }> {
    await getPrimaryMonitorId(); // This will set the dimensions
    return primaryMonitorDimensions;
}

async function getComputerUseDimensions(): Promise<{ width: number; height: number }> {
    await getPrimaryMonitorId(); // This will set the dimensions
    if (!computerUseDimensions) {
        throw new Error('Computer use dimensions not initialized');
    }
    return computerUseDimensions;
}

// Defer monitor detection until first tool use to avoid early initialization errors
// The monitor will be detected on the first tool call (screenshot, click, etc.)
// This prevents WebKit display ID errors on macOS during app startup

function getToolDescription(): string {
    const dims = computerUseDimensions || { width: 1280, height: 800 };
    return `Use a computer to perform actions like taking screenshots, clicking, typing, scrolling, and moving the mouse. The screen resolution is ${dims.width}x${dims.height} pixels.

Available actions:
- key: Press a key or key-combination on the keyboard. This supports xdotool's key syntax. Examples: "a", "Return", "alt+Tab", "ctrl+s", "Up", "KP_0" (for the numpad 0 key).
- hold_key: Hold down a key or multiple keys for a specified duration (in seconds). Supports the same syntax as key.
- type: Type a string of text on the keyboard.
- cursor_position: Get the current (x, y) pixel coordinate of the cursor on the screen.
- mouse_move: Move the cursor to a specified (x, y) pixel coordinate on the screen.
- left_mouse_down: Press the left mouse button.
- left_mouse_up: Release the left mouse button.
- left_click: Click the left mouse button at the specified (x, y) pixel coordinate on the screen. You can also include a key combination to hold down while clicking using the text parameter.
- left_click_drag: Click and drag the cursor from start_coordinate to a specified (x, y) pixel coordinate on the screen.
- right_click: Click the right mouse button at the specified (x, y) pixel coordinate on the screen.
- middle_click: Click the middle mouse button at the specified (x, y) pixel coordinate on the screen.
- double_click: Double-click the left mouse button at the specified (x, y) pixel coordinate on the screen.
- triple_click: Triple-click the left mouse button at the specified (x, y) pixel coordinate on the screen.
- scroll: Scroll the screen in a specified direction by a specified amount of clicks of the scroll wheel, at the specified (x, y) pixel coordinate. DO NOT use PageUp/PageDown to scroll.
- wait: Wait for a specified duration (in seconds).
- screenshot: Take a screenshot of the screen.`;
}

const tools = {
    computer: tool({
        description: getToolDescription(),
        inputSchema: z.object({
            action: z.enum([
                'key',
                'hold_key', 
                'type',
                'cursor_position',
                'mouse_move',
                'left_mouse_down',
                'left_mouse_up', 
                'left_click',
                'left_click_drag',
                'right_click',
                'middle_click',
                'double_click',
                'triple_click',
                'scroll',
                'wait',
                'screenshot'
            ]).describe('The action to perform'),
            // coordinate: z.tuple([z.number().int(), z.number().int()]).optional()
            coordinate: z.array(z.number().int()).optional()
                .describe('(x, y): The x (pixels from the left edge) and y (pixels from the top edge) coordinates to move the mouse to. Required only by action=mouse_move and action=left_click_drag.'),
            duration: z.number().optional()
                .describe('The duration to hold the key down for. Required only by action=hold_key and action=wait.'),
            scroll_amount: z.number().optional()
                .describe('The number of \'clicks\' to scroll. Required only by action=scroll.'),
            scroll_direction: z.enum(['up', 'down', 'left', 'right']).optional()
                .describe('The direction to scroll the screen. Required only by action=scroll.'),
            // start_coordinate: z.tuple([z.number().int(), z.number().int()]).optional()
            start_coordinate: z.array(z.number().int()).optional()
                .describe('(x, y): The x (pixels from the left edge) and y (pixels from the top edge) coordinates to start the drag from. Required only by action=left_click_drag.'),
            text: z.string().optional()
                .describe('Required only by action=type, action=key, and action=hold_key. Can also be used by click or scroll actions to hold down keys while clicking or scrolling.')
        }),
        execute: async ({ action, coordinate, text, duration, scroll_amount, scroll_direction, start_coordinate }) => {
            try {
                // Lazy initialization: Detect monitor on first tool use with retry
                let monitorId: string | undefined;
                let retries = 3;
                while (retries > 0) {
                    try {
                        monitorId = await getPrimaryMonitorId();
                        break;
                    } catch (error) {
                        retries--;
                        if (retries === 0) {
                            throw new Error('Failed to detect monitor after multiple attempts. Please ensure the app is fully loaded.');
                        }
                        // Wait a bit and retry (allows time for window initialization)
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
                
                if (!monitorId) {
                    throw new Error('Monitor ID not available');
                }
                
                const realDimensions = await getPrimaryMonitorDimensions();
                const compUseDimensions = await getComputerUseDimensions();

                console.log('🖥️ COMPUTER TOOL EXECUTED:', { 
                    action, 
                    coordinate, 
                    text, 
                    duration, 
                    scroll_amount, 
                    scroll_direction, 
                    start_coordinate,
                    realDimensions,
                    computerUseDimensions: compUseDimensions
                });

                if (action === 'screenshot') {
                    const screenshotResult = await commands.takeScreenshot(monitorId, compUseDimensions.width, compUseDimensions.height);

                    if (screenshotResult.status === 'error') {
                        throw new Error(screenshotResult.error);
                    }

                    // Return in the format expected by Anthropic's Computer Use API
                    return {
                        type: 'content',
                        value: [{
                            type: 'media',
                            data: screenshotResult.data,
                            mediaType: 'image/jpeg',
                        }],
                    } satisfies LanguageModelV2ToolResultOutput;
                } else if (action === 'left_click' || action === 'right_click') {
                    const button = action === 'left_click' ? 'left' : 'right';
                    
                    if (!coordinate) {
                        throw new Error('Coordinate is required for left_click and right_click');
                    }

                    const [scaledXCoord, scaledYCoord] = scaleCoordinates({
                        source: ScalingSource.API,
                        realDimensions: realDimensions,
                        computerUseDimensions: compUseDimensions,
                        x: coordinate[0],
                        y: coordinate[1],
                    });
                    const scaledX = scaledXCoord;
                    const scaledY = scaledYCoord;
                    
                    const clickResult = await commands.mouseClick(
                        monitorId,
                        button,
                        scaledX,
                        scaledY,
                        autoScreenshotEnabled,
                        compUseDimensions.width,
                        compUseDimensions.height
                    );

                    if (clickResult.status === 'error') {
                        throw new Error(clickResult.error);
                    }
                    
                    if (!clickResult.data) {
                        throw new Error('No data returned from click');
                    }

                    // If screenshot is included, return content with both text and media
                    if (clickResult.data.screenshot) {
                        return {
                            type: 'content',
                            value: [{
                                type: 'text',
                                text: clickResult.data.message
                            }, {
                                type: 'media',
                                data: clickResult.data.screenshot,
                                mediaType: 'image/jpeg',
                            }],
                        } satisfies LanguageModelV2ToolResultOutput;
                    }

                    return {
                        type: 'text',
                        value: clickResult.data.message
                    } satisfies LanguageModelV2ToolResultOutput;

                } else if (action === 'type') {
                    if (!text) {
                        throw new Error('Text is required for type');
                    }

                    const typeResult = await commands.typeText(
                        text,
                        monitorId,
                        autoScreenshotEnabled,
                        compUseDimensions.width,
                        compUseDimensions.height
                    );

                    if (typeResult.status === 'error') {
                        throw new Error(typeResult.error);
                    }
                    
                    if (!typeResult.data) {
                        throw new Error('No data returned from type');
                    }

                    // If screenshot is included, return content with both text and media
                    if (typeResult.data.screenshot) {
                        return {
                            type: 'content',
                            value: [{
                                type: 'text',
                                text: typeResult.data.message
                            }, {
                                type: 'media',
                                data: typeResult.data.screenshot,
                                mediaType: 'image/jpeg',
                            }],
                        } satisfies LanguageModelV2ToolResultOutput;
                    }

                    return {
                        type: 'text',
                        value: typeResult.data.message
                    } satisfies LanguageModelV2ToolResultOutput;
                } else if (action === 'key' && text) {
                    const keyResult = await commands.pressKey(
                        text,
                        monitorId,
                        autoScreenshotEnabled,
                        compUseDimensions.width,
                        compUseDimensions.height
                    );

                    if (keyResult.status === 'error') {
                        throw new Error(keyResult.error);
                    }
                    
                    if (!keyResult.data) {
                        throw new Error('No data returned from key press');
                    }

                    // If screenshot is included, return content with both text and media
                    if (keyResult.data.screenshot) {
                        return {
                            type: 'content',
                            value: [{
                                type: 'text',
                                text: keyResult.data.message
                            }, {
                                type: 'media',
                                data: keyResult.data.screenshot,
                                mediaType: 'image/jpeg',
                            }],
                        } satisfies LanguageModelV2ToolResultOutput;
                    }

                    return {
                        type: 'text',
                        value: keyResult.data.message
                    } satisfies LanguageModelV2ToolResultOutput;
                } else if (action === 'mouse_move') {
                    if (!coordinate) {
                        throw new Error('Coordinate is required for mouse_move');
                    }

                    const [scaledX, scaledY] = scaleCoordinates({
                        source: ScalingSource.API,
                        realDimensions: realDimensions,
                        computerUseDimensions: compUseDimensions,
                        x: coordinate[0],
                        y: coordinate[1],
                    });
                    
                    const moveResult = await commands.moveMouse(
                        monitorId,
                        scaledX,
                        scaledY,
                        autoScreenshotEnabled,
                        compUseDimensions.width,
                        compUseDimensions.height
                    );

                    if (moveResult.status === 'error') {
                        throw new Error(moveResult.error);
                    }
                    
                    if (!moveResult.data) {
                        throw new Error('No data returned from mouse move');
                    }

                    // If screenshot is included, return content with both text and media
                    if (moveResult.data.screenshot) {
                        return {
                            type: 'content',
                            value: [{
                                type: 'text',
                                text: moveResult.data.message
                            }, {
                                type: 'media',
                                data: moveResult.data.screenshot,
                                mediaType: 'image/jpeg',
                            }],
                        } satisfies LanguageModelV2ToolResultOutput;
                    }

                    return {
                        type: 'text',
                        value: moveResult.data.message
                    } satisfies LanguageModelV2ToolResultOutput;
                } else if (action === 'cursor_position') {
                    const positionResult = await commands.getCursorPosition(monitorId);

                    if (positionResult.status === 'error') {
                        throw new Error(positionResult.error);
                    }

                    // Scale cursor position from real screen to computer use resolution
                    const [scaledX, scaledY] = scaleCoordinates({
                        source: ScalingSource.COMPUTER,
                        realDimensions: realDimensions,
                        computerUseDimensions: compUseDimensions,
                        x: positionResult.data[0],
                        y: positionResult.data[1],
                    });

                    return {
                        type: 'text',
                        value: `Cursor position: (${scaledX}, ${scaledY})`
                    } satisfies LanguageModelV2ToolResultOutput;
                } else if (action === 'wait') {
                    if (!duration) {
                        throw new Error('Duration is required for wait');
                    }

                    const waitResult = await commands.wait(
                        duration,
                        monitorId,
                        autoScreenshotEnabled,
                        compUseDimensions.width,
                        compUseDimensions.height
                    );

                    if (waitResult.status === 'error') {
                        throw new Error(waitResult.error);
                    }
                    
                    if (!waitResult.data) {
                        throw new Error('No data returned from wait');
                    }

                    // If screenshot is included, return content with both text and media
                    if (waitResult.data.screenshot) {
                        return {
                            type: 'content',
                            value: [{
                                type: 'text',
                                text: waitResult.data.message
                            }, {
                                type: 'media',
                                data: waitResult.data.screenshot,
                                mediaType: 'image/jpeg',
                            }],
                        } satisfies LanguageModelV2ToolResultOutput;
                    }

                    return {
                        type: 'text',
                        value: waitResult.data.message
                    } satisfies LanguageModelV2ToolResultOutput;
                } else if (action === 'left_click_drag') {
                    if (!start_coordinate || !coordinate) {
                        throw new Error('Both start_coordinate and coordinate are required for left_click_drag');
                    }

                    // Scale the start coordinates
                    const [scaledStartX, scaledStartY] = scaleCoordinates({
                        source: ScalingSource.API,
                        realDimensions: realDimensions,
                        computerUseDimensions: compUseDimensions,
                        x: start_coordinate[0],
                        y: start_coordinate[1],
                    });

                    // Scale the end coordinates
                    const [scaledEndX, scaledEndY] = scaleCoordinates({
                        source: ScalingSource.API,
                        realDimensions: realDimensions,
                        computerUseDimensions: compUseDimensions,
                        x: coordinate[0],
                        y: coordinate[1],
                    });
                    
                    const dragResult = await commands.mouseDrag(
                        monitorId,
                        scaledStartX,
                        scaledStartY,
                        scaledEndX,
                        scaledEndY,
                        autoScreenshotEnabled,
                        compUseDimensions.width,
                        compUseDimensions.height
                    );

                    if (dragResult.status === 'error') {
                        throw new Error(dragResult.error);
                    }
                    
                    if (!dragResult.data) {
                        throw new Error('No data returned from drag');
                    }

                    // If screenshot is included, return content with both text and media
                    if (dragResult.data.screenshot) {
                        return {
                            type: 'content',
                            value: [{
                                type: 'text',
                                text: dragResult.data.message
                            }, {
                                type: 'media',
                                data: dragResult.data.screenshot,
                                mediaType: 'image/jpeg',
                            }],
                        } satisfies LanguageModelV2ToolResultOutput;
                    }

                    return {
                        type: 'text',
                        value: dragResult.data.message
                    } satisfies LanguageModelV2ToolResultOutput;
                } else {
                    return {
                        type: 'text',
                        value: `Action ${action} not implemented yet`
                    } satisfies LanguageModelV2ToolResultOutput;
                }
            } catch (error) {
                console.error('🖥️ Computer tool error:', error);
                throw error;
            }
        },
        toModelOutput: (output) => {
            return output;
        },
    }),
} satisfies ToolSet;

type UITools = InferUITools<typeof tools>;

export default tools;
export type { UITools };