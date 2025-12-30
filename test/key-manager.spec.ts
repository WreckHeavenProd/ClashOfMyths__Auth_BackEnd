import { Test, TestingModule } from '@nestjs/testing';
import { KeyManagerService } from '../src/oidc/key-manager.service';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('KeyManagerService', () => {
    let service: KeyManagerService;

    // We will assume keys exist because we ran the script, 
    // but to be safe for CI/CD we could check or mock.
    // For this step, we test the logic assuming files are present.

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [KeyManagerService],
        }).compile();

        service = module.get<KeyManagerService>(KeyManagerService);

        // Manually trigger init if needed, though testing module usually handles it if we use init().
        // But onModuleInit is auto called by Nest if we use app.init(), here we just compiled module.
        // So we call it manually.
        await service.onModuleInit();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should load keys from secrets directory', () => {
        // We expect at least one key if script ran
        try {
            const latestInfo = service.getLatestKey();
            expect(latestInfo).toBeDefined();
            expect(latestInfo.privateKeyPem).toBeDefined();
            expect(latestInfo.publicKey).toBeDefined();
            expect(latestInfo.kid).toBeDefined();
        } catch (e) {
            // If no keys, this throws. 
            // We should warn user to run script if this fails.
            console.warn('Test skipped or failed because no keys found. Did you run "npm run generate:keys"?');
            throw e;
        }
    });

    it('should return valid JWKS', async () => {
        const jwks = await service.getJwks();
        expect(jwks).toBeDefined();
        expect(jwks.keys).toBeInstanceOf(Array);
        if (jwks.keys.length > 0) {
            const key = jwks.keys[0];
            expect(key.kty).toBe('RSA');
            expect(key.use).toBe('sig');
            expect(key.alg).toBe('RS256');
            expect(key.kid).toBeDefined();
            expect(key.n).toBeDefined(); // Modulus
            expect(key.e).toBeDefined(); // Exponent
        }
    });
});
