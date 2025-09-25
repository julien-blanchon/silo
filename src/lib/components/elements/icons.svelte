<script lang="ts">
  import { cn } from '$lib/utils';

  let { 
    name, 
    size = 16, 
    class: className = '' 
  }: { 
    name: string; 
    size?: number; 
    class?: string; 
  } = $props();
</script>

{#if name === 'arrow-up'}
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={className}
  >
    <path d="M7 17L17 7" />
    <path d="M7 7H17V17" />
  </svg>
{:else if name === 'stop'}
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={className}
  >
    <rect width="6" height="6" x="9" y="9" rx="1" />
  </svg>
{:else if name === 'user'}
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={className}
  >
    <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" />
    <circle cx="12" cy="7" r="4" />
  </svg>
{:else if name === 'sparkles'}
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={className}
  >
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063L7.5 12L8.5 9.937A2 2 0 0 0 9.937 8.5L12 7.5L14.063 8.5A2 2 0 0 0 15.5 9.937L16.5 12L15.5 14.063A2 2 0 0 0 14.063 15.5L12 16.5L9.937 15.5Z" />
    <path d="M20 3V7" />
    <path d="M22 5H18" />
    <path d="M4 17V21" />
    <path d="M6 19H2" />
  </svg>
{:else if name === 'loader'}
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    class={cn('animate-spin', className)}
  >
    <g clip-path="url(#clip0_2393_1490)">
      <path d="M8 0V4" stroke="currentColor" stroke-width="1.5" />
      <path
        d="M8 16V12"
        opacity="0.5"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <path
        d="M3.29773 1.52783L5.64887 4.7639"
        opacity="0.9"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <path
        d="M12.7023 1.52783L10.3511 4.7639"
        opacity="0.1"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <path
        d="M12.7023 14.472L10.3511 11.236"
        opacity="0.4"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <path
        d="M3.29773 14.472L5.64887 11.236"
        opacity="0.6"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <path
        d="M15.6085 5.52783L11.8043 6.7639"
        opacity="0.2"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <path
        d="M0.391602 10.472L4.19583 9.23598"
        opacity="0.7"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <path
        d="M15.6085 10.4722L11.8043 9.2361"
        opacity="0.3"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <path
        d="M0.391602 5.52783L4.19583 6.7639"
        opacity="0.8"
        stroke="currentColor"
        stroke-width="1.5"
      />
    </g>
    <defs>
      <clipPath id="clip0_2393_1490">
        <rect fill="white" height="16" width="16" />
      </clipPath>
    </defs>
  </svg>
{:else if name === 'wrench'}
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={className}
  >
    <path d="M14.7 6.3A1 1 0 0 0 16 5L19 2L22 5L19 8A1 1 0 0 0 17.7 9.3L8.21 18.79A1 1 0 0 1 7.5 19.29L4.71 16.5A1 1 0 0 1 5.21 15.79L14.7 6.3Z" />
  </svg>
{:else if name === 'chevron-down'}
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={className}
  >
    <path d="M6 9L12 15L18 9" />
  </svg>
{:else if name === 'check-circle'}
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={className}
  >
    <path d="M22 11.08V12A10 10 0 1 1 5.93 7.69" />
    <path d="M13 17L9 13L13 9" />
  </svg>
{:else if name === 'clock'}
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={className}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
{:else if name === 'circle'}
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={className}
  >
    <circle cx="12" cy="12" r="10" />
  </svg>
{:else if name === 'x-circle'}
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9L9 15" />
    <path d="M9 9L15 15" />
  </svg>
{:else if name === 'brain'}
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={className}
  >
    <path d="M12 5A3 3 0 1 0 9 8A5.009 5.009 0 0 0 4 13C4 15.209 5.791 17 8 17H16A5 5 0 0 0 21 12A3 3 0 0 0 18 9A3 3 0 0 0 15 6A3 3 0 0 0 12 5Z" />
  </svg>
{/if}
