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
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
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
import { RegisterStudentDto } from '../../../application/auth/dtos/register-student.dto';
import { VerifyOtpDto } from '../../../application/auth/dtos/verify-otp.dto';
import { ResendOtpDto } from '../../../application/auth/dtos/resend-otp.dto';
import { ForgotPasswordDto } from '../../../application/auth/dtos/forgot-password.dto';
import { ResetPasswordDto } from '../../../application/auth/dtos/reset-password.dto';
import { AuthRateLimitGuard } from '../../guards/auth-rate-limit.guard';
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@ApiTags('Auth')
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
  @UseGuards(AuthRateLimitGuard)
  @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login' })
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
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

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return { accessToken: result.accessToken };
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

  @Post('register/student')
    @ApiOperation({ summary: 'Register student' })
  async registerStudent(@Body() dto: RegisterStudentDto) {
    return this.registerUseCase.execute(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify email' })
  async verifyEmail(@Body() dto: VerifyOtpDto) {
    return this.verifyEmailUseCase.execute(dto);
  }

  @Post('resend-otp')
  @UseGuards(AuthRateLimitGuard)
  @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Resend otp' })
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.resendOtpUseCase.execute(dto);
  }

  @Post('forgot-password')
  @UseGuards(AuthRateLimitGuard)
  @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Forgot password' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.forgotPasswordUseCase.execute(dto);
  }

  @Post('verify-reset-otp')
  @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify reset otp' })
  async verifyResetOtp(@Body() dto: VerifyOtpDto) {
    return this.verifyResetOtpUseCase.execute(dto);
  }

  @Post('reset-password')
  @UseGuards(AuthRateLimitGuard)
  @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reset password' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordUseCase.execute(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh' })
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }
    return this.refreshTokenUseCase.execute(refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Logout' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await this.logoutUseCase.execute(refreshToken);
    }
    res.clearCookie('refreshToken');
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get me' })
  async getMe(@CurrentUser() user: any) {
    return this.getMeUseCase.execute(user.id);
  }
}
