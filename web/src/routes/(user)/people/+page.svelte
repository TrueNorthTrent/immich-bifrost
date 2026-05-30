<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { scrollMemory } from '$lib/actions/scroll-memory';
  import { shortcut } from '$lib/actions/shortcut';
  import PeopleCard from './PeopleCard.svelte';
  import PeopleInfiniteScroll from './PeopleInfiniteScroll.svelte';
  import SearchPeople from '$lib/components/faces-page/PeopleSearch.svelte';
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { QueryParameter, SessionStorageKey } from '$lib/constants';
  import PersonMergeSuggestionModal from '$lib/modals/PersonMergeSuggestionModal.svelte';
  import { Route } from '$lib/route';
  import { locale } from '$lib/stores/preferences.store';
  import { websocketEvents } from '$lib/stores/websocket';
  import { handlePromiseError } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { clearQueryParam } from '$lib/utils/navigation';
  import { getPerson, searchPerson, updatePerson, type PersonResponseDto } from '@immich/sdk';
  import {
    fetchPeopleExtended,
    type PeopleSortBy,
    type PersonResponseExtended,
    type PersonTagDto,
    type SortOrder,
  } from '$lib/services/person-tag';
  import PersonTagSidebar from './PersonTagSidebar.svelte';
  import PersonTagPicker from './PersonTagPicker.svelte';
  import { Button, Icon, modalManager, toastManager } from '@immich/ui';
  import { mdiAccountOff, mdiEyeOutline, mdiTagOutline } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let searchName = $state('');
  let newName = $state('');
  let currentPage = $state(1);
  let nextPage = $state(data.people.hasNextPage ? 2 : null);
  let personMerge1 = $state<PersonResponseDto>();
  let personMerge2 = $state<PersonResponseDto>();
  let potentialMergePeople: PersonResponseDto[] = $state([]);
  let editingPerson: PersonResponseDto | null = $state(null);
  let searchedPeopleLocal: PersonResponseDto[] = $state([]);
  let innerHeight = $state(0);
  let searchPeopleElement = $state<ReturnType<typeof SearchPeople>>();
  let sortBy = $state<PeopleSortBy>(data.filters.sortBy);
  let sortOrder = $state<SortOrder>(data.filters.sortOrder);
  let selectedTagIds = $state<string[]>(data.filters.tagIds);
  let overrideDefaultHidden = $state<boolean>(data.filters.overrideDefaultHidden);
  let tags = $state<PersonTagDto[]>(data.tags);
  let tagPickerPerson = $state<PersonResponseExtended | null>(null);

  onMount(() => {
    const getSearchedPeople = $page.url.searchParams.get(QueryParameter.SEARCHED_PEOPLE);
    if (getSearchedPeople) {
      searchName = getSearchedPeople;
      if (searchPeopleElement) {
        handlePromiseError(searchPeopleElement.searchPeople(true, searchName));
      }
    }

    return websocketEvents.on('on_person_thumbnail', (personId: string) => {
      for (const person of people) {
        if (person.id === personId) {
          person.updatedAt = new Date().toISOString();
        }
      }
    });
  });

  const loadInitialScroll = () =>
    new Promise<void>((resolve) => {
      // Load up to previously loaded page when returning.
      let newNextPage = sessionStorage.getItem(SessionStorageKey.INFINITE_SCROLL_PAGE);
      if (newNextPage && nextPage) {
        let startingPage = nextPage,
          pagesToLoad = Number.parseInt(newNextPage) - nextPage;

        if (pagesToLoad) {
          handlePromiseError(
            Promise.all(
              Array.from({ length: pagesToLoad }).map((_, i) => {
                return fetchPeopleExtended({
                  withHidden: true,
                  page: startingPage + i,
                  sortBy,
                  sortOrder,
                  tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
                  overrideDefaultHidden,
                });
              }),
            ).then((pages) => {
              for (const page of pages) {
                people = people.concat(page.people);
              }
              currentPage = startingPage + pagesToLoad - 1;
              nextPage = pages.at(-1)?.hasNextPage ? startingPage + pagesToLoad : null;
              resolve(); // wait until extra pages are loaded
            }),
          );
        } else {
          resolve();
        }
        sessionStorage.removeItem(SessionStorageKey.INFINITE_SCROLL_PAGE);
      }
    });

  const loadNextPage = async () => {
    if (!nextPage) {
      return;
    }

    try {
      const { people: newPeople, hasNextPage } = await fetchPeopleExtended({
        withHidden: true,
        page: nextPage,
        sortBy,
        sortOrder,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        overrideDefaultHidden,
      });
      people = people.concat(newPeople);
      if (nextPage !== null) {
        currentPage = nextPage;
      }
      nextPage = hasNextPage ? nextPage + 1 : null;
    } catch (error) {
      handleError(error, $t('errors.failed_to_load_people'));
    }
  };

  const handleSearch = async () => {
    const getSearchedPeople = $page.url.searchParams.get(QueryParameter.SEARCHED_PEOPLE);
    if (getSearchedPeople !== searchName) {
      $page.url.searchParams.set(QueryParameter.SEARCHED_PEOPLE, searchName);
      await goto($page.url, { keepFocus: true });
    }
  };

  const handleMerge = async () => {
    if (!editingPerson || !personMerge1 || !personMerge2) {
      return;
    }

    const response = await modalManager.show(PersonMergeSuggestionModal, {
      personToMerge: personMerge1,
      personToBeMergedInto: personMerge2,
      potentialMergePeople,
    });

    if (!response) {
      await updateName(personMerge1.id, newName);
      return;
    }

    const [personToMerge, personToBeMergedInto] = response;

    const mergedPerson = await getPerson({ id: personToBeMergedInto.id });

    people = people.filter((person: PersonResponseDto) => person.id !== personToMerge.id);
    people = people.map((person: PersonResponseDto) => (person.id === personToBeMergedInto.id ? mergedPerson : person));

    if (personToBeMergedInto.name !== newName && editingPerson.id === personToBeMergedInto.id) {
      /*
       *
       * If the user merges one of the suggested people into the person he's editing, it's merging the suggested person AND renames
       * the person he's editing
       *
       */
      try {
        await updatePerson({ id: personToBeMergedInto.id, personUpdateDto: { name: newName } });

        for (const person of people) {
          if (person.id === personToBeMergedInto.id) {
            person.name = newName;
            break;
          }
        }
        toastManager.primary($t('change_name_successfully'));
      } catch (error) {
        handleError(error, $t('errors.unable_to_save_name'));
      }
    }
  };

  const handleHidePerson = async (detail: PersonResponseDto) => {
    try {
      const updatedPerson = await updatePerson({
        id: detail.id,
        personUpdateDto: { isHidden: true },
      });

      people = people.map((person: PersonResponseDto) => {
        if (person.id === updatedPerson.id) {
          return updatedPerson;
        }
        return person;
      });

      toastManager.primary($t('changed_visibility_successfully'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_hide_person'));
    }
  };

  const handleToggleFavorite = async (detail: PersonResponseDto) => {
    try {
      const updatedPerson = await updatePerson({
        id: detail.id,
        personUpdateDto: { isFavorite: !detail.isFavorite },
      });

      people = people.map((person: PersonResponseDto) => {
        if (person.id === updatedPerson.id) {
          return updatedPerson;
        }
        return person;
      });

      toastManager.primary(updatedPerson.isFavorite ? $t('added_to_favorites') : $t('removed_from_favorites'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_add_remove_favorites', { values: { favorite: detail.isFavorite } }));
    }
  };

  const handleMergePeople = async (detail: PersonResponseDto) => {
    await goto(Route.viewPerson(detail, { previousRoute: Route.people(), action: 'merge' }));
  };

  const onResetSearchBar = async () => {
    await clearQueryParam(QueryParameter.SEARCHED_PEOPLE, $page.url);
  };

  const applyFilters = async () => {
    const url = new URL($page.url);
    url.searchParams.delete('sortBy');
    url.searchParams.delete('sortOrder');
    url.searchParams.delete('tagId');
    url.searchParams.delete('all');
    if (sortBy !== 'default') url.searchParams.set('sortBy', sortBy);
    if (sortOrder !== 'desc') url.searchParams.set('sortOrder', sortOrder);
    for (const id of selectedTagIds) url.searchParams.append('tagId', id);
    if (overrideDefaultHidden) url.searchParams.set('all', '1');
    sessionStorage.removeItem(SessionStorageKey.INFINITE_SCROLL_PAGE);
    await goto(url, { keepFocus: true, noScroll: false, invalidateAll: true });
  };

  const onSortChange = async (event: Event) => {
    sortBy = (event.target as HTMLSelectElement).value as PeopleSortBy;
    if (sortBy === 'name') {
      sortOrder = 'asc';
    } else if (sortBy === 'firstSeen' || sortBy === 'lastSeen') {
      sortOrder = 'desc';
    }
    await applyFilters();
  };

  const onToggleTag = async (tagId: string) => {
    selectedTagIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];
    await applyFilters();
  };

  const onClearTags = async () => {
    if (selectedTagIds.length === 0 && !overrideDefaultHidden) return;
    selectedTagIds = [];
    overrideDefaultHidden = false;
    await applyFilters();
  };

  const onToggleAll = async () => {
    overrideDefaultHidden = !overrideDefaultHidden;
    await applyFilters();
  };

  const onOpenTagPicker = (person: PersonResponseExtended) => {
    tagPickerPerson = person;
  };

  const onTagsSavedForPerson = (personId: string, tagIds: string[]) => {
    people = people.map((p) => (p.id === personId ? { ...p, tagIds } : p));
    tagPickerPerson = null;
  };

  const onTagsChanged = (updated: PersonTagDto[]) => {
    tags = updated;
  };

  let people = $state<PersonResponseExtended[]>(data.people.people);

  $effect(() => {
    people = data.people.people;
    nextPage = data.people.hasNextPage ? 2 : null;
    tags = data.tags;
  });

  let visiblePeople = $derived(people.filter((people) => !people.isHidden));
  let countVisiblePeople = $derived(searchName ? searchedPeopleLocal.length : data.people.total - data.people.hidden);
  let showPeople = $derived(searchName ? searchedPeopleLocal : visiblePeople);

  const onNameChangeInputFocus = (person: PersonResponseDto) => {
    editingPerson = person;
    newName = person.name;
  };

  const onNameChangeSubmit = async (name: string, targetPerson: PersonResponseDto) => {
    try {
      if (name == targetPerson.name) {
        return;
      }

      if (name === '') {
        await updateName(targetPerson.id, '');
        return;
      }

      const personWithSimilarName = await findPeopleWithSimilarName(name, targetPerson.id);
      if (personWithSimilarName) {
        personMerge1 = targetPerson;
        personMerge2 = personWithSimilarName;
        potentialMergePeople = people
          .filter(
            (person: PersonResponseDto) =>
              personMerge2?.name.toLowerCase() === person.name.toLowerCase() &&
              person.id !== personMerge2.id &&
              person.id !== personMerge1?.id &&
              !person.isHidden,
          )
          .slice(0, 3);
        await handleMerge();
        return;
      }
      await updateName(targetPerson.id, name);
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_name'));
    }
  };

  const onNameChangeInputUpdate = (event: Event) => {
    if (event.target) {
      newName = (event.target as HTMLInputElement).value;
    }
  };

  const updateName = async (id: string, name: string) => {
    await updatePerson({
      id,
      personUpdateDto: { name },
    });

    newName = '';
  };

  const findPeopleWithSimilarName = async (name: string, personId: string) => {
    const searchResult = await searchPerson({ name, withHidden: true });
    return searchResult.find(
      (person) => person.name.toLowerCase() === name.toLowerCase() && person.id !== personId && person.name,
    );
  };

  const onPersonUpdate = (response: PersonResponseDto) => {
    people = people.map((person: PersonResponseDto) => {
      if (person.id === response.id) {
        return response;
      }
      return person;
    });
  };
</script>

<svelte:window bind:innerHeight />

<OnEvents {onPersonUpdate} />

<UserPageLayout
  title={$t('people')}
  description={countVisiblePeople === 0 && !searchName ? undefined : `(${countVisiblePeople.toLocaleString($locale)})`}
  use={[
    [
      scrollMemory,
      {
        routeStartsWith: Route.people(),
        beforeSave: () => {
          if (currentPage) {
            sessionStorage.setItem(SessionStorageKey.INFINITE_SCROLL_PAGE, currentPage.toString());
          }
        },
        beforeClear: () => {
          sessionStorage.removeItem(SessionStorageKey.INFINITE_SCROLL_PAGE);
        },
        beforeLoad: loadInitialScroll,
      },
    ],
  ]}
>
  {#snippet buttons()}
    {#if people.length > 0}
      <div class="flex items-center justify-center gap-2">
        <div class="hidden sm:block">
          <div class="h-10 w-40 lg:w-80">
            <SearchPeople
              bind:this={searchPeopleElement}
              type="searchBar"
              placeholder={$t('search_people')}
              onReset={onResetSearchBar}
              onSearch={handleSearch}
              bind:searchName
              bind:searchedPeopleLocal
            />
          </div>
        </div>
        <select
          class="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-immich-dark-gray dark:text-white"
          value={sortBy}
          onchange={onSortChange}
          aria-label="Sort people"
        >
          <option value="default">Most faces</option>
          <option value="name">Name (A–Z)</option>
          <option value="lastSeen">Recently seen</option>
          <option value="firstSeen">First seen (oldest)</option>
        </select>
        <Button
          leadingIcon={mdiEyeOutline}
          onclick={() => goto('/people/manage')}
          size="small"
          variant="ghost"
          color="secondary">{$t('show_and_hide_people')}</Button
        >
      </div>
    {/if}
  {/snippet}

  <PersonTagSidebar
    {tags}
    {selectedTagIds}
    {overrideDefaultHidden}
    onToggle={onToggleTag}
    onClear={onClearTags}
    onToggleAll={onToggleAll}
    onTagsChanged={onTagsChanged}
  />

  {#if countVisiblePeople > 0 && (!searchName || searchedPeopleLocal.length > 0)}
    <PeopleInfiniteScroll people={showPeople} hasNextPage={!!nextPage && !searchName} {loadNextPage}>
      {#snippet children({ person })}
        <div
          class="rounded-xl border-2 border-transparent p-2 transition-all hover:border-immich-primary/50 hover:bg-gray-200 hover:shadow-sm hover:dark:border-immich-dark-primary/25 dark:hover:bg-immich-dark-primary/20"
        >
          <PeopleCard
            {person}
            onMergePeople={() => handleMergePeople(person)}
            onHidePerson={() => handleHidePerson(person)}
            onToggleFavorite={() => handleToggleFavorite(person)}
          />

          <input
            type="text"
            class="mt-2 w-full rounded-2xl border-gray-100 bg-white py-2 text-center text-sm text-primary placeholder-gray-400 dark:border-gray-900 dark:bg-immich-dark-gray"
            value={person.name}
            placeholder={$t('add_a_name')}
            use:shortcut={{ shortcut: { key: 'Enter' }, onShortcut: (e) => e.currentTarget.blur() }}
            onfocusin={() => onNameChangeInputFocus(person)}
            onfocusout={() => onNameChangeSubmit(newName, person)}
            oninput={(event) => onNameChangeInputUpdate(event)}
          />

          <button
            type="button"
            class="mt-1 flex w-full items-center justify-center gap-1 rounded-md py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-immich-primary dark:hover:bg-immich-dark-primary/20 dark:hover:text-immich-dark-primary"
            onclick={() => onOpenTagPicker(person as PersonResponseExtended)}
            aria-label="Edit tags"
          >
            <Icon icon={mdiTagOutline} size="0.9em" />
            <span>
              {((person as PersonResponseExtended).tagIds?.length ?? 0) === 0
                ? 'Tag'
                : `${(person as PersonResponseExtended).tagIds!.length} tag${
                    (person as PersonResponseExtended).tagIds!.length === 1 ? '' : 's'
                  }`}
            </span>
          </button>
        </div>
      {/snippet}
    </PeopleInfiniteScroll>
  {:else}
    <div class="flex min-h-[calc(66vh-11rem)] w-full place-content-center items-center dark:text-white">
      <div class="flex flex-col content-center items-center text-center">
        <Icon icon={mdiAccountOff} size="3.5em" />
        <p class="mt-5 line-clamp-2 max-w-lg overflow-hidden text-3xl font-medium">
          {$t(searchName ? 'search_no_people_named' : 'search_no_people', { values: { name: searchName } })}
        </p>
      </div>
    </div>
  {/if}

  {#if tagPickerPerson}
    <PersonTagPicker
      person={tagPickerPerson}
      {tags}
      onClose={() => (tagPickerPerson = null)}
      onSaved={onTagsSavedForPerson}
      onTagsChanged={onTagsChanged}
    />
  {/if}
</UserPageLayout>
