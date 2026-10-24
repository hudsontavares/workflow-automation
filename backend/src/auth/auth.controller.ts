import { randomBytes } from 'node:crypto';
import {
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import type { UserProfile } from '@workflow-automation/shared';
import { AppConfig } from '../config/app-config.js';
import { GithubClient } from '../github/github-client.js';
import { UsersRepository } from '../users/users.repository.js';
import {
  cookieOptions,
  sessionCookieName,
  sessionMaxAgeMs,
  signInStateCookieName,
  signInStateMaxAgeMs,
} from './cookies.js';
import { CurrentUserId, SessionGuard } from './session.guard.js';
import { SessionService } from './session.service.js';

const githubScopes = ['read:user', 'repo', 'admin:repo_hook'];

// The browser's own address, so sign-in works the same through localhost, the Angular proxy or ngrok.
function requestOrigin(request: Request): string {
  return `${request.protocol}://${request.host}`;
}

function githubCallbackUrl(request: Request): string {
  return `${requestOrigin(request)}/api/auth/github/callback`;
}

function signInPageUrl(request: Request, error: 'access_denied' | 'invalid_state'): string {
  return `${requestOrigin(request)}/sign-in?error=${error}`;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly config: AppConfig,
    private readonly github: GithubClient,
    private readonly users: UsersRepository,
    private readonly sessions: SessionService,
  ) {}

  @Get('github')
  startGithubSignIn(@Req() request: Request, @Res() response: Response): void {
    const state = randomBytes(16).toString('hex');
    const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
    authorizeUrl.searchParams.set('client_id', this.config.githubClientId);
    authorizeUrl.searchParams.set('redirect_uri', githubCallbackUrl(request));
    authorizeUrl.searchParams.set('scope', githubScopes.join(' '));
    authorizeUrl.searchParams.set('state', state);

    response.cookie(
      signInStateCookieName,
      state,
      cookieOptions(request.secure, signInStateMaxAgeMs),
    );
    response.redirect(authorizeUrl.toString());
  }

  @Get('github/callback')
  async finishGithubSignIn(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') githubError: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const expectedState: string | undefined = request.cookies[signInStateCookieName];
    response.clearCookie(signInStateCookieName, { path: '/' });
    // GitHub sends ?error=access_denied when the user cancels on its authorization page.
    if (githubError) {
      response.redirect(signInPageUrl(request, 'access_denied'));
      return;
    }
    if (!code || !state || state !== expectedState) {
      response.redirect(signInPageUrl(request, 'invalid_state'));
      return;
    }

    const accessToken = await this.github.exchangeCodeForToken(code, githubCallbackUrl(request));
    const profile = await this.github.getAuthenticatedUser(accessToken.token);
    const user = await this.users.saveGithubSignIn({ profile, accessToken });

    const sessionToken = await this.sessions.createSessionToken(user._id);
    response.cookie(
      sessionCookieName,
      sessionToken,
      cookieOptions(request.secure, sessionMaxAgeMs),
    );
    response.redirect(`${requestOrigin(request)}/`);
  }

  @Get('me')
  @UseGuards(SessionGuard)
  async getCurrentUser(@CurrentUserId() userId: string): Promise<UserProfile> {
    const profile = await this.users.findProfile(userId);
    if (!profile) {
      throw new UnauthorizedException();
    }
    return profile;
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(sessionCookieName, { path: '/' });
  }
}
