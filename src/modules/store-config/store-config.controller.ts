import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StoreConfigService } from './store-config.service';
import { CreateStoreConfigDto } from './dto/create-store-config.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Store Config')
@Controller('store-config')
export class StoreConfigController {
  constructor(private readonly storeConfigService: StoreConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get store configuration' })
  getConfig() {
    return this.storeConfigService.getConfig();
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update store configuration (Admin only)' })
  updateConfig(@Body() createStoreConfigDto: CreateStoreConfigDto) {
    return this.storeConfigService.updateConfig(createStoreConfigDto);
  }
}
