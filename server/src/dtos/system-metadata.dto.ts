import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const AdminOnboardingUpdateSchema = z
  .object({
    isOnboarded: z.boolean().describe('Is admin onboarded'),
  })
  .meta({ id: 'AdminOnboardingUpdateDto' });

const AdminOnboardingResponseSchema = z
  .object({
    isOnboarded: z.boolean().describe('Is admin onboarded'),
  })
  .meta({ id: 'AdminOnboardingResponseDto' });

const ReverseGeocodingStateResponseSchema = z
  .object({
    lastUpdate: z.string().nullable().describe('Last update timestamp'),
    lastImportFileName: z.string().nullable().describe('Last import file name'),
  })
  .meta({ id: 'ReverseGeocodingStateResponseDto' });

const VersionCheckStateResponseSchema = z
  .object({
    checkedAt: z.string().nullable().describe('Last check timestamp'),
    releaseVersion: z.string().nullable().describe('Release version'),
  })
  .meta({ id: 'VersionCheckStateResponseDto' });

const ServerThemeSchema = z
  .object({
    bg: z.string().describe('Background color (CSS color value)'),
    surface: z.string().describe('Surface / card color'),
    accent: z.string().describe('Primary accent color'),
    accentSoft: z.string().describe('Soft accent (gradient companion / muted)'),
    fg: z.string().describe('Foreground / text color'),
    border: z.string().describe('Border color'),
    font: z.string().describe('CSS font-family stack'),
    wordmark: z.string().describe('Brand wordmark text'),
    logoSvg: z.string().describe('Optional inline SVG markup for the logo mark; empty string uses the gradient default'),
  })
  .meta({ id: 'ServerThemeDto' });

const ServerThemeUpdateSchema = ServerThemeSchema.partial().meta({ id: 'ServerThemeUpdateDto' });

export class AdminOnboardingUpdateDto extends createZodDto(AdminOnboardingUpdateSchema) {}
export class AdminOnboardingResponseDto extends createZodDto(AdminOnboardingResponseSchema) {}
export class ReverseGeocodingStateResponseDto extends createZodDto(ReverseGeocodingStateResponseSchema) {}
export class VersionCheckStateResponseDto extends createZodDto(VersionCheckStateResponseSchema) {}
export class ServerThemeDto extends createZodDto(ServerThemeSchema) {}
export class ServerThemeUpdateDto extends createZodDto(ServerThemeUpdateSchema) {}
