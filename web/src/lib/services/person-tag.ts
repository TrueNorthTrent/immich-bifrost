import { defaults, type PersonResponseDto } from '@immich/sdk';

export interface PersonTagDto {
  id: string;
  name: string;
  parentTagId: string | null;
  color?: string | null;
  defaultHidden: boolean;
  isSystem: boolean;
  createdAt?: string;
  updatedAt?: string;
  peopleCount?: number;
}

export interface PersonTagCreateDto {
  name: string;
  parentTagId?: string | null;
  color?: string | null;
  defaultHidden?: boolean;
}

export interface PersonTagUpdateDto {
  name?: string;
  color?: string | null;
  defaultHidden?: boolean;
}

export type PeopleSortBy = 'default' | 'name' | 'firstSeen' | 'lastSeen';
export type SortOrder = 'asc' | 'desc';

export interface PeopleSearchExtended {
  withHidden?: boolean;
  closestAssetId?: string;
  closestPersonId?: string;
  page?: number;
  size?: number;
  sortBy?: PeopleSortBy;
  sortOrder?: SortOrder;
  year?: number;
  tagIds?: string[];
  excludeTagIds?: string[];
  overrideDefaultHidden?: boolean;
}

export interface PersonResponseExtended extends PersonResponseDto {
  firstSeenAt?: string | null;
  lastSeenAt?: string | null;
  firstSeenAssetId?: string | null;
  tagIds?: string[];
}

export interface PeopleResponseExtended {
  total: number;
  hidden: number;
  hasNextPage?: boolean;
  people: PersonResponseExtended[];
}

const apiBase = () => defaults.baseUrl ?? '';
const f = () => defaults.fetch ?? fetch;
const headers = () => ({ ...(defaults.headers as Record<string, string> | undefined) });

const qs = (params: Record<string, unknown>): string => {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const v of value) sp.append(key, String(v));
    } else {
      sp.append(key, String(value));
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
};

const handle = async <T>(res: Response, errMsg: string): Promise<T> => {
  if (!res.ok) {
    throw new Error(`${errMsg}: ${res.status}`);
  }
  return (await res.json()) as T;
};

export const fetchPeopleExtended = async (params: PeopleSearchExtended): Promise<PeopleResponseExtended> => {
  const res = await f()(`${apiBase()}/people${qs(params as Record<string, unknown>)}`, {
    headers: { Accept: 'application/json', ...headers() },
    credentials: 'include',
  });
  return handle<PeopleResponseExtended>(res, 'Failed to load people');
};

export const fetchPersonTags = async (): Promise<{ tags: PersonTagDto[] }> => {
  const res = await f()(`${apiBase()}/person-tags`, {
    headers: { Accept: 'application/json', ...headers() },
    credentials: 'include',
  });
  return handle<{ tags: PersonTagDto[] }>(res, 'Failed to load person tags');
};

export const createPersonTag = async (dto: PersonTagCreateDto): Promise<PersonTagDto> => {
  const res = await f()(`${apiBase()}/person-tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers() },
    credentials: 'include',
    body: JSON.stringify(dto),
  });
  return handle<PersonTagDto>(res, 'Failed to create tag');
};

export const updatePersonTag = async (id: string, dto: PersonTagUpdateDto): Promise<PersonTagDto> => {
  const res = await f()(`${apiBase()}/person-tags/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers() },
    credentials: 'include',
    body: JSON.stringify(dto),
  });
  return handle<PersonTagDto>(res, 'Failed to update tag');
};

export const deletePersonTag = async (id: string): Promise<void> => {
  const res = await f()(`${apiBase()}/person-tags/${id}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json', ...headers() },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Failed to delete tag: ${res.status}`);
};

export const attachPeopleToTag = async (tagId: string, personIds: string[]): Promise<void> => {
  const res = await f()(`${apiBase()}/person-tags/${tagId}/people`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers() },
    credentials: 'include',
    body: JSON.stringify({ personIds }),
  });
  if (!res.ok) throw new Error(`Failed to attach people: ${res.status}`);
};

export const detachPeopleFromTag = async (tagId: string, personIds: string[]): Promise<void> => {
  const res = await f()(`${apiBase()}/person-tags/${tagId}/people`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers() },
    credentials: 'include',
    body: JSON.stringify({ personIds }),
  });
  if (!res.ok) throw new Error(`Failed to detach people: ${res.status}`);
};

export const setTagsForPerson = async (personId: string, tagIds: string[]): Promise<void> => {
  const res = await f()(`${apiBase()}/person-tags/person/${personId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers() },
    credentials: 'include',
    body: JSON.stringify({ tagIds }),
  });
  if (!res.ok) throw new Error(`Failed to set tags for person: ${res.status}`);
};
