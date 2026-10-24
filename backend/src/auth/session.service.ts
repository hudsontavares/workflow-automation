import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface SessionPayload {
  sub: string;
}

@Injectable()
export class SessionService {
  constructor(private readonly jwt: JwtService) {}

  createSessionToken(userId: string): Promise<string> {
    return this.jwt.signAsync({ sub: userId } satisfies SessionPayload);
  }

  async readUserId(sessionToken: string | undefined): Promise<string | null> {
    if (!sessionToken) {
      return null;
    }
    try {
      const payload = await this.jwt.verifyAsync<SessionPayload>(sessionToken);
      return payload.sub;
    } catch {
      return null;
    }
  }
}
