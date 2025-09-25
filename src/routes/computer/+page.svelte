<script lang="ts">
  import { Chat } from '@ai-sdk/svelte';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
  import { Button } from '$lib/components/ui/button';
  import ComputerMessage from '$lib/components/elements/computer-message.svelte';
  import ChatInput from '$lib/components/elements/chat-input.svelte';
  import Icons from '$lib/components/elements/icons.svelte';
  import { ComputerTransport } from '$lib/transports/computer-transport';
  import type { UIMessage } from '@ai-sdk/svelte';
  import type { ComputerUIMessage } from '$lib/types/usage';
  let messagesContainer: HTMLDivElement | null = $state(null);
  let endRef: HTMLDivElement | null = $state(null);
  import type { UITools } from '$lib/tools';
  import type { UIDataTypes } from 'ai';

  const computerTransport = new ComputerTransport();
  
  const chat = new Chat<ComputerUIMessage>({
    transport: computerTransport,
    generateId: () => crypto.randomUUID(),
    onError: (error) => {
      console.error('Computer chat error:', error);
      toast.error(error.message || 'Something went wrong');
    },
    onFinish: () => {
      scrollToBottom();
    },
  });

  // Available models grouped by category
  const MODELS = [
    // Anthropic
    { key: 'anthropic/claude-opus-4.1', name: 'Claude Opus 4.1', category: 'Anthropic', supportsNative: true },
    
    // OpenAI
    { key: 'openai/gpt-5', name: 'GPT-5', category: 'OpenAI', supportsNative: true },
    { key: 'openai/gpt-5-nano', name: 'GPT-5 Nano', category: 'OpenAI', supportsNative: true },
    { key: 'openai/gpt-4.1', name: 'GPT 4.1', category: 'OpenAI', supportsNative: true },
    { key: 'openai/o4-mini-high', name: 'O4 Mini High', category: 'OpenAI', supportsNative: true },
    { key: 'openai/o4-mini', name: 'O4 Mini', category: 'OpenAI', supportsNative: true },
    { key: 'openai/gpt-4o', name: 'GPT 4o', category: 'OpenAI', supportsNative: true },
    { key: 'openai/gpt-oss-120b', name: 'GPT OSS 120B', category: 'OpenAI', supportsNative: true },
    
    // LLaMA
    { key: 'meta-llama/llama-4-maverick', name: 'LLaMA 4 Maverick', category: 'LLaMA', supportsNative: true },

    // Qwen
    { key: 'qwen/qwen3-max', name: 'Qwen 3 Max', category: 'Qwen', supportsNative: false, defaultMiddleware: 'hermes' },
    { key: 'qwen/qwen3-235b-a22b-thinking-2507', name: 'Qwen 3 235B Thinking', category: 'Qwen', supportsNative: false, defaultMiddleware: 'hermes' },
    
    // Google
    { key: 'google/gemma-3-27b-it', name: 'Gemma 3 27B IT', category: 'Google', supportsNative: false, defaultMiddleware: 'gemma' },
    
    // Nous Research
    { key: 'nousresearch/hermes-4-405b', name: 'Hermes 4 405B', category: 'Nous Research', supportsNative: false, defaultMiddleware: 'hermes' },
    
    // DeepSeek
    { key: 'deepseek/deepseek-chat-v3.1', name: 'DeepSeek Chat v3.1', category: 'DeepSeek', supportsNative: true },
    
    // Mistral
    { key: 'mistralai/mistral-medium-3.1', name: 'Mistral Medium 3.1', category: 'Mistral', supportsNative: true },
    { key: 'mistralai/codestral-2508', name: 'Codestral 2508', category: 'Mistral', supportsNative: true },
    { key: 'mistralai/pixtral-large-2411', name: 'Pixtral Large 2411', category: 'Mistral', supportsNative: true },
    
    // GLM
    { key: 'z-ai/glm-4.5v', name: 'GLM 4.5V', category: 'GLM', supportsNative: false, defaultMiddleware: 'morphXml' },
    
    // Others
    { key: 'openrouter/sonoma-sky-alpha', name: 'Sonoma Sky Alpha', category: 'OpenRouter', supportsNative: false, defaultMiddleware: 'hermes' },

    { key: 'x-ai/grok-code-fast-1', name: 'Grok Code Fast 1', category: 'xAI', supportsNative: true },
    { key: 'x-ai/grok-4', name: 'Grok 4', category: 'xAI', supportsNative: true },
    { key: 'bytedance/ui-tars-1.5-7b', name: 'UI Tars 1.5 7B', category: 'Bytedance', supportsNative: false, defaultMiddleware: 'uiTars' },
    { key: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', category: 'Google', supportsNative: false },
  ];

  // Middleware options
  const MIDDLEWARE_OPTIONS = [
    { value: null, label: 'Default', description: 'Use model\'s default configuration' },
    { value: 'none', label: 'None (Native)', description: 'Use native tool calling' },
    { value: 'gemma', label: 'Gemma', description: 'JSON in markdown fences' },
    { value: 'hermes', label: 'Hermes', description: 'JSON wrapped in XML tags' },
    { value: 'morphXml', label: 'MorphXML', description: 'XML elements per tool' },
    { value: 'uiTars', label: 'UI-TARS', description: 'UI-TARS function call format' }
  ];
  
  let selectedModel = $state('anthropic/claude-opus-4.1');
  let selectedMiddleware: 'gemma' | 'hermes' | 'morphXml' | 'uiTars' | 'none' | null = $state(null);
  
  function switchModel(modelKey: string) {
    selectedModel = modelKey;
    computerTransport.setModel(modelKey);
    
    // Reset middleware to default when switching models
    selectedMiddleware = null;
    computerTransport.setMiddleware(null);
    
    const model = MODELS.find(m => m.key === modelKey);
    toast.success(`Switched to ${model?.name}`);
  }
  
  function switchMiddleware(middleware: 'gemma' | 'hermes' | 'morphXml' | 'uiTars' | 'none' | null) {
    selectedMiddleware = middleware;
    computerTransport.setMiddleware(middleware);
    
    const middlewareOption = MIDDLEWARE_OPTIONS.find(m => m.value === middleware);
    toast.success(`Middleware: ${middlewareOption?.label}`);
  }
  
  // Group models by category for better UI
  const groupedModels = $derived(MODELS.reduce((acc, model) => {
    if (!acc[model.category]) {
      acc[model.category] = [];
    }
    acc[model.category].push(model);
    return acc;
  }, {} as Record<string, typeof MODELS>));

  chat.status[0]


  const isLoading = $derived(chat.status === 'streaming' || chat.status === 'submitted');

  function scrollToBottom() {
    if (endRef) {
      endRef.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }

  function clearChat() {
    chat.messages = [];
    computerTransport.resetUsage();
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
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  }

  onMount(() => {
    scrollToBottom();
  });

  // Auto-scroll when new messages arrive
  $effect(() => {
    if (chat.messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  });
</script>

<div class="flex h-screen flex-col bg-background">
  <!-- Header -->
  <header class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
            Using: {MODELS.find(m => m.key === selectedModel)?.name}
            {#if selectedMiddleware}
              • {MIDDLEWARE_OPTIONS.find(m => m.value === selectedMiddleware)?.label}
            {:else}
              • Default
            {/if}
            {#if cumulativeUsage()?.totalTokens}
              • {formatTokenCount(cumulativeUsage()?.totalTokens)} tokens
            {/if}
          </p>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <!-- Token Usage Display -->
        {#if cumulativeUsage()}
          {@const usage = cumulativeUsage()}
          <div class="px-2 py-1 text-xs text-muted-foreground border-l border-border">
            <div class="font-mono">
              {formatTokenCount(usage?.totalTokens)}
            </div>
            {#if usage?.inputTokens || usage?.outputTokens}
              <div class="text-[10px] opacity-70">
                {formatTokenCount(usage?.inputTokens)}↑ {formatTokenCount(usage?.outputTokens)}↓
                {#if usage?.reasoningTokens}
                  {formatTokenCount(usage?.reasoningTokens)}⚡
                {/if}
              </div>
            {/if}
          </div>
        {/if}
        
        <!-- Model Selector -->
        <div class="flex flex-col gap-1">
          <select 
            bind:value={selectedModel}
            onchange={(e) => switchModel((e.target as HTMLSelectElement).value)}
            disabled={isLoading}
            class="px-3 py-1 text-sm border rounded-md bg-background min-w-[200px]"
          >
            {#each Object.entries(groupedModels) as [category, models]}
              <optgroup label={category}>
                {#each models as model}
                  <option value={model.key}>
                    {model.name} {model.supportsNative ? '🔧' : '🛠️'}
                  </option>
                {/each}
              </optgroup>
            {/each}
          </select>
        </div>
        
        <!-- Middleware Selector -->
        <div class="flex flex-col gap-1">
          <select 
            bind:value={selectedMiddleware}
            onchange={(e) => {
              const target = e.target as HTMLSelectElement;
              const value = target?.value;
              if (value) {
                switchMiddleware(value === 'null' ? null : value as 'gemma' | 'hermes' | 'morphXml' | 'uiTars' | 'none');
              }
            }}
            disabled={isLoading}
            class="px-3 py-1 text-sm border rounded-md bg-background min-w-[140px]"
            title="Tool calling middleware"
          >
            {#each MIDDLEWARE_OPTIONS as option}
              <option value={option.value} title={option.description}>
                {option.label}
              </option>
            {/each}
          </select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onclick={() => window.location.href = '/'}
        >
          Regular Chat
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
  <div 
    bind:this={messagesContainer}
    class="flex-1 overflow-y-auto overflow-x-hidden"
  >
    <div class="flex flex-col min-w-0 gap-6 pt-4 pb-6 px-4 mx-auto max-w-4xl min-h-full">
      {#if chat.messages.length === 0}
        <div class="flex flex-1 items-center justify-center py-8">
          <div class="text-center space-y-6 max-w-2xl mx-auto px-4">
            <div class="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-full flex items-center justify-center">
              <span class="text-3xl">🖥️</span>
            </div>
            <div class="space-y-3">
              <h2 class="text-2xl font-bold tracking-tight">Computer Use Assistant</h2>
              <p class="text-lg text-muted-foreground">
                I can help you interact with your computer through real screenshots, clicks, typing, and more. 
                ⚠️ All actions will affect your actual desktop.
              </p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div class="p-4 rounded-lg border bg-card">
                <h3 class="font-semibold mb-2">📸 Screenshot</h3>
                <p class="text-muted-foreground">"Take a screenshot of the desktop"</p>
              </div>
              <div class="p-4 rounded-lg border bg-card">
                <h3 class="font-semibold mb-2">🖱️ Click</h3>
                <p class="text-muted-foreground">"Click on the button at coordinates (100, 200)"</p>
              </div>
              <div class="p-4 rounded-lg border bg-card">
                <h3 class="font-semibold mb-2">⌨️ Type</h3>
                <p class="text-muted-foreground">"Type 'Hello World' in the text field"</p>
              </div>
              <div class="p-4 rounded-lg border bg-card">
                <h3 class="font-semibold mb-2">📜 Scroll</h3>
                <p class="text-muted-foreground">"Scroll down to see more content"</p>
              </div>
            </div>
            <div class="p-4 rounded-lg border-2 border-dashed border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
              <p class="text-sm text-orange-700 dark:text-orange-300">
                <strong>⚠️ Warning:</strong> This uses REAL computer control. All actions will affect your actual desktop and applications.
              </p>
            </div>
          </div>
        </div>
      {:else}
        {#each chat.messages as message (message.id)}
          <ComputerMessage {message} isLoading={isLoading && message === chat.messages[chat.messages.length - 1]} />
        {/each}
        
        {#if isLoading && chat.messages.length > 0 && chat.messages[chat.messages.length - 1].role === 'user'}
          <div class="group flex w-full items-end gap-2 py-4 is-assistant flex-row-reverse justify-end [&>div]:max-w-[80%]">
            <Avatar class="size-8 ring-1 ring-border">
              <AvatarFallback class="bg-purple-500 text-white">
                <span class="text-sm font-bold">🖥️</span>
              </AvatarFallback>
            </Avatar>
            <div class="flex flex-col gap-2 overflow-hidden rounded-lg px-4 py-3 text-foreground text-sm bg-secondary">
              <div class="flex items-center gap-2 text-muted-foreground">
                <Icons name="loader" size={16} />
                <span class="text-sm">Analyzing and planning computer actions...</span>
              </div>
            </div>
          </div>
        {/if}
      {/if}
      
      <div bind:this={endRef} class="shrink-0 min-w-[24px] min-h-[24px]"></div>
    </div>
  </div>

  <!-- Input -->
  <ChatInput chat={chat} />
</div>
