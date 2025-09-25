import { tool } from 'ai';
import { z } from 'zod';
import { commands } from '../bindings';
import type { InferUITools, ToolSet } from 'ai';
import type { LanguageModelV2ToolResultOutput } from '@ai-sdk/provider';
import { scaleCoordinates, getTargetDimensions, ScalingSource } from '../utils/scaling';

// Get the primary monitor ID and dimensions on startup
let primaryMonitorId: string | null = null;
let primaryMonitorDimensions: { width: number; height: number } = { width: 1920, height: 1080 };

async function getPrimaryMonitorId(): Promise<string> {
    if (primaryMonitorId) return primaryMonitorId;

    const result = await commands.getMonitors();
    if (result.status === 'ok') {
        const primaryMonitor = result.data.find(m => m.is_primary) || result.data[0];
        if (primaryMonitor) {
            primaryMonitorId = primaryMonitor.id;
            primaryMonitorDimensions = { width: primaryMonitor.width, height: primaryMonitor.height };
            return primaryMonitorId;
        }
    }
    throw new Error('No monitors found');
}

async function getPrimaryMonitorDimensions(): Promise<{ width: number; height: number }> {
    await getPrimaryMonitorId(); // This will set the dimensions
    return primaryMonitorDimensions;
}

// Display configuration - matching Anthropic's computer tool parameters
const DISPLAY_WIDTH_PX = 1024;
const DISPLAY_HEIGHT_PX = 768;
const DISPLAY_NUMBER = 1;

const tools = {
    computer: tool({
        description: `Use a computer to perform actions like taking screenshots, clicking, typing, scrolling, and moving the mouse. The screen resolution is ${DISPLAY_WIDTH_PX}x${DISPLAY_HEIGHT_PX} pixels (display ${DISPLAY_NUMBER}).

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
- screenshot: Take a screenshot of the screen.`,
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
            console.log('🖥️ COMPUTER TOOL EXECUTED:', { 
                action, 
                coordinate, 
                text, 
                duration, 
                scroll_amount, 
                scroll_direction, 
                start_coordinate,
                displayConfig: { width: DISPLAY_WIDTH_PX, height: DISPLAY_HEIGHT_PX, display: DISPLAY_NUMBER }
            });

            try {
                const monitorId = await getPrimaryMonitorId();
                const actualDimensions = await getPrimaryMonitorDimensions();
                // Use the configured display dimensions for scaling
                const targetDimensions = { width: DISPLAY_WIDTH_PX, height: DISPLAY_HEIGHT_PX };

                if (action === 'screenshot') {
                    const screenshotResult = await commands.takeScreenshot(monitorId, targetDimensions.width, targetDimensions.height);

                    if (screenshotResult.status === 'error') {
                        throw new Error(screenshotResult.error);
                    }

                    // Return in the format expected by Anthropic's Computer Use API
                    return {
                        type: 'content',
                        value: [{
                            type: 'media',
                            data: screenshotResult.data,
                            mediaType: 'image/png',
                        }],
                    } satisfies LanguageModelV2ToolResultOutput;
                } else if (action === 'left_click' || action === 'right_click') {
                    const button = action === 'left_click' ? 'left' : 'right';
                    
                    let scaledX: number | null = null;
                    let scaledY: number | null = null;
                    
                    if (coordinate) {
                        const [scaledXCoord, scaledYCoord] = scaleCoordinates({
                            source: ScalingSource.API,
                            screenDimensions: actualDimensions,
                            x: coordinate[0],
                            y: coordinate[1],
                        });
                        scaledX = scaledXCoord;
                        scaledY = scaledYCoord;
                    }
                    
                    const clickResult = await commands.mouseClick(
                        monitorId,
                        button,
                        scaledX,
                        scaledY
                    );

                    if (clickResult.status === 'error') {
                        throw new Error(clickResult.error);
                    }
                    return {
                        type: 'text',
                        value: `Successfully performed ${button} click${coordinate ? ` at (${coordinate[0]}, ${coordinate[1]})` : ''}`
                    } satisfies LanguageModelV2ToolResultOutput;

                } else if (action === 'type' && text) {
                    const typeResult = await commands.typeText(text);

                    if (typeResult.status === 'error') {
                        throw new Error(typeResult.error);
                    }

                    return {
                        type: 'text',
                        value: `Successfully typed: "${text}"`
                    } satisfies LanguageModelV2ToolResultOutput;
                } else if (action === 'key' && text) {
                    const keyResult = await commands.pressKey(text);

                    if (keyResult.status === 'error') {
                        throw new Error(keyResult.error);
                    }

                    return {
                        type: 'text',
                        value: `Successfully pressed key: ${text}`
                    } satisfies LanguageModelV2ToolResultOutput;
                } else if (action === 'mouse_move' && coordinate) {
                    const [scaledX, scaledY] = scaleCoordinates({
                        source: ScalingSource.API,
                        screenDimensions: actualDimensions,
                        x: coordinate[0],
                        y: coordinate[1],
                    });
                    
                    const moveResult = await commands.moveMouse(monitorId, scaledX, scaledY);

                    if (moveResult.status === 'error') {
                        throw new Error(moveResult.error);
                    }

                    return {
                        type: 'text',
                        value: `Successfully moved mouse to (${coordinate[0]}, ${coordinate[1]})`
                    } satisfies LanguageModelV2ToolResultOutput;
                } else if (action === 'cursor_position') {
                    const positionResult = await commands.getCursorPosition(monitorId);

                    if (positionResult.status === 'error') {
                        throw new Error(positionResult.error);
                    }

                    // Scale cursor position from actual screen to target resolution
                    const [scaledX, scaledY] = scaleCoordinates({
                        source: ScalingSource.COMPUTER,
                        screenDimensions: actualDimensions,
                        x: positionResult.data[0],
                        y: positionResult.data[1],
                    });

                    return {
                        type: 'text',
                        value: `Cursor position: (${scaledX}, ${scaledY})`
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