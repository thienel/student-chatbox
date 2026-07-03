import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { LoginUseCase } from '../../../application/auth/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../../application/auth/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../../application/auth/use-cases/logout.use-case';
import { GetMeUseCase } from '../../../application/auth/use-cases/get-me.use-case';
import { LoginDto } from '../../../application/auth/dtos/login.dto';
import { RefreshTokenDto } from '../../../application/auth/dtos/refresh-token.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { AuditLogService } from '../../../application/system/services/audit-log.service';
import { RegisterUseCase } from '../../../application/auth/use-cases/register.use-case';
import { VerifyEmailUseCase } from '../../../application/auth/use-cases/verify-email.use-case';
import { ResendOtpUseCase } from '../../../application/auth/use-cases/resend-otp.use-case';
import { ForgotPasswordUseCase } from '../../../application/auth/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../../../application/auth/use-cases/reset-password.use-case';
import { VerifyResetOtpUseCase } from '../../../application/auth/use-cases/verify-reset-otp.use-case';
import { RegisterDto } from '../../../application/auth/dtos/register.dto';
import { VerifyOtpDto } from '../../../application/auth/dtos/verify-otp.dto';
import { ResendOtpDto } from '../../../application/auth/dtos/resend-otp.dto';
import { ForgotPasswordDto } from '../../../application/auth/dtos/forgot-password.dto';
import { ResetPasswordDto } from '../../../application/auth/dtos/reset-password.dto';

@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly resendOtpUseCase: ResendOtpUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly verifyResetOtpUseCase: VerifyResetOtpUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    try {
      const result = await this.loginUseCase.execute(dto);
      await this.auditLogService.log(
        result.user.id,
        'USER_LOGIN',
        'user',
        result.user.id,
        { email: dto.email },
        req.ip,
      );
      return result;
    } catch (error) {
      await this.auditLogService.log(
        undefined,
        'USER_LOGIN_FAILED',
        'user',
        undefined,
        { email: dto.email },
        req.ip,
      );
      throw error;
    }
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.registerUseCase.execute(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.verifyEmailUseCase.execute(dto);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.resendOtpUseCase.execute(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.forgotPasswordUseCase.execute(dto);
  }

  @Post('verify-reset-otp')
  @HttpCode(HttpStatus.OK)
  async verifyResetOtp(@Body() dto: VerifyOtpDto) {
    return this.verifyResetOtpUseCase.execute(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordUseCase.execute(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.refreshTokenUseCase.execute(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: RefreshTokenDto) {
    await this.logoutUseCase.execute(dto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    return this.getMeUseCase.execute(user.id);
  }
}
