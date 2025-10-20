import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.get<string>(
        'GITHUB_CALLBACK_URL',
        'http://localhost:3000/api/v1/auth/github/callback',
      ),
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
    const { displayName, emails, photos } = profile;

    // GitHub may not provide name parts, so we'll parse displayName
    const nameParts = displayName?.split(' ') || ['', ''];
    const firstName = nameParts[0] || profile.username;
    const lastName = nameParts.slice(1).join(' ') || '';

    const user = {
      email: emails?.[0]?.value || `${profile.username}@github.local`,
      firstName,
      lastName,
      avatar: photos?.[0]?.value,
      provider: 'github',
      providerId: profile.id,
      accessToken,
    };

    done(null, user);
  }
}
