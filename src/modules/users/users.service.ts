import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, role: Role = Role.CUSTOMER) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: createUserDto.phone },
          createUserDto.email ? { email: createUserDto.email } : {},
        ].filter(Boolean) as any,
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        role,
      },
    });

    // Create a cart for customer users
    if (role === Role.CUSTOMER) {
      await this.prisma.cart.create({
        data: {
          userId: user.id,
        },
      });
    }

    const { password, refreshToken, ...result } = user;
    return result;
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    const hashedToken = refreshToken ? await bcrypt.hash(refreshToken, 10) : null;
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedToken },
    });
  }

  async getAllAdmin() {
    return this.prisma.user.findMany({
      where: { role: { in: [Role.ADMIN, Role.STAFF] } },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
