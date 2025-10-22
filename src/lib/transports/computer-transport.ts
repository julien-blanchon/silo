// All models now use OpenRouter - removed direct Anthropic provider
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, convertToModelMessages, stepCountIs, wrapLanguageModel } from 'ai';
import { gemmaToolMiddleware, hermesToolMiddleware, morphXmlToolMiddleware } from '@ai-sdk-tool/parser';
import { uiTarsToolMiddleware } from '../middleware';
import type { ChatTransport, UIMessage, UIMessageChunk, ChatRequestOptions, ModelMessage, ToolModelMessage, ToolContent, UserModelMessage, LanguageModelUsage } from 'ai';
import { dev } from '$app/environment';
import tools from '../tools';
import type { UITools } from '../tools';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import type { LanguageModelV2, LanguageModelV2ToolResultOutput } from '@ai-sdk/provider';
import type { ComputerUsageMetadata } from '../types/usage';
import { settingsStore } from '../runes/settings.svelte';

// Create provider factory functions that use the settings store
function getOpenRouter() {
  const apiKey = settingsStore.state.openrouterApiKey;
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured. Please add it in Settings.');
  }

  return createOpenRouter({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    compatibility: 'compatible',
    extraBody: {
      usage: {
        include: true
      }
    },
    fetch: tauriFetch
  });
}

function getLMStudio() {
  const baseURL = settingsStore.state.lmstudioUrl || 'http://localhost:1234/v1';

  return createOpenAICompatible({
    name: 'lmstudio',
    baseURL,
    fetch: tauriFetch
  });
}

type Provider = 'openrouter' | 'lmstudio';

