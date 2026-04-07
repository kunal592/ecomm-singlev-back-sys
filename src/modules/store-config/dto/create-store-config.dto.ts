import { IsString, IsObject, IsOptional, IsHexColor } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStoreConfigDto {
  @ApiProperty()
  @IsString()
  storeName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty()
  @IsHexColor()
  primaryColor: string;

  @ApiProperty()
  @IsString()
  whatsappNumber: string;

  @ApiProperty()
  @IsObject()
  orderModes: {
    whatsapp: boolean;
    cod: boolean;
    online: boolean;
  };
}
