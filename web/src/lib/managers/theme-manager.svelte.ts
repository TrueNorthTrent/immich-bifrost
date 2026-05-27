import { defaults } from '@immich/sdk';

export interface ServerTheme {
  bg: string;
  surface: string;
  accent: string;
  accentSoft: string;
  fg: string;
  border: string;
  font: string;
  wordmark: string;
  logoSvg: string;
}

export const BIFROST_THEME_DEFAULTS: ServerTheme = {
  bg: '#050a12',
  surface: 'rgba(10, 22, 40, 0.72)',
  accent: '#00f5ff',
  accentSoft: 'rgba(0, 245, 255, 0.45)',
  fg: '#e8f4f8',
  border: 'rgba(0, 245, 255, 0.22)',
  font: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
  wordmark: 'Photos',
  logoSvg: '',
};

const TOKEN_TO_CSS_VAR: Record<keyof ServerTheme, string | null> = {
  bg: '--bifrost-bg',
  surface: '--bifrost-surface',
  accent: '--bifrost-accent',
  accentSoft: '--bifrost-accent-soft',
  fg: '--bifrost-fg',
  border: '--bifrost-border',
  font: '--bifrost-font',
  wordmark: null,
  logoSvg: null,
};

class ServerThemeManager {
  #value: ServerTheme = $state({ ...BIFROST_THEME_DEFAULTS });

  get value(): ServerTheme {
    return this.#value;
  }

  async init() {
    try {
      const response = await (defaults.fetch ?? fetch)(`${defaults.baseUrl ?? ''}/server/theme`, {
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        const data = (await response.json()) as Partial<ServerTheme>;
        this.#apply({ ...BIFROST_THEME_DEFAULTS, ...data });
        return;
      }
    } catch {
      // network unreachable on boot — keep cosmic defaults
    }
    this.#apply(BIFROST_THEME_DEFAULTS);
  }

  async update(patch: Partial<ServerTheme>): Promise<ServerTheme> {
    const response = await (defaults.fetch ?? fetch)(`${defaults.baseUrl ?? ''}/server/theme`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify(patch),
    });
    if (!response.ok) {
      throw new Error(`Failed to update theme: ${response.status}`);
    }
    const data = (await response.json()) as ServerTheme;
    this.#apply(data);
    return data;
  }

  #apply(theme: ServerTheme) {
    this.#value = theme;
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    for (const [key, cssVar] of Object.entries(TOKEN_TO_CSS_VAR) as Array<
      [keyof ServerTheme, string | null]
    >) {
      if (cssVar) {
        root.style.setProperty(cssVar, theme[key]);
      }
    }
  }
}

export const serverThemeManager = new ServerThemeManager();
