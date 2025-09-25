import { anthropic } from '@ai-sdk/anthropic';
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



const tools = {
    computer: anthropic.tools.computer_20250124<LanguageModelV2ToolResultOutput>({
        displayWidthPx: 1024,
        displayHeightPx: 768,
        displayNumber: 1,
        execute: async ({ action, coordinate, text }) => {
            console.log('🖥️ COMPUTER TOOL EXECUTED:', { action, coordinate, text });

            try {
                const monitorId = await getPrimaryMonitorId();
                const actualDimensions = await getPrimaryMonitorDimensions();
                const targetDimensions = getTargetDimensions(actualDimensions);

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