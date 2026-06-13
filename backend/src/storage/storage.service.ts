import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as Minio from 'minio';
import { Readable } from 'stream';

const BUCKET = process.env.MINIO_BUCKET || 'supportvision';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  client: Minio.Client;

  async onModuleInit() {
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT) || 9000,
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });

    try {
      const exists = await this.client.bucketExists(BUCKET);
      if (!exists) {
        await this.client.makeBucket(BUCKET);
        // Make bucket publicly readable
        const policy = JSON.stringify({
          Version: '2012-10-17',
          Statement: [{ Effect: 'Allow', Principal: '*', Action: ['s3:GetObject'], Resource: [`arn:aws:s3:::${BUCKET}/*`] }],
        });
        await this.client.setBucketPolicy(BUCKET, policy);
        this.logger.log(`Bucket "${BUCKET}" created`);
      }
    } catch (err) {
      this.logger.warn(`MinIO init warning: ${err.message}`);
    }
  }

  async upload(objectName: string, buffer: Buffer, contentType: string): Promise<string> {
    await this.client.putObject(BUCKET, objectName, buffer, buffer.length, { 'Content-Type': contentType });
    return this.getUrl(objectName);
  }

  async uploadStream(objectName: string, stream: Readable, contentType: string): Promise<string> {
    await this.client.putObject(BUCKET, objectName, stream, undefined, { 'Content-Type': contentType });
    return this.getUrl(objectName);
  }

  getUrl(objectName: string): string {
    const host = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    return `http://${host}:${port}/${BUCKET}/${objectName}`;
  }

  async presignedUrl(objectName: string, expiry = 3600): Promise<string> {
    return this.client.presignedGetObject(BUCKET, objectName, expiry);
  }
}
