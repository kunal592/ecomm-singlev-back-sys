import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStoreConfigDto } from './dto/create-store-config.dto';

@Injectable()
export class StoreConfigService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Initialize default config if none exists
    const count = await this.prisma.storeConfig.count();
    if (count === 0) {
      await this.prisma.storeConfig.create({
        data: {
          storeName: 'My Awesome Store',
          whatsappNumber: '1234567890',
          primaryColor: '#6200ee',
          orderModes: {
            whatsapp: true,
            cod: true,
            online: false,
          },
        },
      });
    }
  }

  async getConfig() {
    return this.prisma.storeConfig.findFirst();
  }

  async updateConfig(dto: CreateStoreConfigDto) {
    const config = await this.prisma.storeConfig.findFirst();
    if (config) {
      return this.prisma.storeConfig.update({
        where: { id: config.id },
        data: dto as any,
      });
    }
    return this.prisma.storeConfig.create({
      data: dto as any,
    });
  }
}
