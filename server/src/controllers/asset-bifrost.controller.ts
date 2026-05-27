import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AssetBifrostResponseDto, AssetBifrostUpdateDto } from 'src/dtos/asset-bifrost.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { AssetBifrostService } from 'src/services/asset-bifrost.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Assets)
@Controller('assets/:id/bifrost')
export class AssetBifrostController {
  constructor(private service: AssetBifrostService) {}

  @Get()
  @Authenticated({ permission: Permission.AssetRead })
  @Endpoint({
    summary: 'Get asset bifrost sidecar',
    description: 'Retrieve fork-only metadata (NSFW score, attractive rating) for an asset.',
    history: new HistoryBuilder().added('v3.0.0').alpha('v3.0.0'),
  })
  getAssetBifrost(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<AssetBifrostResponseDto> {
    return this.service.get(auth, id);
  }

  @Put()
  @Authenticated({ permission: Permission.AssetUpdate })
  @Endpoint({
    summary: 'Update asset bifrost sidecar',
    description: 'Patch the asset_bifrost row. Partial updates merge; pass null to clear a field.',
    history: new HistoryBuilder().added('v3.0.0').alpha('v3.0.0'),
  })
  updateAssetBifrost(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: AssetBifrostUpdateDto,
  ): Promise<AssetBifrostResponseDto> {
    return this.service.update(auth, id, dto);
  }
}
