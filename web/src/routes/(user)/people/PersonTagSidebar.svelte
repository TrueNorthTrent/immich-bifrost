<script lang="ts">
  import {
    createPersonTag,
    fetchPersonTags,
    updatePersonTag,
    deletePersonTag,
    type PersonTagDto,
  } from '$lib/services/person-tag';
  import { handleError } from '$lib/utils/handle-error';
  import { Icon } from '@immich/ui';
  import { mdiClose, mdiEyeOutline, mdiPlus, mdiTagOutline, mdiTrashCanOutline } from '@mdi/js';

  interface Props {
    tags: PersonTagDto[];
    selectedTagIds: string[];
    overrideDefaultHidden: boolean;
    yearFilter: number | undefined;
    onToggle: (tagId: string) => void | Promise<void>;
    onClear: () => void | Promise<void>;
    onToggleAll: () => void | Promise<void>;
    onYearSelect: (year: number | undefined) => void | Promise<void>;
    onTagsChanged: (tags: PersonTagDto[]) => void;
  }

  let {
    tags,
    selectedTagIds,
    overrideDefaultHidden,
    yearFilter,
    onToggle,
    onClear,
    onToggleAll,
    onYearSelect,
    onTagsChanged,
  }: Props = $props();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => currentYear - i);

  let newTagName = $state('');
  let parentForNew = $state<string | null>(null);
  let savingNew = $state(false);

  const hasSelection = $derived(selectedTagIds.length > 0 || overrideDefaultHidden || yearFilter !== undefined);

  const refresh = async () => {
    try {
      const result = await fetchPersonTags();
      onTagsChanged(result.tags);
    } catch (error) {
      handleError(error, 'Failed to refresh tags');
    }
  };

  const onCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const name = newTagName.trim();
    if (!name || savingNew) return;
    savingNew = true;
    try {
      await createPersonTag({ name, parentTagId: parentForNew });
      newTagName = '';
      parentForNew = null;
      await refresh();
    } catch (error) {
      handleError(error, 'Failed to create tag');
    } finally {
      savingNew = false;
    }
  };

  const onRename = async (tag: PersonTagDto) => {
    const name = prompt('Rename tag', tag.name);
    if (!name || name === tag.name) return;
    try {
      await updatePersonTag(tag.id, { name });
      await refresh();
    } catch (error) {
      handleError(error, 'Failed to rename tag');
    }
  };

  const onDelete = async (tag: PersonTagDto) => {
    if (tag.isSystem) return;
    if (!confirm(`Delete tag "${tag.name}"? This won't delete the people.`)) return;
    try {
      await deletePersonTag(tag.id);
      await refresh();
    } catch (error) {
      handleError(error, 'Failed to delete tag');
    }
  };

  const topLevel = $derived(tags.filter((t) => t.parentTagId === null));
  const childrenOf = (parentId: string) => tags.filter((t) => t.parentTagId === parentId);
</script>

