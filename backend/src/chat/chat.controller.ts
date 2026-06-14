import { Controller, Get, Post, Param, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import { StorageService } from '../storage/storage.service';
import * as path from 'path';

@Controller('chat')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private storageService: StorageService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get(':sessionId/messages')
  getMessages(@Param('sessionId') sessionId: string) {
    return this.chatService.getMessages(sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':sessionId/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('sessionId') sessionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    let fileUrl: string;

    try {
      const ext = path.extname(file.originalname);
      const objectName = `files/${sessionId}/${Date.now()}${ext}`;
      fileUrl = await this.storageService.upload(objectName, file.buffer, file.mimetype);
    } catch (err) {
      // MinIO unavailable (e.g. Render deploy) — fall back to base64 data URL
      const base64 = file.buffer.toString('base64');
      fileUrl = `data:${file.mimetype};base64,${base64}`;
    }

    const message = await this.chatService.saveMessage(
      sessionId,
      req.user.id,
      file.originalname,
      'file',
      fileUrl,
      file.mimetype,
    );

    return {
      id: message.id,
      content: message.content,
      senderId: req.user.id,
      senderName: req.user.name,
      type: 'file',
      fileUrl,
      mimeType: file.mimetype,
      createdAt: message.createdAt,
    };
  }
}
