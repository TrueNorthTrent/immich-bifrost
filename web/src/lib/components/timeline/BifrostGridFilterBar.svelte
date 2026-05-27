<script lang="ts">
  import { bifrostGridFilter } from '$lib/stores/bifrost-grid-filter.svelte';

  let open = $state(false);

  const onNsfwInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const raw = Number(target.value);
    bifrostGridFilter.setNsfwMax(raw >= 1 ? null : raw);
  };

  const onAttractiveInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const raw = Number(target.value);
    bifrostGridFilter.setAttractiveMin(raw <= 1 ? null : raw);
  };

  const formatNsfw = (value: number | null) => (value === null ? 'off' : `≤ ${Math.round(value * 100)}%`);
  const formatAttractive = (value: number | null) => (value === null ? 'off' : `≥ ${value}`);
</script>

<div class="pointer-events-none absolute right-3 top-3 z-30 flex flex-col items-end gap-2">
  <button
    type="button"
    class="pointer-events-auto rounded-full border border-muted/50 bg-surface/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted shadow-sm backdrop-blur hover:text-on-surface"
    class:border-primary={bifrostGridFilter.isActive}
    class:text-primary={bifrostGridFilter.isActive}
    onclick={() => (open = !open)}
    aria-expanded={open}
  >
    Bifrost filter{bifrostGridFilter.isActive ? ' •' : ''}
  </button>

  {#if open}
    <div
      class="pointer-events-auto flex w-72 flex-col gap-3 rounded-lg border border-muted/40 bg-surface/95 p-3 text-xs shadow-lg backdrop-blur"
    >
      <label class="flex flex-col gap-1">
        <span class="flex items-center justify-between">
          <span class="font-semibold uppercase tracking-wider text-muted">NSFW max</span>
          <span class="tabular-nums text-muted">{formatNsfw(bifrostGridFilter.nsfwScoreMax)}</span>
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={bifrostGridFilter.nsfwScoreMax ?? 1}
          class="w-full accent-primary"
          oninput={onNsfwInput}
          aria-label="Maximum NSFW score"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="flex items-center justify-between">
          <span class="font-semibold uppercase tracking-wider text-muted">Attractive min</span>
          <span class="tabular-nums text-muted">{formatAttractive(bifrostGridFilter.minAttractiveScore)}</span>
        </span>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={bifrostGridFilter.minAttractiveScore ?? 1}
          class="w-full accent-primary"
          oninput={onAttractiveInput}
          aria-label="Minimum attractive score"
        />
      </label>

      {#if bifrostGridFilter.isActive}
        <button
          type="button"
          class="self-end text-muted underline-offset-2 hover:underline"
          onclick={() => bifrostGridFilter.reset()}
        >
          Reset
        </button>
      {/if}
    </div>
  {/if}
</div>
