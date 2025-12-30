import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';
import { GoogleAuthDto, AppleAuthDto } from './dto/social-auth.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User successfully registered', type: AuthResponseDto })
    @ApiResponse({ status: 400, description: 'Bad Request (Validation)' })
    @ApiResponse({ status: 403, description: 'Email already exists' })
    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @ApiOperation({ summary: 'Login with email/password' })
    @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
    @ApiResponse({ status: 403, description: 'Invalid Credentials' })
    @HttpCode(HttpStatus.OK)
    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @ApiOperation({ summary: 'Login with Google ID Token' })
    @ApiResponse({ status: 200, description: 'Social login successful (User created or found)', type: AuthResponseDto })
    @ApiResponse({ status: 403, description: 'Invalid Google Token' })
    @HttpCode(HttpStatus.OK)
    @Post('google')
    google(@Body() dto: GoogleAuthDto) {
        return this.authService.verifyGoogleToken(dto.token);
    }

    @ApiOperation({ summary: 'Login with Apple Identity Token' })
    @ApiResponse({ status: 200, description: 'Social login successful (User created or found)', type: AuthResponseDto })
    @ApiResponse({ status: 403, description: 'Invalid Apple Token' })
    @HttpCode(HttpStatus.OK)
    @Post('apple')
    apple(@Body() dto: AppleAuthDto) {
        return this.authService.verifyAppleToken(dto.token);
    }
}
