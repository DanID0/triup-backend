import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async updateHashedRefreshToken(userId: string, hashedRefreshToken: string | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken },
    });
  }

  async create(createUserDto: CreateUserDto) {
    const username = createUserDto.username.trim();
    const email = createUserDto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
      select: { id: true, username: true, email: true },
    });
    if (existing) {
      if (existing.username === username) {
        throw new ConflictException('Username is already taken');
      }
      throw new ConflictException('Email is already taken');
    }

    const hashedPassword = bcrypt.hashSync(createUserDto.password, 10);
    return this.prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      } as any,
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        email: true,
        role: true,
        interfaceLanguage: true,
        Workspace: true,
        hashedRefreshToken: true,
      } as any,
    });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  async findAuthUser(id: string): Promise<{ id: string; hashedRefreshToken: string | null }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        hashedRefreshToken: true,
      },
    });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  async update(userId: string, updateUserDto: UpdateUserDto) {
    const nextUsername = updateUserDto.username?.trim();
    const nextEmail = updateUserDto.email?.trim().toLowerCase();
    if (nextUsername || nextEmail) {
      const existing = await this.prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                ...(nextUsername ? [{ username: nextUsername }] : []),
                ...(nextEmail ? [{ email: nextEmail }] : []),
              ],
            },
          ],
        },
        select: { username: true, email: true },
      });
      if (existing) {
        if (nextUsername && existing.username === nextUsername) {
          throw new ConflictException('Username is already taken');
        }
        if (nextEmail && existing.email === nextEmail) {
          throw new ConflictException('Email is already taken');
        }
      }
    }

    const data: {
      username?: string;
      interfaceLanguage?: UpdateUserDto['interfaceLanguage'];
      email?: string;
      avatarUrl?: string | null;
      password?: string;
    } = {
      username: nextUsername,
      interfaceLanguage: updateUserDto.interfaceLanguage,
      email: nextEmail,
      avatarUrl: updateUserDto.avatarUrl,
    };

    if (updateUserDto.password) {
      if (!updateUserDto.oldPassword) {
        throw new BadRequestException('Current password is required to set a new password');
      }
      const existing = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });
      if (!existing) throw new NotFoundException(`User with id ${userId} not found`);
      const matches = bcrypt.compareSync(updateUserDto.oldPassword, existing.password);
      if (!matches) throw new UnauthorizedException('Current password is incorrect');
      data.password = bcrypt.hashSync(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        interfaceLanguage: true,
      } as any,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } });
  }
}
