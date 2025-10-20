declare module 'passport-github2' {
  import { Strategy as PassportStrategy } from 'passport';

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
  }

  export interface Profile {
    id: string;
    displayName: string;
    username: string;
    emails?: Array<{ value: string }>;
    photos?: Array<{ value: string }>;
  }

  export type VerifyCallback = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: Function,
  ) => void;

  export class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify: VerifyCallback);
  }
}
