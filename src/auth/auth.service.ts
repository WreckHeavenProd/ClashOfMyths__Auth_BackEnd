import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '../../generated/prisma/client';
import { OAuth2Client } from 'google-auth-library';
import verifyAppleToken from 'apple-signin-auth';
import { KeyManagerService } from '../oidc/key-manager.service';

@Injectable()
export class AuthService {
    private googleClient: OAuth2Client;

    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private keyManager: KeyManagerService,
    ) {
        this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }

    async verifyGoogleToken(token: string) {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) throw new ForbiddenException('Google auth not configured');

        const client = new OAuth2Client(clientId);

        let payload: { sub?: string; email?: string } | undefined;
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: clientId,
            });
            payload = ticket.getPayload() as { sub?: string; email?: string } | undefined;
        } catch {
            throw new ForbiddenException('Invalid Google token');
        }

        const googleId = payload?.sub;
        const email = payload?.email;
        if (!googleId || !email) throw new ForbiddenException('Invalid Google token');

        const existingByGoogle = await this.prisma.user.findUnique({
            where: { googleId },
        });
        if (existingByGoogle) return this.signToken(existingByGoogle.id, existingByGoogle.email);

        const existingByEmail = await this.prisma.user.findUnique({
            where: { email },
        });
        const user = existingByEmail
            ? await this.prisma.user.update({
                where: { id: existingByEmail.id },
                data: { googleId },
            })
            : await this.prisma.user.create({
                data: { email, googleId },
            });

        return this.signToken(user.id, user.email);
    }

    async verifyAppleToken(token: string) {
        const clientId = process.env.APPLE_CLIENT_ID;
        if (!clientId) throw new ForbiddenException('Apple auth not configured');

        let payload: { sub?: string; email?: string } | undefined;
        try {
            payload = await verifyAppleToken.verifyIdToken(token, {
                audience: clientId,
                ignoreExpiration: false,
            });
        } catch {
            throw new ForbiddenException('Invalid Apple token');
        }

        const appleId = payload?.sub;
        const email = payload?.email;
        if (!appleId) throw new ForbiddenException('Invalid Apple token');

        const existingByApple = await this.prisma.user.findUnique({
            where: { appleId },
        });
        if (existingByApple) return this.signToken(existingByApple.id, existingByApple.email);

        const existingByEmail = email
            ? await this.prisma.user.findUnique({ where: { email } })
            : null;

        const user = existingByEmail
            ? await this.prisma.user.update({
                where: { id: existingByEmail.id },
                data: { appleId },
            })
            : await this.prisma.user.create({
                data: { email: email ?? `${appleId}@apple.local`, appleId },
            });

        return this.signToken(user.id, user.email);
    }

    async register(dto: RegisterDto) {
        try {
            const hash = await argon2.hash(dto.password);
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    password: hash,
                },
            });
            return this.signToken(user.id, user.email);
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ForbiddenException('Credentials taken');
            }
            throw error;
        }
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });

        if (!user) throw new ForbiddenException('Credentials incorrect');
        if (!user.password) throw new ForbiddenException('Credentials incorrect'); // Social accounts might have null password

        const pwMatches = await argon2.verify(user.password, dto.password);
        if (!pwMatches) throw new ForbiddenException('Credentials incorrect');

        return this.signToken(user.id, user.email);
    }

    async signToken(userId: string, email: string): Promise<{ access_token: string }> {
        const { privateKeyPem, kid } = this.keyManager.getLatestKey();

        // OIDC Claims
        const payload = {
            sub: userId,
            email,
            iss: process.env.OIDC_ISSUER || 'http://localhost:3000',
            aud: process.env.OIDC_AUDIENCE || 'unity-game-client',
        };

        const token = await this.jwt.signAsync(payload, {
            expiresIn: '15m',
            algorithm: 'RS256',
            secret: privateKeyPem,
            header: {
                kid: kid,
                alg: 'RS256',
                typ: 'JWT',
            },
        });

        return {
            access_token: token,
        };
    }
}
