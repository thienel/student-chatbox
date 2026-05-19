import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { LoginUseCase } from '../../../application/auth/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../../application/auth/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../../application/auth/use-cases/logout.use-case';
import { GetMeUseCase } from '../../../application/auth/use-cases/get-me.use-case';
import { JwtStrategy } from '../../guards/jwt.strategy';
import { TypeOrmDatabaseModule } from '../../../infrastructure/database/typeorm/typeorm.module';
import { AuditLogService } from '../../../application/system/services/audit-log.service';

@Module({
  imports: [
    TypeOrmDatabaseModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_ACCESS_EXPIRES', '15m') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [LoginUseCase, RefreshTokenUseCase, LogoutUseCase, GetMeUseCase, JwtStrategy, AuditLogService],
  exports: [JwtStrategy, JwtModule, PassportModule],
})
export class AuthModule {}
