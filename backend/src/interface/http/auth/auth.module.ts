import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { LoginUseCase } from '../../../application/auth/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../../application/auth/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../../application/auth/use-cases/logout.use-case';
import { GetMeUseCase } from '../../../application/auth/use-cases/get-me.use-case';
import { RegisterUseCase } from '../../../application/auth/use-cases/register.use-case';
import { VerifyEmailUseCase } from '../../../application/auth/use-cases/verify-email.use-case';
import { ResendOtpUseCase } from '../../../application/auth/use-cases/resend-otp.use-case';
import { ForgotPasswordUseCase } from '../../../application/auth/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../../../application/auth/use-cases/reset-password.use-case';
import { VerifyResetOtpUseCase } from '../../../application/auth/use-cases/verify-reset-otp.use-case';
import { JwtStrategy } from '../../guards/jwt.strategy';
import { TypeOrmDatabaseModule } from '../../../infrastructure/database/typeorm/typeorm.module';
import { AuditLogService } from '../../../application/system/services/audit-log.service';
import { TokenService } from '../../../application/auth/services/token.service';
import { OtpService } from '../../../application/auth/services/otp.service';
import { BcryptPasswordService } from '../../../infrastructure/auth/services/bcrypt-password.service';
import { EmailModule } from '../../../infrastructure/email/email.module';
import { EmailDomainService } from '../../../application/auth/services/email-domain.service';
import { UserModule } from '../user/user.module';
import { AuthRateLimitGuard } from '../../guards/auth-rate-limit.guard';

@Module({
  imports: [
    TypeOrmDatabaseModule,
    EmailModule,
    PassportModule,
    forwardRef(() => UserModule),
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
  providers: [
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    GetMeUseCase,
    RegisterUseCase,
    VerifyEmailUseCase,
    ResendOtpUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    VerifyResetOtpUseCase,
    JwtStrategy,
    AuditLogService,
    TokenService,
    OtpService,
    EmailDomainService,
    AuthRateLimitGuard,
    {
      provide: 'IPasswordService',
      useClass: BcryptPasswordService,
    }
  ],
  exports: [JwtStrategy, JwtModule, PassportModule, OtpService, EmailDomainService],
})
export class AuthModule {}
