import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { fetchPeopleExtended, fetchPersonTags, type PeopleSortBy, type SortOrder } from '$lib/services/person-tag';
import type { PageLoad } from './$types';

const parseSort = (raw: string | null): PeopleSortBy => {
  switch (raw) {
    case 'name':
    case 'firstSeen':
    case 'lastSeen':
    case 'default':
      return raw;
    default:
      return 'default';
  }
};

const parseOrder = (raw: string | null): SortOrder => (raw === 'asc' ? 'asc' : 'desc');

export const load = (async ({ url }) => {
  await authenticate(url);

  const sortBy = parseSort(url.searchParams.get('sortBy'));
  const sortOrder = parseOrder(url.searchParams.get('sortOrder'));
  const tagIds = url.searchParams.getAll('tagId');
  const overrideDefaultHidden = url.searchParams.get('all') === '1';

  const [people, tagList] = await Promise.all([
    fetchPeopleExtended({
      withHidden: true,
      sortBy,
      sortOrder,
      tagIds: tagIds.length > 0 ? tagIds : undefined,
      overrideDefaultHidden,
    }),
    fetchPersonTags().catch(() => ({ tags: [] })),
  ]);
  const $t = await getFormatter();

  return {
    people,
    tags: tagList.tags,
    filters: { sortBy, sortOrder, tagIds, overrideDefaultHidden },
    meta: {
      title: $t('people'),
    },
  };
}) satisfies PageLoad;
