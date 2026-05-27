import { Injectable } from '@nestjs/common';
import { Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { AssetBifrostTable } from 'src/schema/tables/asset-bifrost.table';

const COLUMNS = ['assetId', 'nsfwScore', 'nsfwScoredAt', 'attractiveScore', 'attractiveRatedAt'] as const;

export type AssetBifrostUpdate = Updateable<AssetBifrostTable>;

@Injectable()
export class AssetBifrostRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  get(assetId: string) {
    return this.db.selectFrom('asset_bifrost').select(COLUMNS).where('assetId', '=', assetId).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async upsert(assetId: string, patch: AssetBifrostUpdate) {
    const row = { assetId, ...patch };
    return this.db
      .insertInto('asset_bifrost')
      .values(row)
      .onConflict((oc) =>
        oc.column('assetId').doUpdateSet({
          ...(patch.nsfwScore !== undefined && { nsfwScore: patch.nsfwScore }),
          ...(patch.nsfwScoredAt !== undefined && { nsfwScoredAt: patch.nsfwScoredAt }),
          ...(patch.attractiveScore !== undefined && { attractiveScore: patch.attractiveScore }),
          ...(patch.attractiveRatedAt !== undefined && { attractiveRatedAt: patch.attractiveRatedAt }),
        }),
      )
      .returning(COLUMNS)
      .executeTakeFirstOrThrow();
  }
}
