<script lang="ts">
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { fetchAssetBifrost, updateAssetBifrost, type AssetBifrostDto } from '$lib/services/asset-bifrost';
  import type { AssetResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    isOwner: boolean;
  }

  let { asset, isOwner }: Props = $props();

  let sidecar = $state<AssetBifrostDto | null>(null);
  let saving = $state(false);

  $effect(() => {
    if (authManager.isSharedLink || !authManager.authenticated) {
      sidecar = null;
      return;
    }
    const assetId = asset.id;
    sidecar = null;
    fetchAssetBifrost(assetId)
      .then((value) => {
        if (asset.id === assetId) {
          sidecar = value;
        }
      })
      .catch((error) => handleError(error, $t('errors.unable_to_load_items')));
  });

  const setScore = async (next: number | null) => {
    if (!isOwner || saving) {
      return;
    }
    saving = true;
    try {
      const updated = await updateAssetBifrost(asset.id, { attractiveScore: next });
      sidecar = updated;
    } catch (error) {
      handleError(error, $t('errors.cant_apply_changes'));
    } finally {
      saving = false;
    }
  };

  const formatNsfw = (value: number | null) => (value === null ? null : `${Math.round(value * 100)}%`);
</script>

{#if !authManager.isSharedLink && authManager.authenticated}
  <section class="px-4 pt-4">
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <span class="text-xs uppercase tracking-wider text-muted">Attractive scale</span>
        {#if sidecar?.attractiveScore != null}
          <button
            type="button"
            class="text-xs text-muted underline-offset-2 hover:underline disabled:opacity-50"
            disabled={!isOwner || saving}
            onclick={() => setScore(null)}
          >
            Clear
          </button>
        {/if}
      </div>
      <div class="flex flex-wrap gap-1">
        {#each Array.from({ length: 10 }, (_, i) => i + 1) as value (value)}
          {@const active = sidecar?.attractiveScore != null && value <= sidecar.attractiveScore}
          <button
            type="button"
            class="h-7 w-7 rounded-md border text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            class:bg-primary={active}
            class:text-on-primary={active}
            class:border-primary={active}
            class:border-muted={!active}
            class:text-muted={!active}
            disabled={!isOwner || saving}
            onclick={() => setScore(value)}
            aria-label={`Set attractive score to ${value}`}
          >
            {value}
          </button>
        {/each}
      </div>

      {#if sidecar?.nsfwScore != null}
        <div class="flex items-center justify-between border-t pt-3">
          <span class="text-xs uppercase tracking-wider text-muted">NSFW score</span>
          <span class="text-sm tabular-nums">{formatNsfw(sidecar.nsfwScore)}</span>
        </div>
      {/if}
    </div>
  </section>
{/if}
