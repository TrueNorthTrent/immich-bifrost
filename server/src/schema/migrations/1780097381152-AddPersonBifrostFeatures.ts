import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE "person"
      ADD COLUMN "firstSeenAt" timestamp with time zone,
      ADD COLUMN "lastSeenAt" timestamp with time zone,
      ADD COLUMN "firstSeenAssetId" uuid REFERENCES "asset" ("id") ON UPDATE CASCADE ON DELETE SET NULL;
  `.execute(db);

  await sql`CREATE INDEX "person_firstSeenAt_idx" ON "person" ("firstSeenAt");`.execute(db);
  await sql`CREATE INDEX "person_lastSeenAt_idx" ON "person" ("lastSeenAt");`.execute(db);

  await sql`
    CREATE TABLE "person_tag" (
      "id" uuid PRIMARY KEY DEFAULT immich_uuid_v7(now()),
      "ownerId" uuid NOT NULL REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
      "name" character varying NOT NULL,
      "parentTagId" uuid REFERENCES "person_tag" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
      "defaultHidden" boolean NOT NULL DEFAULT false,
      "color" character varying,
      "isSystem" boolean NOT NULL DEFAULT false,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(now()),
      CONSTRAINT "person_tag_owner_name_parent_uq"
        UNIQUE NULLS NOT DISTINCT ("ownerId", "parentTagId", "name")
    );
  `.execute(db);
  await sql`CREATE INDEX "person_tag_ownerId_idx" ON "person_tag" ("ownerId");`.execute(db);
  await sql`CREATE INDEX "person_tag_parentTagId_idx" ON "person_tag" ("parentTagId");`.execute(db);
  await sql`CREATE INDEX "person_tag_updateId_idx" ON "person_tag" ("updateId");`.execute(db);
  await sql`
    CREATE TRIGGER "person_tag_updatedAt"
      BEFORE UPDATE ON "person_tag"
      FOR EACH ROW EXECUTE FUNCTION updated_at();
  `.execute(db);

  await sql`
    CREATE TABLE "person_to_tag" (
      "personId" uuid NOT NULL REFERENCES "person" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
      "tagId"    uuid NOT NULL REFERENCES "person_tag" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      PRIMARY KEY ("personId", "tagId")
    );
  `.execute(db);
  await sql`CREATE INDEX "person_to_tag_tagId_idx" ON "person_to_tag" ("tagId");`.execute(db);

  // Maintain firstSeenAt / lastSeenAt / firstSeenAssetId on the person via a
  // per-row trigger on asset_face. Cheap: single-row UPDATE keyed by PK.
  await sql`
    CREATE OR REPLACE FUNCTION person_face_dates_sync() RETURNS trigger
    LANGUAGE plpgsql AS $$
    DECLARE
      v_local timestamp with time zone;
    BEGIN
      IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE')
         AND NEW."personId" IS NOT NULL
         AND NEW."deletedAt" IS NULL
         AND NEW."isVisible" IS TRUE THEN
        SELECT a."localDateTime" INTO v_local FROM "asset" a WHERE a.id = NEW."assetId";
        IF v_local IS NOT NULL THEN
          UPDATE "person" p
            SET "firstSeenAt" = CASE
                  WHEN p."firstSeenAt" IS NULL OR v_local < p."firstSeenAt" THEN v_local
                  ELSE p."firstSeenAt"
                END,
                "firstSeenAssetId" = CASE
                  WHEN p."firstSeenAt" IS NULL OR v_local < p."firstSeenAt" THEN NEW."assetId"
                  ELSE p."firstSeenAssetId"
                END,
                "lastSeenAt" = CASE
                  WHEN p."lastSeenAt" IS NULL OR v_local > p."lastSeenAt" THEN v_local
                  ELSE p."lastSeenAt"
                END
            WHERE p.id = NEW."personId";
        END IF;
      END IF;
      RETURN NULL;
    END;
    $$;
  `.execute(db);
  await sql`
    CREATE TRIGGER "asset_face_person_dates_sync"
      AFTER INSERT OR UPDATE OF "personId", "deletedAt", "isVisible"
      ON "asset_face"
      FOR EACH ROW EXECUTE FUNCTION person_face_dates_sync();
  `.execute(db);

  // Backfill firstSeenAt / lastSeenAt / firstSeenAssetId for existing people.
  await sql`
    WITH agg AS (
      SELECT af."personId" AS pid,
             MIN(a."localDateTime") AS first_at,
             MAX(a."localDateTime") AS last_at
      FROM "asset_face" af
      JOIN "asset" a ON a.id = af."assetId"
      WHERE af."personId" IS NOT NULL
        AND af."deletedAt" IS NULL
        AND af."isVisible" IS TRUE
        AND a."deletedAt" IS NULL
      GROUP BY af."personId"
    ),
    first_asset AS (
      SELECT DISTINCT ON (af."personId")
             af."personId" AS pid,
             af."assetId"  AS aid
      FROM "asset_face" af
      JOIN "asset" a ON a.id = af."assetId"
      WHERE af."personId" IS NOT NULL
        AND af."deletedAt" IS NULL
        AND af."isVisible" IS TRUE
        AND a."deletedAt" IS NULL
      ORDER BY af."personId", a."localDateTime" ASC NULLS LAST
    )
    UPDATE "person" p
       SET "firstSeenAt" = agg.first_at,
           "lastSeenAt"  = agg.last_at,
           "firstSeenAssetId" = first_asset.aid
      FROM agg
      LEFT JOIN first_asset ON first_asset.pid = agg.pid
     WHERE p.id = agg.pid;
  `.execute(db);

  // Seed the three system tags (Family, Friends, Hidden) per existing user.
  await sql`
    INSERT INTO "person_tag" ("ownerId", "name", "parentTagId", "defaultHidden", "isSystem", "color")
    SELECT u.id, t.name, NULL, t."defaultHidden", true, t.color
      FROM "user" u
      CROSS JOIN (VALUES
        ('Family',  false, '#3b82f6'),
        ('Friends', false, '#22c55e'),
        ('Hidden',  true,  '#9ca3af')
      ) AS t(name, "defaultHidden", color)
      WHERE u."deletedAt" IS NULL
    ON CONFLICT DO NOTHING;
  `.execute(db);

  // Fold existing person.isHidden into membership in the Hidden tag.
  await sql`
    INSERT INTO "person_to_tag" ("personId", "tagId")
    SELECT p.id, pt.id
      FROM "person" p
      JOIN "person_tag" pt ON pt."ownerId" = p."ownerId"
                          AND pt."isSystem" = true
                          AND pt.name = 'Hidden'
                          AND pt."parentTagId" IS NULL
      WHERE p."isHidden" = true
    ON CONFLICT DO NOTHING;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER IF EXISTS "asset_face_person_dates_sync" ON "asset_face";`.execute(db);
  await sql`DROP FUNCTION IF EXISTS person_face_dates_sync();`.execute(db);
  await sql`DROP TABLE IF EXISTS "person_to_tag";`.execute(db);
  await sql`DROP TABLE IF EXISTS "person_tag";`.execute(db);
  await sql`DROP INDEX IF EXISTS "person_firstSeenAt_idx";`.execute(db);
  await sql`DROP INDEX IF EXISTS "person_lastSeenAt_idx";`.execute(db);
  await sql`
    ALTER TABLE "person"
      DROP COLUMN IF EXISTS "firstSeenAssetId",
      DROP COLUMN IF EXISTS "lastSeenAt",
      DROP COLUMN IF EXISTS "firstSeenAt";
  `.execute(db);
}
