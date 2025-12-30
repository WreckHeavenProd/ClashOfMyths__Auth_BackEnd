import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
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
        await prisma.user.deleteMany(); // Clean db
    });

    afterAll(async () => {
        await prisma.user.deleteMany();
        await app.close();
    });

    describe('POST /auth/register', () => {
        it('should register a new user', () => {
            return request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                })
                .expect(201)
                .expect((res) => {
                    expect(res.body.access_token).toBeDefined();
                });
        });

        it('should throw error on duplicate email', () => {
            return request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                })
                .expect(403);
        });
    });

    describe('POST /auth/login', () => {
        it('should login with valid credentials', () => {
            return request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body.access_token).toBeDefined();
                });
        });

        it('should throw error with invalid credentials', () => {
            return request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword',
                })
                .expect(403);
        });
    });
});
