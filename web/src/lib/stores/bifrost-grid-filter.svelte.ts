import { browser } from '$app/environment';

const STORAGE_KEY = 'bifrost.grid-filter.v1';

interface PersistedShape {
  nsfwScoreMax: number | null;
  minAttractiveScore: number | null;
}

const readPersisted = (): PersistedShape => {
  if (!browser) {
    return { nsfwScoreMax: null, minAttractiveScore: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { nsfwScoreMax: null, minAttractiveScore: null };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedShape>;
    return {
      nsfwScoreMax: typeof parsed.nsfwScoreMax === 'number' ? parsed.nsfwScoreMax : null,
      minAttractiveScore: typeof parsed.minAttractiveScore === 'number' ? parsed.minAttractiveScore : null,
    };
  } catch {
    return { nsfwScoreMax: null, minAttractiveScore: null };
  }
};

class BifrostGridFilter {
  #initial = readPersisted();
  nsfwScoreMax = $state<number | null>(this.#initial.nsfwScoreMax);
  minAttractiveScore = $state<number | null>(this.#initial.minAttractiveScore);

  persist() {
    if (!browser) {
      return;
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ nsfwScoreMax: this.nsfwScoreMax, minAttractiveScore: this.minAttractiveScore }),
    );
  }

  setNsfwMax(value: number | null) {
    this.nsfwScoreMax = value;
    this.persist();
  }

  setAttractiveMin(value: number | null) {
    this.minAttractiveScore = value;
    this.persist();
  }

  reset() {
    this.nsfwScoreMax = null;
    this.minAttractiveScore = null;
    this.persist();
  }

  get isActive() {
    return this.nsfwScoreMax !== null || this.minAttractiveScore !== null;
  }
}

export const bifrostGridFilter = new BifrostGridFilter();
