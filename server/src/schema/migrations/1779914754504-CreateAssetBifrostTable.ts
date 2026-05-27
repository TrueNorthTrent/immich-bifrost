import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "asset_bifrost" (
  "assetId" uuid NOT NULL,
  "nsfwScore" real,
  "nsfwScoredAt" timestamp with time zone,
  "attractiveScore" smallint,
  "attractiveRatedAt" timestamp with time zone,
  CONSTRAINT "asset_bifrost_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "asset_bifrost_pkey" PRIMARY KEY ("assetId")
);`.execute(db);
  await sql`CREATE INDEX "asset_bifrost_nsfwScore_idx" ON "asset_bifrost" ("nsfwScore");`.execute(db);
  await sql`CREATE INDEX "asset_bifrost_attractiveScore_idx" ON "asset_bifrost" ("attractiveScore");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "asset_bifrost";`.execute(db);
}
