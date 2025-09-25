<script lang="ts">
  import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '$lib/components/ui/collapsible';
  import { Badge } from '$lib/components/ui/badge';
  import { cn } from '$lib/utils';
  import Icons from './icons.svelte';
    import { truncateJson } from '$lib/utils/truncate';

  let {
    type,
    state,
    input,
    output,
    error,
    defaultOpen = true,
    class: className = '',
    children
  }: {
    type: string;
    state: 'pending' | 'running' | 'completed' | 'error';
    input?: any;
    output?: any;
    error?: string;
    defaultOpen?: boolean;
    class?: string;
    children?: any;
  } = $props();

  const getStatusBadge = (status: typeof state) => {
    const configs = {
      'pending': { 
        label: 'Pending', 
        icon: 'circle', 
        variant: 'secondary' as const,
        iconClass: 'text-muted-foreground'
      },
      'running': { 
        label: 'Running', 
        icon: 'clock', 
        variant: 'secondary' as const,
        iconClass: 'text-blue-600 animate-pulse'
      },
      'completed': { 
        label: 'Completed', 
        icon: 'check-circle', 
        variant: 'secondary' as const,
        iconClass: 'text-green-600'
      },
      'error': { 
        label: 'Error', 
        icon: 'x-circle', 
        variant: 'destructive' as const,
        iconClass: 'text-red-600'
      }
    };
    
    return configs[status];
  };

  const badgeConfig = getStatusBadge(state);
  const toolDisplayName = type.replace('tool-', '').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
</script>

<Collapsible 
  class={cn('not-prose mb-4 w-full rounded-lg border bg-card', className)} 
  open={defaultOpen}
>
  <CollapsibleTrigger class="group flex w-full items-center justify-between gap-2 p-4 text-left hover:bg-accent/50 transition-colors">
    <div class="flex items-center gap-3 min-w-0 flex-1">
      <Icons name="wrench" size={16} class="text-muted-foreground shrink-0" />
      <span class="font-medium text-sm truncate">{toolDisplayName}</span>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <Badge class="rounded-full text-xs flex items-center gap-1.5" variant={badgeConfig.variant}>
        <Icons name={badgeConfig.icon} size={12} class={badgeConfig.iconClass} />
        <span>{badgeConfig.label}</span>
      </Badge>
      <Icons 
        name="chevron-down" 
        size={16} 
        class="text-muted-foreground transition-transform group-data-[state=open]:rotate-180" 
      />
    </div>
  </CollapsibleTrigger>
  
  <CollapsibleContent class="border-t">
    <!-- Custom content if provided -->
    {#if children}
      <div class="p-4">
        {@render children?.()}
      </div>
    {/if}
    
    <!-- Parameters section -->
    {#if input}
      <div class="space-y-3 p-4 border-t border-border/50 bg-muted/20">
        <div class="flex items-center gap-2">
          <h4 class="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Parameters
          </h4>
          <Badge variant="outline" class="text-xs">
            Input
          </Badge>
        </div>
        <div class="rounded-md bg-background border overflow-hidden">
          <div class="bg-muted/50 px-3 py-2 border-b">
            <span class="text-xs font-mono text-muted-foreground">JSON</span>
          </div>
          <pre class="overflow-x-auto p-3 text-xs font-mono leading-relaxed max-h-40">
{JSON.stringify(input, null, 2)}
          </pre>
        </div>
      </div>
    {/if}
    
    <!-- Output/Error section -->
    {#if output || error}
      <div class="space-y-3 p-4 border-t border-border/50 bg-muted/20">
        <div class="flex items-center gap-2">
          <h4 class="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {error ? 'Error' : 'Result'}
          </h4>
          <Badge variant={error ? 'destructive' : 'default'} class="text-xs">
            {error ? 'Error' : 'Output'}
          </Badge>
        </div>
        <div class={cn(
          'rounded-md border overflow-hidden',
          error 
            ? 'bg-destructive/5 border-destructive/20' 
            : 'bg-background border-border'
        )}>
          {#if error}
            <div class="bg-destructive/10 px-3 py-2 border-b border-destructive/20">
              <span class="text-xs font-mono text-destructive">Error</span>
            </div>
            <div class="p-3 text-sm text-destructive font-medium">{error}</div>
          {:else if output}
            <div class="bg-muted/50 px-3 py-2 border-b">
              <span class="text-xs font-mono text-muted-foreground">JSON</span>
            </div>
            <pre class="overflow-x-auto p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-40">
{JSON.stringify(truncateJson(output), null, 2)}
            </pre>
          {/if}
        </div>
      </div>
    {/if}
  </CollapsibleContent>
</Collapsible>
