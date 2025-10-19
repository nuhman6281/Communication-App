import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum Language {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
  IT = 'it',
  PT = 'pt',
  RU = 'ru',
  ZH = 'zh',
  JA = 'ja',
  KO = 'ko',
  AR = 'ar',
  HI = 'hi',
}

export class TranslateMessageDto {
  @ApiProperty({ description: 'Message to translate' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Target language', enum: Language })
  @IsEnum(Language)
  targetLanguage: Language;
}
