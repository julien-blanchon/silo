<script lang="ts">
  import type { UIMessage } from '@ai-sdk/svelte';
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
  import { Badge } from '$lib/components/ui/badge';
  import { cn } from '$lib/utils';
  import Icons from './icons.svelte';
  import Response from './response.svelte';
  import Tool from './tool.svelte';
  import { formatTruncatedJson } from '$lib/utils/truncate';
  import type { UITools } from '$lib/tools';
  import type { UIDataTypes } from 'ai';
  import type { JSONValue } from '@ai-sdk/provider';
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
  
  // Format token count for display
  function formatTokenCount(count: number | undefined): string {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  }
</script>

<div class={cn(
  'group flex w-full items-end gap-2 py-4',
  'group-data-[role=assistant]:flex-row-reverse group-data-[role=assistant]:justify-end',
  'group-data-[role=user]:flex-row group-data-[role=user]:justify-start',
  '[&>div]:max-w-[80%]'
)}
  data-role={message.role}
>
  <!-- Avatar for assistant -->
  {#if isAssistant}
    <Avatar class="size-8 ring-1 ring-border">
      <AvatarFallback class="bg-purple-500 text-white">
        <span class="text-xs font-bold">🖥️</span>
      </AvatarFallback>
    </Avatar>
  {/if}

  <!-- Content -->
  <div class={cn(
    'flex flex-col gap-2 overflow-hidden rounded-lg px-4 py-3 text-foreground text-sm',
    'group-data-[role=assistant]:bg-secondary group-data-[role=assistant]:text-foreground',
    'group-data-[role=user]:bg-primary group-data-[role=user]:text-primary-foreground'
  )}>
    {#each message.parts as part, i (`${message.id}-${i}`)}
      {@const { type } = part}
      
      {#if type === 'text'}
        <div class="group-data-[role=user]:dark">
          <Response content={part.text} />
        </div>
      {:else if type === 'reasoning'}
        <div class="group-data-[role=user]:dark">
          <h3 class="text-sm font-medium">Reasoning</h3>
          <Response content={part.text} class="mt-2 p-2 bg-blue-50 border-l-2 border-blue-300 text-blue-800 text-sm"/>
        </div>
      {:else if type === 'tool-computer'}        
        <Tool 
          type={type.replace('tool-', '')}
          state={part.state === 'output-available' || part.output ? 'completed' : (part.state === 'output-error' || part.errorText ? 'error' : 'running')}
          input={part.input}
          output={part.output}
          error={part.errorText}
          defaultOpen={true}
        >
          {@const input = part.input}
          {@const action = input?.action}
          {#if type === 'tool-computer'}
            {#if input && part.output}
              {#if input.action === 'screenshot'}
                <div class="space-y-3">
                  <div class="p-3 bg-muted/50 rounded-md">
                    <div class="text-sm font-medium mb-2">Screenshot taken</div>
                    <div class="text-xs text-muted-foreground mb-3">
                      Real desktop screenshot
                    </div>
                    {#if part.output.value && Array.isArray(part.output.value)}
                      {#each part.output.value as value}
                        {#if value && typeof value === 'object' && 'type' in value && value.type === 'media'}
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
              {:else if input.action === 'left_click' || input.action === 'right_click'}
                <div class="p-3 bg-muted/50 rounded-md space-y-2">
                  <div class="flex items-center gap-2">
                    <span class="text-2xl">🖱️</span>
                    <div>
                      <div class="font-medium">Click Action</div>
                      <div class="text-sm text-muted-foreground">
                        {action} {input?.coordinate ? `at (${input.coordinate[0]}, ${input.coordinate[1]})` : ''}
                      </div>
                      <div class="text-xs text-muted-foreground">{part.output}</div>
                    </div>
                  </div>
                </div>
              {:else if input.action === 'type'}
                <div class="p-3 bg-muted/50 rounded-md space-y-2">
                  <div class="flex items-center gap-2">
                    <span class="text-2xl">⌨️</span>
                    <div>
                      <div class="font-medium">Type Action</div>
                      <div class="text-sm text-muted-foreground">
                        Typed: "{input?.text}"
                      </div>
                      <div class="text-xs text-muted-foreground">{part.output}</div>
                    </div>
                  </div>
                </div>
              {:else if input.action === 'key'}
                <div class="p-3 bg-muted/50 rounded-md space-y-2">
                  <div class="flex items-center gap-2">
                    <span class="text-2xl">🔑</span>
                    <div>
                      <div class="font-medium">Key Press</div>
                      <div class="text-sm text-muted-foreground">
                        Pressed: {input?.text}
                      </div>
                      <div class="text-xs text-muted-foreground">{part.output}</div>
                    </div>
                  </div>
                </div>
              {:else if input.action === 'mouse_move'}
                <div class="p-3 bg-muted/50 rounded-md space-y-2">
                  <div class="flex items-center gap-2">
                    <span class="text-2xl">🖱️</span>
                    <div>
                      <div class="font-medium">Mouse Move</div>
                      {#if input?.coordinate}
                        <div class="text-sm text-muted-foreground">
                          Moved to ({input?.coordinate[0]}, {input?.coordinate[1]})
                        </div>
                      {/if}
                      <div class="text-xs text-muted-foreground">{part.output}</div>
                    </div>
                  </div>
                </div>
              {:else if input.action === 'cursor_position'}
                <div class="p-3 bg-muted/50 rounded-md space-y-2">
                  <div class="flex items-center gap-2">
                    <span class="text-2xl">📍</span>
                    <div>
                      <div class="font-medium">Cursor Position</div>
                      <div class="text-xs text-muted-foreground">{part.output}</div>
                    </div>
                  </div>
                </div>
              {/if}
            {:else}
              <div class="p-3 bg-muted/50 rounded-md space-y-2">
                <div class="flex items-center gap-2">
                  <span class="text-2xl">🔧</span>
                  <div>
                    <div class="font-medium">Unknown Tool Computer: {type.replace('tool-', '')}</div>
                    {#if action}
                      <div class="text-sm text-muted-foreground">Action: {action}</div>
                    {/if}
                  </div>
                </div>
                {#if part.output}
                  <div class="text-xs text-muted-foreground font-mono bg-muted p-2 rounded overflow-auto max-h-32">
                    <pre>{formatTruncatedJson(part.output)}</pre>
                  </div>
                {/if}
              </div>
            {/if}
          {/if}
        </Tool>
      {/if}
    {/each}

    {#if isLoading && !isUser}
      <div class="flex items-center gap-2 text-muted-foreground">
        <Icons name="loader" size={16} />
        <span class="text-sm">Thinking...</span>
      </div>
    {/if}
    
    <!-- Token usage display for assistant messages -->
    {#if isAssistant && message.metadata?.stepUsage}
      <div class="mt-1 pt-1 text-right">
        <div class="text-[10px] text-muted-foreground/60 font-mono">
          {formatTokenCount(message.metadata.stepUsage.totalTokens)}
          {#if message.metadata.stepUsage.inputTokens || message.metadata.stepUsage.outputTokens}
            <span class="opacity-50">
              ({formatTokenCount(message.metadata.stepUsage.inputTokens)}↑{formatTokenCount(message.metadata.stepUsage.outputTokens)}↓{#if message.metadata.stepUsage.reasoningTokens}{formatTokenCount(message.metadata.stepUsage.reasoningTokens)}⚡{/if})
            </span>
          {/if}
        </div>
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
