import { Selectable } from 'kysely';
import { createZodDto } from 'nestjs-zod';
import { asDateString } from 'src/utils/date';
import { emptyStringToNull, hexColor } from 'src/validation';
import z from 'zod';

const PersonTagCreateSchema = z
  .object({
    name: z.string().min(1).max(120).describe('Tag name'),
    parentTagId: z.uuidv4().nullable().optional().describe('Parent tag ID (null for top-level)'),
    color: emptyStringToNull(hexColor.nullable()).optional().describe('Tag color (hex)'),
    defaultHidden: z.boolean().optional().describe('Hide tagged people from default queries'),
  })
  .meta({ id: 'PersonTagCreateDto' });

const PersonTagUpdateSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    color: emptyStringToNull(hexColor.nullable()).optional(),
    defaultHidden: z.boolean().optional(),
  })
  .meta({ id: 'PersonTagUpdateDto' });

const PersonTagsAssignSchema = z
  .object({
    tagIds: z.array(z.uuidv4()).describe('Person tag IDs to assign (replaces existing)'),
  })
  .meta({ id: 'PersonTagsAssignDto' });

const PersonTagAttachSchema = z
  .object({
    personIds: z.array(z.uuidv4()).describe('Person IDs to attach to the tag'),
  })
  .meta({ id: 'PersonTagAttachDto' });

export const PersonTagResponseSchema = z
  .object({
    id: z.string().describe('Tag ID'),
    name: z.string().describe('Tag name'),
    parentTagId: z.string().nullable().describe('Parent tag ID'),
    color: z.string().nullable().optional().describe('Tag color (hex)'),
    defaultHidden: z.boolean().describe('Hide tagged people unless explicitly included'),
    isSystem: z.boolean().describe('Seeded by the system (Family / Friends / Hidden)'),
    createdAt: z.string().meta({ format: 'date-time' }).optional(),
    updatedAt: z.string().meta({ format: 'date-time' }).optional(),
    peopleCount: z.int().min(0).optional().describe('Number of people in this tag'),
  })
  .meta({ id: 'PersonTagResponseDto' });

const PersonTagListResponseSchema = z
  .object({
    tags: z.array(PersonTagResponseSchema),
  })
  .meta({ id: 'PersonTagListResponseDto' });

export class PersonTagCreateDto extends createZodDto(PersonTagCreateSchema) {}
export class PersonTagUpdateDto extends createZodDto(PersonTagUpdateSchema) {}
export class PersonTagsAssignDto extends createZodDto(PersonTagsAssignSchema) {}
export class PersonTagAttachDto extends createZodDto(PersonTagAttachSchema) {}
export class PersonTagResponseDto extends createZodDto(PersonTagResponseSchema) {}
export class PersonTagListResponseDto extends createZodDto(PersonTagListResponseSchema) {}

export interface PersonTagRow {
  id: string;
  ownerId: string;
  name: string;
  parentTagId: string | null;
  color: string | null;
  defaultHidden: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  updateId: string;
}

export function mapPersonTag(
  row: Selectable<PersonTagRow> & { peopleCount?: number | string | bigint | null },
): PersonTagResponseDto {
  return {
    id: row.id,
    name: row.name,
    parentTagId: row.parentTagId,
    color: row.color ?? undefined,
    defaultHidden: row.defaultHidden,
    isSystem: row.isSystem,
    createdAt: asDateString(row.createdAt),
    updatedAt: asDateString(row.updatedAt),
    peopleCount: row.peopleCount == null ? undefined : Number(row.peopleCount),
  };
}
