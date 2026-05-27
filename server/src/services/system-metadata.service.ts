import { Injectable } from '@nestjs/common';
import {
  AdminOnboardingResponseDto,
  AdminOnboardingUpdateDto,
  ReverseGeocodingStateResponseDto,
  ServerThemeDto,
  ServerThemeUpdateDto,
  VersionCheckStateResponseDto,
} from 'src/dtos/system-metadata.dto';
import { SystemMetadataKey } from 'src/enum';
import { BaseService } from 'src/services/base.service';

export const BIFROST_THEME_DEFAULTS: ServerThemeDto = {
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

@Injectable()
export class SystemMetadataService extends BaseService {
  async getAdminOnboarding(): Promise<AdminOnboardingResponseDto> {
    const value = await this.systemMetadataRepository.get(SystemMetadataKey.AdminOnboarding);
    return { isOnboarded: false, ...value };
  }

  async updateAdminOnboarding(dto: AdminOnboardingUpdateDto): Promise<void> {
    await this.systemMetadataRepository.set(SystemMetadataKey.AdminOnboarding, {
      isOnboarded: dto.isOnboarded,
    });
  }

  async getReverseGeocodingState(): Promise<ReverseGeocodingStateResponseDto> {
    const value = await this.systemMetadataRepository.get(SystemMetadataKey.ReverseGeocodingState);
    return { lastUpdate: null, lastImportFileName: null, ...value };
  }

  async getVersionCheckState(): Promise<VersionCheckStateResponseDto> {
    const value = await this.systemMetadataRepository.get(SystemMetadataKey.VersionCheckState);
    return { checkedAt: null, releaseVersion: null, ...value };
  }

  async getServerTheme(): Promise<ServerThemeDto> {
    const value = await this.systemMetadataRepository.get(SystemMetadataKey.ServerTheme);
    return { ...BIFROST_THEME_DEFAULTS, ...value };
  }

  async updateServerTheme(dto: ServerThemeUpdateDto): Promise<ServerThemeDto> {
    const current = await this.systemMetadataRepository.get(SystemMetadataKey.ServerTheme);
    const merged = { ...BIFROST_THEME_DEFAULTS, ...current, ...dto };
    await this.systemMetadataRepository.set(SystemMetadataKey.ServerTheme, merged);
    return merged;
  }
}
