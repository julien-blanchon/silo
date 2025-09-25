<script lang="ts">
  import type { Chat, UIMessage } from '@ai-sdk/svelte';
  import { Button } from '$lib/components/ui/button';
  import { Textarea } from '$lib/components/ui/textarea';
  import { cn } from '$lib/utils';
  import Icons from './icons.svelte';
  import { onMount } from 'svelte';
  import type { UIDataTypes } from 'ai';
  import type { UITools } from '$lib/tools';
  import type { ComputerUIMessage } from '$lib/types/usage';

  let { 
    chat,
    disabled = false,
    class: className = ''
  }: { 
    chat: Chat<ComputerUIMessage>; 
    disabled?: boolean;
    class?: string;
  } = $props();

  let textareaRef: HTMLTextAreaElement | null = $state(null);
  let input = $state('');

  const isLoading = $derived(chat.status === 'streaming' || chat.status === 'submitted');

  function adjustHeight() {
    if (textareaRef) {
      textareaRef.style.height = 'auto';
      textareaRef.style.height = `${Math.min(textareaRef.scrollHeight, 200)}px`;
    }
  }

  function resetHeight() {
    if (textareaRef) {
      textareaRef.style.height = '60px';
    }
  }

  function handleSubmit(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    
    if (!input.trim() || isLoading || disabled) {
      return;
    }

    chat.sendMessage({ text: input.trim() });
    input = '';
    resetHeight();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      handleSubmit();
    }
  }

  function handleInput() {
    adjustHeight();
  }

  onMount(() => {
    if (textareaRef) {
      textareaRef.focus();
      resetHeight();
    }
  });
</script>

<div class="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
  <form 
    onsubmit={handleSubmit} 
    class={cn(
      'mx-auto max-w-3xl relative rounded-2xl border bg-background shadow-sm transition-all duration-200 hover:shadow-md focus-within:shadow-md focus-within:ring-1 focus-within:ring-ring',
      className
    )}
  >
    <div class="relative">
      <Textarea
        bind:ref={textareaRef}
        bind:value={input}
        placeholder="Send a message..."
        class="min-h-[60px] resize-none border-0 bg-transparent px-4 py-4 pr-12 text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
        rows={1}
        {disabled}
        onkeydown={handleKeydown}
        oninput={handleInput}
      />
      
      <!-- Send/Stop Button - positioned absolutely in the textarea -->
      <div class="absolute right-3 bottom-3">
        {#if isLoading}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            class="h-8 w-8 p-0 rounded-full hover:bg-muted"
            onclick={() => chat.stop()}
          >
            <Icons name="stop" size={16} class="text-muted-foreground" />
          </Button>
        {:else}
          <Button
            type="submit"
            size="sm"
            class="h-8 w-8 p-0 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!input.trim() || disabled}
          >
            <Icons name="arrow-up" size={16} class="text-primary-foreground" />
          </Button>
        {/if}
      </div>
    </div>
    
    {#if input.trim()}
      <div class="px-4 pb-3 pt-1 text-xs text-muted-foreground border-t">
        Press Enter to send, Shift+Enter for new line
      </div>
    {/if}
  </form>
</div>
