import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { KeyManagerService } from '../src/oidc/key-manager.service';
import * as crypto from 'crypto';

describe('AuthService', () => {
    let service: AuthService;
    let jwtService: JwtService;
    let keyManagerService: KeyManagerService;

    // Generate a temporary keypair for testing
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    }); // Generate as PEM strings directly for simplicity

    const mockKeyManager = {
        getLatestKey: jest.fn().mockReturnValue({
            privateKeyPem: privateKey,
            publicKey: crypto.createPublicKey(publicKey), // If KeyManager stores KeyObject for public
            kid: 'test-kid'
        })
    };

    const mockPrisma = {
        user: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        }
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: KeyManagerService, useValue: mockKeyManager },
                JwtService, // Use real JwtService to verify signing mostly, or mock if we trust library
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        jwtService = module.get<JwtService>(JwtService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should sign token with RS256 and include OIDC claims/header', async () => {
        const email = 'test@example.com';
        const userId = '123';

        const { access_token } = await service.signToken(userId, email);

        expect(mockKeyManager.getLatestKey).toHaveBeenCalled();

        // Verify token
        const decoded = jwtService.decode(access_token, { complete: true }) as any;

        // Header check
        expect(decoded.header.alg).toBe('RS256');
        expect(decoded.header.kid).toBe('test-kid');

        // Payload check
        expect(decoded.payload.sub).toBe(userId);
        expect(decoded.payload.email).toBe(email);
        expect(decoded.payload.iss).toBeDefined(); // Defaults to localhost
        expect(decoded.payload.aud).toBeDefined(); // Defaults to unity-game-client
    });
});
