<script lang="ts">
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
  import { Badge } from '$lib/components/ui/badge';
  import { cn } from '$lib/utils';
  import Icons from './icons.svelte';
  import Response from './response.svelte';
  import Tool from './tool.svelte';
  import Weather from './weather.svelte';
  import type { ComputerUIMessage } from '$lib/types/usage';

  let { 
    message,
    isLoading = false 
  }: { 
    message: ComputerUIMessage; 
    isLoading?: boolean;
  } = $props();

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
</script>

<div class={cn(
  'group flex w-full items-end justify-end gap-2 py-4',
  isUser ? 'is-user' : 'is-assistant flex-row-reverse justify-end',
  '[&>div]:max-w-[80%]'
)}>
  <!-- Avatar for assistant -->
  {#if isAssistant}
    <Avatar class="size-8 ring-1 ring-border">
      <AvatarFallback class="bg-muted">
        <Icons name="sparkles" size={14} />
      </AvatarFallback>
    </Avatar>
  {/if}

  <!-- Content -->
  <div class={cn(
    'flex flex-col gap-2 overflow-hidden rounded-lg px-4 py-3 text-foreground text-sm',
    'group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground',
    'group-[.is-assistant]:bg-secondary group-[.is-assistant]:text-foreground'
  )}>
    {#each message.parts as part, i (`${message.id}-${i}`)}
      {#if part.type === 'text'}
        <div class="group-[.is-user]:dark">
          <Response content={part.text} />
        </div>
        <!-- Collapsible tool display -->
      {:else if part.type === 'file'}
        pass
      {:else if part.type === 'source-document'}
        pass
      {:else if part.type === 'source-url'}
        pass
      {:else if part.type === 'reasoning'}
        pass
      {:else if part.type === 'step-start'}
        pass
      {:else if part.type === 'dynamic-tool'}
        pass
      {:else if part.type === 'tool-computer'}
          <Tool 
            type={part.toolCallId}
            state={part.output ? 'completed' : (part.errorText ? 'error' : 'running')}
            input={part.input}
            output={part.output}
            error={part.errorText}
          >
          </Tool>
      {:else}
        pass
      {/if}
    {/each}

    {#if isLoading && !isUser}
      <div class="flex items-center gap-2 text-muted-foreground">
        <Icons name="loader" size={16} />
        <span class="text-sm">Thinking...</span>
      </div>
    {/if}
  </div>

  <!-- Avatar for user -->
  {#if isUser}
    <Avatar class="size-8 ring-1 ring-border">
      <AvatarFallback class="bg-primary text-primary-foreground">
        <Icons name="user" size={14} />
      </AvatarFallback>
    </Avatar>
  {/if}
</div>
