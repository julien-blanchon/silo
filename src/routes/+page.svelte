<script lang="ts">
  import { Chat } from "@ai-sdk/svelte";
  import { toast } from "svelte-sonner";
  import { Avatar, AvatarFallback } from "$lib/components/ui/avatar";
  import { Button } from "$lib/components/ui/button";
  import * as Select from "$lib/components/ui/select";
  import {
    PromptInput,
    PromptInputAttachment,
    PromptInputAttachments,
    PromptInputBody,
    PromptInputButton,
    PromptInputTextarea,
    PromptInputToolbar,
    PromptInputTools,
    PromptInputSubmit,
    PromptInputActionMenu,
    PromptInputActionMenuContent,
    PromptInputActionMenuTrigger,
    PromptInputActionAddAttachments,
    type PromptInputMessage,
  } from "$lib/components/ai-elements/prompt-input";
  import {
    Context,
    ContextContent,
    ContextContentBody,
    ContextContentFooter,
    ContextContentHeader,
    ContextInputUsage,
    ContextOutputUsage,
    ContextReasoningUsage,
    ContextTrigger,
  } from "$lib/components/ai-elements/context";
  import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
  } from "$lib/components/ai-elements/conversation";
  import Icons from "$lib/components/elements/icons.svelte";
  import { ComputerTransport } from "$lib/transports/computer-transport";
  import type { ComputerUIMessage } from "$lib/types/usage";
  import {
    Message,
    MessageAvatar,
    MessageContent,
  } from "$lib/components/ai-elements/message";
  import { Loader } from "$lib/components/ai-elements/loader";
  import {
    Reasoning,
    ReasoningTrigger,
    ReasoningContent,
  } from "$lib/components/ai-elements/reasoning";
  import { Response } from "$lib/components/ai-elements/response";
  import {
    Tool,
    ToolHeader,
    ToolContent,
    ToolInput,
    ToolOutput,
  } from "$lib/components/ai-elements/tool";
  import { formatTruncatedJson } from "$lib/utils/truncate";
  import { setAutoScreenshot, getAutoScreenshot } from "$lib/tools";
  import { settingsStore } from "$lib/runes/settings.svelte";

  const computerTransport = new ComputerTransport();

  const chat = new Chat<ComputerUIMessage>({
    transport: computerTransport,
    generateId: () => crypto.randomUUID(),
    onError: (error) => {
      console.error("Computer chat error:", error);
      toast.error(error.message || "Something went wrong");
    },
  });

  // Available models grouped by category
  const MODELS = [
    {
      key: "mlx-community/lfm2-vl-1.6b",
      name: "LiquidAI LFM2 VL 1.6B",
      category: "LiquidAI",
      supportsNative: true,
    },
    {
      key: "openai/gpt-oss-20b",
      name: "GPT OSS 20B",
      category: "OpenAI",
      supportsNative: true,
    },
    {
      key: "smolvlm2-2.2b-instruct-agentic-gui",
      name: "SMOLVLM2 2.2B Instruct Agentic GUI",
      category: "Huggingface",
      supportsNative: true,
    },
    // Anthropic
    {
      key: "anthropic/claude-opus-4.1",
      name: "Claude Opus 4.1",
      category: "Anthropic",
      supportsNative: true,
    },

    {
      key: "anthropic/claude-sonnet-4.5",
      name: "Claude Sonnet 4.5",
      category: "Anthropic",
      supportsNative: true,
    },

    // OpenAI
    {
      key: "openai/gpt-5",
      name: "GPT-5",
      category: "OpenAI",
      supportsNative: true,
    },
    {
      key: "openai/gpt-5-nano",
      name: "GPT-5 Nano",
      category: "OpenAI",
      supportsNative: true,
    },
    {
      key: "openai/gpt-4.1",
      name: "GPT 4.1",
      category: "OpenAI",
      supportsNative: true,
    },
    {
      key: "openai/o4-mini-high",
      name: "O4 Mini High",
      category: "OpenAI",
      supportsNative: true,
    },
    {
      key: "openai/o4-mini",
      name: "O4 Mini",
      category: "OpenAI",
      supportsNative: true,
    },
    {
      key: "openai/gpt-4o",
      name: "GPT 4o",
      category: "OpenAI",
      supportsNative: true,
    },
    {
      key: "openai/gpt-oss-120b",
      name: "GPT OSS 120B",
      category: "OpenAI",
      supportsNative: true,
    },

    // LLaMA
    {
      key: "meta-llama/llama-4-maverick",
      name: "LLaMA 4 Maverick",
      category: "LLaMA",
      supportsNative: true,
    },

    // Qwen
    {
      key: "qwen/qwen3-max",
      name: "Qwen 3 Max",
      category: "Qwen",
      supportsNative: false,
      defaultMiddleware: "hermes",
    },
    {
      key: "qwen/qwen3-235b-a22b-thinking-2507",
      name: "Qwen 3 235B Thinking",
      category: "Qwen",
      supportsNative: false,
      defaultMiddleware: "hermes",
    },

    // Google
    {
      key: "google/gemma-3-27b-it",
      name: "Gemma 3 27B IT",
      category: "Google",
      supportsNative: false,
      defaultMiddleware: "gemma",
    },

    // Nous Research
    {
      key: "nousresearch/hermes-4-405b",
      name: "Hermes 4 405B",
      category: "Nous Research",
      supportsNative: false,
      defaultMiddleware: "hermes",
    },

    // DeepSeek
    {
      key: "deepseek/deepseek-chat-v3.1",
      name: "DeepSeek Chat v3.1",
      category: "DeepSeek",
      supportsNative: true,
    },

    // Mistral
    {
      key: "mistralai/mistral-medium-3.1",
      name: "Mistral Medium 3.1",
      category: "Mistral",
      supportsNative: true,
    },
    {
      key: "mistralai/codestral-2508",
      name: "Codestral 2508",
      category: "Mistral",
      supportsNative: true,
    },
    {
      key: "mistralai/pixtral-large-2411",
      name: "Pixtral Large 2411",
      category: "Mistral",
      supportsNative: true,
    },

    // GLM
    {
      key: "z-ai/glm-4.5v",
      name: "GLM 4.5V",
      category: "GLM",
      supportsNative: false,
      defaultMiddleware: "morphXml",
    },

    // Others
    {
      key: "openrouter/sonoma-sky-alpha",
      name: "Sonoma Sky Alpha",
      category: "OpenRouter",
      supportsNative: false,
      defaultMiddleware: "hermes",
    },

    {
      key: "x-ai/grok-code-fast-1",
      name: "Grok Code Fast 1",
      category: "xAI",
      supportsNative: true,
    },
    {
      key: "x-ai/grok-4",
      name: "Grok 4",
      category: "xAI",
      supportsNative: true,
    },
    {
      key: "bytedance/ui-tars-1.5-7b",
      name: "UI Tars 1.5 7B",
      category: "Bytedance",
      supportsNative: false,
      defaultMiddleware: "uiTars",
    },
    {
      key: "google/gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      category: "Google",
      supportsNative: false,
    },
  ];

  // Middleware options
  const MIDDLEWARE_OPTIONS = [
    {
      value: "default",
      label: "Default",
      description: "Use model's default configuration",
    },
    {
      value: "none",
      label: "None (Native)",
      description: "Use native tool calling",
    },
    { value: "gemma", label: "Gemma", description: "JSON in markdown fences" },
    {
      value: "hermes",
      label: "Hermes",
      description: "JSON wrapped in XML tags",
    },
    {
      value: "morphXml",
      label: "MorphXML",
      description: "XML elements per tool",
    },
    {
      value: "uiTars",
      label: "UI-TARS",
      description: "UI-TARS function call format",
    },
  ];

  // Initialize from settings store
  let selectedModel = $state(
    settingsStore.state.defaultModel || "anthropic/claude-sonnet-4.5",
  );
  let selectedMiddleware:
    | "gemma"
    | "hermes"
    | "morphXml"
    | "uiTars"
    | "none"
    | null = $state(null);

  // String representation for the select component
  const middlewareSelectValue = $derived(selectedMiddleware || "default");

  // Initialize the transport with the selected model
  $effect(() => {
    if (selectedModel) {
      computerTransport.setModel(selectedModel);
    }
  });

  function switchModel(modelKey: string) {
    selectedModel = modelKey;
    computerTransport.setModel(modelKey);

    // Save to settings store
    settingsStore.state.defaultModel = modelKey;

    // Reset middleware to default when switching models
    selectedMiddleware = null;
    computerTransport.setMiddleware(null);

    const model = MODELS.find((m) => m.key === modelKey);
    toast.success(`Switched to ${model?.name}`);
  }

  function switchMiddleware(
    middleware: "gemma" | "hermes" | "morphXml" | "uiTars" | "none" | null,
  ) {
    selectedMiddleware = middleware;
    computerTransport.setMiddleware(middleware);

    const middlewareOption = MIDDLEWARE_OPTIONS.find(
      (m) => m.value === middleware,
    );
    toast.success(`Middleware: ${middlewareOption?.label}`);
  }

  // Group models by category for better UI
  const groupedModels = $derived(
    MODELS.reduce(
      (acc, model) => {
        if (!acc[model.category]) {
          acc[model.category] = [];
        }
        acc[model.category].push(model);
        return acc;
      },
      {} as Record<string, typeof MODELS>,
    ),
  );

  const isLoading = $derived(
    chat.status === "streaming" || chat.status === "submitted",
  );

  // Prompt input state
  let promptText = $state("");

  // Auto-screenshot setting - sync with settings store
  let autoScreenshot = $state(settingsStore.state.autoScreenshot);

  // Sync auto-screenshot with settings store and tool state
  $effect(() => {
    const enabled = settingsStore.state.autoScreenshot;
    if (typeof enabled === "boolean") {
      setAutoScreenshot(enabled);
      autoScreenshot = enabled;
    }
  });

  function toggleAutoScreenshot() {
    settingsStore.state.autoScreenshot = !settingsStore.state.autoScreenshot;
    toast.success(
      settingsStore.state.autoScreenshot
        ? "Auto-screenshot enabled"
        : "Auto-screenshot disabled",
    );
  }

  function clearChat() {
    chat.messages = [];
    computerTransport.resetUsage();
  }

  function handlePromptSubmit(message: PromptInputMessage) {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    console.log(message.files);

    chat.sendMessage({
      text: message.text || "Sent with attachments",
      files: message.files || [],
    });
    promptText = "";
  }

  function handleModelChange(modelKey: string | undefined) {
    if (modelKey && computerTransport) {
      switchModel(modelKey);
    }
  }

  // Calculate cumulative usage from messages metadata
  const cumulativeUsage = $derived(() => {
    // Find the latest message with cumulative usage metadata
    for (let i = chat.messages.length - 1; i >= 0; i--) {
      const message = chat.messages[i];
      if (message.metadata?.cumulativeUsage) {
        return message.metadata.cumulativeUsage;
      }
    }
    return null;
  });

  // Format token count for display
  function formatTokenCount(count: number | undefined): string {
    if (!count) return "0";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  }
