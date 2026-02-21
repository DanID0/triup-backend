import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

@Injectable()
export class UserService {
  async updateHashedRefreshToken(userId: string, hashedRefreshToken: string | null) {
    return prisma.user.update({
      where: { id: userId },
      data: {hashedRefreshToken: hashedRefreshToken},
    });
  }
  async create(createUserDto: CreateUserDto) {
    const hashedPassword = bcrypt.hashSync(createUserDto.password, 10);
    return prisma.user.create({
      data: {
        username: createUserDto.username,
        email: createUserDto.email,
        password: hashedPassword,
      },
    });
  }
  async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
  }
  findAll() {
    return `This action returns all user`;
  }

  async findOne(id: string) {
    return prisma.user.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        interfaceLanguage: true,
        Workspace: true,
        hashedRefreshToken: true,
      },
    })
  }

  async update(userId: number, updateUserDto: UpdateUserDto) {
    return prisma.user.update({
      where: { id: userId.toString()},
      data: {
        username: updateUserDto.username,
        interfaceLanguage: updateUserDto.interfaceLanguage,
      },
      select: {
        id: true,
        username: true,
        email: true,
        interfaceLanguage: true,
      },
    });

  }

  remove(id: number) {
    

  }
}
