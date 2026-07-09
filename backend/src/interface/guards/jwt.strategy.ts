import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { IUserRepository } from '../../domain/user/repositories/user.repository.interface';
import { TOKENS } from '../../shared/constants/tokens';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    @Inject(TOKENS.USER_REPO) private readonly userRepo: IUserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'default-secret'),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }
    
    // Fetch live user with current permissions to ensure RBAC updates take effect immediately
    const user = await this.userRepo.findByIdWithPermissions(payload.sub);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User is not active or does not exist');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.roleId, // or whatever role field is needed
      permissions: user.permissions || [],
      roleName: user.roleName,
    };
  }
}
