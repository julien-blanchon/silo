<script lang="ts">
  import { Chat } from '@ai-sdk/svelte';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
  import { Button } from '$lib/components/ui/button';
  import ComputerMessage from '$lib/components/elements/computer-message.svelte';
  import ChatInput from '$lib/components/elements/chat-input.svelte';
  import Icons from '$lib/components/elements/icons.svelte';
  import { ComputerTransport } from '$lib/transports/computer-transport.old';
  import type { UIMessage } from '@ai-sdk/svelte';
  let messagesContainer: HTMLDivElement | null = $state(null);
  let endRef: HTMLDivElement | null = $state(null);
  import type { UITools } from '$lib/tools';
  import type { UIDataTypes } from 'ai';

  const chat = new Chat<UIMessage<unknown, UIDataTypes, UITools>>({
    transport: new ComputerTransport(),
    generateId: () => crypto.randomUUID(),
    onError: (error) => {
      console.error('Computer chat error:', error);
      toast.error(error.message || 'Something went wrong');
    },
    onFinish: () => {
      scrollToBottom();
    },
  });

  chat.status[0]


  const isLoading = $derived(chat.status === 'streaming' || chat.status === 'submitted');

  function scrollToBottom() {
    if (endRef) {
      endRef.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }

  function clearChat() {
    chat.messages = [];
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
          <p class="text-sm text-muted-foreground">Powered by Claude with Computer Tools</p>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
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
  <ChatInput {chat} />
</div>
