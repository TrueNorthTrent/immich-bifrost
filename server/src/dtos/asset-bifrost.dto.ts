import { createZodDto } from 'nestjs-zod';
import { isoDatetimeToDate } from 'src/validation';
import z from 'zod';

const AssetBifrostResponseSchema = z
  .object({
    assetId: z.uuidv4().describe('Asset ID'),
    nsfwScore: z.number().min(0).max(1).nullable().describe('NSFW score 0..1 from the moderation worker'),
    nsfwScoredAt: isoDatetimeToDate.nullable().describe('When the NSFW score was last computed'),
    attractiveScore: z
      .int()
      .min(1)
      .max(10)
      .nullable()
      .describe('Personal attractive scale, manual 1..10 rating'),
    attractiveRatedAt: isoDatetimeToDate.nullable().describe('When the attractive score was last set'),
  })
  .meta({ id: 'AssetBifrostResponseDto' });

const AssetBifrostUpdateSchema = z
  .object({
    nsfwScore: z.number().min(0).max(1).nullable().optional(),
    attractiveScore: z.int().min(1).max(10).nullable().optional(),
  })
  .meta({ id: 'AssetBifrostUpdateDto' });

export class AssetBifrostResponseDto extends createZodDto(AssetBifrostResponseSchema) {}
export class AssetBifrostUpdateDto extends createZodDto(AssetBifrostUpdateSchema) {}
