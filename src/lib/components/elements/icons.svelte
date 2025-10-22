<script lang="ts">
  import { cn } from "$lib/utils";

  let {
    name,
    size = 16,
    class: className = "",
  }: {
    name: string;
    size?: number;
    class?: string;
  } = $props();
</script>

{#if name === "arrow-up"}
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
{:else if name === "stop"}
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
{:else if name === "user"}
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
    <path
      d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21"
    />
    <circle cx="12" cy="7" r="4" />
  </svg>
{:else if name === "sparkles"}
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
    <path
      d="M9.937 15.5A2 2 0 0 0 8.5 14.063L7.5 12L8.5 9.937A2 2 0 0 0 9.937 8.5L12 7.5L14.063 8.5A2 2 0 0 0 15.5 9.937L16.5 12L15.5 14.063A2 2 0 0 0 14.063 15.5L12 16.5L9.937 15.5Z"
    />
    <path d="M20 3V7" />
    <path d="M22 5H18" />
    <path d="M4 17V21" />
    <path d="M6 19H2" />
  </svg>
{:else if name === "loader"}
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    class={cn("animate-spin", className)}
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
{:else if name === "wrench"}
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
    <path
      d="M14.7 6.3A1 1 0 0 0 16 5L19 2L22 5L19 8A1 1 0 0 0 17.7 9.3L8.21 18.79A1 1 0 0 1 7.5 19.29L4.71 16.5A1 1 0 0 1 5.21 15.79L14.7 6.3Z"
    />
  </svg>
{:else if name === "chevron-down"}
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
{:else if name === "check-circle"}
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
{:else if name === "clock"}
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
{:else if name === "circle"}
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
{:else if name === "x-circle"}
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
{:else if name === "brain"}
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
    <path
      d="M12 5A3 3 0 1 0 9 8A5.009 5.009 0 0 0 4 13C4 15.209 5.791 17 8 17H16A5 5 0 0 0 21 12A3 3 0 0 0 18 9A3 3 0 0 0 15 6A3 3 0 0 0 12 5Z"
    />
  </svg>
{:else if name === "settings"}
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
    <path
      d="M12.22 2H11.78C11.2496 2 10.8105 2.39139 10.7488 2.91862L10.5618 4.43384C10.2268 4.58568 9.90762 4.76563 9.60543 4.97099L8.18134 4.46925C7.68333 4.30497 7.14019 4.52843 6.8887 4.99778L6.66895 5.40222C6.41745 5.87157 6.53109 6.44918 6.93816 6.77887L8.15326 7.73663C8.10357 8.07423 8.07801 8.41854 8.07801 8.76852C8.07801 9.1185 8.10357 9.46281 8.15326 9.80041L6.93816 10.7582C6.53109 11.0879 6.41745 11.6655 6.66895 12.1348L6.8887 12.5393C7.14019 13.0086 7.68333 13.2321 8.18134 13.0678L9.60543 12.566C9.90762 12.7714 10.2268 12.9513 10.5618 13.1032L10.7488 14.6184C10.8105 15.1456 11.2496 15.537 11.78 15.537H12.22C12.7504 15.537 13.1895 15.1456 13.2512 14.6184L13.4382 13.1032C13.7732 12.9513 14.0924 12.7714 14.3946 12.566L15.8187 13.0678C16.3167 13.2321 16.8598 13.0086 17.1113 12.5393L17.3311 12.1348C17.5826 11.6655 17.4689 11.0879 17.0618 10.7582L15.8467 9.80041C15.8964 9.46281 15.922 9.1185 15.922 8.76852C15.922 8.41854 15.8964 8.07423 15.8467 7.73663L17.0618 6.77887C17.4689 6.44918 17.5826 5.87157 17.3311 5.40222L17.1113 4.99778C16.8598 4.52843 16.3167 4.30497 15.8187 4.46925L14.3946 4.97099C14.0924 4.76563 13.7732 4.58568 13.4382 4.43384L13.2512 2.91862C13.1895 2.39139 12.7504 2 12.22 2Z"
    />
    <circle cx="12" cy="8.76852" r="2.5" />
  </svg>
{:else if name === "arrow-left"}
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
    <path d="M19 12H5" />
    <path d="M12 19L5 12L12 5" />
  </svg>
{:else if name === "eye"}
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
    <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
{:else if name === "eye-off"}
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
    <path d="M9.88 9.88A3 3 0 1 0 14.12 14.12" />
    <path
      d="M10.73 5.08A10.43 10.43 0 0 1 12 5C19 5 23 12 23 12A13.16 13.16 0 0 1 19.38 16.38"
    />
    <path
      d="M6.61 6.61A13.526 13.526 0 0 0 1 12S5 19 12 19A9.74 9.74 0 0 0 14.65 18.65"
    />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
{:else if name === "save"}
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
    <path
      d="M19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H16L21 8V19A2 2 0 0 1 19 21Z"
    />
    <polyline points="17,21 17,13 7,13 7,21" />
    <polyline points="7,3 7,8 15,8" />
  </svg>
{:else if name === "refresh-ccw"}
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
    <path d="M3 12A9 9 0 0 0 12 21A9 9 0 0 0 21 12" />
    <path d="M3 12A9 9 0 0 1 12 3A9 9 0 0 1 21 12" />
    <polyline points="3,4 3,12 11,12" />
    <polyline points="21,20 21,12 13,12" />
  </svg>
{:else if name === "rotate-ccw"}
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
    <polyline points="1,4 1,10 7,10" />
    <path d="M3.51 15A9 9 0 1 0 2.13 9.36L1 10" />
  </svg>
{:else if name === "check"}
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
    <polyline points="20,6 9,17 4,12" />
  </svg>
{/if}
