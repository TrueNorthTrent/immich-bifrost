import { Injectable, NotFoundException } from '@nestjs/common';
import { AssetBifrostResponseDto, AssetBifrostUpdateDto } from 'src/dtos/asset-bifrost.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { Permission } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { AssetBifrostRepository, AssetBifrostUpdate } from 'src/repositories/asset-bifrost.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { requireAccess } from 'src/utils/access';

type BifrostRow = Awaited<ReturnType<AssetBifrostRepository['get']>>;

const empty = (assetId: string): AssetBifrostResponseDto => ({
  assetId,
  nsfwScore: null,
  nsfwScoredAt: null,
  attractiveScore: null,
  attractiveRatedAt: null,
});

const toResponse = (assetId: string, row: BifrostRow): AssetBifrostResponseDto => {
  if (!row) {
    return empty(assetId);
  }
  return {
    assetId: row.assetId,
    nsfwScore: row.nsfwScore ?? null,
    nsfwScoredAt: row.nsfwScoredAt ?? null,
    attractiveScore: row.attractiveScore ?? null,
    attractiveRatedAt: row.attractiveRatedAt ?? null,
  };
};

@Injectable()
export class AssetBifrostService {
  constructor(
    private logger: LoggingRepository,
    private accessRepository: AccessRepository,
    private repository: AssetBifrostRepository,
  ) {
    this.logger.setContext(AssetBifrostService.name);
  }

  async get(auth: AuthDto, assetId: string): Promise<AssetBifrostResponseDto> {
    await requireAccess(this.accessRepository, { auth, permission: Permission.AssetRead, ids: [assetId] });
    const row = await this.repository.get(assetId);
    return toResponse(assetId, row);
  }

  async update(auth: AuthDto, assetId: string, dto: AssetBifrostUpdateDto): Promise<AssetBifrostResponseDto> {
    await requireAccess(this.accessRepository, { auth, permission: Permission.AssetUpdate, ids: [assetId] });

    const patch: AssetBifrostUpdate = {};
    const now = new Date();
    if (dto.nsfwScore !== undefined) {
      patch.nsfwScore = dto.nsfwScore;
      patch.nsfwScoredAt = dto.nsfwScore === null ? null : now;
    }
    if (dto.attractiveScore !== undefined) {
      patch.attractiveScore = dto.attractiveScore;
      patch.attractiveRatedAt = dto.attractiveScore === null ? null : now;
    }

    if (Object.keys(patch).length === 0) {
      const existing = await this.repository.get(assetId);
      return toResponse(assetId, existing);
    }

    const row = await this.repository.upsert(assetId, patch);
    if (!row) {
      throw new NotFoundException('Asset not found');
    }
    return toResponse(assetId, row);
  }
}
