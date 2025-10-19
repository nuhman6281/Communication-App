import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media, MediaType } from './entities/media.entity';
import { StorageService } from './services/storage.service';
import { UploadMediaDto } from './dto/upload-media.dto';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Upload a file and create media record
   */
  async uploadFile(
    userId: string,
    file: Express.Multer.File,
    uploadDto: UploadMediaDto,
  ): Promise<Media> {
    const folder = uploadDto.folder || this.getFolderFromMimeType(file.mimetype);

    // Upload to MinIO
    const { url, objectKey, bucket } = await this.storageService.uploadFile(
      file,
      folder,
    );

    // Determine media type from MIME type
    const mediaType = this.getMediaTypeFromMimeType(file.mimetype);

    // Create media record
    const media = this.mediaRepository.create({
      filename: objectKey.split('/').pop() || objectKey,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url,
      type: mediaType,
      uploaderId: userId,
      messageId: uploadDto.messageId || null,
      bucket,
      objectKey,
    });

    await this.mediaRepository.save(media);

    return this.mediaRepository.findOne({
      where: { id: media.id },
      relations: ['uploader'],
    }) as Promise<Media>;
  }

  /**
   * Get media by ID
   */
  async getMediaById(userId: string, mediaId: string): Promise<Media> {
    const media = await this.mediaRepository.findOne({
      where: { id: mediaId },
      relations: ['uploader'],
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return media;
  }

  /**
   * Get all media uploaded by a user
   */
  async getUserMedia(userId: string, page = 1, limit = 20) {
    const [media, total] = await this.mediaRepository.findAndCount({
      where: { uploaderId: userId },
      relations: ['uploader'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Delete media (only uploader can delete)
   */
  async deleteMedia(userId: string, mediaId: string): Promise<void> {
    const media = await this.mediaRepository.findOne({
      where: { id: mediaId },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    if (media.uploaderId !== userId) {
      throw new ForbiddenException('Only the uploader can delete this media');
    }

    // Delete from MinIO
    await this.storageService.deleteFile(media.bucket, media.objectKey);

    // Delete from database
    await this.mediaRepository.remove(media);
  }

  /**
   * Determine media type from MIME type
   */
  private getMediaTypeFromMimeType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) {
      return MediaType.IMAGE;
    }
    if (mimeType.startsWith('video/')) {
      return MediaType.VIDEO;
    }
    if (mimeType.startsWith('audio/')) {
      // Check if it's a voice note (usually webm or ogg from browsers)
      if (mimeType.includes('webm') || mimeType.includes('ogg')) {
        return MediaType.VOICE;
      }
      return MediaType.AUDIO;
    }
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('text') ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('presentation')
    ) {
      return MediaType.DOCUMENT;
    }
    return MediaType.OTHER;
  }

  /**
   * Determine folder from MIME type
   */
  private getFolderFromMimeType(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return 'images';
    }
    if (mimeType.startsWith('video/')) {
      return 'videos';
    }
    if (mimeType.startsWith('audio/')) {
      return 'audio';
    }
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('spreadsheet')
    ) {
      return 'documents';
    }
    return 'other';
  }
}