// Model configuration - determines which provider and middleware to use
type ModelConfig = {
  provider: Provider;
  modelId: string;
  useMiddleware?: boolean;
  middlewareType?: 'gemma' | 'hermes' | 'morphXml' | 'uiTars' | 'none';
  supportsNativeTools?: boolean; // Whether the model supports native tool calling
  category?: string; // For UI grouping
};

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'mlx-community/lfm2-vl-1.6b': {
    provider: 'lmstudio',
    modelId: 'mlx-community/lfm2-vl-1.6b',
    supportsNativeTools: true,
    useMiddleware: false,
    category: 'LiquidAI'
  },
  'openai/gpt-oss-20b': {
    provider: 'lmstudio',
    modelId: 'openai/gpt-oss-20b',
    supportsNativeTools: true,
    useMiddleware: false,
    category: 'OpenAI'
  },
  'smolvlm2-2.2b-instruct-agentic-gui': {
    provider: 'lmstudio',
    modelId: 'smolvlm2-2.2b-instruct-agentic-gui',
    supportsNativeTools: true,
    useMiddleware: false,
    category: 'Huggingface'
  },
  // Anthropic Models (via OpenRouter)
  'anthropic/claude-opus-4.1': {
    provider: 'openrouter',
    modelId: 'anthropic/claude-opus-4.1',
    supportsNativeTools: true,
    useMiddleware: false,
    category: 'Anthropic'
  },
  'anthropic/claude-sonnet-4.5': {
    provider: 'openrouter',
    modelId: 'anthropic/claude-sonnet-4.5',
    supportsNativeTools: true,
    useMiddleware: false,
    category: 'Anthropic'
  },

  // OpenAI Models
  'openai/gpt-5': {
    provider: 'openrouter',
    modelId: 'openai/gpt-5',
    supportsNativeTools: true,
    useMiddleware: false,
    category: 'OpenAI'
  },
  'openai/gpt-5-nano': {
    provider: 'openrouter',
    modelId: 'openai/gpt-5-nano',
    supportsNativeTools: true,
    useMiddleware: false,
    category: 'OpenAI'
  },
  'openai/gpt-4.1': {
    provider: 'openrouter',
    modelId: 'openai/gpt-4.1',
    supportsNativeTools: true,
    useMiddleware: false,
    category: 'OpenAI'
  },
  'openai/o4-mini-high': {
    provider: 'openrouter',
    modelId: 'openai/o4-mini-high',
    supportsNativeTools: true,
    useMiddleware: false,
    category: 'OpenAI'
  },
  'openai/o4-mini': {
    provider: 'openrouter',
    modelId: 'openai/o4-mini',
    supportsNativeTools: true,
    useMiddleware: false,
    category: 'OpenAI'
  },
  'openai/gpt-4o': {
    provider: 'openrouter',
    modelId: 'openai/gpt-4o',
    supportsNativeTools: true,
    useMiddleware: false,
    category: 'OpenAI'
  },
  'openai/gpt-oss-120b': {
    provider: 'openrouter',
    modelId: 'openai/gpt-oss-120b',
    supportsNativeTools: true,
    useMiddleware: false,
    category: 'OpenAI'
  },

  // LLaMA Models
  'meta-llama/llama-4-maverick': {
    provider: 'openrouter',
    modelId: 'meta-llama/llama-4-maverick',
    supportsNativeTools: true,
    useMiddleware: false,
    category: 'LLaMA'
  },

  // Qwen Models (Hermes/XML middleware)
  'qwen/qwen3-max': {
    provider: 'openrouter',
    modelId: 'qwen/qwen3-max',
    supportsNativeTools: false,
    useMiddleware: true,
    middlewareType: 'hermes',
    category: 'Qwen'
  },
  'qwen/qwen3-235b-a22b-thinking-2507': {
    provider: 'openrouter',
    modelId: 'qwen/qwen3-235b-a22b-thinking-2507',
    supportsNativeTools: false,
    useMiddleware: true,
    middlewareType: 'hermes',
    category: 'Qwen'
  },

  // Google Models
  'google/gemma-3-27b-it': {
    provider: 'openrouter',
    modelId: 'google/gemma-3-27b-it',
    supportsNativeTools: false,
    useMiddleware: true,
    middlewareType: 'gemma',
    category: 'Google'
  },
  'google/gemini-2.0-flash-001': {
    provider: 'openrouter',
    modelId: 'google/gemini-2.0-flash-001',
    supportsNativeTools: true,
    useMiddleware: false,
    category: 'Google'
  },

  // Hermes Models (Hermes middleware)
  'nousresearch/hermes-4-405b': {
    provider: 'openrouter',
    modelId: 'nousresearch/hermes-4-405b',
    supportsNativeTools: false,
    useMiddleware: true,
    middlewareType: 'hermes',
    category: 'Nous Research'
  },

  // DeepSeek Models (may support native tools)
  'deepseek/deepseek-chat-v3.1': {
    provider: 'openrouter',
    modelId: 'deepseek/deepseek-chat-v3.1',
    supportsNativeTools: true,
    useMiddleware: false,
    category: 'DeepSeek'
  },

  // Mistral Models (may support native tools)
  'mistralai/mistral-medium-3.1': {
    provider: 'openrouter',
    modelId: 'mistralai/mistral-medium-3.1',
    supportsNativeTools: true,
    useMiddleware: false,
    category: 'Mistral'
  },
  'mistralai/codestral-2508': {
    provider: 'openrouter',
    modelId: 'mistralai/codestral-2508',
    supportsNativeTools: true,
    useMiddleware: false,
    category: 'Mistral'
  },
  'mistralai/pixtral-large-2411': {
    provider: 'openrouter',
    modelId: 'mistralai/pixtral-large-2411',
    supportsNativeTools: true,
    useMiddleware: false,
    category: 'Mistral'
  },

  // GLM Models (XML middleware)
  'z-ai/glm-4.5v': {
    provider: 'openrouter',
    modelId: 'z-ai/glm-4.5v',
    supportsNativeTools: false,
    useMiddleware: false,
    category: 'GLM'
  },
  'x-ai/grok-code-fast-1': {
    provider: 'openrouter',
    modelId: 'x-ai/grok-code-fast-1',
    supportsNativeTools: true, // Try native first
    useMiddleware: false,
    category: 'xAI'
  },
  'x-ai/grok-4': {
    provider: 'openrouter',
    modelId: 'x-ai/grok-4',
    supportsNativeTools: true,
    useMiddleware: false,
    category: 'xAI'
  },

  'bytedance/ui-tars-1.5-7b': {
    provider: 'openrouter',
    modelId: 'bytedance/ui-tars-1.5-7b',
    supportsNativeTools: false,
    useMiddleware: true,
    middlewareType: 'uiTars',
    category: 'Bytedance'
  },
  'google/gemini-2.5-flash': {
    provider: 'openrouter',
    modelId: 'google/gemini-2.5-flash',
    supportsNativeTools: true,
    useMiddleware: false,
    category: 'Google'
  }
};