<aside class="mb-4 rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-immich-dark-gray">
  <div class="mb-2 flex items-center justify-between gap-2">
    <div class="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200">
      <Icon icon={mdiTagOutline} size="1em" />
      <span>Tags</span>
    </div>
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 {overrideDefaultHidden
          ? 'text-immich-primary dark:text-immich-dark-primary'
          : 'text-gray-500'}"
        onclick={onToggleAll}
        title="Include people in default-hidden tags"
      >
        <Icon icon={mdiEyeOutline} size="0.9em" />
        <span>Show all</span>
      </button>
      {#if hasSelection}
        <button
          type="button"
          class="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          onclick={onClear}
        >
          <Icon icon={mdiClose} size="0.9em" />
          <span>Clear</span>
        </button>
      {/if}
    </div>
  </div>

  <div class="mb-2 flex flex-wrap gap-1.5 text-xs text-gray-600 dark:text-gray-300">
    <span class="self-center text-gray-400">Seen in:</span>
    {#each years as year (year)}
      {@const active = yearFilter === year}
      <button
        type="button"
        class="rounded-md border px-2 py-0.5 transition-colors {active
          ? 'border-immich-primary bg-immich-primary text-white dark:border-immich-dark-primary dark:bg-immich-dark-primary dark:text-immich-dark-gray'
          : 'border-gray-300 hover:border-immich-primary hover:text-immich-primary dark:border-gray-700'}"
        onclick={() => onYearSelect(year)}
      >
        {year}
      </button>
    {/each}
  </div>

  <div class="flex flex-wrap gap-2">
    {#each topLevel as tag (tag.id)}
      {@const selected = selectedTagIds.includes(tag.id)}
      <div class="group flex items-center gap-1">
        <button
          type="button"
          class="flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors {selected
            ? 'border-immich-primary bg-immich-primary text-white dark:border-immich-dark-primary dark:bg-immich-dark-primary dark:text-immich-dark-gray'
            : 'border-gray-300 text-gray-700 hover:border-immich-primary hover:text-immich-primary dark:border-gray-700 dark:text-gray-200'}"
          onclick={() => onToggle(tag.id)}
          ondblclick={() => !tag.isSystem && onRename(tag)}
          style={tag.color ? `border-color: ${tag.color};` : undefined}
        >
          {#if tag.color}
            <span class="inline-block size-2 rounded-full" style="background: {tag.color};"></span>
          {/if}
          <span>{tag.name}</span>
          {#if tag.peopleCount !== undefined}
            <span class="opacity-70">{tag.peopleCount}</span>
          {/if}
        </button>
        {#if !tag.isSystem}
          <button
            type="button"
            class="invisible rounded p-1 text-gray-400 hover:text-red-500 group-hover:visible"
            onclick={() => onDelete(tag)}
            aria-label="Delete tag"
          >
            <Icon icon={mdiTrashCanOutline} size="0.8em" />
          </button>
        {/if}
      </div>
      {#each childrenOf(tag.id) as child (child.id)}
        {@const childSelected = selectedTagIds.includes(child.id)}
        <div class="group flex items-center gap-1">
          <button
            type="button"
            class="flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors {childSelected
              ? 'border-immich-primary bg-immich-primary text-white dark:border-immich-dark-primary dark:bg-immich-dark-primary dark:text-immich-dark-gray'
              : 'border-dashed border-gray-300 text-gray-600 hover:border-immich-primary hover:text-immich-primary dark:border-gray-700 dark:text-gray-300'}"
            onclick={() => onToggle(child.id)}
            ondblclick={() => onRename(child)}
            style={child.color ? `border-color: ${child.color};` : undefined}
          >
            <span class="opacity-60">{tag.name} /</span>
            <span>{child.name}</span>
            {#if child.peopleCount !== undefined}
              <span class="opacity-70">{child.peopleCount}</span>
            {/if}
          </button>
          <button
            type="button"
            class="invisible rounded p-1 text-gray-400 hover:text-red-500 group-hover:visible"
            onclick={() => onDelete(child)}
            aria-label="Delete tag"
          >
            <Icon icon={mdiTrashCanOutline} size="0.8em" />
          </button>
        </div>
      {/each}
    {/each}
  </div>

  <form class="mt-3 flex items-center gap-2" onsubmit={onCreate}>
    <select
      class="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-immich-dark-gray dark:text-white"
      bind:value={parentForNew}
      aria-label="Parent tag"
    >
      <option value={null}>New top-level tag</option>
      {#each topLevel as tag (tag.id)}
        <option value={tag.id}>Subtag under {tag.name}</option>
      {/each}
    </select>
    <input
      type="text"
      bind:value={newTagName}
      placeholder="Tag name"
      class="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-immich-dark-gray dark:text-white"
      maxlength="120"
    />
    <button
      type="submit"
      class="flex items-center gap-1 rounded-md bg-immich-primary px-2 py-1 text-xs text-white disabled:opacity-50 dark:bg-immich-dark-primary dark:text-immich-dark-gray"
      disabled={!newTagName.trim() || savingNew}
    >
      <Icon icon={mdiPlus} size="0.9em" />
      <span>Add</span>
    </button>
  </form>
</aside>
