<script lang="ts">
  import { serverThemeManager } from '$lib/managers/theme-manager.svelte';

  type Variant = 'icon' | 'inline';
  type Size = 'tiny' | 'small' | 'medium' | 'giant';

  interface Props {
    variant?: Variant;
    size?: Size;
    class?: string;
  }

  let { variant = 'inline', size = 'medium', class: className = '' }: Props = $props();

  const wordmark = $derived(serverThemeManager.value.wordmark);
  const logoSvg = $derived(serverThemeManager.value.logoSvg);

  const sizeStyles: Record<Size, { fontSize: string; iconSize: string; gap: string }> = {
    tiny: { fontSize: '0.875rem', iconSize: '1.25rem', gap: '0.375rem' },
    small: { fontSize: '1rem', iconSize: '1.5rem', gap: '0.5rem' },
    medium: { fontSize: '1.125rem', iconSize: '2rem', gap: '0.625rem' },
    giant: { fontSize: '2rem', iconSize: '4rem', gap: '0.875rem' },
  };

  const s = $derived(sizeStyles[size]);
</script>

<span
  class="bifrost-logo {className}"
  style:display="inline-flex"
  style:align-items="center"
  style:gap={s.gap}
  style:font-family="var(--bifrost-font, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif)"
  style:font-weight="600"
  style:letter-spacing="0.02em"
  style:color="var(--bifrost-fg, currentColor)"
>
  {#if logoSvg}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <span
      class="bifrost-logo-mark"
      aria-hidden="true"
      style:width={s.iconSize}
      style:height={s.iconSize}
      style:flex-shrink="0"
      style:display="inline-flex"
      style:align-items="center"
      style:justify-content="center"
      style:color="var(--bifrost-accent, #00f5ff)"
    >
      {@html logoSvg}
    </span>
  {:else}
    <span
      class="bifrost-logo-mark"
      aria-hidden="true"
      style:width={s.iconSize}
      style:height={s.iconSize}
      style:border-radius="6px"
      style:background="linear-gradient(135deg, var(--bifrost-accent, #00f5ff) 0%, var(--bifrost-accent-soft, rgba(0, 245, 255, 0.45)) 100%)"
      style:flex-shrink="0"
    ></span>
  {/if}
  {#if variant === 'inline'}
    <span style:font-size={s.fontSize}>{wordmark}</span>
  {/if}
</span>

<style>
  .bifrost-logo {
    user-select: none;
  }
</style>
