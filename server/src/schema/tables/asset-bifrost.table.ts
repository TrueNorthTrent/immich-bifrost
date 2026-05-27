import { Column, ForeignKeyColumn, Table, Timestamp } from '@immich/sql-tools';
import { AssetTable } from 'src/schema/tables/asset.table';

@Table('asset_bifrost')
export class AssetBifrostTable {
  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', primary: true })
  assetId!: string;

  @Column({ type: 'real', nullable: true })
  nsfwScore!: number | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  nsfwScoredAt!: Timestamp | null;

  @Column({ type: 'smallint', nullable: true })
  attractiveScore!: number | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  attractiveRatedAt!: Timestamp | null;
}
