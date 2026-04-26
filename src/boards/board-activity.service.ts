import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BoardActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    boardId: string;
    userId: string;
    type: string;
    message: string;
    meta?: Prisma.InputJsonValue;
  }) {
    return this.prisma.$executeRaw`
      INSERT INTO "BoardActivity" ("id", "boardId", "userId", "type", "message", "meta", "createdAt")
      VALUES (
        ${randomUUID()},
        ${params.boardId},
        ${params.userId},
        ${params.type}::"BoardActivityType",
        ${params.message},
        ${params.meta ? JSON.stringify(params.meta) : null}::jsonb,
        NOW()
      )
    `;
  }

  async listForBoard(boardId: string, take = 200) {
    return this.prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT
        a."id",
        a."boardId",
        a."userId",
        a."type",
        a."message",
        a."meta",
        a."createdAt",
        json_build_object(
          'id', u."id",
          'username', u."username",
          'email', u."email",
          'avatarUrl', u."avatarUrl"
        ) AS "user"
      FROM "BoardActivity" a
      JOIN "User" u ON u."id" = a."userId"
      WHERE a."boardId" = ${boardId}
      ORDER BY a."createdAt" DESC
      LIMIT ${take}
    `;
  }
}
