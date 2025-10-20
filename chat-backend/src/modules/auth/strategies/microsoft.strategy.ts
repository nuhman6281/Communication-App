import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('MICROSOFT_CLIENT_ID'),
      clientSecret: configService.get<string>('MICROSOFT_CLIENT_SECRET'),
      callbackURL: configService.get<string>(
        'MICROSOFT_CALLBACK_URL',
        'http://localhost:3000/api/v1/auth/microsoft/callback',
      ),
      scope: ['user.read'],
      tenant: 'common', // 'common', 'organizations', 'consumers', or specific tenant ID
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
    const { name, emails, photos } = profile;

    const user = {
      email: emails?.[0]?.value || profile.userPrincipalName,
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      avatar: photos?.[0]?.value,
      provider: 'microsoft',
      providerId: profile.id,
      accessToken,
    };

    done(null, user);
  }
}