export class ComputerTransport implements ChatTransport<UIMessage> {
  // Allow switching models - default to Claude via OpenRouter
  private currentModelKey: string = 'anthropic/claude-sonnet-4.5';
  private middlewareOverride: 'gemma' | 'hermes' | 'morphXml' | 'uiTars' | 'none' | null = null;

  // Cumulative usage tracking across the conversation
  private cumulativeUsage: LanguageModelUsage = {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    reasoningTokens: 0,
    cachedInputTokens: 0
  };

  // Track which tool call IDs have been processed to avoid reprocessing
  private processedToolCallIds = new Set<string>();

  // Method to switch models
  setModel(modelKey: string) {
    if (MODEL_CONFIGS[modelKey]) {
      this.currentModelKey = modelKey;
      console.log(`🖥️ Switched to model: ${modelKey}`);
    } else {
      console.error(`🖥️ Unknown model: ${modelKey}`);
    }
  }

  // Method to override middleware
  setMiddleware(middleware: 'gemma' | 'hermes' | 'morphXml' | 'uiTars' | 'none' | null) {
    this.middlewareOverride = middleware;
    console.log(`🖥️ Middleware override set to: ${middleware || 'default'}`);
  }

  // Method to get current cumulative usage
  getCumulativeUsage(): LanguageModelUsage {
    return { ...this.cumulativeUsage };
  }

  // Method to reset cumulative usage (e.g., when starting a new conversation)
  resetUsage() {
    this.cumulativeUsage = {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      reasoningTokens: 0,
      cachedInputTokens: 0
    };
  }

  // Method to reset processed tool call IDs (e.g., when starting a new conversation)
  resetProcessedToolCalls() {
    this.processedToolCallIds.clear();
    console.log('🖥️ Cleared processed tool call IDs');
  }

  // Helper to add usage numbers safely
  private addUsage(current: number | undefined, additional: number | undefined): number {
    return (current || 0) + (additional || 0);
  }

  // Analyze conversation to find existing image messages and all tool images
  private analyzeConversationImages(messages: ModelMessage[]) {
    const existingImageMessages: number[] = [];
    const allToolImages: { data: string; description: string; toolCallId: string; messageIndex: number; timestamp: number }[] = [];

    messages.forEach((message, index) => {
      if (message.role === 'user' && Array.isArray(message.content) &&
        message.content.some(part => part.type === 'text' && part.text.startsWith('[System:'))) {
        existingImageMessages.push(index);
      } else if (message.role === 'tool') {
        message.content.forEach(part => {
          if (part.output.type === 'content') {
            let textDescription = '';
            for (const contentItem of part.output.value) {
              if (contentItem.type === 'media' && contentItem.mediaType.startsWith('image/')) {
                allToolImages.push({
                  data: contentItem.data,
                  description: textDescription || `Screenshot ${allToolImages.length + 1} from computer tool`,
                  toolCallId: part.toolCallId,
                  messageIndex: index,
                  timestamp: Date.now() // Add timestamp for proper ordering
                });

                // Log only if this is a truly new tool call
                if (!this.processedToolCallIds.has(part.toolCallId)) {
                  console.log(`🖥️ Found new image from tool ${part.toolCallId} (screenshot ${allToolImages.length})`);
                  this.processedToolCallIds.add(part.toolCallId);
                }
              } else if (contentItem.type === 'text') {
                textDescription = contentItem.text;
              }
            }
          }
        });
      }
    });

    // Sort by message index to maintain chronological order
    allToolImages.sort((a, b) => a.messageIndex - b.messageIndex);

    return { existingImageMessages, allToolImages };
  }

