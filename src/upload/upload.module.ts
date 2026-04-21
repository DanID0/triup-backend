import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { UploadController } from './upload.controller';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

try {
  mkdirSync(UPLOAD_DIR, { recursive: true });
} catch {
  // ignore: dir exists
}

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const safeName = `${randomUUID()}${extname(file.originalname) || ''}`;
          cb(null, safeName);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) return cb(null, true);
        cb(new Error('Only image uploads are allowed'), false);
      },
    }),
  ],
  controllers: [UploadController],
})
export class UploadModule {}
