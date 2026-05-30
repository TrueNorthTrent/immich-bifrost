<script lang="ts">
  import {
    createPersonTag,
    fetchPersonTags,
    setTagsForPerson,
    type PersonResponseExtended,
    type PersonTagDto,
  } from '$lib/services/person-tag';
  import { handleError } from '$lib/utils/handle-error';
  import { Icon, toastManager } from '@immich/ui';
  import { mdiClose, mdiPlus } from '@mdi/js';

  interface Props {
    person: PersonResponseExtended;
    tags: PersonTagDto[];
    onClose: () => void;
    onSaved: (personId: string, tagIds: string[]) => void;
    onTagsChanged: (tags: PersonTagDto[]) => void;
  }

  let { person, tags, onClose, onSaved, onTagsChanged }: Props = $props();

  let selected = $state<string[]>([...(person.tagIds ?? [])]);
  let newTagName = $state('');
  let parentForNew = $state<string | null>(null);
  let creating = $state(false);
  let saving = $state(false);

  const toggle = (id: string) => {
    selected = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
  };

  const save = async () => {
    if (saving) return;
    saving = true;
    try {
      await setTagsForPerson(person.id, selected);
      toastManager.primary('Tags updated');
      onSaved(person.id, selected);
    } catch (error) {
      handleError(error, 'Failed to save tags');
    } finally {
      saving = false;
    }
  };

  const onCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const name = newTagName.trim();
    if (!name || creating) return;
    creating = true;
    try {
      const created = await createPersonTag({ name, parentTagId: parentForNew });
      newTagName = '';
      parentForNew = null;
      const result = await fetchPersonTags();
      onTagsChanged(result.tags);
      selected = [...selected, created.id];
    } catch (error) {
      handleError(error, 'Failed to create tag');
    } finally {
      creating = false;
    }
  };

  const topLevel = $derived(tags.filter((t) => t.parentTagId === null));
  const childrenOf = (parentId: string) => tags.filter((t) => t.parentTagId === parentId);
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
  role="dialog"
  aria-modal="true"
  onclick={onClose}
>
  <div
    class="w-full max-w-md rounded-xl bg-white p-4 shadow-xl dark:bg-immich-dark-gray dark:text-white"
    role="document"
    onclick={(event) => event.stopPropagation()}
  >
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-base font-semibold">Tags for {person.name || 'unnamed'}</h2>
      <button type="button" onclick={onClose} class="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
        <Icon icon={mdiClose} size="1em" />
      </button>
    </div>

    <div class="max-h-72 space-y-2 overflow-y-auto pr-1">
      {#each topLevel as tag (tag.id)}
        <label
          class="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <input type="checkbox" checked={selected.includes(tag.id)} onchange={() => toggle(tag.id)} />
          {#if tag.color}
            <span class="inline-block size-2 rounded-full" style="background: {tag.color};"></span>
          {/if}
          <span class="font-medium">{tag.name}</span>
          {#if tag.isSystem}<span class="text-xs text-gray-400">system</span>{/if}
        </label>
        {#each childrenOf(tag.id) as child (child.id)}
          <label
            class="ml-6 flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <input type="checkbox" checked={selected.includes(child.id)} onchange={() => toggle(child.id)} />
            {#if child.color}
              <span class="inline-block size-2 rounded-full" style="background: {child.color};"></span>
            {/if}
            <span>{child.name}</span>
          </label>
        {/each}
      {/each}
    </div>

    <form class="mt-3 flex items-center gap-2" onsubmit={onCreate}>
      <select
        class="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-immich-dark-gray dark:text-white"
        bind:value={parentForNew}
        aria-label="Parent tag"
      >
        <option value={null}>Top-level</option>
        {#each topLevel as tag (tag.id)}
          <option value={tag.id}>Under {tag.name}</option>
        {/each}
      </select>
      <input
        type="text"
        bind:value={newTagName}
        placeholder="New tag"
        class="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-immich-dark-gray dark:text-white"
        maxlength="120"
      />
      <button
        type="submit"
        class="flex items-center gap-1 rounded-md bg-immich-primary px-2 py-1 text-xs text-white disabled:opacity-50 dark:bg-immich-dark-primary dark:text-immich-dark-gray"
        disabled={!newTagName.trim() || creating}
      >
        <Icon icon={mdiPlus} size="0.9em" />
        <span>Add</span>
      </button>
    </form>

    <div class="mt-4 flex items-center justify-end gap-2">
      <button type="button" onclick={onClose} class="rounded-md px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
        Cancel
      </button>
      <button
        type="button"
        onclick={save}
        disabled={saving}
        class="rounded-md bg-immich-primary px-3 py-1 text-sm text-white disabled:opacity-50 dark:bg-immich-dark-primary dark:text-immich-dark-gray"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  </div>
</div>
