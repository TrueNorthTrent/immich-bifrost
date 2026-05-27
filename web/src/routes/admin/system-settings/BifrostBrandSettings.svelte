<script lang="ts">
  import { serverThemeManager, type ServerTheme } from '$lib/managers/theme-manager.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { Button, Field, Input, Textarea } from '@immich/ui';
  import { fade } from 'svelte/transition';

  let draft = $state<ServerTheme>({ ...serverThemeManager.value });
  let saving = $state(false);

  const fields: Array<{ key: keyof ServerTheme; label: string; description: string; type: 'color' | 'text' | 'textarea' }> = [
    { key: 'bg', label: 'Background', description: 'Page background color', type: 'color' },
    { key: 'surface', label: 'Surface', description: 'Cards, panels, popovers', type: 'text' },
    { key: 'accent', label: 'Accent', description: 'Primary brand accent', type: 'color' },
    { key: 'accentSoft', label: 'Accent (soft)', description: 'Gradient companion, muted accent', type: 'text' },
    { key: 'fg', label: 'Foreground', description: 'Default text color', type: 'color' },
    { key: 'border', label: 'Border', description: 'Hairlines, dividers', type: 'text' },
    { key: 'font', label: 'Font stack', description: 'CSS font-family declaration', type: 'text' },
    { key: 'wordmark', label: 'Wordmark', description: 'Brand text shown next to the logo mark', type: 'text' },
    { key: 'logoSvg', label: 'Logo SVG', description: 'Optional inline SVG markup. Leave blank for the gradient default.', type: 'textarea' },
  ];

  const save = async () => {
    saving = true;
    try {
      await serverThemeManager.update(draft);
      draft = { ...serverThemeManager.value };
    } catch (error) {
      handleError(error, 'Failed to update theme');
    } finally {
      saving = false;
    }
  };

  const reset = () => {
    draft = { ...serverThemeManager.value };
  };
</script>

<div in:fade={{ duration: 500 }}>
  <form autocomplete="off" onsubmit={(event) => event.preventDefault()}>
    <div class="ms-4 mt-4 flex flex-col gap-4">
      {#each fields as field (field.key)}
        <Field label={field.label} description={field.description}>
          {#if field.type === 'textarea'}
            <Textarea bind:value={draft[field.key]} rows={4} />
          {:else if field.type === 'color'}
            <div class="flex items-center gap-2">
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(draft[field.key]) ? draft[field.key] : '#000000'}
                oninput={(event) => (draft[field.key] = event.currentTarget.value)}
                class="h-10 w-12 cursor-pointer rounded border"
                aria-label="{field.label} color picker"
              />
              <Input bind:value={draft[field.key]} class="flex-1" />
            </div>
          {:else}
            <Input bind:value={draft[field.key]} />
          {/if}
        </Field>
      {/each}

      <div class="flex justify-end gap-2 pt-2">
        <Button color="secondary" onclick={reset} disabled={saving}>Reset</Button>
        <Button color="primary" onclick={save} loading={saving}>Save theme</Button>
      </div>
    </div>
  </form>
</div>
