<script lang="ts">
  /**
   * Drop-in replacement for @immich/ui's <Logo> component. API-compatible
   * (variant, size, class) so call sites stay one-line swaps.
   *
   * v1 of this component renders a clean text wordmark and an optional
   * square icon mark — both driven by themeable values that the theme
   * engine (next patch) will source from server config. Until that
   * lands, defaults below are intentionally neutral / spartan.
   */

  type Variant = 'icon' | 'inline';
  type Size = 'tiny' | 'small' | 'medium' | 'giant';

  interface Props {
    variant?: Variant;
    size?: Size;
    class?: string;
  }

  let { variant = 'inline', size = 'medium', class: className = '' }: Props = $props();

  // Until the theme engine lands these come from a constant. Theme patch
  // will replace this with a store fetched from /api/server/theme.
  const wordmark = 'Photos';

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
  <span
    class="bifrost-logo-mark"
    aria-hidden="true"
    style:width={s.iconSize}
    style:height={s.iconSize}
    style:border-radius="6px"
    style:background="linear-gradient(135deg, var(--bifrost-accent, #00f5ff) 0%, var(--bifrost-accent-soft, rgba(0, 245, 255, 0.45)) 100%)"
    style:flex-shrink="0"
  ></span>
  {#if variant === 'inline'}
    <span style:font-size={s.fontSize}>{wordmark}</span>
  {/if}
</span>

<style>
  .bifrost-logo {
    user-select: none;
  }
</style>
