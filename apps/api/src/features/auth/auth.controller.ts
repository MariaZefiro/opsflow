import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from '../../common/dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private withCookie(response: Response, result: { refreshToken: string; [key: string]: unknown }) {
    response.cookie('opsflow_refresh', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const { refreshToken, ...body } = result;
    return body;
  }

  @Post('register') async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withCookie(response, await this.auth.register(dto));
  }
  @Post('login') async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withCookie(response, await this.auth.login(dto));
  }
  @Post('refresh') async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withCookie(response, await this.auth.refresh(request.cookies?.opsflow_refresh));
  }
  @Post('forgot-password') forgot(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }
  @Post('reset-password') reset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }
}
