<script lang="ts">
  import { Chat } from '@ai-sdk/svelte';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
  import { Button } from '$lib/components/ui/button';
  import Message from './message.svelte';
  import ChatInput from './chat-input.svelte';
  import Icons from './icons.svelte';
  import { CustomChatTransport } from '$lib/transports/chat-transport';

  let messagesContainer: HTMLDivElement | null = $state(null);
  let endRef: HTMLDivElement | null = $state(null);

  const chat = new Chat({
    transport: new CustomChatTransport(),
    generateId: () => crypto.randomUUID(),
    onError: (error) => {
      console.error('Chat error:', error);
      toast.error(error.message || 'Something went wrong');
    },
    onFinish: () => {
      scrollToBottom();
    }
  });

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
          <AvatarFallback class="bg-primary text-primary-foreground">
            <Icons name="sparkles" size={16} />
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 class="text-lg font-semibold">AI Assistant</h1>
          <p class="text-sm text-muted-foreground">Powered by GPT-4o</p>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onclick={() => window.location.href = '/computer'}
        >
          🖥️ Computer Use
        </Button>

        <Button
          variant="outline"
          size="sm"
          onclick={() => window.location.href = '/control-demo'}
        >
          Control Demo
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
              <div class="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
                <Icons name="sparkles" size={32} class="text-primary" />
              </div>
              <div class="space-y-3">
                <h2 class="text-2xl font-bold tracking-tight">Welcome to AI Assistant</h2>
                <p class="text-lg text-muted-foreground">
                  Start a conversation with your AI assistant. I can help with calculations, weather information, 
                  time queries, and much more!
                </p>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div class="p-4 rounded-lg border bg-card">
                  <h3 class="font-semibold mb-2">🌤️ Weather</h3>
                  <p class="text-muted-foreground">"What's the weather in Tokyo?"</p>
                </div>
                <div class="p-4 rounded-lg border bg-card">
                  <h3 class="font-semibold mb-2">🧮 Calculator</h3>
                  <p class="text-muted-foreground">"Calculate 15 * 23 + 7"</p>
                </div>
                <div class="p-4 rounded-lg border bg-card">
                  <h3 class="font-semibold mb-2">🕒 Time</h3>
                  <p class="text-muted-foreground">"What time is it in New York?"</p>
                </div>
                <div class="p-4 rounded-lg border bg-card">
                  <h3 class="font-semibold mb-2">🌡️ Temperature</h3>
                  <p class="text-muted-foreground">"Convert 75°F to Celsius"</p>
                </div>
              </div>
            </div>
          </div>
        {:else}
          {#each chat.messages as message (message.id)}
            <Message {message} isLoading={isLoading && message === chat.messages[chat.messages.length - 1]} />
          {/each}
          
          {#if isLoading && chat.messages.length > 0 && chat.messages[chat.messages.length - 1].role === 'user'}
            <div class="group flex w-full items-end gap-2 py-4 is-assistant flex-row-reverse justify-end [&>div]:max-w-[80%]">
              <Avatar class="size-8 ring-1 ring-border">
                <AvatarFallback class="bg-muted">
                  <Icons name="sparkles" size={14} />
                </AvatarFallback>
              </Avatar>
              <div class="flex flex-col gap-2 overflow-hidden rounded-lg px-4 py-3 text-foreground text-sm bg-secondary">
                <div class="flex items-center gap-2 text-muted-foreground">
                  <Icons name="loader" size={16} />
                  <span class="text-sm">Thinking...</span>
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
