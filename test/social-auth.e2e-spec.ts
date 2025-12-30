import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';

// Mock dependencies
jest.mock('google-auth-library', () => {
    return {
        OAuth2Client: jest.fn().mockImplementation(() => {
            return {
                verifyIdToken: jest.fn().mockResolvedValue({
                    getPayload: () => ({
                        email: 'social@example.com',
                        sub: '123456789',
                    }),
                }),
            };
        }),
    };
});

jest.mock('apple-signin-auth', () => {
    return jest.fn().mockResolvedValue({
        email: 'apple@example.com',
        sub: 'apple.123456',
    });
});

describe('Social Auth (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();

        prisma = app.get<PrismaService>(PrismaService);
        await prisma.user.deleteMany();
    });

    afterAll(async () => {
        await prisma.user.deleteMany();
        await app.close();
    });

    describe('POST /auth/google', () => {
        it('should create user and return token', async () => {
            // 1. Call endpoint
            const res = await request(app.getHttpServer())
                .post('/auth/google')
                .send({ token: 'fake_google_token' })
                .expect(200);

            expect(res.body.access_token).toBeDefined();

            // 2. Verify DB
            const user = await prisma.user.findUnique({
                where: { email: 'social@example.com' },
            });
            expect(user).toBeDefined();
            expect(user?.googleId).toBe('123456789');
        });

        it('should login existing user', async () => {
            // Call again, should work and not fail with duplicate
            const res = await request(app.getHttpServer())
                .post('/auth/google')
                .send({ token: 'fake_google_token' })
                .expect(200);
            expect(res.body.access_token).toBeDefined();
        });
    });

    describe('POST /auth/apple', () => {
        it('should create apple user and return token', async () => {
            const res = await request(app.getHttpServer())
                .post('/auth/apple')
                .send({ token: 'fake_apple_token' })
                .expect(200);

            expect(res.body.access_token).toBeDefined();

            const user = await prisma.user.findUnique({
                where: { email: 'apple@example.com' },
            });
            expect(user).toBeDefined();
            expect(user?.appleId).toBe('apple.123456');
        });
    });
});