  // Build the cleaned conversation with image management
  private buildCleanedConversation(
    messages: ModelMessage[],
    existingImageMessages: number[],
    imagesToKeep: { data: string; description: string; toolCallId: string; messageIndex: number; timestamp?: number }[]
  ): ModelMessage[] {
    const finalMessages: ModelMessage[] = [];

    messages.forEach((message, index) => {
      // Skip existing image messages - they will be replaced
      if (existingImageMessages.includes(index)) {
        return;
      }

      if (message.role === 'tool') {
        // Clean tool messages - remove image data, keep text
        const cleanToolResults: ToolContent = [];

        message.content.forEach(part => {
          if (part.output.type === 'content') {
            let textDescription = '';
            for (const contentItem of part.output.value) {
              if (contentItem.type === 'text') {
                textDescription = contentItem.text;
              }
              // Skip media content - it's extracted to imagesToKeep
            }

            cleanToolResults.push({
              ...part,
              output: {
                type: 'text',
                value: textDescription || 'Tool executed successfully'
              }
            });
          } else {
            cleanToolResults.push(part);
          }
        });

        finalMessages.push({
          ...message,
          content: cleanToolResults
        } satisfies ToolModelMessage);
      } else {
        // Keep other messages as-is
        finalMessages.push(message);
      }
    });

    // Add the kept images as user messages at the end, in chronological order
    imagesToKeep.forEach((image, index) => {
      finalMessages.push({
        role: 'user',
        content: [{
          type: 'text',
          text: `[System: ${image.description}]`
        }, {
          type: 'image',
          image: image.data,
          mediaType: 'image/jpeg'
        }]
      } satisfies UserModelMessage);
    });

    if (imagesToKeep.length > 0) {
      console.log(`🖥️ Added ${imagesToKeep.length} images to conversation: ${imagesToKeep.map(img => img.toolCallId).join(', ')}`);
    }

    return finalMessages;
  }

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
    console.log('🖥️ Using model:', this.currentModelKey);

    const config = MODEL_CONFIGS[this.currentModelKey];
    if (!config) {
      throw new Error(`Unknown model configuration: ${this.currentModelKey}`);
    }

