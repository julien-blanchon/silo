<script lang="ts">
  import Markdown from 'svelte-exmarkdown';
  import { gfmPlugin } from 'svelte-exmarkdown/gfm';
  import { cn } from '$lib/utils';

  let { 
    content, 
    class: className = '' 
  }: { 
    content: string; 
    class?: string; 
  } = $props();
</script>

<div class={cn(
  'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_code]:break-words [&_code]:whitespace-pre-wrap',
  className
)}>
  <Markdown md={content} plugins={[gfmPlugin()]}>
    {#snippet ol(props)}
      {@const { children, ...rest } = props}
      <ol {...rest} class={cn('ml-4 list-outside list-decimal space-y-1', rest.class)}>
        {@render children?.()}
      </ol>
    {/snippet}
    
    {#snippet ul(props)}
      {@const { children, ...rest } = props}
      <ul {...rest} class={cn('ml-4 list-outside list-disc space-y-1', rest.class)}>
        {@render children?.()}
      </ul>
    {/snippet}
    
    {#snippet li(props)}
      {@const { children, ...rest } = props}
      <li {...rest} class={cn('leading-relaxed', rest.class)}>
        {@render children?.()}
      </li>
    {/snippet}
    
    {#snippet p(props)}
      {@const { children, ...rest } = props}
      <p {...rest} class={cn('leading-relaxed [&:not(:first-child)]:mt-4', rest.class)}>
        {@render children?.()}
      </p>
    {/snippet}
    
    {#snippet strong(props)}
      {@const { children, ...rest } = props}
      <strong {...rest} class={cn('font-semibold', rest.class)}>
        {@render children?.()}
      </strong>
    {/snippet}
    
    {#snippet a(props)}
      {@const { children, ...rest } = props}
      <a
        {...rest}
        class={cn('text-primary underline underline-offset-4 hover:no-underline', rest.class)}
        target="_blank"
        rel="noopener noreferrer"
      >
        {@render children?.()}
      </a>
    {/snippet}
    
    {#snippet h1(props)}
      {@const { children, ...rest } = props}
      <h1 {...rest} class={cn('mt-6 mb-4 text-2xl font-bold tracking-tight', rest.class)}>
        {@render children?.()}
      </h1>
    {/snippet}
    
    {#snippet h2(props)}
      {@const { children, ...rest } = props}
      <h2 {...rest} class={cn('mt-6 mb-3 text-xl font-semibold tracking-tight', rest.class)}>
        {@render children?.()}
      </h2>
    {/snippet}
    
    {#snippet h3(props)}
      {@const { children, ...rest } = props}
      <h3 {...rest} class={cn('mt-5 mb-2 text-lg font-semibold tracking-tight', rest.class)}>
        {@render children?.()}
      </h3>
    {/snippet}
    
    {#snippet h4(props)}
      {@const { children, ...rest } = props}
      <h4 {...rest} class={cn('mt-4 mb-2 text-base font-semibold tracking-tight', rest.class)}>
        {@render children?.()}
      </h4>
    {/snippet}
    
    {#snippet blockquote(props)}
      {@const { children, ...rest } = props}
      <blockquote {...rest} class={cn('mt-6 border-l-4 border-border pl-4 italic text-muted-foreground', rest.class)}>
        {@render children?.()}
      </blockquote>
    {/snippet}
    
    {#snippet code(props)}
      {@const { children, ...rest } = props}
      {#if typeof rest.class === 'string' && rest.class.includes('language-')}
        <!-- Code block -->
        <div class="not-prose my-4 overflow-hidden rounded-lg border bg-muted">
          <div class="flex items-center justify-between bg-muted/50 px-4 py-2 text-xs">
            <span class="text-muted-foreground font-mono">
              {rest.class.replace('language-', '')}
            </span>
          </div>
          <pre class="overflow-x-auto p-4 text-sm leading-relaxed">
            <code class="font-mono" {...rest}>
              {@render children?.()}
            </code>
          </pre>
        </div>
      {:else}
        <!-- Inline code -->
        <code
          class={cn(
            'relative rounded-md bg-muted px-1.5 py-0.5 font-mono text-sm font-medium',
            rest.class
          )}
          {...rest}
        >
          {@render children?.()}
        </code>
      {/if}
    {/snippet}
    
    {#snippet pre(props)}
      {@const { children, ...rest } = props}
      <div class="not-prose my-4 overflow-hidden rounded-lg border bg-muted">
        <pre
          class={cn('overflow-x-auto p-4 text-sm leading-relaxed', rest.class)}
          {...rest}
        >
          {@render children?.()}
        </pre>
      </div>
    {/snippet}
    
    {#snippet table(props)}
      {@const { children, ...rest } = props}
      <div class="my-6 w-full overflow-y-auto">
        <table {...rest} class={cn('w-full border-collapse border border-border', rest.class)}>
          {@render children?.()}
        </table>
      </div>
    {/snippet}
    
    {#snippet th(props)}
      {@const { children, ...rest } = props}
      <th
        {...rest}
        class={cn(
          'border border-border px-4 py-2 text-left font-semibold bg-muted/50 [&[align=center]]:text-center [&[align=right]]:text-right',
          rest.class
        )}
      >
        {@render children?.()}
      </th>
    {/snippet}
    
    {#snippet td(props)}
      {@const { children, ...rest } = props}
      <td
        {...rest}
        class={cn(
          'border border-border px-4 py-2 [&[align=center]]:text-center [&[align=right]]:text-right',
          rest.class
        )}
      >
        {@render children?.()}
      </td>
    {/snippet}
  </Markdown>
</div>
