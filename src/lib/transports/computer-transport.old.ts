import { createAnthropic, type AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import type { ChatTransport, UIMessage, UIMessageChunk, ChatRequestOptions, ModelMessage, ToolModelMessage, ToolContent } from 'ai';
import { dev } from '$app/environment';
import tools from '../tools/index.old';
import type { ToolSet } from 'ai';
import type { LanguageModelV2ToolResultOutput } from '@ai-sdk/provider';

// Development API key - replace with your own or use environment variables in production
const DEV_ANTHROPIC_API_KEY = 'sk...';

const anthropic = createAnthropic({
  apiKey: DEV_ANTHROPIC_API_KEY,
  // Use proxy only in development mode, direct API in production
  baseURL: dev ? '/proxy/anthropic/v1' : undefined,
  headers: {
    'anthropic-dangerous-direct-browser-access': 'true'
  }
});


export class ComputerTransport implements ChatTransport<UIMessage> {
  async sendMessages({
    trigger,
    chatId,
    messageId,
    messages,
    abortSignal,
    headers,
    body,
    metadata
  }: {
    trigger: 'submit-message' | 'regenerate-message';
    chatId: string;
    messageId: string | undefined;
    messages: UIMessage[];
    abortSignal: AbortSignal | undefined;
  } & ChatRequestOptions): Promise<ReadableStream<UIMessageChunk>> {

    console.log('🖥️ Computer Transport sendMessages called with:', { trigger, messages: messages.length });
    console.log('🖥️ Last message:', messages[messages.length - 1]);

    try {
      const result = streamText<ToolSet>({
        providerOptions: {
          anthropic: {
            thinking: { type: 'enabled', budgetTokens: 12000 },
            disableParallelToolUse: false,
          } satisfies AnthropicProviderOptions,
        },
        maxOutputTokens: 16000,
        headers: {
          'anthropic-dangerous-direct-browser-access': 'true',
          'anthropic-beta': 'computer-use-2025-01-24',
          'token-efficient-tools-2025-02-19': 'true',
          "output-128k-2025-02-19": "true",
          "interleaved-thinking-2025-05-14": "true",
          "context-1m-2025-08-07": "true",
        },
        model: anthropic('claude-opus-4-20250514'),
        messages: convertToModelMessages(messages, { tools }),
        abortSignal,
        stopWhen: stepCountIs(20), // Allow up to 20 tool steps
        system: `You are Claude, an AI assistant with computer use capabilities. You can see the screen, move the cursor, click buttons, and type text using the computer tool.

IMPORTANT: You MUST complete ALL requested actions in sequence. For example:
- When someone says "take a screenshot and click", FIRST take a screenshot, THEN click
- When someone asks for multiple actions, perform them one by one
- Always explain what you're doing at each step
- Use the tools in the logical order requested

SCREENSHOT ANALYSIS: When you take a screenshot, you can see and analyze the image content. Use this to:
- Identify UI elements, buttons, text fields, etc.
- Determine coordinates for clicking
- Understand the current state of applications
- Guide your next actions based on what you see

⚠️ WARNING: These are REAL computer actions that will affect the actual desktop and applications. Be careful with clicks and keyboard input.

CRITICAL: Complete ALL requested actions, don't stop after just one tool call.`,
        tools: tools,
        onError: (error) => {
          console.error('🖥️ Computer Transport error:', error);
          throw error;
        },
        onStepFinish: ({ usage }) => {
          const { totalTokens, inputTokens, outputTokens, reasoningTokens } = usage;
          console.log('onStepFinish Prompt tokens:', inputTokens);
          console.log('onStepFinish Completion tokens:', outputTokens);
          console.log('onStepFinish Reasoning tokens:', reasoningTokens);
          console.log('onStepFinish Total tokens:', totalTokens);
        },
        onFinish: ({ usage }) => {
          const { totalTokens, inputTokens, outputTokens, reasoningTokens } = usage;
          // your own logic, e.g. for saving the chat history or recording usage
          console.log('onFinish Prompt tokens:', inputTokens);
          console.log('onFinish Completion tokens:', outputTokens);
          console.log('onFinish Reasoning tokens:', reasoningTokens);
          console.log('onFinish Total tokens:', totalTokens);
        },
        prepareStep: (step) => {
          // We only keep the last images in the messages
          let totalCounterOfImages = 0
          const step_messages: ModelMessage[] = step.messages.reverse().map(message => {
            if (message.role !== 'tool') {
              return message satisfies ModelMessage
            }

            return {
              ...message,
              content: message.content.map(part => {
                if (part.output.type !== 'content') {
                  return part
                }

                let output: LanguageModelV2ToolResultOutput
                if (part.output.type !== 'content') {
                  output = part.output
                } else {
                  output = {
                    type: "content" as const,
                    value: part.output.value.map(v => {
                      if (v.type !== 'media') {
                        return v
                      } else {
                        totalCounterOfImages += 1
                        console.log(`🖥️ Redacting image ${totalCounterOfImages}`)
                        if (totalCounterOfImages > 1) {
                          return {
                            type: "text" as const,
                            text: "Image redacted to save input tokens"
                          }
                        }
                        else {
                          return v
                        }
                      }
                    })
                  }
                }
                return {
                  ...part,
                  output: output
                }
              }) satisfies ToolContent
            } satisfies ToolModelMessage
          }).reverse()
          return {
            // Here we can dynamically change the model, tools, etc.
            // https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling#preparestep-callback
            model: step.model,
            messages: step_messages as ModelMessage[],
          }
        },
      });

      // Return the UI message stream directly
      return result.toUIMessageStream();
    } catch (error) {
      console.error('🖥️ Computer Transport error:', error);
      throw error;
    }
  }

  async reconnectToStream({
    chatId,
    headers,
    body,
    metadata
  }: {
    chatId: string;
  } & ChatRequestOptions): Promise<ReadableStream<UIMessageChunk> | null> {
    console.log('🖥️ Computer Transport reconnectToStream called for chatId:', chatId);
    // For this implementation, we don't support reconnection
    return null;
  }
}