</script>

<div class="flex h-screen flex-col bg-background">
  <!-- Header -->
  <header
    class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
  >
    <div class="flex h-16 items-center justify-between px-4">
      <div class="flex items-center gap-3">
        <Avatar class="size-8">
          <AvatarFallback class="bg-purple-500 text-white">
            <span class="text-sm font-bold">🖥️</span>
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 class="text-lg font-semibold">Computer Use Assistant</h1>
          <p class="text-sm text-muted-foreground">
            I can help you interact with your computer through real screenshots,
            clicks, typing, and more.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Context Usage Display -->
        {#if cumulativeUsage()}
          {@const usage = cumulativeUsage()}
          <Context
            maxTokens={128_000}
            modelId={selectedModel}
            usage={{
              inputTokens: usage?.inputTokens || 0,
              outputTokens: usage?.outputTokens || 0,
              cachedInputTokens: usage?.cachedInputTokens || 0,
              reasoningTokens: usage?.reasoningTokens || 0,
            }}
            usedTokens={usage?.totalTokens || 0}
          >
            <ContextTrigger />
            <ContextContent>
              <ContextContentHeader />
              <ContextContentBody>
                <ContextInputUsage />
                <ContextOutputUsage />
                <ContextReasoningUsage />
              </ContextContentBody>
              <ContextContentFooter />
            </ContextContent>
          </Context>
        {/if}

        <Button
          variant="outline"
          size="sm"
          onclick={() => (window.location.href = "/settings")}
        >
          <Icons name="settings" size={16} />
          <span class="ml-2">Settings</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onclick={() => (window.location.href = "/control-demo")}
        >
          Debug
        </Button>

        {#if chat.messages.length > 0}
          <Button
            variant="outline"
            size="sm"
            onclick={clearChat}
            disabled={isLoading}
          >
            Clear Chat
          </Button>
        {/if}
      </div>
    </div>
  </header>

  <!-- Messages -->
  <Conversation class="flex-1">
    <ConversationContent class="overflow-x-hidden">
      <div
        class="mx-auto flex min-h-full max-w-4xl min-w-0 flex-col gap-6 px-4 pt-4 pb-6"
      >
      {#if chat.messages.length === 0}
        <div class="flex flex-1 items-center justify-center py-8">
          <div class="mx-auto max-w-2xl space-y-6 px-4 text-center">
            <div
              class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/5"
            >
              <span class="text-3xl">🖥️</span>
            </div>
            <div class="space-y-3">
              <h2 class="text-2xl font-bold tracking-tight">
                Computer Use Assistant
              </h2>
              <p class="text-lg text-muted-foreground">
                I can help you interact with your computer through real
                screenshots, clicks, typing, and more. ⚠️ All actions will
                affect your actual desktop.
              </p>
            </div>
            <div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div class="rounded-lg border bg-card p-4">
                <h3 class="mb-2 font-semibold">📸 Screenshot</h3>
                <p class="text-muted-foreground">
                  "Take a screenshot of the desktop"
                </p>
              </div>
              <div class="rounded-lg border bg-card p-4">
                <h3 class="mb-2 font-semibold">🖱️ Click</h3>
                <p class="text-muted-foreground">
                  "Click on the button at coordinates (100, 200)"
                </p>
              </div>
              <div class="rounded-lg border bg-card p-4">
                <h3 class="mb-2 font-semibold">⌨️ Type</h3>
                <p class="text-muted-foreground">
                  "Type 'Hello World' in the text field"
                </p>
              </div>
              <div class="rounded-lg border bg-card p-4">
                <h3 class="mb-2 font-semibold">📜 Scroll</h3>
                <p class="text-muted-foreground">
                  "Scroll down to see more content"
                </p>
              </div>
            </div>
            <div
              class="rounded-lg border-2 border-dashed border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/20"
            >
              <p class="text-sm text-orange-700 dark:text-orange-300">
                <strong>⚠️ Warning:</strong> This uses REAL computer control. All
                actions will affect your actual desktop and applications.
              </p>
            </div>
          </div>
        </div>
      {:else}
        {#each chat.messages as message (message.id)}
          {@const isUser = message.role === "user"}
          {@const isAssistant = message.role === "assistant"}
          <!-- <ComputerMessage {message} isLoading={isLoading && message === chat.messages[chat.messages.length - 1]} /> -->
          <Message from={message.role}>
            <MessageContent>
              {#each message.parts as part, i (`${message.id}-${i}`)}
                {@const { type } = part}

                {#if type === "text"}
                  <Response content={part.text} />
                {:else if type === "file"}
                  <img
                    src={part.url}
                    alt="File"
                    class="h-auto max-h-[300px] max-w-full overflow-hidden rounded-md"
                  />
                {:else if type === "reasoning"}
                  <Reasoning isStreaming={false}>
                    <ReasoningTrigger />
                    <ReasoningContent>
                      <Response content={part.text} />
                    </ReasoningContent>
                  </Reasoning>
                {:else if type === "tool-computer"}
                  <Tool>
                    <ToolHeader
                      type={type.replace("tool-", "")}
                      state={part.state === "output-available" || part.output
                        ? "output-available"
                        : part.state === "output-error" || part.errorText
                          ? "output-error"
                          : "input-available"}
                    />
                    <ToolContent>
                      {@const input = part.input}
                      {@const action = input?.action}
                      {#if type === "tool-computer"}
                        {#if input && part.output}
                          {#if input.action === "screenshot"}
                            <div class="space-y-3">
                              <div class="rounded-md bg-muted/50 p-3">
                                <div class="mb-2 text-sm font-medium">
                                  Screenshot taken
                                </div>
                                <div class="mb-3 text-xs text-muted-foreground">
                                  Real desktop screenshot
                                </div>
                                {#if part.output.value && Array.isArray(part.output.value)}
                                  {#each part.output.value as value}
                                    {#if value && typeof value === "object" && "type" in value && value.type === "media"}
                                      <img
                                        src={`data:${value.mediaType};base64,${value.data?.toString()}`}
                                        alt="Screenshot"
                                        class="w-full max-w-md rounded-lg border shadow-sm"
                                      />
                                    {/if}
                                  {/each}
                                {/if}
                              </div>
                            </div>
                          {:else if input.action === "left_click" || input.action === "right_click"}
                            <div class="space-y-3 rounded-md bg-muted/50 p-3">
                              <div class="flex items-center gap-2">
                                <span class="text-2xl">🖱️</span>
                                <div>
                                  <div class="font-medium">Click Action</div>
                                  <div class="text-sm text-muted-foreground">
                                    {action}
                                    {input?.coordinate
                                      ? `at (${input.coordinate[0]}, ${input.coordinate[1]})`
                                      : ""}
                                  </div>
                                </div>
                              </div>
                              {#if part.output && part.output.type === "content" && part.output.value}
                                {#each part.output.value as value}
                                  {#if value && typeof value === "object" && "type" in value && value.type === "media"}
                                    <img
                                      src={`data:${value.mediaType};base64,${value.data?.toString()}`}
                                      alt="Screenshot after click"
                                      class="w-full max-w-md rounded-lg border shadow-sm"
                                    />
                                  {/if}
                                {/each}
                              {/if}
                            </div>
                          {:else if input.action === "type"}
                            <div class="space-y-3 rounded-md bg-muted/50 p-3">
                              <div class="flex items-center gap-2">
                                <span class="text-2xl">⌨️</span>
                                <div>
                                  <div class="font-medium">Type Action</div>
                                  <div class="text-sm text-muted-foreground">
                                    Typed: "{input?.text}"
                                  </div>
                                </div>
                              </div>
                              {#if part.output && part.output.type === "content" && part.output.value}
                                {#each part.output.value as value}
                                  {#if value && typeof value === "object" && "type" in value && value.type === "media"}
                                    <img
                                      src={`data:${value.mediaType};base64,${value.data?.toString()}`}
                                      alt="Screenshot after typing"
                                      class="w-full max-w-md rounded-lg border shadow-sm"
                                    />
                                  {/if}
                                {/each}
                              {/if}
                            </div>
                          {:else if input.action === "key"}
                            <div class="space-y-3 rounded-md bg-muted/50 p-3">
                              <div class="flex items-center gap-2">
                                <span class="text-2xl">🔑</span>
                                <div>
                                  <div class="font-medium">Key Press</div>
                                  <div class="text-sm text-muted-foreground">
                                    Pressed: {input?.text}
                                  </div>
                                </div>
                              </div>
                              {#if part.output && part.output.type === "content" && part.output.value}
                                {#each part.output.value as value}
                                  {#if value && typeof value === "object" && "type" in value && value.type === "media"}
                                    <img
                                      src={`data:${value.mediaType};base64,${value.data?.toString()}`}
                                      alt="Screenshot after key press"
                                      class="w-full max-w-md rounded-lg border shadow-sm"
                                    />
                                  {/if}
                                {/each}
                              {/if}
                            </div>
                          {:else if input.action === "mouse_move"}
                            <div class="space-y-3 rounded-md bg-muted/50 p-3">
                              <div class="flex items-center gap-2">
                                <span class="text-2xl">🖱️</span>
                                <div>
                                  <div class="font-medium">Mouse Move</div>
                                  {#if input?.coordinate}
                                    <div class="text-sm text-muted-foreground">
                                      Moved to ({input?.coordinate[0]}, {input
                                        ?.coordinate[1]})
                                    </div>
                                  {/if}
                                </div>
                              </div>
                              {#if part.output && part.output.type === "content" && part.output.value}
                                {#each part.output.value as value}
                                  {#if value && typeof value === "object" && "type" in value && value.type === "media"}
                                    <img
                                      src={`data:${value.mediaType};base64,${value.data?.toString()}`}
                                      alt="Screenshot after mouse move"
                                      class="w-full max-w-md rounded-lg border shadow-sm"
                                    />
                                  {/if}
                                {/each}
                              {/if}
                            </div>
                          {:else if input.action === "cursor_position"}
                            <div class="space-y-2 rounded-md bg-muted/50 p-3">
                              <div class="flex items-center gap-2">
                                <span class="text-2xl">📍</span>
                                <div>
                                  <div class="font-medium">Cursor Position</div>
                                  <div class="text-xs text-muted-foreground">
                                    {part.output}
                                  </div>
                                </div>
                              </div>
                            </div>
                          {:else if input.action === "wait"}
                            <div class="space-y-3 rounded-md bg-muted/50 p-3">
                              <div class="flex items-center gap-2">
                                <span class="text-2xl">⏳</span>
                                <div>
                                  <div class="font-medium">Wait Action</div>
                                  {#if input?.duration}
                                    <div class="text-sm text-muted-foreground">
                                      Waited {input.duration} seconds
                                    </div>
                                  {/if}
                                </div>
                              </div>
                              {#if part.output && part.output.type === "content" && part.output.value}
                                {#each part.output.value as value}
                                  {#if value && typeof value === "object" && "type" in value && value.type === "media"}
                                    <img
                                      src={`data:${value.mediaType};base64,${value.data?.toString()}`}
                                      alt="Screenshot after wait"
                                      class="w-full max-w-md rounded-lg border shadow-sm"
                                    />
                                  {/if}
                                {/each}
                              {/if}
                            </div>
                          {:else if input.action === "left_click_drag"}
                            <div class="space-y-3 rounded-md bg-muted/50 p-3">
                              <div class="flex items-center gap-2">
                                <span class="text-2xl">🖱️➡️</span>
                                <div>
                                  <div class="font-medium">Drag Action</div>
                                  <div class="text-sm text-muted-foreground">
                                    Dragged from
                                    {input?.start_coordinate
                                      ? `(${input.start_coordinate[0]}, ${input.start_coordinate[1]})`
                                      : ""}
                                    to
                                    {input?.coordinate
                                      ? `(${input.coordinate[0]}, ${input.coordinate[1]})`
                                      : ""}
                                  </div>
                                </div>
                              </div>
                              {#if part.output && part.output.type === "content" && part.output.value}
                                {#each part.output.value as value}
                                  {#if value && typeof value === "object" && "type" in value && value.type === "media"}
                                    <img
                                      src={`data:${value.mediaType};base64,${value.data?.toString()}`}
                                      alt="Screenshot after drag"
                                      class="w-full max-w-md rounded-lg border shadow-sm"
                                    />
                                  {/if}
                                {/each}
                              {/if}
                            </div>
                          {/if}
                        {:else}
                          <div class="space-y-2 rounded-md bg-muted/50 p-3">
                            <div class="flex items-center gap-2">
                              <span class="text-2xl">🔧</span>
                              <div>
                                <div class="font-medium">
                                  Unknown Tool Computer: {type.replace(
                                    "tool-",
                                    "",
                                  )}
                                </div>
                                {#if action}
                                  <div class="text-sm text-muted-foreground">
                                    Action: {action}
                                  </div>
                                {/if}
                              </div>
                            </div>
                            {#if part.output}
                              <div
                                class="max-h-32 overflow-auto rounded bg-muted p-2 font-mono text-xs text-muted-foreground"
                              >
                                <pre>{formatTruncatedJson(part.output)}</pre>
                              </div>
                            {/if}
                          </div>
                        {/if}
                      {/if}

                      {#if part.input}
                        <ToolInput input={part.input} />
                      {/if}

                      {#if part.output || part.errorText}
                        {@const output = part.output}
                        {#if output && output.type === "text"}
                          <ToolOutput {output} errorText={part.errorText} />
                        {:else if output && output.type === "content"}
                          <!-- part.output.value[].data could be a big base64 string that don't need to be rendered -->
                          {@const outputPrunned = output.value.map((value) => {
                            if (value.type === "media") {
                              return {
                                ...value,
                                data: value.data.substring(0, 10) + "...",
                              };
                            }
                            return value;
                          })}
                          <ToolOutput
                            output={outputPrunned}
                            errorText={part.errorText}
                          />
                        {/if}
                      {/if}
                    </ToolContent>
                  </Tool>
                {/if}
              {/each}

              {#if isLoading && !isUser}
                <Loader>
                  <span class="text-sm"
                    >Analyzing and planning computer actions...</span
                  >
                </Loader>
              {/if}

              <!-- Token usage display for assistant messages -->
              {#if isAssistant && message.metadata?.stepUsage}
                <div class="mt-1 flex justify-end pt-1">
                  <Context
                    maxTokens={128_000}
                    modelId="computer-assistant"
                    usage={{
                      inputTokens: message.metadata.stepUsage.inputTokens || 0,
                      outputTokens:
                        message.metadata.stepUsage.outputTokens || 0,
                      cachedInputTokens:
                        message.metadata.stepUsage.cachedInputTokens || 0,
                      reasoningTokens:
                        message.metadata.stepUsage.reasoningTokens || 0,
                    }}
                    usedTokens={message.metadata.stepUsage.totalTokens || 0}
                  >
                    <ContextTrigger />
                    <ContextContent>
                      <ContextContentHeader />
                      <ContextContentBody>
                        <ContextInputUsage />
                        <ContextOutputUsage />
                        <ContextReasoningUsage />
                      </ContextContentBody>
                      <ContextContentFooter />
                    </ContextContent>
                  </Context>
                </div>
              {/if}
            </MessageContent>

            <MessageAvatar
              name={isUser ? "User" : "Computer Assistant"}
              src={isUser
                ? "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDIxVjE5QzIwIDE2Ljc5MDkgMTguMjA5MSAxNSAxNiAxNUg4QzUuNzkwODYgMTUgNCAxNi43OTA5IDQgMTlWMjEiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8Y2lyY2xlIGN4PSIxMiIgY3k9IjciIHI9IjQiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K"
                : "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGV4dCB4PSIxMiIgeT0iMTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTYiPvCfkqXvuI88L3RleHQ+PC9zdmc+"}
            />
          </Message>
        {/each}

        {#if isLoading && chat.messages.length > 0 && chat.messages[chat.messages.length - 1].role === "user"}
          <div
            class="group is-assistant flex w-full flex-row-reverse items-end justify-end gap-2 py-4 [&>div]:max-w-[80%]"
          >
            <Avatar class="size-8 ring-1 ring-border">
              <AvatarFallback class="bg-purple-500 text-white">
                <span class="text-sm font-bold">🖥️</span>
              </AvatarFallback>
            </Avatar>
            <div
              class="flex flex-col gap-2 overflow-hidden rounded-lg bg-secondary px-4 py-3 text-sm text-foreground"
            >
              <div class="flex items-center gap-2 text-muted-foreground">
                <Icons name="loader" size={16} />
                <span class="text-sm"
                  >Analyzing and planning computer actions...</span
                >
              </div>
            </div>
          </div>
        {/if}
      {/if}
      </div>
    </ConversationContent>
    <ConversationScrollButton />
  </Conversation>

  <!-- Input -->
  <div
    class="sticky bottom-0 border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60"
  >
    <PromptInput
      onSubmit={handlePromptSubmit}
      globalDrop
      multiple
      class="mx-auto max-w-3xl"
    >
      <PromptInputBody>
        <PromptInputAttachments>
          {#snippet children(attachment)}
            <PromptInputAttachment data={attachment} />
          {/snippet}
        </PromptInputAttachments>
        <PromptInputTextarea
          bind:value={promptText}
          placeholder="Describe what you'd like me to do with your computer..."
          class="min-h-[60px] resize-none border-0 bg-transparent px-4 py-4 text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </PromptInputBody>
      <PromptInputToolbar>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>

          <PromptInputButton>
            <Icons name="brain" size={16} />
          </PromptInputButton>

          <!-- Auto-Screenshot Toggle -->
          <PromptInputButton
            onclick={toggleAutoScreenshot}
            class={autoScreenshot ? "bg-primary/10 text-primary" : ""}
            title={autoScreenshot
              ? "Auto-screenshot enabled"
              : "Auto-screenshot disabled"}
          >
            📸
          </PromptInputButton>

          <!-- Model Selector -->
          <Select.Root
            type="single"
            bind:value={selectedModel}
            onValueChange={handleModelChange}
          >
            <Select.Trigger class="h-8 w-[200px] text-sm">
              {MODELS.find((m) => m.key === selectedModel)?.name ||
                "Select Model"}
            </Select.Trigger>
            <Select.Content>
              {#each Object.entries(groupedModels) as [category, models]}
                <Select.Group>
                  <Select.Label>{category}</Select.Label>
                  {#each models as model}
                    <Select.Item value={model.key} label={model.name}>
                      {model.name}
                      {model.supportsNative ? "🔧" : "🛠️"}
                    </Select.Item>
                  {/each}
                </Select.Group>
              {/each}
            </Select.Content>
          </Select.Root>

          <!-- Middleware Selector -->
          <Select.Root
            type="single"
            value={middlewareSelectValue}
            onValueChange={(value) => {
              if (value === "default") {
                switchMiddleware(null);
              } else {
                switchMiddleware(
                  value as "gemma" | "hermes" | "morphXml" | "uiTars" | "none",
                );
              }
            }}
          >
            <Select.Trigger class="h-8 w-[140px] text-sm">
              {MIDDLEWARE_OPTIONS.find((m) => m.value === selectedMiddleware)
                ?.label || "Default"}
            </Select.Trigger>
            <Select.Content>
              {#each MIDDLEWARE_OPTIONS as option}
                <Select.Item value={option.value} label={option.label}>
                  {option.label}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </PromptInputTools>
        <PromptInputSubmit
          status={chat.status}
          onclick={() => {
            if (chat.status && chat.status !== "ready") {
              chat.stop();
            }
          }}
        />
      </PromptInputToolbar>
    </PromptInput>
  </div>
</div>
