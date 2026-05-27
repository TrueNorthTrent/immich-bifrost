import { defaults } from '@immich/sdk';

export interface AssetBifrostDto {
  assetId: string;
  nsfwScore: number | null;
  nsfwScoredAt: string | null;
  attractiveScore: number | null;
  attractiveRatedAt: string | null;
}

export interface AssetBifrostUpdate {
  nsfwScore?: number | null;
  attractiveScore?: number | null;
}

const url = (assetId: string) => `${defaults.baseUrl ?? ''}/assets/${assetId}/bifrost`;

export const fetchAssetBifrost = async (assetId: string): Promise<AssetBifrostDto> => {
  const response = await (defaults.fetch ?? fetch)(url(assetId), {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`Failed to load asset bifrost sidecar: ${response.status}`);
  }
  return (await response.json()) as AssetBifrostDto;
};

export const updateAssetBifrost = async (assetId: string, patch: AssetBifrostUpdate): Promise<AssetBifrostDto> => {
  const response = await (defaults.fetch ?? fetch)(url(assetId), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    throw new Error(`Failed to update asset bifrost sidecar: ${response.status}`);
  }
  return (await response.json()) as AssetBifrostDto;
};