    try {
      // Prepare the model based on provider and middleware requirements
      let model: any;
      let providerOptions: any = {};
      let modelHeaders: Record<string, string> = {};

      // Get the provider instance dynamically from settings
      let baseModel: LanguageModelV2;
      if (config.provider === 'openrouter') {
        const openrouter = getOpenRouter();
        baseModel = openrouter(config.modelId);
      } else {
        const lmstudio = getLMStudio();
        baseModel = lmstudio(config.modelId);
      }

      console.log('🖥️ Base model:', baseModel);

      // Determine middleware to use (override takes precedence)
      const useMiddleware = this.middlewareOverride !== null
        ? this.middlewareOverride !== 'none'
        : config.useMiddleware;

      const middlewareType = this.middlewareOverride !== null && this.middlewareOverride !== 'none'
        ? this.middlewareOverride
        : config.middlewareType;

      if (useMiddleware && middlewareType) {
        // Apply middleware for models that don't support native tools or when overridden
        switch (middlewareType) {
          case 'gemma':
            model = wrapLanguageModel({
              model: baseModel,
              middleware: gemmaToolMiddleware,
            });
            break;
          case 'hermes':
            model = wrapLanguageModel({
              model: baseModel,
              middleware: hermesToolMiddleware,
            });
            break;
          case 'morphXml':
            model = wrapLanguageModel({
              model: baseModel,
              middleware: morphXmlToolMiddleware,
            });
            break;
          case 'uiTars':
            model = wrapLanguageModel({
              model: baseModel,
              middleware: uiTarsToolMiddleware,
            });
            break;
          default:
            model = wrapLanguageModel({
              model: baseModel,
              middleware: gemmaToolMiddleware,
            });
        }

        // Add middleware error handling
        providerOptions = {
          toolCallMiddleware: {
            onError: (message: string, metadata: any) => {
              console.warn('🖥️ Tool middleware warning:', message, metadata);
            }
          }
        };

        console.log(`🖥️ Using ${middlewareType} middleware for ${config.modelId}`);
      } else {
        // Use native tool calling
        model = baseModel;
        console.log(`🖥️ Using native tool calling for ${config.modelId}`);
      }

      const result = streamText<typeof tools>({
        maxOutputTokens: 16000,
        model,
        messages: convertToModelMessages(messages, { tools }),
        abortSignal,
        stopWhen: stepCountIs(20), // Allow up to 20 tool steps
        system: `You are an AI assistant with computer use capabilities. 
<SYSTEM_CAPABILITY>
* You can see the screen, move the cursor, click buttons, and type text using the computer tool.
</SYSTEM_CAPABILITY>


* When using Firefox, if a startup wizard appears, IGNORE IT.  Do not even click "skip this step".  Instead, click on the address bar where it says "Search or enter address", and enter the appropriate search term or URL there.
* If the item you are looking at is a pdf, if after taking a single screenshot of the pdf it seems that you want to read the entire document instead of trying to continue to read the pdf from your screenshots + navigation, determine the URL, use curl to download the pdf, install and use pdftotext to convert it to a text file, and then read that text file directly with your str_replace_based_edit_tool.


<IMPORTANT>
You MUST complete ALL requested actions in sequence. For example:
- When someone says "take a screenshot and click", FIRST take a screenshot, THEN click
- When someone asks for multiple actions, perform them one by one
- Always explain what you're doing at each step
- Use the tools in the logical order requested
</IMPORTANT>

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

          // Enhanced debugging for model-specific issues
          if (error && typeof error === 'object') {
            const apiError = error as any;
            console.error('🖥️ Error details:', {
              message: apiError.message,
              statusCode: apiError.statusCode,
              responseBody: apiError.responseBody,
              url: apiError.url,
              modelId: config.modelId
            });

            // Check for specific model availability issues
            if (apiError.statusCode === 400) {
              console.warn(`🖥️ Model ${config.modelId} may not be available or may not support the requested features on OpenRouter`);
              console.warn('🖥️ Try switching to a different model like anthropic/claude-sonnet-4.5 or google/gemini-2.0-flash-001');
            }
          }

          throw error;
        },
        onStepFinish: ({ usage, dynamicToolResults, toolResults, toolCalls, content }) => {
          // Update cumulative usage
          this.cumulativeUsage.inputTokens = this.addUsage(this.cumulativeUsage.inputTokens, usage.inputTokens);
          this.cumulativeUsage.outputTokens = this.addUsage(this.cumulativeUsage.outputTokens, usage.outputTokens);
          this.cumulativeUsage.totalTokens = this.addUsage(this.cumulativeUsage.totalTokens, usage.totalTokens);
          this.cumulativeUsage.reasoningTokens = this.addUsage(this.cumulativeUsage.reasoningTokens, usage.reasoningTokens);
          this.cumulativeUsage.cachedInputTokens = this.addUsage(this.cumulativeUsage.cachedInputTokens, usage.cachedInputTokens);

          const { totalTokens, inputTokens, outputTokens, reasoningTokens } = usage;
          console.log('onStepFinish Prompt tokens:', inputTokens);
          console.log('onStepFinish Completion tokens:', outputTokens);
          console.log('onStepFinish Reasoning tokens:', reasoningTokens);
          console.log('onStepFinish Total tokens:', totalTokens);
          console.log('🖥️ Cumulative total tokens:', this.cumulativeUsage.totalTokens);
        },
        onFinish: ({ usage }) => {
          const { totalTokens, inputTokens, outputTokens, reasoningTokens } = usage;
          // your own logic, e.g. for saving the chat history or recording usage
          console.log('onFinish Prompt tokens:', inputTokens);
          console.log('onFinish Completion tokens:', outputTokens);
          console.log('onFinish Reasoning tokens:', reasoningTokens);
          console.log('onFinish Total tokens:', totalTokens);
          console.log('🖥️ Final cumulative total tokens:', this.cumulativeUsage.totalTokens);
        },
        prepareStep: (step) => {
          const maxImagesInConversation = 5;

          console.log(`🖥️ Processing conversation: ${step.messages.length} messages`);

          // Find and collect image management data
          const { existingImageMessages, allToolImages } = this.analyzeConversationImages(step.messages);

          // Keep ALL images if under limit, or the most recent ones if over limit
          const imagesToKeep = allToolImages.length <= maxImagesInConversation
            ? allToolImages
            : allToolImages.slice(-maxImagesInConversation);

          console.log(`🖥️ Image management: ${existingImageMessages.length} existing, ${allToolImages.length} total → keeping ${imagesToKeep.length}`);

          if (imagesToKeep.length > 0) {
            console.log(`🖥️ Images to keep:`, imagesToKeep.map((img, i) => `${i + 1}. ${img.toolCallId} (msg ${img.messageIndex})`));
          }

          // Build the cleaned conversation
          const finalMessages = this.buildCleanedConversation(step.messages, existingImageMessages, imagesToKeep);

          console.log(`🖥️ Conversation transformed: ${step.messages.length} → ${finalMessages.length} messages`);

          return {
            model: step.model,
            messages: finalMessages,
          }
        },
      });

      // Return the UI message stream with usage metadata
      return result.toUIMessageStream({
        messageMetadata: ({ part }) => {
          // Send usage metadata when generation is finished
          if (part.type === 'finish') {
            return {
              stepUsage: part.totalUsage,
              cumulativeUsage: { ...this.cumulativeUsage }
            } satisfies ComputerUsageMetadata;
          }
        }
      });
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
