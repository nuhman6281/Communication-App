import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private minioClient: Minio.Client;
  private readonly defaultBucket: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
    const port = parseInt(this.configService.get<string>('MINIO_PORT', '9000'), 10);
    const useSSL = this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true';
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin');
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin123');

    this.defaultBucket = this.configService.get<string>('MINIO_BUCKET', 'chatapp-media');

    this.minioClient = new Minio.Client({
      endPoint: endpoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });

    this.logger.log(`MinIO client initialized: ${endpoint}:${port}`);
  }

  async onModuleInit() {
    await this.ensureBucketExists(this.defaultBucket);
  }

  /**
   * Ensure bucket exists, create if it doesn't
   */
  private async ensureBucketExists(bucketName: string): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(bucketName, '');
        this.logger.log(`Created bucket: ${bucketName}`);

        // Set bucket policy to allow public read for media files
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucketName}/*`],
            },
          ],
        };
        await this.minioClient.setBucketPolicy(
          bucketName,
          JSON.stringify(policy),
        );
        this.logger.log(`Set public read policy for bucket: ${bucketName}`);
      }
    } catch (error) {
      this.logger.error(`Error ensuring bucket exists: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload file to MinIO
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<{ url: string; objectKey: string; bucket: string }> {
    const filename = `${folder}/${uuidv4()}-${file.originalname}`;
    const bucket = this.defaultBucket;

    try {
      // Convert buffer to stream
      const stream = Readable.from(file.buffer);

      await this.minioClient.putObject(
        bucket,
        filename,
        stream,
        file.size,
        {
          'Content-Type': file.mimetype,
          'X-Original-Name': encodeURIComponent(file.originalname),
        },
      );

      const url = await this.getFileUrl(bucket, filename);

      this.logger.log(`Uploaded file: ${filename}`);

      return {
        url,
        objectKey: filename,
        bucket,
      };
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get public URL for a file
   */
  async getFileUrl(bucket: string, objectKey: string): Promise<string> {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
    const port = this.configService.get<string>('MINIO_PORT', '9000');
    const useSSL = this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true';
    const protocol = useSSL ? 'https' : 'http';

    return `${protocol}://${endpoint}:${port}/${bucket}/${objectKey}`;
  }

  /**
   * Delete file from MinIO
   */
  async deleteFile(bucket: string, objectKey: string): Promise<void> {
    try {
      await this.minioClient.removeObject(bucket, objectKey);
      this.logger.log(`Deleted file: ${objectKey}`);
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(bucket: string, objectKey: string) {
    try {
      const stat = await this.minioClient.statObject(bucket, objectKey);
      return stat;
    } catch (error) {
      this.logger.error(`Error getting file metadata: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate presigned URL for temporary file access
   */
  async getPresignedUrl(
    bucket: string,
    objectKey: string,
    expirySeconds: number = 3600,
  ): Promise<string> {
    try {
      const url = await this.minioClient.presignedGetObject(
        bucket,
        objectKey,
        expirySeconds,
      );
      return url;
    } catch (error) {
      this.logger.error(`Error generating presigned URL: ${error.message}`);
      throw error;
    }
  }
}
