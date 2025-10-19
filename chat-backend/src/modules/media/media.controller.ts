import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { UploadMediaDto } from './dto/upload-media.dto';
import { GetUser } from '@common/decorators/get-user.decorator';

@ApiTags('media')
@ApiBearerAuth()
@Controller({ path: 'media', version: '1' })
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * Upload a file
   */
  @Post('upload')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        messageId: {
          type: 'string',
          format: 'uuid',
        },
        folder: {
          type: 'string',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @GetUser('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }), // 100MB
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() uploadDto: UploadMediaDto,
  ) {
    const media = await this.mediaService.uploadFile(userId, file, uploadDto);
    return {
      success: true,
      data: media,
    };
  }

  /**
   * Get media by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get media by ID' })
  async getMediaById(
    @GetUser('id') userId: string,
    @Param('id') mediaId: string,
  ) {
    const media = await this.mediaService.getMediaById(userId, mediaId);
    return {
      success: true,
      data: media,
    };
  }

  /**
   * Get user's media
   */
  @Get()
  @ApiOperation({ summary: "Get user's uploaded media" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUserMedia(
    @GetUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.mediaService.getUserMedia(
      userId,
      page || 1,
      limit || 20,
    );
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Delete media
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete media' })
  async deleteMedia(
    @GetUser('id') userId: string,
    @Param('id') mediaId: string,
  ) {
    await this.mediaService.deleteMedia(userId, mediaId);
    return {
      success: true,
      message: 'Media deleted successfully',
    };
  }
}
